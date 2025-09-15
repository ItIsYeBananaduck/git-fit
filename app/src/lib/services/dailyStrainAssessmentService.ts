// File: dailyStrainAssessmentService.ts

/**
 * Daily Strain Assessment Service
 * Purpose: Assess daily strain using SpO₂ and resting heart rate to adjust workout recommendations
 */

import type { RecoveryData } from '../types/sharedTypes';
import { widgetService, TrafficLight, AlertSeverity, RecommendationStatus } from './widgetService';

export interface DailyStrainInputs {
  userId: string;
  date: Date;
  todayRestingHR: number;
  todaySpO2: number;
  baselineRestingHR: number; // 30-day trimmed mean
  baselineSpO2: number; // 30-day trimmed mean
  hrvScore?: number; // Optional for enhanced alerts
}

export interface StrainDeltas {
  hrDelta: number;
  spo2Delta: number;
  hrDeltaBpm: number;
  spo2DeltaPercent: number;
}

export interface TrafficLightZones {
  hrZone: 'green' | 'yellow' | 'red';
  spo2Zone: 'green' | 'yellow' | 'red';
  hrReason: string;
  spo2Reason: string;
}

export interface StrainAssessment {
  userId: string;
  date: Date;
  inputs: DailyStrainInputs;
  deltas: StrainDeltas;
  zones: TrafficLightZones;
  overallStatus: 'ready' | 'moderate' | 'compromised' | 'high_risk';
  compositeScore: number; // 0-100
  trainingRecommendation: TrainingRecommendation;
  healthAlerts: HealthAlert[];
  riskFactors: string[];
  confidence: number; // 0-100, based on data completeness
}

export interface TrainingRecommendation {
  status: 'no_change' | 'reduce_load' | 'modify_session' | 'full_rest';
  loadReductionPercent?: number; // 0-100
  modifications: string[];
  reasoning: string;
  alternativeActivities?: string[];
}

export interface HealthAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'spo2_critical' | 'hr_elevated' | 'dual_red' | 'hrv_drop';
  message: string;
  recommendation: string;
  requiresAttention: boolean;
}

export class DailyStrainAssessmentService {
  /**
   * Composite strain calculation using baseline comparison, session intensity, cumulative fatigue, and user feedback
   */
  public calculateCompositeStrain(
    baselineHR: number,
    baselineSpO2: number,
    avgHR: number,
    avgSpO2: number,
    intensityScore: number,
    fatigueTrend: number,
    feedbackModifier: number
  ): number {
    // Weights for each component
    const alpha = 0.4;
    const beta = 0.3;
    const gamma = 0.2;
    const delta = 0.1;
    // Baseline comparison
    const baselineComponent = (avgHR - baselineHR) + (baselineSpO2 - avgSpO2);
    // Composite strain formula
    const strain =
      alpha * baselineComponent +
      beta * intensityScore +
      gamma * fatigueTrend +
      delta * feedbackModifier;
    // Normalize and cap between 0-100
    return Math.max(0, Math.min(100, Math.round(strain)));
  }
  private readonly HR_GREEN_MAX_DELTA = 4; // bpm
  private readonly HR_YELLOW_MAX_DELTA = 9; // bpm
  private readonly SPO2_GREEN_MAX_DELTA = 1; // %
  private readonly SPO2_YELLOW_MAX_DELTA = 3; // %
  private readonly SPO2_CRITICAL_THRESHOLD = 92; // %
  private readonly SPO2_ALERT_THRESHOLD = 90; // %
  private readonly HR_ALERT_DELTA = 15; // bpm above baseline

