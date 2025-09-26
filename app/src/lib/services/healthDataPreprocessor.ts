import type { HealthMetrics } from './healthDataService.js';

// Validation thresholds for health data quality
export const HEALTH_DATA_THRESHOLDS = {
  heartRate: {
    min: 40,    // Minimum reasonable HR (bradycardia boundary)
    max: 220,   // Maximum reasonable HR
    restingMax: 100,  // Maximum reasonable resting HR
    exerciseMin: 90,  // Minimum reasonable exercise HR
  },
  spo2: {
    min: 80,    // Minimum reasonable SpO2 (medical emergency below this)
    max: 100,   // Maximum possible SpO2
    normalMin: 95, // Normal SpO2 minimum
  },
  sleep: {
    minHours: 2,    // Minimum reasonable sleep (naps)
    maxHours: 16,   // Maximum reasonable sleep
    idealMin: 6,    // Minimum healthy sleep
    idealMax: 10,   // Maximum healthy sleep
  },
} as const;

// Data quality indicators
export interface HealthDataQuality {
  heartRateQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';
  spo2Quality: 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';
  sleepQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';
  overallQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';
  issues: string[];
  recommendations: string[];
}

// Processed health metrics with quality indicators
export interface ProcessedHealthMetrics {
  // Original health metrics
  heartRate?: {
    avgHR: number;
    maxHR: number;
    variance: number;
  };
  spo2?: {
    avgSpO2: number;
    drift: number;
  };
  sleepScore?: number;
  
  // Quality assessment
  quality: HealthDataQuality;
  normalized: {
    heartRateIntensity: number;  // 0-100 scale
    spo2Stability: number;       // 0-100 scale (higher = more stable)
    sleepQuality: number;        // 0-100 scale
  };
  flags: {
    possibleArtifacts: boolean;
    unusualReadings: boolean;
    incompleteData: boolean;
  };
}

class HealthDataPreprocessor {
  /**
   * Process and validate health metrics for Monday intensity analysis
   */
  processHealthMetrics(metrics: HealthMetrics): ProcessedHealthMetrics {
    const quality = this.assessDataQuality(metrics);
    const normalized = this.normalizeHealthData(metrics);
    const flags = this.detectDataFlags(metrics);

    return {
      // Map original health metrics
      heartRate: metrics.heartRate,
      spo2: metrics.spo2,
      sleepScore: metrics.sleepScore,
      
      // Add quality assessment
      quality,
      normalized,
      flags,
    };
  }

  /**
   * Assess the quality of health data
   */
  private assessDataQuality(metrics: HealthMetrics): HealthDataQuality {
    const issues: string[] = [];
    const recommendations: string[] = [];
    
    // Assess heart rate quality
    const hrQuality = this.assessHeartRateQuality(metrics.heartRate, issues, recommendations);
    
    // Assess SpO2 quality  
    const spo2Quality = this.assessSpO2Quality(metrics.spo2, issues, recommendations);
    
    // Assess sleep quality
    const sleepQuality = this.assessSleepQuality(metrics.sleepScore, issues, recommendations);
    
    // Calculate overall quality
    const qualities = [hrQuality, spo2Quality, sleepQuality];
    const qualityScores = qualities.map(q => this.qualityToScore(q));
    const avgScore = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length;
    const overallQuality = this.scoreToQuality(avgScore);

    return {
      heartRateQuality: hrQuality,
      spo2Quality: spo2Quality,
      sleepQuality: sleepQuality,
      overallQuality,
      issues,
      recommendations,
    };
  }

  /**
   * Assess heart rate data quality
   */
  private assessHeartRateQuality(
    heartRate: HealthMetrics['heartRate'],
    issues: string[],
    recommendations: string[]
  ): HealthDataQuality['heartRateQuality'] {
    if (!heartRate) {
      issues.push('No heart rate data available');
      recommendations.push('Ensure fitness tracker is worn during workouts');
      return 'invalid';
    }

    const { avgHR, maxHR, variance } = heartRate;

    // Check for reasonable ranges
    if (avgHR < HEALTH_DATA_THRESHOLDS.heartRate.min || avgHR > HEALTH_DATA_THRESHOLDS.heartRate.max) {
      issues.push(`Average heart rate (${avgHR}) outside normal range`);
      return 'invalid';
    }

    if (maxHR < HEALTH_DATA_THRESHOLDS.heartRate.min || maxHR > HEALTH_DATA_THRESHOLDS.heartRate.max) {
      issues.push(`Maximum heart rate (${maxHR}) outside normal range`);
      return 'invalid';
    }

    // Check for logical consistency
    if (maxHR <= avgHR) {
      issues.push('Maximum heart rate should be higher than average');
      return 'poor';
    }

    // Quality assessment based on variance and values
    if (variance > 25) {
      issues.push('Very high heart rate variability detected');
      recommendations.push('Check for device positioning or artifacts');
      return 'fair';
    }

    if (variance < 2) {
      issues.push('Very low heart rate variability may indicate poor data quality');
      return 'fair';
    }

    // Excellent quality indicators
    if (variance >= 8 && variance <= 20 && maxHR - avgHR >= 20) {
      return 'excellent';
    }

    // Good quality indicators
    if (variance >= 5 && variance <= 25 && maxHR - avgHR >= 10) {
      return 'good';
    }

    return 'fair';
  }

