/**
 * Strain Calculator Service - Real-time Strain Assessment and Recommendations
 * Part of Phase 3.4 - Services Layer Implementation
 */

export interface StrainData {
  heartRate: number;
  restingHeartRate: number;
  maxHeartRate: number;
  timestamp: number;
}

export interface StrainCalculation {
  currentStrain: number; // 0-21 WHOOP-style scale
  cumulativeStrain: number;
  strainRate: number; // strain per minute
  zone: 'recovery' | 'moderate' | 'vigorous' | 'max';
  recommendation: StrainRecommendation;
  timestamp: number;
}

export interface StrainRecommendation {
  action: 'continue' | 'reduce_intensity' | 'increase_rest' | 'stop';
  reason: string;
  suggestedHeartRate?: number;
  suggestedRestTime?: number;
}

export interface StrainThresholds {
  recoveryMax: number; // % of max HR
  moderateMax: number;
  vigorousMax: number;
  dailyStrainTarget: number;
}

export class StrainCalculator {
  private strainHistory: StrainCalculation[] = [];
  private thresholds: StrainThresholds;

  constructor() {
    this.thresholds = {
      recoveryMax: 60,   // 60% max HR
      moderateMax: 70,   // 70% max HR  
      vigorousMax: 85,   // 85% max HR
      dailyStrainTarget: 15 // Target daily strain
    };
  }

  /**
   * Calculate current strain based on heart rate data
   */
  calculateStrain(data: StrainData): StrainCalculation {
    const hrReserve = data.maxHeartRate - data.restingHeartRate;
    const currentReserve = data.heartRate - data.restingHeartRate;
    const percentReserve = Math.max(0, Math.min(100, (currentReserve / hrReserve) * 100));
    
    // Calculate strain using exponential formula similar to WHOOP
    const strainContribution = this.calculateStrainContribution(percentReserve);
    
    // Get cumulative strain for the day
    const cumulativeStrain = this.getCumulativeStrain() + strainContribution;
    
    // Determine zone
    const zone = this.getHeartRateZone(data.heartRate, data.maxHeartRate);
    
    // Calculate strain rate (strain accumulated per minute)
    const strainRate = this.calculateStrainRate();
    
    // Generate recommendation
    const recommendation = this.generateRecommendation({
      currentStrain: strainContribution,
      cumulativeStrain,
      zone,
      heartRate: data.heartRate,
      maxHeartRate: data.maxHeartRate
    });

    const calculation: StrainCalculation = {
      currentStrain: strainContribution,
      cumulativeStrain,
      strainRate,
      zone,
      recommendation,
      timestamp: data.timestamp
    };

    // Store in history
    this.strainHistory.push(calculation);
    
    // Keep only last hour of data
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.strainHistory = this.strainHistory.filter(h => h.timestamp > oneHourAgo);

    return calculation;
  }

  /**
   * Calculate strain contribution from heart rate percentage
   */
  private calculateStrainContribution(percentReserve: number): number {
    if (percentReserve < 50) return 0;
    
    // Exponential formula: strain = e^(HR%/30) - 1
    const strain = Math.exp(percentReserve / 30) - 1;
    return Math.min(21, strain); // Cap at 21 like WHOOP
  }

  /**
   * Get heart rate zone
   */
  private getHeartRateZone(heartRate: number, maxHeartRate: number): 'recovery' | 'moderate' | 'vigorous' | 'max' {
    const percent = (heartRate / maxHeartRate) * 100;
    
    if (percent < this.thresholds.recoveryMax) return 'recovery';
    if (percent < this.thresholds.moderateMax) return 'moderate';
    if (percent < this.thresholds.vigorousMax) return 'vigorous';
    return 'max';
  }

  /**
   * Calculate strain rate (strain per minute)
   */
  private calculateStrainRate(): number {
    if (this.strainHistory.length < 2) return 0;
    
    const recent = this.strainHistory.slice(-10); // Last 10 readings
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp;
    const strainDiff = recent[recent.length - 1].currentStrain - recent[0].currentStrain;
    
    return timeSpan > 0 ? (strainDiff / timeSpan) * 60000 : 0; // per minute
  }

