// Adaptive Training Configuration
export interface AdaptiveTrainingConfig {
    load: number; // percentage of 1RM or RPE scale
    reps: number;
    sets: number;
    restBetweenSets: number; // seconds
    restBetweenExercises: number; // seconds
    intensity: 'light' | 'moderate' | 'high' | 'max';
    isDeloadWeek?: boolean; // indicates if this is deload week parameters
}

export function unifiedRestAdjustment(
    baseline: { hr: number; spo2: number; hrv: number },
    current: { hr: number; spo2: number; hrv: number },
    lastRestDuration: number,
    strainMetrics: { currentStrain: number; perceivedExertion: number },
    fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
    maxRestTime: number = 300
): {
    adjustedRestTime: number;
    reason: string;
    confidence: number;
    priority: 'low' | 'medium' | 'high';
} {
    const hrDelta = Math.abs(current.hr - baseline.hr);
    const spo2Delta = Math.abs(current.spo2 - baseline.spo2);
    const hrvDelta = Math.abs(current.hrv - baseline.hrv);

    let adjustedRestTime = lastRestDuration;
    let reason = 'Normal rest period';
    let confidence = 0.8;
    let priority: 'low' | 'medium' | 'high' = 'medium';

    // Adjust based on recovery speed
    if (hrDelta < 5 && spo2Delta < 2 && hrvDelta < 5) {
        adjustedRestTime = Math.max(20, lastRestDuration - 30);
        reason = 'Fast recovery detected - reduced rest time';
        priority = 'low';
    } else if (hrDelta > 15 || spo2Delta > 5 || hrvDelta > 10) {
        adjustedRestTime = Math.min(maxRestTime, lastRestDuration + 30);
        reason = 'Slow recovery detected - extended rest time';
        priority = 'high';
    }

    // Adjust based on strain metrics
    if (strainMetrics.currentStrain > 15) {
        adjustedRestTime = Math.min(maxRestTime, adjustedRestTime * 1.3);
        reason += ', high strain detected';
        priority = 'high';
    } else if (strainMetrics.currentStrain < 8) {
        adjustedRestTime = Math.max(20, adjustedRestTime * 0.8);
        reason += ', low strain detected';
        priority = 'low';
    }

    // Adjust based on perceived exertion
    if (strainMetrics.perceivedExertion > 8) {
        adjustedRestTime = Math.min(maxRestTime, adjustedRestTime * 1.4);
        reason += ', high perceived exertion';
    } else if (strainMetrics.perceivedExertion < 4) {
        adjustedRestTime = Math.max(20, adjustedRestTime * 0.9);
        reason += ', low perceived exertion';
    }

    // Adjust based on fitness level
    const fitnessAdjustment = fitnessLevel === 'beginner' ? 1.2 : fitnessLevel === 'advanced' ? 0.8 : 1.0;
    adjustedRestTime = Math.round(adjustedRestTime * fitnessAdjustment);

    // Ensure rest time is within bounds
    adjustedRestTime = Math.max(20, Math.min(maxRestTime, adjustedRestTime));

    // Calculate confidence based on recovery metrics
    confidence = 1 - hrDelta / 100;

    return {
        adjustedRestTime,
        reason,
        confidence: Math.max(0, Math.min(1, confidence)),
        priority
    };
}