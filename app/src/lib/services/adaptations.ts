import type { AiConfig } from './aiConfig';

export type TrainingSessionState = {
  sets: number;
  restSeconds: number;
  intensity: 'low' | 'moderate' | 'high';
};

export function applyTrainingAdjustments(state: TrainingSessionState, readiness: number, recovery: number, cfg: AiConfig): TrainingSessionState {
  const thr = cfg.thresholds.readiness;
  const rules = cfg.trainingRules;

  // Clone state to avoid mutation
  const next: TrainingSessionState = { ...state };

  if (readiness < thr.low) {
    // Deload: reduce volume and increase rest
    next.sets = Math.max(1, Math.round(state.sets * (1 - rules.volumeReductionPct)));
    next.restSeconds = state.restSeconds + rules.restIncreaseSeconds;
    next.intensity = 'low';
    return next;
  }

  if (readiness < thr.moderate) {
    // Moderate adjustment: slight rest increase
    next.restSeconds = state.restSeconds + Math.floor(rules.restIncreaseSeconds / 2);
    if (next.intensity === 'high') next.intensity = 'moderate';
    return next;
  }

  // No change
  return next;
}

export type LiveSessionMetrics = {
  // Normalized strain for current phase/session 0..1
  strainNorm: number;
  // Seconds since last set until HR near baseline
  hrRecoverySec: number;
};

export type InSessionAdjustment = {
  restSeconds: number;
  // Optional fallback adjustment suggestion if strain remains very high
  fallback?: { type: 'reps' | 'sets' | 'volume'; value: number };
};

export function manageInSessionStrain(
  currentRestSeconds: number,
  alreadyIncreasedRestSec: number,
  live: LiveSessionMetrics,
  cfg: AiConfig
): InSessionAdjustment {
  const p = cfg.trainingRules as any;
  const sp = p.strainPolicy as {
    strainHigh: number;
    strainVeryHigh: number;
    hrRecoverySlowSec: number;
    restIncreaseStepSec: number;
    maxRestIncreaseSec: number;
    fallbackOrder: Array<'reps' | 'sets' | 'volume'>;
    repsReductionStep: number;
    setsReductionStep: number;
    volumeReductionLb: number;
  };

  // Start with no change
  let nextRest = currentRestSeconds;
  let fallback: InSessionAdjustment['fallback'] | undefined;

  // If strain is high or HR recovery is slow, increase rest if possible
  const needsRest = live.strainNorm >= sp.strainHigh || live.hrRecoverySec >= sp.hrRecoverySlowSec;
  if (needsRest && alreadyIncreasedRestSec < sp.maxRestIncreaseSec) {
    const remaining = sp.maxRestIncreaseSec - alreadyIncreasedRestSec;
    const step = Math.min(sp.restIncreaseStepSec, remaining);
    nextRest = currentRestSeconds + step;
  }

  // If strain still very high, recommend fallback (reps -> sets -> volume)
  if (live.strainNorm >= sp.strainVeryHigh) {
    for (const t of sp.fallbackOrder) {
      if (t === 'reps') { fallback = { type: 'reps', value: sp.repsReductionStep }; break; }
      if (t === 'sets') { fallback = { type: 'sets', value: sp.setsReductionStep }; break; }
      if (t === 'volume') { fallback = { type: 'volume', value: sp.volumeReductionLb }; break; }
    }
  }

  return { restSeconds: nextRest, fallback };
}

export type DayNutrition = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  weightKg?: number;
};

export function applyNutritionAdjustments(day: DayNutrition, recovery: number, cfg: AiConfig): DayNutrition {
  const thr = cfg.thresholds.recovery;
  const rules = cfg.nutritionRules;

  const next: DayNutrition = { ...day };

  if (recovery < thr.low && rules.increaseCarbsOnLowRecovery) {
    next.carbsG = Math.round(day.carbsG * (1 + rules.carbBoostPct));
  } else if (recovery < thr.moderate) {
    // Ensure protein minimum per kg
    if (day.weightKg) {
      const minProtein = Math.round(day.weightKg * rules.proteinMinGPerKg);
      next.proteinG = Math.max(day.proteinG, minProtein);
    }
  }

  return next;
}
