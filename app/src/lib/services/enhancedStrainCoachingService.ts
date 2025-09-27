/**
 * Enhanced Strain & Coaching Service
 * Combines the most sophisticated strain assessment with Alice/Aiden AI coaching
 * 
 * This consolidates:
 * - Daily Strain Assessment (most advanced calculation system)
 * - AI Coaching personas (Alice/Aiden)
 * - Real-time strain monitoring for wearables
 * - Rule-based logic as AI training input
 */

import { DailyStrainAssessmentService, type StrainAssessment, type DailyStrainInputs } from './dailyStrainAssessmentService.js';
import { AICoachingService, type WorkoutContext, type CoachResponse } from './aiCoaching.js';

export interface LiveStrainMetrics {
  currentStrain: number;
  intensityScore: number;
  heartRateStatus: 'green' | 'yellow' | 'red';
  spo2Status: 'green' | 'yellow' | 'red';
  overallStatus: 'ready' | 'moderate' | 'compromised' | 'high_risk';
  confidence: number;
  timestamp: number;
}

export interface StrainCoachingContext extends WorkoutContext {
  strainAssessment: StrainAssessment;
  liveMetrics: LiveStrainMetrics;
  isRealTime: boolean;
}

export interface AIStrainGuidance {
  coachResponse: CoachResponse;
  strainRecommendations: string[];
  intensityAdjustments: {
    shouldAdjust: boolean;
    adjustment: number; // -10 to +10 percentage
    reason: string;
  };
  alertLevel: 'none' | 'caution' | 'warning' | 'critical';
}

/**
 * Enhanced service combining advanced strain assessment with AI coaching
 */
export class EnhancedStrainCoachingService {
  private strainService: DailyStrainAssessmentService;
  private coachingService: AICoachingService;
  private ruleBasedKnowledge: Map<string, Record<string, unknown>> = new Map();

  constructor() {
    this.strainService = new DailyStrainAssessmentService();
    this.coachingService = new AICoachingService();
    
    // Load rule-based knowledge as training data for AI
    this.loadRuleBasedTrainingData();
  }

  /**
   * Calculate live strain metrics for wearable display
   */
  async calculateLiveStrainMetrics(
    userId: string,
    currentHR: number,
    currentSpO2: number,
    baselineHR: number,
    baselineSpO2: number
  ): Promise<LiveStrainMetrics> {
    const inputs: DailyStrainInputs = {
      userId,
      date: new Date(),
      todayRestingHR: currentHR,
      todaySpO2: currentSpO2,
      baselineRestingHR: baselineHR,
      baselineSpO2: baselineSpO2
    };

    const assessment = await this.strainService.assessDailyStrain(inputs);
    
    return {
      currentStrain: assessment.compositeScore,
      intensityScore: this.calculateIntensityFromStrain(assessment),
      heartRateStatus: assessment.zones.hrZone,
      spo2Status: assessment.zones.spo2Zone,
      overallStatus: assessment.overallStatus,
      confidence: assessment.confidence,
      timestamp: Date.now()
    };
  }

  /**
   * Generate AI-powered coaching guidance based on strain assessment
   */
  async generateStrainCoachingGuidance(
    context: StrainCoachingContext,
    coachPersonality: 'alice' | 'aiden'
  ): Promise<AIStrainGuidance> {
    const { strainAssessment } = context;
    
    // Generate AI coaching response with strain context
    const coachResponse = await this.generateContextualCoachResponse(
      context,
      coachPersonality,
      strainAssessment
    );

    // Generate strain-specific recommendations
    const strainRecommendations = this.generateStrainRecommendations(strainAssessment);

    // Determine intensity adjustments
    const intensityAdjustments = this.calculateIntensityAdjustments(strainAssessment);

    // Determine alert level
    const alertLevel = this.determineAlertLevel(strainAssessment);

    return {
      coachResponse,
      strainRecommendations,
      intensityAdjustments,
      alertLevel
    };
  }

  /**
   * Generate contextual coach response using AI + strain data
   */
  private async generateContextualCoachResponse(
    context: StrainCoachingContext,
    coachPersonality: 'alice' | 'aiden',
    assessment: StrainAssessment
  ): Promise<CoachResponse> {
    // Enhanced workout context with strain data (using correct WorkoutContext interface)
    const enhancedContext: WorkoutContext = {
      workoutId: context.workoutId || ('strain-assessment' as any),
      exercise: context.exercise || 'general',
      setNumber: context.setNumber || 1,
      repCount: context.repCount || 0,
      weight: context.weight || 0,
      heartRate: context.heartRate || 120,
      timeElapsed: context.timeElapsed || 0,
      previousPerformance: context.previousPerformance || undefined
    };

    // Generate AI response using coaching service
    const baseResponse = this.coachingService.generateResponse(enhancedContext);

    // Enhance response with strain-specific guidance
    return this.enhanceResponseWithStrain(baseResponse, assessment, coachPersonality);
  }

