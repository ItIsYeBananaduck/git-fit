/**
 * Intensity Scoring Service - Live Intensity Calculation and Tracking
 * Part of Phase 3.4 - Services Layer Implementation
 */

import { api } from "$lib/convex/_generated/api.js";
import { convex } from "$lib/convex";
import type { Id } from "$lib/convex/_generated/dataModel.js";

export interface IntensityInputs {
  heartRateData: { timestamp: number; value: number; }[];
  motionData?: {
    acceleration: { x: number; y: number; z: number; };
    gyroscope?: { x: number; y: number; z: number; };
    timestamp: number;
  }[];
  exerciseData: {
    exerciseName: string;
    weight?: number;
    reps?: number;
    duration?: number;
    restTime?: number;
  };
  userFeedback?: {
    perceivedEffort: number; // 1-10 scale
    formQuality: number; // 1-10 scale
    fatigue: number; // 1-10 scale
  };
}

export interface IntensityScore {
  overall: number; // 0-100
  breakdown: {
    tempo: number;
    motionSmoothness: number;
    repConsistency: number;
    userFeedback: number;
    strainModifier: number;
  };
  feedback: string;
  recommendations: string[];
  timestamp: number;
}

export interface LiveIntensityData {
  currentScore: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  targetRange: { min: number; max: number };
  timeInTargetZone: number;
  recommendations: string[];
}

export class IntensityScoring {
  private scoreHistory: IntensityScore[] = [];
  private targetRange = { min: 60, max: 85 };
  private sessionStartTime: number;

  constructor() {
    this.sessionStartTime = Date.now();
  }

  /**
   * Calculate intensity score from multiple inputs
   */
  calculateIntensityScore(inputs: IntensityInputs): IntensityScore {
    const breakdown = {
      tempo: this.calculateTempoScore(inputs.heartRateData),
      motionSmoothness: this.calculateMotionSmoothnessScore(inputs.motionData),
      repConsistency: this.calculateRepConsistencyScore(inputs.exerciseData, inputs.motionData),
      userFeedback: this.calculateUserFeedbackScore(inputs.userFeedback),
      strainModifier: this.calculateStrainModifier(inputs.heartRateData)
    };

    // Weighted overall score
    const overall = (
      breakdown.tempo * 0.3 +
      breakdown.motionSmoothness * 0.25 +
      breakdown.repConsistency * 0.2 +
      breakdown.userFeedback * 0.15 +
      breakdown.strainModifier * 0.1
    );

    const score: IntensityScore = {
      overall: Math.round(overall),
      breakdown,
      feedback: this.generateFeedback(breakdown, overall),
      recommendations: this.generateRecommendations(breakdown, overall),
      timestamp: Date.now()
    };

    this.scoreHistory.push(score);
    return score;
  }

  /**
   * Calculate tempo score based on heart rate pattern
   */
  private calculateTempoScore(heartRateData: { timestamp: number; value: number; }[]): number {
    if (!heartRateData || heartRateData.length < 2) return 50;

    // Analyze heart rate variability and pattern
    const hrValues = heartRateData.map(d => d.value);
    const avgHR = hrValues.reduce((sum, hr) => sum + hr, 0) / hrValues.length;
    
    // Calculate coefficient of variation (lower is better for controlled tempo)
    const stdDev = Math.sqrt(hrValues.reduce((sum, hr) => sum + Math.pow(hr - avgHR, 2), 0) / hrValues.length);
    const coeffVar = stdDev / avgHR;

    // Score based on consistency (lower variation = higher score)
    let tempoScore = Math.max(0, 100 - (coeffVar * 500));

    // Bonus for appropriate heart rate range
    if (avgHR >= 120 && avgHR <= 160) {
      tempoScore += 10;
    }

    return Math.min(100, tempoScore);
  }