  /**
   * Assess SpO2 data quality
   */
  private assessSpO2Quality(
    spo2: HealthMetrics['spo2'],
    issues: string[],
    recommendations: string[]
  ): HealthDataQuality['spo2Quality'] {
    if (!spo2) {
      issues.push('No SpO2 data available');
      recommendations.push('Use device with SpO2 sensor during workouts');
      return 'invalid';
    }

    const { avgSpO2, drift } = spo2;

    // Check for reasonable ranges
    if (avgSpO2 < HEALTH_DATA_THRESHOLDS.spo2.min || avgSpO2 > HEALTH_DATA_THRESHOLDS.spo2.max) {
      issues.push(`Average SpO2 (${avgSpO2.toFixed(1)}%) outside normal range`);
      return 'invalid';
    }

    // Check for concerning values
    if (avgSpO2 < HEALTH_DATA_THRESHOLDS.spo2.normalMin) {
      issues.push(`Low SpO2 detected (${avgSpO2.toFixed(1)}%)`);
      recommendations.push('Consider consulting healthcare provider if consistently low');
      return 'poor';
    }

    // Quality assessment based on drift
    if (drift > 8) {
      issues.push('Very high SpO2 instability detected');
      recommendations.push('Check device fit and positioning');
      return 'poor';
    }

    if (drift > 5) {
      issues.push('High SpO2 instability may indicate measurement issues');
      return 'fair';
    }

    // Excellent quality indicators  
    if (avgSpO2 >= 96 && drift <= 2) {
      return 'excellent';
    }

    // Good quality indicators
    if (avgSpO2 >= 94 && drift <= 3) {
      return 'good';
    }

    return 'fair';
  }

  /**
   * Assess sleep data quality
   */
  private assessSleepQuality(
    sleepScore: number | undefined,
    issues: string[],
    recommendations: string[]
  ): HealthDataQuality['sleepQuality'] {
    if (sleepScore === undefined) {
      issues.push('No sleep data available');
      recommendations.push('Enable sleep tracking on your device');
      return 'invalid';
    }

    // Convert sleep score back to hours for assessment (0-20 range = 0-10 hours)
    const sleepHours = (sleepScore / 20) * 10;

    if (sleepHours < HEALTH_DATA_THRESHOLDS.sleep.minHours) {
      issues.push(`Very little sleep detected (${sleepHours.toFixed(1)} hours)`);
      return 'poor';
    }

    if (sleepHours > HEALTH_DATA_THRESHOLDS.sleep.maxHours) {
      issues.push(`Excessive sleep detected (${sleepHours.toFixed(1)} hours)`);
      return 'fair';
    }

    // Quality assessment based on sleep duration
    if (sleepHours >= HEALTH_DATA_THRESHOLDS.sleep.idealMin && 
        sleepHours <= HEALTH_DATA_THRESHOLDS.sleep.idealMax) {
      return 'excellent';
    }

    if (sleepHours >= 5 && sleepHours <= 11) {
      return 'good';
    }

    if (sleepHours < 5) {
      issues.push(`Insufficient sleep (${sleepHours.toFixed(1)} hours)`);
      recommendations.push('Aim for 7-9 hours of sleep for optimal recovery');
      return 'poor';
    }

    return 'fair';
  }

  /**
   * Normalize health data to 0-100 scales for consistent analysis
   */
  private normalizeHealthData(metrics: HealthMetrics) {
    return {
      heartRateIntensity: this.normalizeHeartRateIntensity(metrics.heartRate),
      spo2Stability: this.normalizeSpO2Stability(metrics.spo2),
      sleepQuality: this.normalizeSleepQuality(metrics.sleepScore),
    };
  }

  /**
   * Normalize heart rate intensity to 0-100 scale
   */
  private normalizeHeartRateIntensity(heartRate: HealthMetrics['heartRate']): number {
    if (!heartRate) return 0;

    const { avgHR, maxHR, variance } = heartRate;
    
    // Calculate intensity based on multiple factors
    let intensity = 0;

    // Base intensity from average HR (assuming age ~30, max HR ~190)
    const estimatedMaxHR = 190;
    const hrIntensity = Math.min(100, (avgHR / estimatedMaxHR) * 100);
    intensity += hrIntensity * 0.5;

    // Add intensity from HR elevation (max - avg)
    const elevation = maxHR - avgHR;
    const elevationIntensity = Math.min(100, (elevation / 50) * 100);
    intensity += elevationIntensity * 0.3;

    // Add intensity from variance (indicates effort variation)
    const varianceIntensity = Math.min(100, (variance / 20) * 100);
    intensity += varianceIntensity * 0.2;

    return Math.round(Math.min(100, Math.max(0, intensity)));
  }

