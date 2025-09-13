// File: dataRetentionService.ts

/**
 * Data Retention Service
 * Purpose: Manage data lifecycle, retention policies, and automated cleanup
 */

import type { RecoveryData, TrainingSession } from '../types/sharedTypes';

export interface RetentionPolicy {
  dataType: string;
  rawDataRetentionDays: number;
  summarizedRetentionDays: number;
  archiveRetentionDays: number;
  compressionEnabled: boolean;
  encryptionRequired: boolean;
}

export interface DataRetentionConfig {
  policies: RetentionPolicy[];
  defaultRetentionDays: number;
  archiveThresholdDays: number;
  cleanupBatchSize: number;
  cleanupIntervalHours: number;
  enableAutoCleanup: boolean;
}

export interface DataSummary {
  id: string;
  userId: string;
  dataType: string;
  period: 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  metrics: Record<string, any>;
  sampleCount: number;
  createdAt: Date;
}

export interface CleanupResult {
  dataType: string;
  recordsDeleted: number;
  recordsArchived: number;
  recordsCompressed: number;
  errors: string[];
  duration: number;
}

export class DataRetentionService {
  private config: DataRetentionConfig;
  private cleanupTimer?: NodeJS.Timeout;
  private readonly defaultPolicies: RetentionPolicy[] = [
    {
      dataType: 'heart_rate',
      rawDataRetentionDays: 30,
      summarizedRetentionDays: 365,
      archiveRetentionDays: 2555, // 7 years
      compressionEnabled: true,
      encryptionRequired: true
    },
    {
      dataType: 'hrv',
      rawDataRetentionDays: 90,
      summarizedRetentionDays: 730, // 2 years
      archiveRetentionDays: 2555,
      compressionEnabled: true,
      encryptionRequired: true
    },
    {
      dataType: 'sleep',
      rawDataRetentionDays: 365,
      summarizedRetentionDays: 1825, // 5 years
      archiveRetentionDays: 2555,
      compressionEnabled: true,
      encryptionRequired: false
    },
    {
      dataType: 'activity',
      rawDataRetentionDays: 90,
      summarizedRetentionDays: 730,
      archiveRetentionDays: 2555,
      compressionEnabled: true,
      encryptionRequired: false
    },
    {
      dataType: 'recovery',
      rawDataRetentionDays: 180,
      summarizedRetentionDays: 1095, // 3 years
      archiveRetentionDays: 2555,
      compressionEnabled: true,
      encryptionRequired: true
    },
    {
      dataType: 'training_session',
      rawDataRetentionDays: 730, // 2 years
      summarizedRetentionDays: 2555, // 7 years
      archiveRetentionDays: -1, // Never delete
      compressionEnabled: true,
      encryptionRequired: false
    },
    {
      dataType: 'nutrition_log',
      rawDataRetentionDays: 365,
      summarizedRetentionDays: 1825,
      archiveRetentionDays: 2555,
      compressionEnabled: true,
      encryptionRequired: false
    }
  ];

