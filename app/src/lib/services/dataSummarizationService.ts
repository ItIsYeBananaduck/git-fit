// File: dataSummarizationService.ts

/**
 * Data Summarization Service
 * Purpose: Automatically aggregate and summarize historical data for efficient storage and querying
 */

import type { DataSummary } from './dataRetentionService';

export interface SummarizationJob {
  id: string;
  dataType: string;
  userId?: string; // If null, summarize for all users
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface SummarizationConfig {
  enabled: boolean;
  batchSize: number;
  maxConcurrentJobs: number;
  retryAttempts: number;
  retryDelayMs: number;
  schedule: {
    hourly: boolean;
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
}

export interface SummarizationResult {
  jobId: string;
  dataType: string;
  period: string;
  recordsProcessed: number;
  summariesCreated: number;
  storageSaved: number; // bytes
  duration: number;
  errors: string[];
}

export class DataSummarizationService {
  private config: SummarizationConfig;
  private activeJobs: Map<string, SummarizationJob> = new Map();
  private jobQueue: SummarizationJob[] = [];
  private schedulerTimer?: NodeJS.Timeout;
  private readonly dataTypes = [
    'heart_rate',
    'hrv',
    'sleep',
    'activity',
    'recovery',
    'training_session',
    'nutrition_log'
  ];

  constructor(config?: Partial<SummarizationConfig>) {
    this.config = {
      enabled: true,
      batchSize: 1000,
      maxConcurrentJobs: 3,
      retryAttempts: 3,
      retryDelayMs: 5000,
      schedule: {
        hourly: true,
        daily: true,
        weekly: true,
        monthly: true
      },
      ...config
    };

    if (this.config.enabled) {
      this.startScheduler();
    }
  }

  /**
   * Start the summarization scheduler
   */
  private startScheduler(): void {
    // Run hourly jobs every hour
    if (this.config.schedule.hourly) {
      setInterval(() => this.scheduleHourlySummarization(), 60 * 60 * 1000);
    }

    // Run daily jobs at 2 AM
    if (this.config.schedule.daily) {
      this.scheduleNextDailyJob();
    }

    // Run weekly jobs every Monday at 3 AM
    if (this.config.schedule.weekly) {
      this.scheduleNextWeeklyJob();
    }

    // Run monthly jobs on the 1st at 4 AM
    if (this.config.schedule.monthly) {
      this.scheduleNextMonthlyJob();
    }
  }

  /**
   * Schedule hourly summarization
   */
  private async scheduleHourlySummarization(): Promise<void> {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    for (const dataType of this.dataTypes) {
      await this.createSummarizationJob({
        dataType,
        period: 'hourly',
        startDate: oneHourAgo,
        endDate: now
      });
    }
  }

  /**
   * Schedule next daily job
   */
  private scheduleNextDailyJob(): void {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(2, 0, 0, 0); // 2 AM

    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = nextRun.getTime() - now.getTime();
    setTimeout(async () => {
      await this.scheduleDailySummarization();
      this.scheduleNextDailyJob(); // Schedule next one
    }, delay);
  }

  /**
   * Schedule daily summarization
   */
  private async scheduleDailySummarization(): Promise<void> {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date(yesterday);
    today.setHours(23, 59, 59, 999);

    for (const dataType of this.dataTypes) {
      await this.createSummarizationJob({
        dataType,
        period: 'daily',
        startDate: yesterday,
        endDate: today
      });
    }
  }

  /**
   * Schedule next weekly job
   */
  private scheduleNextWeeklyJob(): void {
    const now = new Date();
    const nextRun = new Date(now);
    nextRun.setHours(3, 0, 0, 0); // 3 AM

    // Find next Monday
    const daysUntilMonday = (1 - nextRun.getDay() + 7) % 7;
    if (daysUntilMonday === 0 && nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 7);
    } else {
      nextRun.setDate(nextRun.getDate() + daysUntilMonday);
    }

    const delay = nextRun.getTime() - now.getTime();
    setTimeout(async () => {
      await this.scheduleWeeklySummarization();
      this.scheduleNextWeeklyJob();
    }, delay);
  }

  /**
   * Schedule weekly summarization
   */
  private async scheduleWeeklySummarization(): Promise<void> {
    const now = new Date();
    const lastMonday = new Date(now);
    lastMonday.setDate(lastMonday.getDate() - lastMonday.getDay() + 1);
    lastMonday.setHours(0, 0, 0, 0);

    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastSunday.getDate() + 6);
    lastSunday.setHours(23, 59, 59, 999);

    for (const dataType of this.dataTypes) {
      await this.createSummarizationJob({
        dataType,
        period: 'weekly',
        startDate: lastMonday,
        endDate: lastSunday
      });
    }
  }

