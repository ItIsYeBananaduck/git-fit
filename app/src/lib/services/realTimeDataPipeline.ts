// File: realTimeDataPipeline.ts

/**
 * Real-Time Data Collection Pipeline
 * Purpose: Process streaming data from wearable devices with real-time analytics
 */

import type {
  HeartRateData,
  HRVData,
  ActivityData,
  DeviceData,
  DeviceType
} from './deviceDataSyncService';

export interface StreamingDataPoint {
  deviceId: string;
  userId: string;
  timestamp: Date;
  dataType: 'heart_rate' | 'hrv' | 'activity' | 'sleep' | 'recovery';
  value: number;
  metadata?: Record<string, any>;
}

export interface RealTimeMetrics {
  userId: string;
  timestamp: Date;
  currentHeartRate: number;
  averageHeartRate: number;
  hrvScore: number;
  hrvTrend: 'improving' | 'declining' | 'stable';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  fatigueIndex: number;
  recoveryRate: number;
}

export interface AlertCondition {
  id: string;
  userId: string;
  condition: string; // e.g., "heart_rate > 180", "hrv < 20"
  threshold: number;
  operator: '>' | '<' | '>=' | '<=' | '==';
  duration: number; // seconds
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
}

export interface Alert {
  id: string;
  userId: string;
  conditionId: string;
  timestamp: Date;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: StreamingDataPoint;
  acknowledged: boolean;
}

export class RealTimeDataPipeline {
  private dataBuffer: Map<string, StreamingDataPoint[]> = new Map();
  private metricsCache: Map<string, RealTimeMetrics> = new Map();
  private alertConditions: Map<string, AlertCondition[]> = new Map();
  private activeAlerts: Map<string, Alert[]> = new Map();
  private processingIntervals: Map<string, NodeJS.Timeout> = new Map();

  private readonly bufferSize = 100; // Keep last 100 data points per user
  private readonly processingInterval = 5000; // Process every 5 seconds

  constructor() {
    this.startProcessing();
  }

  /**
   * Ingest streaming data point
   */
  async ingestDataPoint(dataPoint: StreamingDataPoint): Promise<void> {
    const userKey = `${dataPoint.userId}_${dataPoint.dataType}`;

    // Add to buffer
    const buffer = this.dataBuffer.get(userKey) || [];
    buffer.push(dataPoint);

    // Keep only recent data points
    if (buffer.length > this.bufferSize) {
      buffer.shift();
    }

    this.dataBuffer.set(userKey, buffer);

    // Process immediately for critical data types
    if (dataPoint.dataType === 'heart_rate' || dataPoint.dataType === 'hrv') {
      await this.processCriticalData(dataPoint);
    }
  }

  /**
   * Process critical data types immediately
   */
  private async processCriticalData(dataPoint: StreamingDataPoint): Promise<void> {
    // Check alert conditions
    await this.checkAlertConditions(dataPoint);

    // Update real-time metrics
    await this.updateRealTimeMetrics(dataPoint);
  }

  /**
   * Check if data point triggers any alert conditions
   */
  private async checkAlertConditions(dataPoint: StreamingDataPoint): Promise<void> {
    const conditions = this.alertConditions.get(dataPoint.userId) || [];

    for (const condition of conditions) {
      if (!condition.enabled) continue;

      const shouldAlert = this.evaluateCondition(condition, dataPoint);
      if (shouldAlert) {
        await this.triggerAlert(condition, dataPoint);
      }
    }
  }

  /**
   * Evaluate if a condition is met
   */
  private evaluateCondition(condition: AlertCondition, dataPoint: StreamingDataPoint): boolean {
    // Parse condition (e.g., "heart_rate > 180")
    const parts = condition.condition.split(' ');
    if (parts.length !== 3) return false;

    const [dataType, operator, thresholdStr] = parts;
    const threshold = parseFloat(thresholdStr);

    if (dataPoint.dataType !== dataType) return false;

    switch (operator) {
      case '>':
        return dataPoint.value > threshold;
      case '<':
        return dataPoint.value < threshold;
      case '>=':
        return dataPoint.value >= threshold;
      case '<=':
        return dataPoint.value <= threshold;
      case '==':
        return dataPoint.value === threshold;
      default:
        return false;
    }
  }

