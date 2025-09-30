import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// 6 permutations of [sets, reps, volume]
const ARMS: Array<["sets" | "reps" | "volume", "sets" | "reps" | "volume", "sets" | "reps" | "volume"]> = [
  ["sets", "reps", "volume"],
  ["sets", "volume", "reps"],
  ["reps", "sets", "volume"],
  ["reps", "volume", "sets"],
  ["volume", "sets", "reps"],
  ["volume", "reps", "sets"],
];

function nowIso() { return new Date().toISOString(); }

export const getOrInitPolicy = mutation({
  args: { userId: v.id("users"), epsilon: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("adjustmentPolicies")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .first();
    if (existing) return existing;

    const armStats = ARMS.map(() => ({ plays: 0, rewardSum: 0 }));
    const epsilon = args.epsilon ?? 0.1;
    const id = await ctx.db.insert("adjustmentPolicies", {
      userId: args.userId,
      armStats,
      epsilon,
      updatedAt: nowIso(),
    });
    return await ctx.db.get(id);
  }
});

export const chooseAdjustmentOrderForExercise = mutation({
  args: { userId: v.id("users"), exerciseId: v.id("exercises"), weekStart: v.string() },
  handler: async (ctx, args) => {
    // One decision per (user, exercise, weekStart)
    const prior = await ctx.db
      .query("adjustmentDecisions")
      .withIndex("by_user_exercise_week", q => q.eq("userId", args.userId).eq("exerciseId", args.exerciseId).eq("weekStart", args.weekStart))
      .first();
    if (prior) {
      // Return prior decision to avoid duplicates
      return {
        reused: true as const,
        armIndex: prior.armIndex as number,
        order: ARMS[prior.armIndex] as readonly string[],
        adjustmentType: prior.adjustmentType as "sets" | "reps" | "volume",
      };
    }

    const policy = await ctx.runMutation("functions/adjustmentLearning:getOrInitPolicy", { userId: args.userId } as any);
    const epsilon = policy.epsilon as number;

    // epsilon-greedy
    const explore = Math.random() < epsilon;
    let armIndex = 0;
    if (explore) {
      armIndex = Math.floor(Math.random() * ARMS.length);
    } else {
      let best = -Infinity;
      let bestIdx = 0;
      (policy.armStats as any[]).forEach((s, i) => {
        const avg = s.plays > 0 ? s.rewardSum / s.plays : 0;
        if (avg > best) { best = avg; bestIdx = i; }
      });
      armIndex = bestIdx;
    }

    const order = ARMS[armIndex];
    const adjustmentType = order[0]; // only apply first change this week

    await ctx.db.insert("adjustmentDecisions", {
      userId: args.userId,
      exerciseId: args.exerciseId,
      weekStart: args.weekStart,
      armIndex,
      adjustmentType,
      createdAt: nowIso(),
    });

    return { reused: false as const, armIndex, order: order as readonly string[], adjustmentType };
  }
});

