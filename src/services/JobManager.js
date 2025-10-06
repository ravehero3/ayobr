const { EventEmitter } = require('events');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CONFIG = {
  MAX_CONCURRENT_JOBS: 2,
  TEMP_BASE_DIR: './temp/video-jobs',
  MAX_QUEUE_SIZE: 20,
  CLEANUP_COMPLETED_AFTER_MS: 600000
};

class JobManager extends EventEmitter {
  constructor() {
    super();
    this.jobs = new Map();
    this.activeProcesses = new Map();
    this.cleanupTimers = new Map();
    this.initialize();
  }

  async initialize() {
    try {
      await fs.mkdir(CONFIG.TEMP_BASE_DIR, { recursive: true });
      await this.cleanupOrphanedDirs();
    } catch (error) {
      console.error('JobManager initialization error:', error);
    }
  }

  async createJob(imagePath, audioPath) {
    if (this.jobs.size >= CONFIG.MAX_QUEUE_SIZE) {
      throw new Error('Queue is full. Maximum jobs limit reached.');
    }

    const jobId = uuidv4();
    const tempDir = path.join(CONFIG.TEMP_BASE_DIR, jobId);

    try {
      await fs.mkdir(tempDir, { recursive: true });

      const imageExt = path.extname(imagePath);
      const audioExt = path.extname(audioPath);
      const tempImagePath = path.join(tempDir, `input-image${imageExt}`);
      const tempAudioPath = path.join(tempDir, `input-audio${audioExt}`);
      const outputPath = path.join(tempDir, 'output.mp4');

      await fs.copyFile(imagePath, tempImagePath);
      await fs.copyFile(audioPath, tempAudioPath);

      const job = {
        id: jobId,
        status: 'queued',
        progress: 0,
        imagePath: imagePath,
        audioPath: audioPath,
        tempDir: tempDir,
        tempImagePath: tempImagePath,
        tempAudioPath: tempAudioPath,
        outputPath: outputPath,
        error: null,
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null
      };

      this.jobs.set(jobId, job);
      this.emit('job-created', jobId);

      this.processQueue();

      return jobId;
    } catch (error) {
      console.error(`Failed to create job ${jobId}:`, error);
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error('Cleanup error:', cleanupError);
      }
      throw error;
    }
  }

  async createBatchJobs(pairsArray) {
    const jobIds = [];
    for (const pair of pairsArray) {
      try {
        const jobId = await this.createJob(pair.image, pair.audio);
        jobIds.push(jobId);
      } catch (error) {
        console.error('Failed to create batch job:', error);
      }
    }
    return jobIds;
  }

  getJob(jobId) {
    return this.jobs.get(jobId);
  }

  getAllJobs() {
    return Array.from(this.jobs.values()).sort((a, b) => a.createdAt - b.createdAt);
  }

  getQueuedJobs() {
    return this.getAllJobs().filter(job => job.status === 'queued');
  }

  getProcessingJobs() {
    return this.getAllJobs().filter(job => job.status === 'processing');
  }

  getCompletedJobs() {
    return this.getAllJobs().filter(job => job.status === 'completed');
  }

  async processQueue() {
    const processingCount = this.getProcessingJobs().length;
    const availableSlots = CONFIG.MAX_CONCURRENT_JOBS - processingCount;

    if (availableSlots <= 0) {
      return;
    }

    const queuedJobs = this.getQueuedJobs();
    const jobsToStart = queuedJobs.slice(0, availableSlots);

    for (const job of jobsToStart) {
      await this.startJob(job.id);
    }
  }

  async startJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'queued') {
      return;
    }

    job.status = 'processing';
    job.startedAt = Date.now();
    this.jobs.set(jobId, job);
    this.emit('job-started', jobId);

    this.processVideo(job);
  }

  updateProgress(jobId, progress) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.progress = Math.min(Math.max(0, progress), 100);
    this.jobs.set(jobId, job);
    this.emit('job-progress', { jobId, progress: job.progress });
  }

  async markCompleted(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'completed';
    job.progress = 100;
    job.completedAt = Date.now();
    this.jobs.set(jobId, job);
    this.emit('job-completed', jobId);

    const timer = setTimeout(() => {
      this.cleanupJob(jobId);
    }, CONFIG.CLEANUP_COMPLETED_AFTER_MS);
    this.cleanupTimers.set(jobId, timer);

    this.processQueue();
  }

  async markFailed(jobId, error) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = 'failed';
    job.error = error;
    job.completedAt = Date.now();
    this.jobs.set(jobId, job);
    this.emit('job-failed', { jobId, error });

    this.processQueue();
  }

  async cancelJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    if (job.status === 'queued') {
      await this.cleanupJob(jobId);
      this.emit('job-cancelled', jobId);
      return;
    }

    if (job.status === 'processing') {
      const process = this.activeProcesses.get(jobId);
      if (process) {
        process.kill('SIGTERM');
        this.activeProcesses.delete(jobId);
      }

      job.status = 'failed';
      job.error = 'Cancelled by user';
      job.completedAt = Date.now();
      this.jobs.set(jobId, job);

      await this.cleanupJob(jobId);
      this.emit('job-cancelled', jobId);

      this.processQueue();
    }
  }

  async cleanupJob(jobId) {
    const job = this.jobs.get(jobId);
    if (!job) return;

    const timer = this.cleanupTimers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.cleanupTimers.delete(jobId);
    }

    let retries = 3;
    while (retries > 0) {
      try {
        if (fsSync.existsSync(job.tempDir)) {
          await fs.rm(job.tempDir, { recursive: true, force: true });
        }
        this.jobs.delete(jobId);
        return;
      } catch (error) {
        console.error(`Cleanup attempt failed for ${jobId}, retries left: ${retries - 1}`, error);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    console.error(`Failed to cleanup job ${jobId} after all retries`);
    this.jobs.delete(jobId);
  }

  async cleanupOrphanedDirs() {
    try {
      if (!fsSync.existsSync(CONFIG.TEMP_BASE_DIR)) {
        return;
      }

      const entries = await fs.readdir(CONFIG.TEMP_BASE_DIR);
      const oneHourAgo = Date.now() - 3600000;

      for (const entry of entries) {
        const dirPath = path.join(CONFIG.TEMP_BASE_DIR, entry);
        try {
          const stats = await fs.stat(dirPath);
          if (stats.isDirectory() && stats.mtimeMs < oneHourAgo) {
            console.log(`Cleaning orphaned directory: ${entry}`);
            await fs.rm(dirPath, { recursive: true, force: true });
          }
        } catch (error) {
          console.error(`Failed to cleanup orphaned dir ${entry}:`, error);
        }
      }
    } catch (error) {
      console.error('Error during orphaned dirs cleanup:', error);
    }
  }

  getVideoPath(jobId) {
    const job = this.jobs.get(jobId);
    return job ? job.outputPath : null;
  }

  async processVideo(job) {
    try {
      const args = [
        '-loop', '1',
        '-i', job.tempImagePath,
        '-i', job.tempAudioPath,
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-y',
        job.outputPath
      ];

      const ffmpegProcess = spawn('ffmpeg', args);
      this.activeProcesses.set(job.id, ffmpegProcess);

      let stderrOutput = '';
      let totalDuration = null;

      ffmpegProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderrOutput += output;

        if (!totalDuration) {
          const durationMatch = output.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
          if (durationMatch) {
            const hours = parseInt(durationMatch[1]);
            const minutes = parseInt(durationMatch[2]);
            const seconds = parseFloat(durationMatch[3]);
            totalDuration = hours * 3600 + minutes * 60 + seconds;
          }
        }

        if (totalDuration) {
          const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
          if (timeMatch) {
            const hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2]);
            const seconds = parseFloat(timeMatch[3]);
            const currentTime = hours * 3600 + minutes * 60 + seconds;
            const progress = Math.min(Math.round((currentTime / totalDuration) * 100), 100);
            this.updateProgress(job.id, progress);
          }
        }
      });

      ffmpegProcess.on('error', (error) => {
        console.error(`FFmpeg process error for job ${job.id}:`, error);
        this.activeProcesses.delete(job.id);
        this.markFailed(job.id, error.message);
      });

      ffmpegProcess.on('close', (code) => {
        this.activeProcesses.delete(job.id);

        if (code === 0) {
          this.markCompleted(job.id);
        } else {
          const errorMsg = `FFmpeg exited with code ${code}`;
          console.error(`${errorMsg} for job ${job.id}`);
          console.error('FFmpeg stderr:', stderrOutput);
          this.markFailed(job.id, errorMsg);
        }
      });

    } catch (error) {
      console.error(`Failed to process video for job ${job.id}:`, error);
      this.markFailed(job.id, error.message);
    }
  }
}

module.exports = JobManager;