  /**
   * Assess daily strain for a user
   */
  async assessDailyStrain(inputs: DailyStrainInputs): Promise<StrainAssessment> {
    // Calculate deltas
    const deltas = this.calculateDeltas(inputs);

    // Determine traffic light zones
    const zones = this.determineTrafficLightZones(deltas, inputs);

    // Calculate overall status
    const overallStatus = this.calculateOverallStatus(zones);

    // Calculate composite score
    const compositeScore = this.calculateCompositeScore(zones);

    // Generate training recommendation
    const trainingRecommendation = this.generateTrainingRecommendation(overallStatus, zones);

    // Check for health alerts
    const healthAlerts = this.checkHealthAlerts(inputs, deltas, zones);

    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(inputs, deltas, zones);

    // Calculate confidence score
    const confidence = this.calculateConfidence(inputs);

    return {
      userId: inputs.userId,
      date: inputs.date,
      inputs,
      deltas,
      zones,
      overallStatus,
      compositeScore,
      trainingRecommendation,
      healthAlerts,
      riskFactors,
      confidence
    };
  }

  /**
   * Calculate deltas from baseline
   */
  private calculateDeltas(inputs: DailyStrainInputs): StrainDeltas {
    const hrDelta = inputs.todayRestingHR - inputs.baselineRestingHR;
    const spo2Delta = inputs.todaySpO2 - inputs.baselineSpO2;

    return {
      hrDelta,
      spo2Delta,
      hrDeltaBpm: hrDelta,
      spo2DeltaPercent: spo2Delta
    };
  }

  /**
   * Determine traffic light zones for HR and SpO₂
   */
  private determineTrafficLightZones(deltas: StrainDeltas, inputs: DailyStrainInputs): TrafficLightZones {
    // HR Zone Logic
    let hrZone: 'green' | 'yellow' | 'red';
    let hrReason: string;

    if (deltas.hrDelta <= this.HR_GREEN_MAX_DELTA) {
      hrZone = 'green';
      hrReason = `HR increase of ${deltas.hrDelta.toFixed(1)} bpm is within normal range`;
    } else if (deltas.hrDelta <= this.HR_YELLOW_MAX_DELTA) {
      hrZone = 'yellow';
      hrReason = `HR increase of ${deltas.hrDelta.toFixed(1)} bpm indicates moderate strain`;
    } else {
      hrZone = 'red';
      hrReason = `HR increase of ${deltas.hrDelta.toFixed(1)} bpm indicates high strain`;
    }

    // SpO₂ Zone Logic
    let spo2Zone: 'green' | 'yellow' | 'red';
    let spo2Reason: string;

    // Check absolute SpO₂ level first (critical override)
    if (inputs.todaySpO2 < this.SPO2_CRITICAL_THRESHOLD) {
      spo2Zone = 'red';
      spo2Reason = `SpO₂ of ${inputs.todaySpO2.toFixed(1)}% is below critical threshold`;
    } else if (Math.abs(deltas.spo2Delta) <= this.SPO2_GREEN_MAX_DELTA) {
      spo2Zone = 'green';
      spo2Reason = `SpO₂ change of ${deltas.spo2Delta.toFixed(1)}% is within normal range`;
    } else if (Math.abs(deltas.spo2Delta) <= this.SPO2_YELLOW_MAX_DELTA) {
      spo2Zone = 'yellow';
      spo2Reason = `SpO₂ change of ${Math.abs(deltas.spo2Delta).toFixed(1)}% indicates moderate strain`;
    } else {
      spo2Zone = 'red';
      spo2Reason = `SpO₂ change of ${Math.abs(deltas.spo2Delta).toFixed(1)}% indicates high strain`;
    }

    return {
      hrZone,
      spo2Zone,
      hrReason,
      spo2Reason
    };
  }

  /**
   * Calculate overall strain status based on zones
   */
  private calculateOverallStatus(zones: TrafficLightZones): 'ready' | 'moderate' | 'compromised' | 'high_risk' {
    const { hrZone, spo2Zone } = zones;

    if (hrZone === 'green' && spo2Zone === 'green') {
      return 'ready';
    } else if (hrZone === 'red' && spo2Zone === 'red') {
      return 'high_risk';
    } else if (hrZone === 'red' || spo2Zone === 'red') {
      return 'compromised';
    } else {
      return 'moderate';
    }
  }