  /**
   * Calculate motion smoothness from accelerometer data
   */
  private calculateMotionSmoothnessScore(motionData?: Array<{ acceleration: { x: number; y: number; z: number } }>): number {
    if (!motionData || motionData.length < 3) return 75; // Default moderate score

    // Calculate jerk (derivative of acceleration) to measure smoothness
    let totalJerk = 0;
    for (let i = 1; i < motionData.length - 1; i++) {
      const prev = motionData[i - 1].acceleration;
      const curr = motionData[i].acceleration;
      const next = motionData[i + 1].acceleration;

      // Calculate jerk for each axis
      const jerkX = Math.abs((next.x - curr.x) - (curr.x - prev.x));
      const jerkY = Math.abs((next.y - curr.y) - (curr.y - prev.y));
      const jerkZ = Math.abs((next.z - curr.z) - (curr.z - prev.z));

      totalJerk += Math.sqrt(jerkX * jerkX + jerkY * jerkY + jerkZ * jerkZ);
    }

    const avgJerk = totalJerk / (motionData.length - 2);
    
    // Lower jerk = smoother motion = higher score
    const smoothnessScore = Math.max(0, 100 - (avgJerk * 10));
    return Math.min(100, smoothnessScore);
  }

  /**
   * Calculate rep consistency score
   */
  private calculateRepConsistencyScore(_exerciseData: unknown, motionData?: Array<{ acceleration: { x: number; y: number; z: number } }>): number {
    if (!motionData || motionData.length < 10) return 70; // Default

    // Detect rep patterns in motion data
    const accelerationMagnitudes = motionData.map(d => {
      const acc = d.acceleration;
      return Math.sqrt(acc.x * acc.x + acc.y * acc.y + acc.z * acc.z);
    });

    // Find peaks (potential rep completions)
    const peaks = this.findPeaks(accelerationMagnitudes);
    
    if (peaks.length < 2) return 60;

    // Calculate consistency of intervals between peaks
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i - 1]);
    }

    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
    const intervalVariance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const coeffVar = Math.sqrt(intervalVariance) / avgInterval;

    // Lower variation = higher consistency score
    const consistencyScore = Math.max(0, 100 - (coeffVar * 200));
    return Math.min(100, consistencyScore);
  }

  /**
   * Calculate user feedback score
   */
  private calculateUserFeedbackScore(userFeedback?: { perceivedEffort: number; formQuality: number; fatigue: number }): number {
    if (!userFeedback) return 75; // Neutral score if no feedback

    const { perceivedEffort, formQuality, fatigue } = userFeedback;
    
    // Convert 1-10 scales to 0-100
    const effortScore = ((perceivedEffort - 1) / 9) * 100;
    const formScore = ((formQuality - 1) / 9) * 100;
    const fatigueScore = 100 - (((fatigue - 1) / 9) * 100); // Inverted - lower fatigue is better

    return (effortScore * 0.4 + formScore * 0.4 + fatigueScore * 0.2);
  }

  /**
   * Calculate strain modifier based on heart rate zones
   */
  private calculateStrainModifier(heartRateData: { timestamp: number; value: number; }[]): number {
    if (!heartRateData || heartRateData.length === 0) return 50;

    const avgHR = heartRateData.reduce((sum, d) => sum + d.value, 0) / heartRateData.length;
    
    // Strain zones (simplified)
    if (avgHR < 100) return 30; // Very low
    if (avgHR < 120) return 50; // Low
    if (avgHR < 140) return 70; // Moderate
    if (avgHR < 160) return 85; // High
    if (avgHR < 180) return 95; // Very high
    return 100; // Maximum
  }

  /**
   * Generate feedback message
   */
  private generateFeedback(_breakdown: Record<string, number>, overall: number): string {
    if (overall >= 85) return "Excellent intensity! You're pushing your limits effectively.";
    if (overall >= 70) return "Good intensity level. Keep maintaining this effort.";
    if (overall >= 55) return "Moderate intensity. Consider increasing effort if feeling good.";
    if (overall >= 40) return "Lower intensity detected. Focus on form and gradual progression.";
    return "Very low intensity. Ensure you're challenging yourself appropriately.";
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(breakdown: Record<string, number>, overall: number): string[] {
    const recommendations = [];

    if (breakdown.tempo < 60) {
      recommendations.push("Focus on maintaining steady tempo throughout your sets");
    }
    if (breakdown.motionSmoothness < 70) {
      recommendations.push("Work on smoother, more controlled movements");
    }
    if (breakdown.repConsistency < 65) {
      recommendations.push("Try to maintain consistent timing between reps");
    }
    if (breakdown.userFeedback < 60) {
      recommendations.push("Pay attention to your form and perceived exertion");
    }

    if (overall < 50) {
      recommendations.push("Consider increasing weight or reducing rest time");
    } else if (overall > 90) {
      recommendations.push("Excellent work! Monitor for signs of overexertion");
    }

    return recommendations.length > 0 ? recommendations : ["Keep up the great work!"];
  }

  /**
   * Find peaks in data array (simple peak detection)
   */
  private findPeaks(data: number[], minHeight: number = 0): number[] {
    const peaks = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > minHeight) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  /**
   * Get live intensity data for real-time display
   */
  getLiveIntensityData(): LiveIntensityData {
    const recentScores = this.scoreHistory.slice(-10);
    if (recentScores.length === 0) {
      return {
        currentScore: 0,
        trend: 'stable',
        targetRange: this.targetRange,
        timeInTargetZone: 0,
        recommendations: ['Start your workout to see live intensity data']
      };
    }

    const currentScore = recentScores[recentScores.length - 1].overall;
    const previousScore = recentScores.length > 1 ? recentScores[recentScores.length - 2].overall : currentScore;
    
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (currentScore > previousScore + 5) trend = 'increasing';
    else if (currentScore < previousScore - 5) trend = 'decreasing';

    // Calculate time in target zone
    const totalTime = Date.now() - this.sessionStartTime;
    const timeInTarget = this.scoreHistory.filter(s => 
      s.overall >= this.targetRange.min && s.overall <= this.targetRange.max
    ).length;
    const timeInTargetZone = totalTime > 0 ? (timeInTarget / this.scoreHistory.length) * totalTime : 0;

    return {
      currentScore,
      trend,
      targetRange: this.targetRange,
      timeInTargetZone,
      recommendations: recentScores[recentScores.length - 1].recommendations
    };
  }

  /**
   * Store intensity score in backend
   */
  async storeScore(workoutSessionId: Id<"workoutSessions">, setId: string): Promise<void> {
    if (this.scoreHistory.length === 0) return;

    const latestScore = this.scoreHistory[this.scoreHistory.length - 1];
    
    try {
      await convex.mutation(api.functions.intensity.calculateScore, {
        workoutSessionId,
        setId,
        tempoScore: latestScore.breakdown.tempo,
        motionSmoothnessScore: latestScore.breakdown.motionSmoothness,
        repConsistencyScore: latestScore.breakdown.repConsistency,
        userFeedbackScore: latestScore.breakdown.userFeedback,
        strainModifier: latestScore.breakdown.strainModifier,
        isEstimated: false
      });
    } catch (error) {
      console.error('Failed to store intensity score:', error);
    }
  }

  /**
   * Get score history
   */
  getScoreHistory(): IntensityScore[] {
    return [...this.scoreHistory];
  }

  /**
   * Set target intensity range
   */
  setTargetRange(min: number, max: number): void {
    this.targetRange = { min, max };
  }

  /**
   * Reset for new workout session
   */
  reset(): void {
    this.scoreHistory = [];
    this.sessionStartTime = Date.now();
  }

  /**
   * Get current average intensity
   */
  getAverageIntensity(): number {
    if (this.scoreHistory.length === 0) return 0;
    return this.scoreHistory.reduce((sum, score) => sum + score.overall, 0) / this.scoreHistory.length;
  }
}

// Export singleton instance
export const intensityScoring = new IntensityScoring();
export default intensityScoring;