  /**
   * Schedule next monthly job
   */
  private scheduleNextMonthlyJob(): void {
    const now = new Date();
    const nextRun = new Date(now.getFullYear(), now.getMonth() + 1, 1, 4, 0, 0, 0); // 1st of next month at 4 AM

    const delay = nextRun.getTime() - now.getTime();
    setTimeout(async () => {
      await this.scheduleMonthlySummarization();
      this.scheduleNextMonthlyJob();
    }, delay);
  }

  /**
   * Schedule monthly summarization
   */
  private async scheduleMonthlySummarization(): Promise<void> {
    const now = new Date();
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    lastDayOfLastMonth.setHours(23, 59, 59, 999);

    for (const dataType of this.dataTypes) {
      await this.createSummarizationJob({
        dataType,
        period: 'monthly',
        startDate: firstDayOfLastMonth,
        endDate: lastDayOfLastMonth
      });
    }
  }

  /**
   * Create a new summarization job
   */
  async createSummarizationJob(params: {
    dataType: string;
    userId?: string;
    period: 'hourly' | 'daily' | 'weekly' | 'monthly';
    startDate: Date;
    endDate: Date;
  }): Promise<string> {
    const job: SummarizationJob = {
      id: `summarize_${params.dataType}_${params.period}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dataType: params.dataType,
      userId: params.userId,
      period: params.period,
      startDate: params.startDate,
      endDate: params.endDate,
      status: 'pending',
      progress: 0,
      createdAt: new Date()
    };

    this.jobQueue.push(job);

    // Start processing if we have capacity
    this.processJobQueue();

    return job.id;
  }

  /**
   * Process the job queue
   */
  private async processJobQueue(): Promise<void> {
    const runningJobs = Array.from(this.activeJobs.values()).filter(job => job.status === 'running');

    if (runningJobs.length >= this.config.maxConcurrentJobs) {
      return; // At capacity
    }

    const availableSlots = this.config.maxConcurrentJobs - runningJobs.length;
    const jobsToStart = this.jobQueue.splice(0, availableSlots);

    for (const job of jobsToStart) {
      this.activeJobs.set(job.id, { ...job, status: 'running' });
      this.processJob(job).catch(error => {
        console.error(`Job ${job.id} failed:`, error);
        this.updateJobStatus(job.id, 'failed', error.message);
      });
    }
  }

  /**
   * Process a single summarization job
   */
  private async processJob(job: SummarizationJob): Promise<void> {
    try {
      const result = await this.executeSummarization(job);
      this.updateJobStatus(job.id, 'completed');
      this.activeJobs.delete(job.id);

      // Process next job in queue
      this.processJobQueue();

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.updateJobStatus(job.id, 'failed', errorMessage);
      this.activeJobs.delete(job.id);

      // Retry logic
      if (job.status !== 'failed' || this.shouldRetry(job)) {
        await this.retryJob(job);
      } else {
        this.processJobQueue();
      }
    }
  }

  /**
   * Execute the actual summarization
   */
  private async executeSummarization(job: SummarizationJob): Promise<SummarizationResult> {
    const startTime = Date.now();

    // Get raw data for the time period
    const rawData = await this.getRawData(job);
    if (rawData.length === 0) {
      return {
        jobId: job.id,
        dataType: job.dataType,
        period: job.period,
        recordsProcessed: 0,
        summariesCreated: 0,
        storageSaved: 0,
        duration: Date.now() - startTime,
        errors: []
      };
    }

    // Group data by user if processing all users
    const userGroups = job.userId
      ? { [job.userId]: rawData }
      : this.groupDataByUser(rawData);

    const summariesCreated: DataSummary[] = [];
    let totalRecordsProcessed = 0;

    for (const [userId, userData] of Object.entries(userGroups)) {
      // Create summary for this user and time period
      const summary = await this.createDataSummary(userId, job.dataType, job.period, job.startDate, job.endDate, userData);
      summariesCreated.push(summary);
      totalRecordsProcessed += userData.length;

      // Update job progress
      job.progress = (totalRecordsProcessed / rawData.length) * 100;
      this.activeJobs.set(job.id, job);
    }

    // Calculate storage savings (rough estimate)
    const storageSaved = this.calculateStorageSavings(rawData, summariesCreated);

    return {
      jobId: job.id,
      dataType: job.dataType,
      period: job.period,
      recordsProcessed: totalRecordsProcessed,
      summariesCreated: summariesCreated.length,
      storageSaved,
      duration: Date.now() - startTime,
      errors: []
    };
  }

  /**
   * Get raw data for summarization
   */
  private async getRawData(job: SummarizationJob): Promise<any[]> {
    // This would query your database for raw data in the specified time range
    // For now, return mock data structure
    console.log(`Getting raw data for ${job.dataType} from ${job.startDate.toISOString()} to ${job.endDate.toISOString()}`);
    return [];
  }

  /**
   * Group data by user ID
   */
  private groupDataByUser(data: any[]): Record<string, any[]> {
    const groups: Record<string, any[]> = {};

    data.forEach(item => {
      const userId = item.userId || 'unknown';
      if (!groups[userId]) {
        groups[userId] = [];
      }
      groups[userId].push(item);
    });

    return groups;
  }

  /**
   * Create data summary (placeholder - would integrate with DataRetentionService)
   */
  private async createDataSummary(
    userId: string,
    dataType: string,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    rawData: any[]
  ): Promise<DataSummary> {
    // This would use the DataRetentionService to create summaries
    const summary: DataSummary = {
      id: `${dataType}_${userId}_${period}_${startDate.getTime()}`,
      userId,
      dataType,
      period,
      startDate,
      endDate,
      metrics: {},
      sampleCount: rawData.length,
      createdAt: new Date()
    };

    return summary;
  }

  /**
   * Calculate estimated storage savings
   */
  private calculateStorageSavings(rawData: any[], summaries: DataSummary[]): number {
    // Rough estimate: assume each raw record is ~1KB and summary is ~0.1KB
    const rawSizeBytes = rawData.length * 1024;
    const summarySizeBytes = summaries.length * 102;
    return Math.max(0, rawSizeBytes - summarySizeBytes);
  }

  /**
   * Update job status
   */
  private updateJobStatus(jobId: string, status: SummarizationJob['status'], error?: string): void {
    const job = this.activeJobs.get(jobId);
    if (job) {
      job.status = status;
      if (error) job.error = error;
      if (status === 'completed' || status === 'failed') {
        job.completedAt = new Date();
      }
      this.activeJobs.set(jobId, job);
    }
  }

  /**
   * Check if job should be retried
   */
  private shouldRetry(job: SummarizationJob): boolean {
    // Simple retry logic - could be more sophisticated
    return !job.error?.includes('permanent') && !job.error?.includes('invalid');
  }

  /**
   * Retry a failed job
   */
  private async retryJob(job: SummarizationJob): Promise<void> {
    if (job.status !== 'failed') return;

    // Wait before retrying
    await this.delay(this.config.retryDelayMs);

    // Reset job status and add back to queue
    job.status = 'pending';
    job.progress = 0;
    job.error = undefined;
    this.jobQueue.unshift(job); // Add to front of queue

    this.processJobQueue();
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): SummarizationJob | undefined {
    return this.activeJobs.get(jobId) || this.jobQueue.find(job => job.id === jobId);
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): SummarizationJob[] {
    return Array.from(this.activeJobs.values());
  }

  /**
   * Get queued jobs
   */
  getQueuedJobs(): SummarizationJob[] {
    return [...this.jobQueue];
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const activeJob = this.activeJobs.get(jobId);
    if (activeJob) {
      this.updateJobStatus(jobId, 'failed', 'Cancelled by user');
      this.activeJobs.delete(jobId);
      return true;
    }

    const queueIndex = this.jobQueue.findIndex(job => job.id === jobId);
    if (queueIndex >= 0) {
      this.jobQueue.splice(queueIndex, 1);
      return true;
    }

    return false;
  }

  /**
   * Get summarization statistics
   */
  async getSummarizationStats(): Promise<Record<string, any>> {
    const allJobs = [...Array.from(this.activeJobs.values()), ...this.jobQueue];
    const completedJobs = allJobs.filter(job => job.status === 'completed');
    const failedJobs = allJobs.filter(job => job.status === 'failed');

    return {
      totalJobs: allJobs.length,
      activeJobs: this.activeJobs.size,
      queuedJobs: this.jobQueue.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      averageProcessingTime: completedJobs.length > 0
        ? completedJobs.reduce((sum, job) =>
            sum + ((job.completedAt?.getTime() || 0) - job.createdAt.getTime()), 0) / completedJobs.length
        : 0,
      storageSavedEstimate: completedJobs.reduce((sum, job) => sum + 1000000, 0) // Rough estimate
    };
  }

  /**
   * Manually trigger summarization for specific parameters
   */
  async triggerManualSummarization(params: {
    dataType: string;
    userId?: string;
    period: 'hourly' | 'daily' | 'weekly' | 'monthly';
    startDate: Date;
    endDate: Date;
  }): Promise<string> {
    return await this.createSummarizationJob(params);
  }

  /**
   * Stop the scheduler
   */
  stopScheduler(): void {
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer);
      this.schedulerTimer = undefined;
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}