  /**
   * Trigger an alert
   */
  private async triggerAlert(condition: AlertCondition, dataPoint: StreamingDataPoint): Promise<void> {
    const alert: Alert = {
      id: `${condition.id}_${Date.now()}`,
      userId: dataPoint.userId,
      conditionId: condition.id,
      timestamp: new Date(),
      message: this.generateAlertMessage(condition, dataPoint),
      severity: condition.severity,
      data: dataPoint,
      acknowledged: false
    };

    const userAlerts = this.activeAlerts.get(dataPoint.userId) || [];
    userAlerts.push(alert);
    this.activeAlerts.set(dataPoint.userId, userAlerts);

    // In a real implementation, this would send notifications
    console.log(`Alert triggered: ${alert.message}`);
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(condition: AlertCondition, dataPoint: StreamingDataPoint): string {
    const dataTypeLabel = dataPoint.dataType.replace('_', ' ').toUpperCase();
    const operator = condition.operator;
    const threshold = condition.threshold;

    return `${dataTypeLabel} ${operator} ${threshold}: Current value is ${dataPoint.value}`;
  }

  /**
   * Update real-time metrics for a user
   */
  private async updateRealTimeMetrics(dataPoint: StreamingDataPoint): Promise<void> {
    const metrics = this.metricsCache.get(dataPoint.userId) || this.createEmptyMetrics(dataPoint.userId);

    switch (dataPoint.dataType) {
      case 'heart_rate':
        metrics.currentHeartRate = dataPoint.value;
        metrics.averageHeartRate = this.calculateAverageHeartRate(dataPoint.userId);
        metrics.activityLevel = this.determineActivityLevel(metrics.currentHeartRate);
        break;

      case 'hrv':
        metrics.hrvScore = dataPoint.value;
        metrics.hrvTrend = this.calculateHRVTrend(dataPoint.userId);
        metrics.fatigueIndex = this.calculateFatigueIndex(metrics);
        break;

      case 'recovery':
        metrics.recoveryRate = dataPoint.value;
        break;
    }

    metrics.timestamp = new Date();
    this.metricsCache.set(dataPoint.userId, metrics);
  }

  /**
   * Calculate average heart rate from recent data
   */
  private calculateAverageHeartRate(userId: string): number {
    const hrData = this.dataBuffer.get(`${userId}_heart_rate`) || [];
    if (hrData.length === 0) return 0;

    const sum = hrData.reduce((acc, point) => acc + point.value, 0);
    return sum / hrData.length;
  }

  /**
   * Determine activity level based on heart rate
   */
  private determineActivityLevel(heartRate: number): 'sedentary' | 'light' | 'moderate' | 'vigorous' {
    if (heartRate < 100) return 'sedentary';
    if (heartRate < 130) return 'light';
    if (heartRate < 160) return 'moderate';
    return 'vigorous';
  }

  /**
   * Calculate HRV trend
   */
  private calculateHRVTrend(userId: string): 'improving' | 'declining' | 'stable' {
    const hrvData = this.dataBuffer.get(`${userId}_hrv`) || [];
    if (hrvData.length < 5) return 'stable';

    const recent = hrvData.slice(-5);
    const older = hrvData.slice(-10, -5);

    if (older.length === 0) return 'stable';

    const recentAvg = recent.reduce((sum, p) => sum + p.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, p) => sum + p.value, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }

  /**
   * Calculate fatigue index based on multiple metrics
   */
  private calculateFatigueIndex(metrics: RealTimeMetrics): number {
    // Simple fatigue calculation based on HRV and heart rate
    const hrvComponent = Math.max(0, (50 - metrics.hrvScore) / 50); // Lower HRV = higher fatigue
    const hrComponent = Math.max(0, (metrics.currentHeartRate - 60) / 40); // Higher HR relative to resting = higher fatigue

    return (hrvComponent * 0.6 + hrComponent * 0.4) * 100;
  }

  /**
   * Create empty metrics object
   */
  private createEmptyMetrics(userId: string): RealTimeMetrics {
    return {
      userId,
      timestamp: new Date(),
      currentHeartRate: 0,
      averageHeartRate: 0,
      hrvScore: 0,
      hrvTrend: 'stable',
      activityLevel: 'sedentary',
      fatigueIndex: 0,
      recoveryRate: 0
    };
  }

  /**
   * Start periodic processing of buffered data
   */
  private startProcessing(): void {
    setInterval(() => {
      this.processBufferedData();
    }, this.processingInterval);
  }

  /**
   * Process buffered data periodically
   */
  private async processBufferedData(): Promise<void> {
    // Process data for analysis, aggregation, and storage
    Array.from(this.dataBuffer.entries()).forEach(async ([userKey, buffer]) => {
      if (buffer.length === 0) return;

      const [userId, dataType] = userKey.split('_');

      // Aggregate data for storage
      await this.aggregateAndStoreData(userId, dataType as any, buffer);

      // Clear old data (keep only recent)
      const recentData = buffer.filter((point: StreamingDataPoint) =>
        point.timestamp > new Date(Date.now() - 3600000) // Last hour
      );
      this.dataBuffer.set(userKey, recentData);
    });
  }

  /**
   * Aggregate and store processed data
   */
  private async aggregateAndStoreData(
    userId: string,
    dataType: StreamingDataPoint['dataType'],
    data: StreamingDataPoint[]
  ): Promise<void> {
    // This would aggregate data and store in database
    // For example, calculate hourly averages, detect patterns, etc.
    console.log(`Processing ${data.length} ${dataType} data points for user ${userId}`);
  }

  /**
   * Add alert condition for a user
   */
  addAlertCondition(userId: string, condition: Omit<AlertCondition, 'id'>): string {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullCondition: AlertCondition = { id, ...condition };

    const userConditions = this.alertConditions.get(userId) || [];
    userConditions.push(fullCondition);
    this.alertConditions.set(userId, userConditions);

    return id;
  }

  /**
   * Remove alert condition
   */
  removeAlertCondition(userId: string, conditionId: string): boolean {
    const conditions = this.alertConditions.get(userId) || [];
    const filtered = conditions.filter(c => c.id !== conditionId);

    if (filtered.length !== conditions.length) {
      this.alertConditions.set(userId, filtered);
      return true;
    }

    return false;
  }

  /**
   * Get active alerts for a user
   */
  getActiveAlerts(userId: string): Alert[] {
    return this.activeAlerts.get(userId) || [];
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(userId: string, alertId: string): boolean {
    const alerts = this.activeAlerts.get(userId) || [];
    const alert = alerts.find(a => a.id === alertId);

    if (alert) {
      alert.acknowledged = true;
      return true;
    }

    return false;
  }

  /**
   * Get real-time metrics for a user
   */
  getRealTimeMetrics(userId: string): RealTimeMetrics | undefined {
    return this.metricsCache.get(userId);
  }

  /**
   * Get recent data points for a user and data type
   */
  getRecentData(userId: string, dataType: StreamingDataPoint['dataType'], limit = 50): StreamingDataPoint[] {
    const buffer = this.dataBuffer.get(`${userId}_${dataType}`) || [];
    return buffer.slice(-limit);
  }

  /**
   * Process device data from sync service
   */
  async processDeviceData(deviceData: DeviceData): Promise<void> {
    const dataPoints: StreamingDataPoint[] = [];

    // Convert heart rate data
    if (deviceData.heartRate) {
      deviceData.heartRate.forEach(hr => {
        dataPoints.push({
          deviceId: deviceData.deviceId,
          userId: deviceData.userId,
          timestamp: hr.timestamp,
          dataType: 'heart_rate',
          value: hr.bpm,
          metadata: { zone: hr.zone }
        });
      });
    }

    // Convert HRV data
    if (deviceData.hrv) {
      deviceData.hrv.forEach(hrv => {
        dataPoints.push({
          deviceId: deviceData.deviceId,
          userId: deviceData.userId,
          timestamp: hrv.timestamp,
          dataType: 'hrv',
          value: hrv.hrv,
          metadata: { rmssd: hrv.rmssd, sdnn: hrv.sdnn }
        });
      });
    }

    // Convert activity data
    if (deviceData.activity) {
      dataPoints.push({
        deviceId: deviceData.deviceId,
        userId: deviceData.userId,
        timestamp: new Date(),
        dataType: 'activity',
        value: deviceData.activity.calories,
        metadata: {
          steps: deviceData.activity.steps,
          distance: deviceData.activity.distance,
          activeMinutes: deviceData.activity.activeMinutes
        }
      });
    }

    // Ingest all data points
    for (const point of dataPoints) {
      await this.ingestDataPoint(point);
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    Array.from(this.processingIntervals.values()).forEach(interval => {
      clearInterval(interval);
    });
    this.processingIntervals.clear();
  }
}