  constructor(config?: Partial<DataRetentionConfig>) {
    this.config = {
      policies: this.defaultPolicies,
      defaultRetentionDays: 365,
      archiveThresholdDays: 180,
      cleanupBatchSize: 1000,
      cleanupIntervalHours: 24,
      enableAutoCleanup: true,
      ...config
    };

    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Get retention policy for a specific data type
   */
  getPolicy(dataType: string): RetentionPolicy {
    return this.config.policies.find(p => p.dataType === dataType) ||
           this.createDefaultPolicy(dataType);
  }

  /**
   * Create default policy for unknown data types
   */
  private createDefaultPolicy(dataType: string): RetentionPolicy {
    return {
      dataType,
      rawDataRetentionDays: this.config.defaultRetentionDays,
      summarizedRetentionDays: this.config.defaultRetentionDays * 2,
      archiveRetentionDays: this.config.defaultRetentionDays * 7,
      compressionEnabled: true,
      encryptionRequired: false
    };
  }

  /**
   * Check if data should be retained based on policy
   */
  shouldRetain(dataType: string, dataAge: Date, dataCategory: 'raw' | 'summarized' | 'archived' = 'raw'): boolean {
    const policy = this.getPolicy(dataType);
    const ageInDays = this.getAgeInDays(dataAge);

    switch (dataCategory) {
      case 'raw':
        return ageInDays <= policy.rawDataRetentionDays;
      case 'summarized':
        return ageInDays <= policy.summarizedRetentionDays;
      case 'archived':
        return policy.archiveRetentionDays === -1 || ageInDays <= policy.archiveRetentionDays;
      default:
        return false;
    }
  }

  /**
   * Calculate age in days
   */
  private getAgeInDays(date: Date): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Determine if data should be archived
   */
  shouldArchive(dataType: string, dataAge: Date): boolean {
    const policy = this.getPolicy(dataType);
    const ageInDays = this.getAgeInDays(dataAge);

    return ageInDays > policy.rawDataRetentionDays &&
           ageInDays <= policy.summarizedRetentionDays;
  }

  /**
   * Determine if data should be compressed
   */
  shouldCompress(dataType: string): boolean {
    const policy = this.getPolicy(dataType);
    return policy.compressionEnabled;
  }

  /**
   * Determine if data should be encrypted
   */
  shouldEncrypt(dataType: string): boolean {
    const policy = this.getPolicy(dataType);
    return policy.encryptionRequired;
  }

  /**
   * Run cleanup for a specific data type
   */
  async cleanupDataType(dataType: string): Promise<CleanupResult> {
    const startTime = Date.now();
    const result: CleanupResult = {
      dataType,
      recordsDeleted: 0,
      recordsArchived: 0,
      recordsCompressed: 0,
      errors: [],
      duration: 0
    };

    try {
      // Get data older than retention policy allows
      const policy = this.getPolicy(dataType);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - policy.rawDataRetentionDays);

      // Delete raw data that's too old
      const deletedCount = await this.deleteOldRawData(dataType, cutoffDate);
      result.recordsDeleted = deletedCount;

      // Archive data that's between raw retention and summarized retention
      const archiveCutoff = new Date();
      archiveCutoff.setDate(archiveCutoff.getDate() - policy.summarizedRetentionDays);
      const archivedCount = await this.archiveOldData(dataType, cutoffDate, archiveCutoff);
      result.recordsArchived = archivedCount;

      // Compress data if policy requires it
      if (policy.compressionEnabled) {
        const compressedCount = await this.compressData(dataType);
        result.recordsCompressed = compressedCount;
      }

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Run cleanup for all data types
   */
  async cleanupAllData(): Promise<CleanupResult[]> {
    const results: CleanupResult[] = [];

    for (const policy of this.config.policies) {
      try {
        const result = await this.cleanupDataType(policy.dataType);
        results.push(result);
      } catch (error) {
        results.push({
          dataType: policy.dataType,
          recordsDeleted: 0,
          recordsArchived: 0,
          recordsCompressed: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          duration: 0
        });
      }
    }

    return results;
  }

  /**
   * Create data summary for aggregation
   */
  async createDataSummary(
    userId: string,
    dataType: string,
    period: 'hourly' | 'daily' | 'weekly' | 'monthly',
    startDate: Date,
    endDate: Date,
    rawData: any[]
  ): Promise<DataSummary> {
    const summary: DataSummary = {
      id: `${dataType}_${userId}_${period}_${startDate.getTime()}`,
      userId,
      dataType,
      period,
      startDate,
      endDate,
      metrics: this.calculateSummaryMetrics(dataType, rawData),
      sampleCount: rawData.length,
      createdAt: new Date()
    };

    // Store summary (would integrate with database)
    await this.storeDataSummary(summary);

    return summary;
  }

  /**
   * Calculate summary metrics based on data type
   */
  private calculateSummaryMetrics(dataType: string, rawData: any[]): Record<string, any> {
    if (rawData.length === 0) return {};

    switch (dataType) {
      case 'heart_rate':
        return this.calculateHeartRateMetrics(rawData);
      case 'hrv':
        return this.calculateHRVMetrics(rawData);
      case 'sleep':
        return this.calculateSleepMetrics(rawData);
      case 'activity':
        return this.calculateActivityMetrics(rawData);
      case 'recovery':
        return this.calculateRecoveryMetrics(rawData);
      default:
        return this.calculateGenericMetrics(rawData);
    }
  }

  /**
   * Calculate heart rate summary metrics
   */
  private calculateHeartRateMetrics(data: any[]): Record<string, any> {
    const values = data.map(d => d.bpm || d.value).filter(v => v > 0);
    if (values.length === 0) return {};

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((a, b) => a + b, 0) / values.length,
      median: this.calculateMedian(values),
      resting: this.calculateRestingHeartRate(values),
      zones: this.calculateHeartRateZones(values)
    };
  }

  /**
   * Calculate HRV summary metrics
   */
  private calculateHRVMetrics(data: any[]): Record<string, any> {
    const values = data.map(d => d.hrv || d.value).filter(v => v > 0);
    if (values.length === 0) return {};

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((a, b) => a + b, 0) / values.length,
      median: this.calculateMedian(values),
      rmssd: data.filter(d => d.rmssd).length > 0 ?
        data.map(d => d.rmssd).reduce((a, b) => a + b, 0) / data.filter(d => d.rmssd).length : null,
      sdnn: data.filter(d => d.sdnn).length > 0 ?
        data.map(d => d.sdnn).reduce((a, b) => a + b, 0) / data.filter(d => d.sdnn).length : null
    };
  }

