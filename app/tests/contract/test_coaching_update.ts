import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

describe('Contract: coaching:updateContext', () => {
  let t: ConvexTestingHelper;
  let userId: Id<"users">;
  let intensityScoreId: Id<"intensityScores">;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
    
    // Setup test user
    userId = await t.db.insert("users", {
      name: "Test Coach User",
      email: "coach@example.com",
      role: "user",
      createdAt: Date.now(),
    });

    // Setup existing coaching context
    await t.db.insert("aiCoachingContext", {
      userId,
      coachPersonality: "alice",
      currentStrainStatus: "green",
      calibrationPhase: "active",
      voiceEnabled: true,
      hasEarbuds: false,
      voiceIntensity: 75,
      isZenMode: false,
      lastCoachingMessage: "Great form!",
      updatedAt: Date.now(),
    });

    // Setup test intensity score
    const workoutSessionId = await t.db.insert("workoutSessions", {
      userId,
      startTime: Date.now(),
      isActive: true,
      exerciseIds: [],
    });

    intensityScoreId = await t.db.insert("intensityScores", {
      userId,
      workoutSessionId,
      setId: await t.db.insert("workoutSets", {
        workoutSessionId,
        exerciseId: "test_exercise",
        setNumber: 1,
        reps: 10,
        weight: 100,
        restTime: 60,
      }),
      tempoScore: 80,
      motionSmoothnessScore: 75,
      repConsistencyScore: 85,
      userFeedbackScore: 5,
      strainModifier: 1.0,
      totalScore: 78,
      isEstimated: false,
      createdAt: Date.now(),
    });
  });

  it('updates strain status correctly', async () => {
    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "yellow",
      intensityScoreId,
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    });

    expect(result.contextUpdated).toBe(true);
    expect(result.coachingMessage).toBeDefined();
    expect(result.strainStatusChanged).toBe(true);
    expect(result.newStrainStatus).toBe("yellow");
  });

  it('handles red strain status with appropriate coaching', async () => {
    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "red",
      intensityScoreId,
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    });

    expect(result.coachingMessage).toContain("slow down");
    expect(result.urgencyLevel).toBe("high");
    expect(result.recommendedRestTime).toBeGreaterThan(90);
  });

  it('enables zen mode automatically in red strain', async () => {
    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "red",
      intensityScoreId,
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    });

    expect(result.zenModeActivated).toBe(true);
    expect(result.voiceIntensityReduced).toBe(true);
  });

  it('respects zen mode settings', async () => {
    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "yellow",
      intensityScoreId,
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: true,
    });

    expect(result.coachingMessage).toBe("");
    expect(result.voiceMessageGenerated).toBe(false);
    expect(result.zenModeRespected).toBe(true);
  });

  it('only provides voice coaching when earbuds are connected', async () => {
    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "green",
      intensityScoreId,
      voiceEnabled: true,
      hasEarbuds: false, // No earbuds
      isZenMode: false,
    });

    expect(result.voiceMessageGenerated).toBe(false);
    expect(result.textMessageOnly).toBe(true);
    expect(result.earbud_requirement_enforced).toBe(true);
  });

  it('switches coach personality based on strain patterns', async () => {
    // Simulate multiple high strain updates
    await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "red",
      intensityScoreId,
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    });

    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "red",
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    });

    expect(result.personalitySwitchRecommended).toBeDefined();
    expect(result.newPersonalityReason).toContain("strain management");
  });

  it('tracks calibration phase progression', async () => {
    // Update coaching context to week1 phase
    const contextId = await t.db
      .query("aiCoachingContext")
      .filter(q => q.eq(q.field("userId"), userId))
      .first();

    await t.db.patch(contextId!._id, { calibrationPhase: "week1" });

    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "green",
      intensityScoreId,
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    });

    expect(result.calibrationUpdate).toBeDefined();
    expect(result.weeklyProgressNoted).toBe(true);
  });

  it('provides intensity score-based coaching', async () => {
    // Create a low intensity score
    const lowIntensityId = await t.db.insert("intensityScores", {
      userId,
      workoutSessionId: intensityScoreId, // Reuse for simplicity
      setId: intensityScoreId, // Reuse for simplicity
      tempoScore: 40,
      motionSmoothnessScore: 35,
      repConsistencyScore: 45,
      userFeedbackScore: -10,
      strainModifier: 1.0,
      totalScore: 32,
      isEstimated: false,
      createdAt: Date.now(),
    });

    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "green",
      intensityScoreId: lowIntensityId,
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    });

    expect(result.coachingMessage).toContain("focus");
    expect(result.intensityImprovementSuggested).toBe(true);
    expect(result.specificFeedback).toBeDefined();
  });

  it('handles missing intensity score gracefully', async () => {
    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "green",
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    });

    expect(result.contextUpdated).toBe(true);
    expect(result.intensityScoreMissing).toBe(true);
    expect(result.genericCoachingUsed).toBe(true);
  });

  it('validates strain status values', async () => {
    await expect(t.mutation(api.coaching.updateContext, {
      // @ts-expect-error Testing invalid strain status
      currentStrainStatus: "purple", // Invalid status
      intensityScoreId,
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    })).rejects.toThrow("Invalid strain status");
  });

  it('requires authenticated user', async () => {
    t.withIdentity({ tokenIdentifier: "" });

    await expect(t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "green",
      intensityScoreId,
      voiceEnabled: true,
      hasEarbuds: true,
      isZenMode: false,
    })).rejects.toThrow("Unauthorized");
  });

  it('creates coaching context if none exists', async () => {
    // Create new user without coaching context
    const newUserId = await t.db.insert("users", {
      name: "New User",
      email: "new@example.com",
      role: "user",
      createdAt: Date.now(),
    });

    t.withIdentity({ tokenIdentifier: `test_${newUserId}` });

    const result = await t.mutation(api.coaching.updateContext, {
      currentStrainStatus: "green",
      voiceEnabled: false,
      hasEarbuds: false,
      isZenMode: false,
    });

    expect(result.contextCreated).toBe(true);
    expect(result.defaultsApplied).toBe(true);
    expect(result.calibrationPhase).toBe("week1");
  });
});