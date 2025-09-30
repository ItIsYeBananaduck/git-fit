import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Server-side configuration for AI fusion and thresholds
// Only thresholds and rules are returned to clients; proprietary weights remain server-controlled.

export const getConfig = query({
  args: {},
  handler: async () => {
    // Placeholder config. TODO: move to persistent storage if needed.
    return {
      deviceWeights: {
        whoop: { strain: 0.5, recovery: 0.6 },
        apple: { hr: 0.4, steps: 0.4 },
        fitbit: { sleep: 0.3, activity: 0.3 },
        samsung: { sleep: 0.3, activity: 0.3 },
      },
      thresholds: {
        readiness: { low: 0.35, moderate: 0.6 },
        recovery: { low: 0.4, moderate: 0.65 },
        sleep: { lowHours: 6.0 },
      },
      trainingRules: {
        deloadOnLowReadiness: true,
        volumeReductionPct: 0.2,
        restIncreaseSeconds: 30,
        strainPolicy: {
          // If in-session strain is high, adjust REST FIRST
          // Values are illustrative; tune with data
          strainHigh: 0.75,        // 0..1 normalized
          strainVeryHigh: 0.9,     // 0..1 normalized
          hrRecoverySlowSec: 90,   // if HR not near baseline within this duration
          restIncreaseStepSec: 30, // increase rest by this many seconds per escalation
          maxRestIncreaseSec: 120, // cap total in-session rest increase
          // If still excessive after rest adjustments, fall back to reducing reps, then sets, then load
          fallbackOrder: ["reps", "sets", "volume"],
          repsReductionStep: 2,
          setsReductionStep: 1,
          volumeReductionLb: 2.5,
        },
      },
      adjustmentMagnitudes: {
        volume: { stepLbMin: 2.5, stepLbMax: 5 },
        reps: { perSetStep: 3 },
        sets: { step: 1 },
      },
      nutritionRules: {
        increaseCarbsOnLowRecovery: true,
        carbBoostPct: 0.15,
        proteinMinGPerKg: 1.6,
      },
    } as const;
  },
});

export const updateConfig = mutation({
  args: {
    // Admin-only mutation: keep arg structure simple (replace whole config)
    config: v.any(),
  },
  handler: async (_ctx, args) => {
    // TODO: persist to database / secured storage; validation as needed
    // For now, accept but do not persist in this scaffold
    return { ok: true } as const;
  },
});