  /**
   * Calculate sleep summary metrics
   */
  private calculateSleepMetrics(data: any[]): Record<string, any> {
    const sleepSessions = data.filter(d => d.duration);
    if (sleepSessions.length === 0) return {};

    const durations = sleepSessions.map(d => d.duration);
    const efficiencies = sleepSessions.map(d => d.efficiency).filter(e => e > 0);

    return {
      totalSleepTime: durations.reduce((a, b) => a + b, 0),
      averageSleepTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      averageEfficiency: efficiencies.length > 0 ?
        efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length : null,
      sleepConsistency: this.calculateSleepConsistency(durations),
      stages: this.aggregateSleepStages(sleepSessions)
    };
  }

  /**
   * Calculate activity summary metrics
   */
  private calculateActivityMetrics(data: any[]): Record<string, any> {
    const activities = data.filter(d => d.steps || d.calories);
    if (activities.length === 0) return {};

    return {
      totalSteps: activities.reduce((sum, d) => sum + (d.steps || 0), 0),
      totalCalories: activities.reduce((sum, d) => sum + (d.calories || 0), 0),
      totalDistance: activities.reduce((sum, d) => sum + (d.distance || 0), 0),
      totalActiveMinutes: activities.reduce((sum, d) => sum + (d.activeMinutes || 0), 0),
      averageSteps: activities.reduce((sum, d) => sum + (d.steps || 0), 0) / activities.length,
      averageCalories: activities.reduce((sum, d) => sum + (d.calories || 0), 0) / activities.length
    };
  }

  /**
   * Calculate recovery summary metrics
   */
  private calculateRecoveryMetrics(data: any[]): Record<string, any> {
    const recoveries = data.filter(d => d.recoveryScore);
    if (recoveries.length === 0) return {};

    return {
      averageRecoveryScore: recoveries.reduce((sum, d) => sum + d.recoveryScore, 0) / recoveries.length,
      averageHRVScore: recoveries.filter(d => d.hrvScore).length > 0 ?
        recoveries.reduce((sum, d) => sum + d.hrvScore, 0) / recoveries.filter(d => d.hrvScore).length : null,
      averageRestingHR: recoveries.filter(d => d.restingHeartRate).length > 0 ?
        recoveries.reduce((sum, d) => sum + d.restingHeartRate, 0) / recoveries.filter(d => d.restingHeartRate).length : null,
      averageSleepPerformance: recoveries.filter(d => d.sleepPerformance).length > 0 ?
        recoveries.reduce((sum, d) => sum + d.sleepPerformance, 0) / recoveries.filter(d => d.sleepPerformance).length : null,
      recoveryTrend: this.calculateRecoveryTrend(recoveries)
    };
  }

  /**
   * Calculate generic metrics for unknown data types
   */
  private calculateGenericMetrics(data: any[]): Record<string, any> {
    const numericValues = data.map(d => {
      if (typeof d.value === 'number') return d.value;
      if (typeof d === 'number') return d;
      return null;
    }).filter(v => v !== null) as number[];

    if (numericValues.length === 0) return {};

    return {
      count: data.length,
      min: Math.min(...numericValues),
      max: Math.max(...numericValues),
      average: numericValues.reduce((a, b) => a + b, 0) / numericValues.length,
      median: this.calculateMedian(numericValues)
    };
  }

  /**
   * Calculate median value
   */
  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  /**
   * Calculate resting heart rate from data
   */
  private calculateRestingHeartRate(values: number[]): number {
    // Resting HR is typically the lowest values during sleep/rest periods
    const sorted = [...values].sort((a, b) => a - b);
    const lowest10Percent = sorted.slice(0, Math.ceil(sorted.length * 0.1));
    return lowest10Percent.reduce((a, b) => a + b, 0) / lowest10Percent.length;
  }