  /**
   * Generate strain-specific recommendations
   */
  private generateStrainRecommendations(assessment: StrainAssessment): string[] {
    const recommendations: string[] = [];

    // Use training recommendation from strain service
    if (assessment.trainingRecommendation) {
      recommendations.push(`🎯 Status: ${assessment.trainingRecommendation.status}`);
      
      if (assessment.trainingRecommendation.loadReductionPercent) {
        recommendations.push(`⚖️ Reduce load by ${assessment.trainingRecommendation.loadReductionPercent}%`);
      }

      assessment.trainingRecommendation.modifications.forEach(mod => {
        recommendations.push(`💡 ${mod}`);
      });
    }

    // Add risk factor warnings
    assessment.riskFactors.forEach((risk: string) => {
      recommendations.push(`⚠️ ${risk}`);
    });

    // Add health alerts
    assessment.healthAlerts.forEach((alert: { requiresAttention: boolean; message: string; recommendation: string }) => {
      if (alert.requiresAttention) {
        recommendations.push(`🚨 ${alert.message}`);
      } else {
        recommendations.push(`💡 ${alert.recommendation}`);
      }
    });

    return recommendations;
  }

  /**
   * Calculate intensity adjustments based on strain
   */
  private calculateIntensityAdjustments(
    assessment: StrainAssessment
  ): AIStrainGuidance['intensityAdjustments'] {
    let shouldAdjust = false;
    let adjustment = 0;
    let reason = '';

    // High strain detection
    if (assessment.compositeScore > 85) {
      shouldAdjust = true;
      adjustment = -Math.min(15, (assessment.compositeScore - 85) * 0.5);
      reason = 'High strain detected - reducing intensity for recovery';
    }
    // Critical health indicators
    else if (assessment.overallStatus === 'high_risk') {
      shouldAdjust = true;
      adjustment = -20;
      reason = 'Critical health indicators - significant intensity reduction';
    }
    // Compromised status
    else if (assessment.overallStatus === 'compromised') {
      shouldAdjust = true;
      adjustment = -10;
      reason = 'Compromised recovery state - moderate intensity reduction';
    }
    // Low strain - can push harder
    else if (assessment.compositeScore < 30 && assessment.overallStatus === 'ready') {
      shouldAdjust = true;
      adjustment = 5;
      reason = 'Low strain with good recovery - can increase intensity';
    }

    return { shouldAdjust, adjustment, reason };
  }

  /**
   * Determine alert level based on assessment
   */
  private determineAlertLevel(assessment: StrainAssessment): AIStrainGuidance['alertLevel'] {
    if (assessment.overallStatus === 'high_risk' || assessment.healthAlerts.some((a: { requiresAttention: boolean }) => a.requiresAttention)) {
      return 'critical';
    }
    if (assessment.overallStatus === 'compromised' || assessment.compositeScore > 80) {
      return 'warning';
    }
    if (assessment.overallStatus === 'moderate' || assessment.riskFactors.length > 0) {
      return 'caution';
    }
    return 'none';
  }

  /**
   * Load rule-based knowledge as training data for AI
   */
  private loadRuleBasedTrainingData(): void {
    // Convert Monday workout rules to training data
    this.ruleBasedKnowledge.set('intensityRules', {
      baseScore: 50,
      hrVarianceWeight: 20,
      spo2DriftWeight: 10,
      sleepWeight: 20,
      feedbackScoring: {
        'keep_going': 20,
        'finally_challenge': 10,
        'neutral': 0,
        'easy_killer': -15,
        'flag_review': -5
      }
    });

    // Volume adjustment rules
    this.ruleBasedKnowledge.set('volumeRules', {
      highIntensityThreshold: 100,
      autoReduceRange: [5, 10],
      strainThreshold: 95,
      healthMismatchFlag: true
    });

    // Health data interpretation rules
    this.ruleBasedKnowledge.set('healthRules', {
      hrZones: { green: 4, yellow: 9, critical: 15 },
      spo2Zones: { green: 1, yellow: 3, critical: 92 },
      confidenceFactors: {
        missingHRV: -15,
        extremeHR: -20,
        extremeSpO2: -20,
        unreliableBaseline: -10
      }
    });
  }

  /**
   * Enhance AI response with strain-specific content
   */
  private enhanceResponseWithStrain(
    baseResponse: CoachResponse,
    assessment: StrainAssessment,
    personality: 'alice' | 'aiden'
  ): CoachResponse {
    let enhancedMessage = baseResponse.message;

    // Add personality-specific strain guidance
    if (personality === 'alice' && assessment.overallStatus === 'compromised') {
      enhancedMessage += " I can see your body is working hard to recover - let's listen to what it's telling us and adjust accordingly. 💪";
    } else if (personality === 'aiden' && assessment.compositeScore > 80) {
      enhancedMessage += " Your strain levels indicate it's time to dial back the intensity. Smart training means knowing when to push and when to recover.";
    }

    return {
      ...baseResponse,
      message: enhancedMessage,
      priority: assessment.overallStatus === 'high_risk' ? 'high' : baseResponse.priority
    };
  }

  /**
   * Calculate intensity score from strain assessment
   */
  private calculateIntensityFromStrain(assessment: StrainAssessment): number {
    // Convert composite strain score to intensity percentage
    // Lower strain = higher available intensity capacity
    return Math.max(0, Math.min(100, 100 - assessment.compositeScore));
  }
}

// Export singleton instance
export const enhancedStrainCoachingService = new EnhancedStrainCoachingService();