  /**
   * Calculate composite strain score (0-100)
   */
  private calculateCompositeScore(zones: TrafficLightZones): number {
    let score = 10; // Base strain floor

    // Add points based on zones
    if (zones.hrZone === 'yellow') score += 25;
    if (zones.hrZone === 'red') score += 40;

    if (zones.spo2Zone === 'yellow') score += 25;
    if (zones.spo2Zone === 'red') score += 40;

    // Cap at 100
    return Math.min(100, score);
  }

  /**
   * Generate training recommendation based on strain status
   */
  private generateTrainingRecommendation(
    status: 'ready' | 'moderate' | 'compromised' | 'high_risk',
    zones: TrafficLightZones
  ): TrainingRecommendation {
    switch (status) {
      case 'ready':
        return {
          status: 'no_change',
          modifications: [],
          reasoning: 'Cardiovascular markers indicate good recovery and readiness for training'
        };

      case 'moderate':
        return {
          status: 'reduce_load',
          loadReductionPercent: 7.5, // Average of 5-10%
          modifications: [
            'Reduce training load by 5-10%',
            'Drop 1 set from compound exercises',
            'Skip supersets or high-intensity finishers',
            'Consider shorter rest periods between sets'
          ],
          reasoning: 'Moderate strain detected - reduce intensity while maintaining training stimulus'
        };

      case 'compromised':
        return {
          status: 'modify_session',
          modifications: [
            'Replace high-intensity session with moderate intensity',
            'Focus on technique and form',
            'Reduce volume by 20-30%',
            'Include more mobility work'
          ],
          alternativeActivities: [
            'Light resistance training',
            'Mobility and flexibility work',
            'Low-intensity cardio (walking, light cycling)',
            'Yoga or pilates'
          ],
          reasoning: 'Compromised recovery detected - modify session to prioritize recovery while maintaining activity'
        };

      case 'high_risk':
        return {
          status: 'full_rest',
          modifications: [
            'Skip planned training session',
            'Focus on complete recovery',
            'Monitor symptoms closely'
          ],
          alternativeActivities: [
            'Light walking (20-30 minutes)',
            'Gentle stretching',
            'Meditation or relaxation',
            'Reading or low-stress activities'
          ],
          reasoning: 'High risk indicators detected - prioritize recovery and monitor health closely'
        };

      default:
        return {
          status: 'no_change',
          modifications: [],
          reasoning: 'Unable to determine strain status'
        };
    }
  }

  /**
   * Check for health alerts that require attention
   */
  private checkHealthAlerts(
    inputs: DailyStrainInputs,
    deltas: StrainDeltas,
    zones: TrafficLightZones
  ): HealthAlert[] {
    const alerts: HealthAlert[] = [];

    // Critical SpO₂ alert
    if (inputs.todaySpO2 < this.SPO2_ALERT_THRESHOLD) {
      alerts.push({
        severity: 'critical',
        type: 'spo2_critical',
        message: `Critical SpO₂ level: ${inputs.todaySpO2.toFixed(1)}%`,
        recommendation: 'Seek medical attention immediately. Stop all physical activity.',
        requiresAttention: true
      });
    }

    // Elevated resting HR alert
    if (deltas.hrDelta > this.HR_ALERT_DELTA) {
      alerts.push({
        severity: 'high',
        type: 'hr_elevated',
        message: `Resting HR ${deltas.hrDelta.toFixed(1)} bpm above baseline`,
        recommendation: 'Monitor for signs of illness or overtraining. Consider reducing training intensity.',
        requiresAttention: true
      });
    }

    // Dual red zones alert
    if (zones.hrZone === 'red' && zones.spo2Zone === 'red') {
      alerts.push({
        severity: 'high',
        type: 'dual_red',
        message: 'Both HR and SpO₂ in red zone - high strain detected',
        recommendation: 'Take immediate rest. Monitor for illness symptoms. Consult healthcare provider if symptoms persist.',
        requiresAttention: true
      });
    }

    // HRV drop with low SpO₂ (if HRV data available)
    if (inputs.hrvScore && inputs.hrvScore < 30 && inputs.todaySpO2 < 95) {
      alerts.push({
        severity: 'medium',
        type: 'hrv_drop',
        message: 'Low HRV combined with reduced SpO₂ - potential recovery issue',
        recommendation: 'Prioritize recovery activities. Monitor sleep quality and stress levels.',
        requiresAttention: false
      });
    }

    return alerts;
  }