  /**
   * Calculate heart rate zones
   */
  private calculateHeartRateZones(values: number[]): Record<string, number> {
    const max = Math.max(...values);
    return {
      fatBurn: values.filter(v => v >= max * 0.5 && v < max * 0.7).length,
      cardio: values.filter(v => v >= max * 0.7 && v < max * 0.85).length,
      peak: values.filter(v => v >= max * 0.85).length
    };
  }

  /**
   * Calculate sleep consistency
   */
  private calculateSleepConsistency(durations: number[]): number {
    if (durations.length < 2) return 100;

    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / durations.length;
    const stdDev = Math.sqrt(variance);

    // Return consistency as percentage (lower std dev = higher consistency)
    return Math.max(0, Math.min(100, 100 - (stdDev / avg) * 100));
  }

  /**
   * Aggregate sleep stages
   */
  private aggregateSleepStages(sleepSessions: any[]): Record<string, number> {
    const stages: Record<string, number> = { awake: 0, light: 0, deep: 0, rem: 0 };

    sleepSessions.forEach(session => {
      if (session.stages) {
        session.stages.forEach((stage: any) => {
          const stageName = stage.stage?.toLowerCase() || 'unknown';
          if (stages[stageName] !== undefined) {
            stages[stageName] += stage.duration || 0;
          }
        });
      }
    });

    return stages;
  }

  /**
   * Calculate recovery trend
   */
  private calculateRecoveryTrend(recoveries: any[]): 'improving' | 'declining' | 'stable' {
    if (recoveries.length < 7) return 'stable';

    const recent = recoveries.slice(-7);
    const previous = recoveries.slice(-14, -7);

    if (previous.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, r) => sum + r.recoveryScore, 0) / recent.length;
    const previousAvg = previous.reduce((sum, r) => sum + r.recoveryScore, 0) / previous.length;

    const change = ((recentAvg - previousAvg) / previousAvg) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  /**
   * Delete old raw data
   */
  private async deleteOldRawData(dataType: string, cutoffDate: Date): Promise<number> {
    // This would integrate with your database to delete old records
    console.log(`Deleting ${dataType} data older than ${cutoffDate.toISOString()}`);
    return 0; // Placeholder
  }

  /**
   * Archive old data
   */
  private async archiveOldData(dataType: string, rawCutoff: Date, archiveCutoff: Date): Promise<number> {
    // This would move data to archive storage
    console.log(`Archiving ${dataType} data between ${rawCutoff.toISOString()} and ${archiveCutoff.toISOString()}`);
    return 0; // Placeholder
  }

  /**
   * Compress data
   */
  private async compressData(dataType: string): Promise<number> {
    // This would compress old data to save space
    console.log(`Compressing ${dataType} data`);
    return 0; // Placeholder
  }

  /**
   * Store data summary
   */
  private async storeDataSummary(summary: DataSummary): Promise<void> {
    // This would store the summary in your database
    console.log(`Storing summary for ${summary.dataType}: ${summary.id}`);
  }

  /**
   * Start automatic cleanup process
   */
  private startAutoCleanup(): void {
    const intervalMs = this.config.cleanupIntervalHours * 60 * 60 * 1000;
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.cleanupAllData();
      } catch (error) {
        console.error('Auto cleanup failed:', error);
      }
    }, intervalMs);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
  }

  /**
   * Update retention policy
   */
  updatePolicy(dataType: string, updates: Partial<RetentionPolicy>): void {
    const existingIndex = this.config.policies.findIndex(p => p.dataType === dataType);
    if (existingIndex >= 0) {
      this.config.policies[existingIndex] = { ...this.config.policies[existingIndex], ...updates };
    } else {
      this.config.policies.push({ ...this.createDefaultPolicy(dataType), ...updates });
    }
  }

  /**
   * Get all retention policies
   */
  getAllPolicies(): RetentionPolicy[] {
    return [...this.config.policies];
  }

  /**
   * Get cleanup statistics
   */
  async getCleanupStatistics(): Promise<Record<string, any>> {
    // This would return statistics about data cleanup operations
    return {
      lastCleanup: new Date(),
      totalRecordsProcessed: 0,
      storageSaved: '0 MB',
      policies: this.config.policies.length
    };
  }
}