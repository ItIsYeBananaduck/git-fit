import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Fuse readiness/recovery from device metrics.
 * Placeholder implementation: averages normalized metrics using simple weights from aiConfig.getConfig.
 */
export const fuseReadiness = query({
  args: {
    userId: v.id("users"),
    windowDays: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const window = args.windowDays ?? 7;

    // Get server-side AI config
    const config = await ctx.runQuery("functions/aiConfig:getConfig", {} as any).catch(() => null);

    // TODO: Pull device metrics from existing tables (e.g., fitnessData) within the window
    // For scaffold, return a constant readiness/recovery pair
    const readiness = 0.62;
    const recovery = 0.65;

    return {
      readiness,
      recovery,
      windowDays: window,
      thresholds: config?.thresholds ?? null,
    } as const;
  },
});

/**
 * Derive training adjustments from readiness.
 */
export const deriveTrainingAdjustments = query({
  args: {
    readiness: v.number(),
    recovery: v.number(),
  },
  handler: async (ctx, args) => {
    const cfg = await ctx.runQuery("functions/aiConfig:getConfig", {} as any).catch(() => null);
    const thr = cfg?.thresholds?.readiness ?? { low: 0.35, moderate: 0.6 };
    const rules = cfg?.trainingRules ?? { deloadOnLowReadiness: true, volumeReductionPct: 0.2, restIncreaseSeconds: 30 };

    if (args.readiness < thr.low) {
      return {
        type: "deload",
        volumeReductionPct: rules.volumeReductionPct,
        restIncreaseSeconds: rules.restIncreaseSeconds,
      } as const;
    }
    if (args.readiness < thr.moderate) {
      return {
        type: "moderate",
        restIncreaseSeconds: Math.floor(rules.restIncreaseSeconds / 2),
      } as const;
    }
    return { type: "none" as const };
  },
});

/**
 * Derive nutrition adjustments from recovery and (optionally) intake/goal later.
 */
export const deriveNutritionAdjustments = query({
  args: {
    recovery: v.number(),
  },
  handler: async (ctx, args) => {
    const cfg = await ctx.runQuery("functions/aiConfig:getConfig", {} as any).catch(() => null);
    const thr = cfg?.thresholds?.recovery ?? { low: 0.4, moderate: 0.65 };
    const rules = cfg?.nutritionRules ?? { increaseCarbsOnLowRecovery: true, carbBoostPct: 0.15, proteinMinGPerKg: 1.6 };

    if (args.recovery < thr.low && rules.increaseCarbsOnLowRecovery) {
      return { type: "increase_carbs", carbBoostPct: rules.carbBoostPct } as const;
    }
    if (args.recovery < thr.moderate) {
      return { type: "ensure_protein", proteinMinGPerKg: rules.proteinMinGPerKg } as const;
    }
    return { type: "none" as const };
  },
});
