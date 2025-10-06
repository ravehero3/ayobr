import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import { v4 as uuidv4 } from 'uuid';

const CONFIG = {
  MAX_CONCURRENT_JOBS: 2,
  MAX_QUEUE_SIZE: 20,
  CLEANUP_COMPLETED_AFTER_MS: 600000
};

class JobManager {
  constructor() {
    this.jobs = new Map();
    this.activeProcesses = new Map();
    this.cleanupTimers = new Map();
    this.eventListeners = new Map();
    this.ffmpeg = null;
    this.isFFmpegLoaded = false;
    this.initializeFFmpeg();
  }

  async initializeFFmpeg() {
    if (this.isFFmpegLoaded) return;

    try {
      console.log('Initializing FFmpeg...');
      this.ffmpeg = new FFmpeg();

      this.ffmpeg.on('log', ({ message }) => {
        console.log('FFmpeg:', message);
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm';
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      this.isFFmpegLoaded = true;
      console.log('FFmpeg initialized successfully');
    } catch (error) {
      console.error('Failed to initialize FFmpeg:', error);
      throw error;
    }
  }

  async createJob(imagePath, audioPath) {
    await this.initializeFFmpeg();

    if (this.jobs.size >= CONFIG.MAX_QUEUE_SIZE) {
      throw new Error('Queue is full. Maximum jobs limit reached.');
    }

    const jobId = uuidv4();

    try {
      const imageExt = this.getFileExtension(imagePath);
      const audioExt = this.getFileExtension(audioPath);
      const inputImageName = `input-image-${jobId}${imageExt}`;
      const inputAudioName = `input-audio-${jobId}${audioExt}`;
      const outputName = `output-${jobId}.mp4`;

      const job = {
        id: jobId,
        status: 'queued',
        progress: 0,
        imagePath: imagePath,
        audioPath: audioPath,
        inputImageName: inputImageName,
        inputAudioName: inputAudioName,
        outputName: outputName,
        videoBlob: null,
        videoBlobURL: null,
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

  getFileExtension(path) {
    const match = path.match(/\.([^.]+)$/);
    return match ? `.${match[1]}` : '';
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
      this.startJob(job.id);
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
      const cancelFlag = this.activeProcesses.get(jobId);
      if (cancelFlag) {
        cancelFlag.cancelled = true;
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

    try {
      if (job.videoBlobURL) {
        URL.revokeObjectURL(job.videoBlobURL);
      }

      if (this.ffmpeg && this.isFFmpegLoaded) {
        try {
          await this.ffmpeg.deleteFile(job.inputImageName).catch(() => {});
          await this.ffmpeg.deleteFile(job.inputAudioName).catch(() => {});
          await this.ffmpeg.deleteFile(job.outputName).catch(() => {});
        } catch (error) {
          console.log('Error cleaning up FFmpeg files:', error);
        }
      }

      this.jobs.delete(jobId);
      this.activeProcesses.delete(jobId);
    } catch (error) {
      console.error(`Cleanup error for job ${jobId}:`, error);
      this.jobs.delete(jobId);
    }
  }

  getVideoPath(jobId) {
    const job = this.jobs.get(jobId);
    return job ? job.videoBlobURL : null;
  }

  async processVideo(job) {
    const cancelFlag = { cancelled: false };
    this.activeProcesses.set(job.id, cancelFlag);

    try {
      const imageFile = await fetchFile(job.imagePath);
      const audioFile = await fetchFile(job.audioPath);

      await this.ffmpeg.writeFile(job.inputImageName, imageFile);
      await this.ffmpeg.writeFile(job.inputAudioName, audioFile);

      let totalDuration = null;
      let lastProgress = 0;

      this.ffmpeg.on('progress', ({ progress, time }) => {
        if (cancelFlag.cancelled) return;

        const currentProgress = Math.min(Math.round(progress * 100), 100);
        if (currentProgress !== lastProgress) {
          lastProgress = currentProgress;
          this.updateProgress(job.id, currentProgress);
        }
      });

      if (cancelFlag.cancelled) {
        await this.markFailed(job.id, 'Cancelled');
        return;
      }

      await this.ffmpeg.exec([
        '-loop', '1',
        '-i', job.inputImageName,
        '-i', job.inputAudioName,
        '-c:v', 'libx264',
        '-tune', 'stillimage',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-pix_fmt', 'yuv420p',
        '-shortest',
        '-y',
        job.outputName
      ]);

      if (cancelFlag.cancelled) {
        await this.markFailed(job.id, 'Cancelled');
        return;
      }

      const data = await this.ffmpeg.readFile(job.outputName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const blobURL = URL.createObjectURL(blob);

      const updatedJob = this.jobs.get(job.id);
      if (updatedJob) {
        updatedJob.videoBlob = blob;
        updatedJob.videoBlobURL = blobURL;
        this.jobs.set(job.id, updatedJob);
      }

      this.ffmpeg.off('progress');
      await this.markCompleted(job.id);

    } catch (error) {
      console.error(`Failed to process video for job ${job.id}:`, error);
      this.ffmpeg.off('progress');
      await this.markFailed(job.id, error.message);
    } finally {
      this.activeProcesses.delete(job.id);
    }
  }

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      const listeners = this.eventListeners.get(event);
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }
}

export default JobManager;
