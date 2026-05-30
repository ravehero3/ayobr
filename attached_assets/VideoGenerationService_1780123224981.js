import JobManager from './JobManager';

class VideoGenerationService {
  constructor() {
    this.jobManager = new JobManager();
    this.eventListeners = new Map();
    this.setupEventForwarding();
  }

  setupEventForwarding() {
    const events = [
      'job-created',
      'job-started',
      'job-progress',
      'job-completed',
      'job-failed',
      'job-cancelled'
    ];

    events.forEach(event => {
      this.jobManager.on(event, (data) => {
        const listeners = this.eventListeners.get(event) || [];
        listeners.forEach(callback => {
          try {
            callback(event, data);
          } catch (error) {
            console.error(`Error in event listener for ${event}:`, error);
          }
        });
      });
    });
  }

  async generateVideo(imageFile, audioFile, preparedAssets = null) {
    return await this.jobManager.createJob(imageFile, audioFile, preparedAssets);
  }

  async generateVideos(pairsArray, preparedAssetsMap = {}) {
    const jobIds = [];
    for (const pair of pairsArray) {
      try {
        const preparedAssets = preparedAssetsMap[pair.id] || null;
        const jobId = await this.jobManager.createJob(pair.image, pair.audio, preparedAssets);
        jobIds.push(jobId);
      } catch (error) {
        console.error('Failed to create batch job:', error);
      }
    }
    return jobIds;
  }

  getJobStatus(jobId) {
    return this.jobManager.getJob(jobId);
  }

  getAllJobs() {
    return this.jobManager.getAllJobs();
  }

  getQueuedJobs() {
    return this.jobManager.getQueuedJobs();
  }

  getProcessingJobs() {
    return this.jobManager.getProcessingJobs();
  }

  getCompletedJobs() {
    return this.jobManager.getCompletedJobs();
  }

  async cancelJob(jobId) {
    return await this.jobManager.cancelJob(jobId);
  }

  getVideoPath(jobId) {
    return this.jobManager.getVideoPath(jobId);
  }

  async cleanupJob(jobId) {
    return await this.jobManager.cleanupJob(jobId);
  }

  onJobUpdate(callback) {
    const events = [
      'job-created',
      'job-started',
      'job-progress',
      'job-completed',
      'job-failed',
      'job-cancelled'
    ];

    events.forEach(event => {
      if (!this.eventListeners.has(event)) {
        this.eventListeners.set(event, []);
      }
      this.eventListeners.get(event).push(callback);
    });

    return () => {
      events.forEach(event => {
        const listeners = this.eventListeners.get(event) || [];
        const index = listeners.indexOf(callback);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      });
    };
  }
}

export default new VideoGenerationService();