  /**
   * Normalize SpO2 stability to 0-100 scale (higher = more stable)
   */
  private normalizeSpO2Stability(spo2: HealthMetrics['spo2']): number {
    if (!spo2) return 0;

    const { drift } = spo2;
    
    // Convert drift to stability (inverse relationship)
    // Drift of 0 = 100% stability, drift of 10+ = 0% stability
    const stability = Math.max(0, Math.min(100, 100 - (drift * 10)));
    
    return Math.round(stability);
  }

  /**
   * Normalize sleep quality to 0-100 scale
   */
  private normalizeSleepQuality(sleepScore: number | undefined): number {
    if (sleepScore === undefined) return 0;

    // Sleep score is already 0-20, convert to 0-100
    return Math.round((sleepScore / 20) * 100);
  }

  /**
   * Detect data quality flags
   */
  private detectDataFlags(metrics: HealthMetrics) {
    return {
      possibleArtifacts: this.detectPossibleArtifacts(metrics),
      unusualReadings: this.detectUnusualReadings(metrics),
      incompleteData: this.detectIncompleteData(metrics),
    };
  }

  /**
   * Detect possible measurement artifacts
   */
  private detectPossibleArtifacts(metrics: HealthMetrics): boolean {
    // Very high HR variance might indicate movement artifacts
    if (metrics.heartRate?.variance && metrics.heartRate.variance > 30) {
      return true;
    }

    // Very high SpO2 drift might indicate sensor issues
    if (metrics.spo2?.drift && metrics.spo2.drift > 8) {
      return true;
    }

    // Unrealistic perfect readings might be artifacts
    if (metrics.heartRate?.variance === 0 || metrics.spo2?.drift === 0) {
      return true;
    }

    return false;
  }

  /**
   * Detect unusual but potentially valid readings
   */
  private detectUnusualReadings(metrics: HealthMetrics): boolean {
    // Very low or high heart rates (but within valid range)
    if (metrics.heartRate) {
      const { avgHR } = metrics.heartRate;
      if (avgHR < 50 || avgHR > 180) {
        return true;
      }
    }

    // Low SpO2 readings
    if (metrics.spo2?.avgSpO2 && metrics.spo2.avgSpO2 < 95) {
      return true;
    }

    // Very little or excessive sleep
    if (metrics.sleepScore !== undefined) {
      const sleepHours = (metrics.sleepScore / 20) * 10;
      if (sleepHours < 4 || sleepHours > 12) {
        return true;
      }
    }

    return false;
  }

  /**
   * Detect incomplete data
   */
  private detectIncompleteData(metrics: HealthMetrics): boolean {
    // Check if any major data types are missing
    const hasHeartRate = !!metrics.heartRate;
    const hasSpO2 = !!metrics.spo2;
    const hasSleep = metrics.sleepScore !== undefined;

    // Consider incomplete if missing 2 or more data types
    const dataTypesPresent = [hasHeartRate, hasSpO2, hasSleep].filter(Boolean).length;
    return dataTypesPresent < 2;
  }

  /**
   * Helper: Convert quality enum to numeric score
   */
  private qualityToScore(quality: HealthDataQuality['heartRateQuality']): number {
    switch (quality) {
      case 'excellent': return 100;
      case 'good': return 80;
      case 'fair': return 60;
      case 'poor': return 40;
      case 'invalid': return 0;
      default: return 0;
    }
  }

  /**
   * Helper: Convert numeric score to quality enum
   */
  private scoreToQuality(score: number): HealthDataQuality['overallQuality'] {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    if (score >= 50) return 'fair';
    if (score >= 25) return 'poor';
    return 'invalid';
  }

  /**
   * Generate health data insights for user display
   */
  generateHealthInsights(processed: ProcessedHealthMetrics): string[] {
    const insights: string[] = [];

    // Heart rate insights
    if (processed.heartRate && processed.quality.heartRateQuality !== 'invalid') {
      const intensity = processed.normalized.heartRateIntensity;
      if (intensity > 80) {
        insights.push(`High intensity workout detected (${intensity}% HR intensity)`);
      } else if (intensity < 40) {
        insights.push(`Low intensity session (${intensity}% HR intensity)`);
      }
    }

    // SpO2 insights
    if (processed.spo2 && processed.quality.spo2Quality !== 'invalid') {
      const stability = processed.normalized.spo2Stability;
      if (stability < 50) {
        insights.push('SpO2 instability may indicate high workout stress');
      }
    }

    // Sleep insights
    if (processed.sleepScore !== undefined && processed.quality.sleepQuality !== 'invalid') {
      const sleepQuality = processed.normalized.sleepQuality;
      if (sleepQuality < 40) {
        insights.push('Poor sleep may impact workout performance');
      } else if (sleepQuality > 80) {
        insights.push('Excellent sleep supports peak performance');
      }
    }

    return insights;
  }
}

// Create singleton instance
export const healthDataPreprocessor = new HealthDataPreprocessor();

// Helper function to process health data for Monday analysis
export function preprocessHealthDataForMonday(
  healthMetrics: HealthMetrics
): ProcessedHealthMetrics {
  return healthDataPreprocessor.processHealthMetrics(healthMetrics);
}