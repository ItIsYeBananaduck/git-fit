import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from '../helpers/ConvexTestingHelper';
// Simple type mocks to avoid import issues
type Id<T> = string;

describe('Contract: intensity:calculateScore', () => {
  let t: ConvexTestingHelper;
  let userId: Id<"users">;
  let workoutSessionId: Id<"workoutSessions">;
  let setId: Id<"workoutSets">;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
    await t.setup();
    
    // Set up authentication
    t.withIdentity({ tokenIdentifier: "test_user_token" });
    
    // Setup test user
    userId = await t.createTestUser();

    // Setup test workout session
    workoutSessionId = await t.createTestWorkoutSession(userId);

    // Setup test workout set
    setId = await t.createTestWorkoutSet(workoutSessionId);
  });

  it('calculates basic intensity score correctly', async () => {
    const result = await t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 75,
      motionSmoothnessScore: 80,
      repConsistencyScore: 85,
      userFeedbackScore: 10,
      strainModifier: 1.0,
      isEstimated: false,
    });

    expect(result.intensityScoreId).toBeDefined();
    expect(result.totalScore).toBeCloseTo(61); // 75*0.3 + 80*0.25 + 85*0.2 + 10*0.15 = 22.5+20+17+1.5 = 61
    expect(result.isCapped).toBe(false);
  });

  it('caps intensity score at 100 for regular users', async () => {
    const result = await t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 100,
      motionSmoothnessScore: 100,
      repConsistencyScore: 100,
      userFeedbackScore: 20,
      strainModifier: 1.0,
      isEstimated: false,
    });

    // For regular users, even perfect scores should be capped at 100
    expect(result.totalScore).toBe(100);
    expect(result.isCapped).toBe(true);
  });

  it('allows trainers to exceed 100% intensity', async () => {
    // Update user to trainer role
    await t.db.patch(userId, { role: "trainer" });

    const result = await t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 100,
      motionSmoothnessScore: 100,
      repConsistencyScore: 100,
      userFeedbackScore: 20,
      strainModifier: 1.0,
      isEstimated: false,
    });

    // Trainers get the actual calculated score, not capped
    expect(result.totalScore).toBeCloseTo(78); // 100*0.3 + 100*0.25 + 100*0.2 + 20*0.15
    expect(result.isCapped).toBe(false);
  });

  it('applies strain modifier correctly', async () => {
    const result = await t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 80,
      motionSmoothnessScore: 80,
      repConsistencyScore: 80,
      userFeedbackScore: 0,
      strainModifier: 0.85, // High strain penalty
      isEstimated: false,
    });

    // Base score: 80*0.3 + 80*0.25 + 80*0.2 + 0*0.15 = 60
    // With strain modifier: 60 * 0.85 = 51
    expect(result.totalScore).toBeCloseTo(51);
    expect(result.isCapped).toBe(false);
  });

  it('validates tempo score range', async () => {
    await expect(t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 150, // Invalid: > 100
      motionSmoothnessScore: 80,
      repConsistencyScore: 80,
      userFeedbackScore: 0,
      strainModifier: 1.0,
      isEstimated: false,
    })).rejects.toThrow("Tempo score must be 0-100");
  });

  it('validates motion smoothness score range', async () => {
    await expect(t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 80,
      motionSmoothnessScore: -10, // Invalid: < 0
      repConsistencyScore: 80,
      userFeedbackScore: 0,
      strainModifier: 1.0,
      isEstimated: false,
    })).rejects.toThrow("Motion smoothness score must be 0-100");
  });

  it('validates user feedback score range', async () => {
    await expect(t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 80,
      motionSmoothnessScore: 80,
      repConsistencyScore: 80,
      userFeedbackScore: 25, // Invalid: > 20
      strainModifier: 1.0,
      isEstimated: false,
    })).rejects.toThrow("User feedback score must be -15 to +20");
  });

  it('stores intensity score with correct metadata', async () => {
    const result = await t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 75,
      motionSmoothnessScore: 80,
      repConsistencyScore: 85,
      userFeedbackScore: 10,
      strainModifier: 0.95,
      isEstimated: true, // No wearable data
    });

    const storedScore = await t.db.get(result.intensityScoreId);
    expect(storedScore).toMatchObject({
      userId,
      workoutSessionId,
      setId,
      tempoScore: 75,
      motionSmoothnessScore: 80,
      repConsistencyScore: 85,
      userFeedbackScore: 10,
      strainModifier: 0.95,
      isEstimated: true,
    });
    expect(storedScore?.createdAt).toBeTypeOf('number');
  });

  it('handles negative user feedback correctly', async () => {
    const result = await t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 80,
      motionSmoothnessScore: 80,
      repConsistencyScore: 80,
      userFeedbackScore: -15, // Maximum negative feedback
      strainModifier: 1.0,
      isEstimated: false,
    });

    // Base: 80*0.3 + 80*0.25 + 80*0.2 + (-15)*0.15 = 60 - 2.25 = 57.75
    expect(result.totalScore).toBeCloseTo(57.75);
  });

  it('requires authenticated user', async () => {
    // Clear auth context
    t.withIdentity({ tokenIdentifier: "" });

    await expect(t.mutation('intensity:calculateScore', {
      userId,
      workoutSessionId,
      setId,
      tempoScore: 80,
      motionSmoothnessScore: 80,
      repConsistencyScore: 80,
      userFeedbackScore: 0,
      strainModifier: 1.0,
      isEstimated: false,
    })).rejects.toThrow("Unauthorized");
  });
});