  /**
   * Get cumulative strain for the day
   */
  private getCumulativeStrain(): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.strainHistory
      .filter(h => h.timestamp >= today.getTime())
      .reduce((sum, h) => sum + h.currentStrain, 0);
  }

  /**
   * Generate strain-based recommendations
   */
  private generateRecommendation(context: {
    currentStrain: number;
    cumulativeStrain: number;
    zone: 'recovery' | 'moderate' | 'vigorous' | 'max';
    heartRate: number;
    maxHeartRate: number;
  }): StrainRecommendation {
    // High strain protection
    if (context.cumulativeStrain > this.thresholds.dailyStrainTarget * 1.5) {
      return {
        action: 'stop',
        reason: `Daily strain limit exceeded (${context.cumulativeStrain.toFixed(1)}/21). Consider recovery.`,
        suggestedRestTime: 300 // 5 minutes
      };
    }

    // Heart rate zone recommendations
    if (context.zone === 'max' && context.currentStrain > 5) {
      return {
        action: 'reduce_intensity',
        reason: `Heart rate too high (${context.heartRate} BPM). Reduce intensity.`,
        suggestedHeartRate: Math.floor(context.maxHeartRate * 0.85)
      };
    }

    // Rapid strain accumulation
    if (context.currentStrain > 3 && context.zone === 'vigorous') {
      return {
        action: 'increase_rest',
        reason: `High strain rate detected. Consider longer rest periods.`,
        suggestedRestTime: 90
      };
    }

    // Optimal range
    if (context.zone === 'moderate' || context.zone === 'vigorous') {
      return {
        action: 'continue',
        reason: `Great pace! You're in the optimal training zone.`
      };
    }

    // Low intensity
    return {
      action: 'continue',
      reason: `Low strain. You can safely increase intensity if desired.`
    };
  }

  /**
   * Update strain thresholds
   */
  updateThresholds(newThresholds: Partial<StrainThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
  }

  /**
   * Get current strain status
   */
  getCurrentStatus(): {
    totalStrain: number;
    avgStrain: number;
    timeInZones: Record<string, number>;
    recommendation: string;
  } {
    const totalStrain = this.getCumulativeStrain();
    const avgStrain = this.strainHistory.length > 0 
      ? this.strainHistory.reduce((sum, h) => sum + h.currentStrain, 0) / this.strainHistory.length
      : 0;

    // Calculate time in zones (last hour)
    const timeInZones = {
      recovery: 0,
      moderate: 0,
      vigorous: 0,
      max: 0
    };

    this.strainHistory.forEach(h => {
      timeInZones[h.zone]++;
    });

    let recommendation = "Continue your workout at current intensity.";
    if (totalStrain > this.thresholds.dailyStrainTarget) {
      recommendation = "Consider recovery - daily strain target reached.";
    } else if (avgStrain > 15) {
      recommendation = "High average strain - monitor closely.";
    }

    return {
      totalStrain,
      avgStrain,
      timeInZones,
      recommendation
    };
  }

  /**
   * Reset strain calculator (new day/workout)
   */
  reset(): void {
    this.strainHistory = [];
  }

  /**
   * Export strain data for analysis
   */
  exportData(): StrainCalculation[] {
    return [...this.strainHistory];
  }

  /**
   * Check if user should take a break
   */
  shouldTakeBreak(): boolean {
    const recentHigh = this.strainHistory.slice(-5)
      .every(h => h.zone === 'max' || h.zone === 'vigorous');
    
    const totalStrain = this.getCumulativeStrain();
    
    return recentHigh && totalStrain > this.thresholds.dailyStrainTarget * 1.2;
  }
}

// Export singleton instance
export const strainCalculator = new StrainCalculator();
export default strainCalculator;