// Compute reward based on performance delta, RPE proximity to target, and objective device metrics when present.
export const computeRewardForExercise = query({
  args: { userId: v.id("users"), exerciseId: v.id("exercises"), weekStart: v.string() },
  handler: async (ctx, args) => {
    const start = new Date(args.weekStart);
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
    const prevStart = new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevEnd = new Date(start.getTime());

    // Helper to parse ISO date strings safely
    const inRange = (iso: string, s: Date, e: Date) => {
      const t = new Date(iso).getTime();
      return t >= s.getTime() && t < e.getTime();
    };

    // 1) Performance score: compare current week vs previous week volume (sum reps*weight)
    const perfByRange = async (s: Date, e: Date) => {
      const perfs = await ctx.db
        .query("exercisePerformance")
        .withIndex("by_exercise", q => q.eq("exerciseId", args.exerciseId))
        .collect();
      const filtered = perfs.filter(p => typeof p.createdAt === 'string' && inRange(p.createdAt as string, s, e));
      let vol = 0;
      for (const p of filtered) {
        const reps: number[] = Array.isArray(p.actualReps) ? p.actualReps as any : [];
        const wts: number[] = Array.isArray(p.actualWeight) ? p.actualWeight as any : [];
        const len = Math.min(reps.length, wts.length);
        for (let i = 0; i < len; i++) vol += Math.max(0, reps[i]) * Math.max(0, wts[i]);
      }
      return vol;
    };

    const currentVol = await perfByRange(start, end);
    const prevVol = await perfByRange(prevStart, prevEnd);
    let perfScore = 0.5; // neutral baseline
    if (prevVol <= 0 && currentVol > 0) perfScore = 0.6;
    else if (prevVol > 0) {
      // normalize against a modest target: +20% seen as 1.0, equal as ~0.5
      const ratio = currentVol / (prevVol * 1.2);
      perfScore = Math.max(0, Math.min(1, ratio));
    }

    // 2) RPE score: average rpePerSet for current week; peak at ~8 (two-RIR)
    const curPerfs = await ctx.db
      .query("exercisePerformance")
      .withIndex("by_exercise", q => q.eq("exerciseId", args.exerciseId))
      .collect();
    const curFilt = curPerfs.filter(p => typeof p.createdAt === 'string' && inRange(p.createdAt as string, start, end));
    const rpes: number[] = [];
    for (const p of curFilt) {
      const arr = Array.isArray(p.rpePerSet) ? (p.rpePerSet as any) : [];
      for (const r of arr) if (typeof r === 'number' && !Number.isNaN(r)) rpes.push(r);
    }
    let rpeScore = 0.5;
    if (rpes.length > 0) {
      const avg = rpes.reduce((a, b) => a + b, 0) / rpes.length; // 1..10 scale
      // Gaussian around target 8 with sd ~1 → maps to 0..1
      const sd = 1.0;
      const exponent = -0.5 * Math.pow((avg - 8) / sd, 2);
      rpeScore = Math.max(0, Math.min(1, Math.exp(exponent)));
    }

    // 3) Objective device score: prefer moderate strain, decent readiness
    // Try strain average for the week (0..1 normalized expected), else fallback to readiness
    const fit = await ctx.db
      .query("fitnessData")
      .withIndex("by_user_and_date", q => q.eq("userId", args.userId))
      .collect();
    const weekFit = fit.filter(f => typeof f.timestamp === 'string' && inRange(f.timestamp as string, start, end));
    const strainVals = weekFit.filter(f => f.dataType === 'strain').map(f => f.value as number);
    let objectiveScore = 0.5;
    if (strainVals.length > 0) {
      const avgStrain = strainVals.reduce((a, b) => a + b, 0) / strainVals.length; // 0..1 expected
      const target = 0.6; // moderate strain target
      const dist = Math.abs(avgStrain - target);
      objectiveScore = Math.max(0, 1 - dist / target);
    } else {
      // fallback to readiness from fusion
      try {
        const fused = await ctx.runQuery("functions/fusion:fuseReadiness", { userId: args.userId, windowDays: 7 } as any);
        if (fused && typeof fused.readiness === 'number') objectiveScore = Math.max(0, Math.min(1, fused.readiness));
      } catch {
        // keep default
      }
    }

    const reward = 0.55 * perfScore + 0.25 * rpeScore + 0.20 * objectiveScore;
    return { reward, perfScore, rpeScore, objectiveScore } as const;
  }
});

export const recordOutcomeForExercise = mutation({
  args: { userId: v.id("users"), exerciseId: v.id("exercises"), weekStart: v.string() },
  handler: async (ctx, args) => {
    // Find decision
    const decision = await ctx.db
      .query("adjustmentDecisions")
      .withIndex("by_user_exercise_week", q => q.eq("userId", args.userId).eq("exerciseId", args.exerciseId).eq("weekStart", args.weekStart))
      .first();
    if (!decision) throw new Error("No decision recorded for this (user,exercise,week)");

    // Compute reward
    const r = await ctx.runQuery("functions/adjustmentLearning:computeRewardForExercise", args as any);

    // Update policy
    const policy = await ctx.runMutation("functions/adjustmentLearning:getOrInitPolicy", { userId: args.userId } as any);
    const armStats = [...(policy.armStats as any[])];
    const s = armStats[decision.armIndex];
    armStats[decision.armIndex] = { plays: s.plays + 1, rewardSum: s.rewardSum + r.reward };
    await ctx.db.patch(policy._id, { armStats, updatedAt: nowIso() });

    // Log outcome
    await ctx.db.insert("adjustmentOutcomes", {
      userId: args.userId,
      armIndex: decision.armIndex,
      reward: r.reward,
      context: { perfScore: r.perfScore, rpeScore: r.rpeScore, objectiveScore: r.objectiveScore },
      createdAt: nowIso(),
    });

    return { ok: true as const, reward: r.reward };
  }
});

// Log user's achieved adjustment vs planned (user override respected)
export const logAdjustmentAchievement = mutation({
  args: {
    userId: v.id('users'),
    exerciseId: v.id('exercises'),
    weekStart: v.string(),
    adjustmentType: v.union(v.literal('sets'), v.literal('reps'), v.literal('volume')),
    plannedValue: v.number(),
    achievedValue: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('adjustmentAchievements')
      .withIndex('by_user_exercise_week', q => q.eq('userId', args.userId).eq('exerciseId', args.exerciseId).eq('weekStart', args.weekStart))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        adjustmentType: args.adjustmentType,
        plannedValue: args.plannedValue,
        achievedValue: args.achievedValue,
      });
      return { ok: true as const, updated: true };
    }

    await ctx.db.insert('adjustmentAchievements', {
      userId: args.userId,
      exerciseId: args.exerciseId,
      weekStart: args.weekStart,
      adjustmentType: args.adjustmentType,
      plannedValue: args.plannedValue,
      achievedValue: args.achievedValue,
      createdAt: new Date().toISOString(),
    });
    return { ok: true as const, created: true };
  }
});

export const getPolicy = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("adjustmentPolicies")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .first();
  }
});