  /**
   * Identify risk factors for the assessment
   */
  private identifyRiskFactors(
    inputs: DailyStrainInputs,
    deltas: StrainDeltas,
    zones: TrafficLightZones
  ): string[] {
    const factors: string[] = [];

    if (zones.hrZone === 'red') {
      factors.push('Elevated resting heart rate');
    }

    if (zones.spo2Zone === 'red') {
      factors.push('Reduced blood oxygen saturation');
    }

    if (deltas.hrDelta > 10) {
      factors.push('Significant HR elevation from baseline');
    }

    if (Math.abs(deltas.spo2Delta) > 3) {
      factors.push('Significant SpO₂ deviation from baseline');
    }

    if (inputs.todaySpO2 < 95) {
      factors.push('Suboptimal SpO₂ levels');
    }

    if (inputs.hrvScore && inputs.hrvScore < 40) {
      factors.push('Low HRV indicating poor recovery');
    }

    return factors;
  }

  /**
   * Calculate confidence score based on data completeness and quality
   */
  private calculateConfidence(inputs: DailyStrainInputs): number {
    let confidence = 100;

    // Reduce confidence if data is missing
    if (!inputs.hrvScore) confidence -= 15;

    // Reduce confidence if measurements are at extremes (possible sensor issues)
    if (inputs.todayRestingHR < 40 || inputs.todayRestingHR > 120) confidence -= 20;
    if (inputs.todaySpO2 < 85 || inputs.todaySpO2 > 100) confidence -= 20;

    // Reduce confidence if baseline data seems unreliable
    if (inputs.baselineRestingHR < 40 || inputs.baselineRestingHR > 100) confidence -= 10;
    if (inputs.baselineSpO2 < 90 || inputs.baselineSpO2 > 100) confidence -= 10;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Get historical baseline data for a user
   */
  async getHistoricalBaseline(userId: string, days: number = 30): Promise<{
    restingHR: number;
    spo2: number;
    hrv?: number;
  }> {
    // This would query the database for historical data
    // For now, return mock data
    console.log(`Getting ${days}-day baseline for user ${userId}`);

    return {
      restingHR: 65, // Mock baseline
      spo2: 97, // Mock baseline
      hrv: 55 // Mock baseline
    };
  }

  /**
   * Get today's wearable data
   */
  async getTodaysWearableData(userId: string): Promise<{
    restingHR: number;
    spo2: number;
    hrv?: number;
  }> {
    // This would fetch today's data from wearable devices
    // For now, return mock data
    console.log(`Getting today's wearable data for user ${userId}`);

    return {
      restingHR: 72, // Mock today's data
      spo2: 95, // Mock today's data
      hrv: 45 // Mock today's data
    };
  }

  /**
   * Run complete daily strain assessment for a user
   */
  async runDailyAssessment(userId: string, date: Date = new Date()): Promise<StrainAssessment> {
    // Get historical baseline
    const baseline = await this.getHistoricalBaseline(userId);

    // Get today's data
    const todayData = await this.getTodaysWearableData(userId);

    // Create inputs
    const inputs: DailyStrainInputs = {
      userId,
      date,
      todayRestingHR: todayData.restingHR,
      todaySpO2: todayData.spo2,
      baselineRestingHR: baseline.restingHR,
      baselineSpO2: baseline.spo2,
      hrvScore: todayData.hrv
    };

    // Run assessment
    const assessment = await this.assessDailyStrain(inputs);

    // Update widget with assessment results
    await this.updateWidgetWithAssessment(assessment);

    return assessment;
  }

  /**
   * Get strain assessment history for a user
   */
  async getStrainHistory(userId: string, days: number = 7): Promise<StrainAssessment[]> {
    // This would query historical assessments from database
    console.log(`Getting strain history for user ${userId} (${days} days)`);
    return [];
  }

  /**
   * Export strain assessment data for analysis
   */
  async exportStrainData(userId: string, startDate: Date, endDate: Date): Promise<any[]> {
    // This would export strain assessment data for external analysis
    console.log(`Exporting strain data for user ${userId} from ${startDate} to ${endDate}`);
    return [];
  }

  /**
   * Update widget with strain assessment results
   */
  private async updateWidgetWithAssessment(assessment: StrainAssessment): Promise<void> {
    try {
      // Convert assessment to widget-compatible format
      const widgetAssessment = {
        overallStatus: assessment.overallStatus,
        compositeScore: assessment.compositeScore,
        zones: {
          hrZone: this.convertTrafficLight(assessment.zones.hrZone),
          spo2Zone: this.convertTrafficLight(assessment.zones.spo2Zone)
        },
        deltas: {
          hrDelta: assessment.deltas.hrDelta,
          spo2Delta: assessment.deltas.spo2Delta,
          hrvDelta: 0 // Not available in current assessment
        },
        healthAlerts: assessment.healthAlerts.map(alert => ({
          message: alert.message,
          severity: this.convertAlertSeverity(alert.severity),
          requiresAttention: alert.requiresAttention,
          recommendation: alert.recommendation
        })),
        trainingRecommendation: {
          status: this.convertRecommendationStatus(assessment.trainingRecommendation.status),
          reasoning: assessment.trainingRecommendation.reasoning,
          modifications: assessment.trainingRecommendation.modifications,
          loadReductionPercent: assessment.trainingRecommendation.loadReductionPercent,
          alternativeActivities: assessment.trainingRecommendation.alternativeActivities
        },
        confidence: assessment.confidence,
        timestamp: assessment.date.getTime()
      };

      await widgetService.updateWidgetWithAssessment(widgetAssessment);
    } catch (error) {
      console.error('Failed to update widget with assessment:', error);
      // Don't throw - widget update failure shouldn't break assessment
    }
  }

  private convertTrafficLight(zone: 'green' | 'yellow' | 'red'): TrafficLight {
    switch (zone) {
      case 'green': return TrafficLight.GREEN;
      case 'yellow': return TrafficLight.YELLOW;
      case 'red': return TrafficLight.RED;
      default: return TrafficLight.GREEN;
    }
  }

  private convertAlertSeverity(severity: 'low' | 'medium' | 'high' | 'critical'): AlertSeverity {
    switch (severity) {
      case 'low': return AlertSeverity.LOW;
      case 'medium': return AlertSeverity.MEDIUM;
      case 'high': return AlertSeverity.HIGH;
      case 'critical': return AlertSeverity.HIGH; // Map critical to high for widget
      default: return AlertSeverity.MEDIUM;
    }
  }

  private convertRecommendationStatus(status: 'no_change' | 'reduce_load' | 'modify_session' | 'full_rest'): RecommendationStatus {
    switch (status) {
      case 'no_change': return RecommendationStatus.NORMAL;
      case 'reduce_load': return RecommendationStatus.REDUCE_LOAD;
      case 'modify_session': return RecommendationStatus.REDUCE_LOAD; // Map to reduce_load
      case 'full_rest': return RecommendationStatus.REST;
      default: return RecommendationStatus.NORMAL;
    }
  }
}