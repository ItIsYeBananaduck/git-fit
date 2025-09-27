import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

describe('Contract: social:shareContent', () => {
  let t: ConvexTestingHelper;
  let userId: Id<"users">;
  let workoutSessionId: Id<"workoutSessions">;
  let supplementStackId: Id<"supplementStacks">;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
    
    // Setup test user
    userId = await t.db.insert("users", {
      name: "Test Social User",
      email: "social@example.com",
      role: "user",
      createdAt: Date.now(),
    });

    t.withIdentity({ tokenIdentifier: `test_${userId}` });

    // Setup workout session for sharing
    workoutSessionId = await t.db.insert("workoutSessions", {
      userId,
      startTime: Date.now() - 3600000, // 1 hour ago
      endTime: Date.now(),
      isActive: false,
      exerciseIds: ["exercise_123", "exercise_456"],
    });

    // Setup supplement stack for sharing
    const supplementItemId = await t.db.insert("supplementItems", {
      userId,
      barcode: "123456789001",
      productName: "Vitamin D3",
      dosage: "1000 IU daily",
      userNotes: "Morning routine",
      categoryType: "vitamin",
      isRxCompound: false,
      scannedAt: Date.now(),
    });

    supplementStackId = await t.db.insert("supplementStacks", {
      userId,
      name: "Morning Wellness Stack",
      description: "Daily morning supplements",
      supplementItemIds: [supplementItemId],
      isPublic: true,
      tags: ["morning", "wellness"],
      createdAt: Date.now(),
    });
  });

  it('shares workout content publicly', async () => {
    const result = await t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: workoutSessionId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: ["fitness_level", "age_range"],
    });

    expect(result.shareId).toBeDefined();
    expect(result.privacyLevel).toBe("public");
    expect(result.expectedReach).toBeGreaterThan(0);
    expect(result.medicalDataFiltered).toBe(false);
  });

  it('shares supplement stack with medical data filtering', async () => {
    // Add Rx compound to stack
    const rxItemId = await t.db.insert("supplementItems", {
      userId,
      barcode: "RX123456789",
      productName: "Prescription Medication",
      dosage: "5mg daily",
      userNotes: "Prescribed",
      categoryType: "medication",
      isRxCompound: true,
      scannedAt: Date.now(),
    });

    // Update stack to include Rx item
    await t.db.patch(supplementStackId, {
      supplementItemIds: [rxItemId],
    });

    const result = await t.mutation(api.social.shareContent, {
      contentType: "supplement_stack",
      contentId: supplementStackId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: ["health_goals"],
    });

    expect(result.medicalDataFiltered).toBe(true);
    expect(result.filteredItemCount).toBe(1);
    expect(result.privacyWarning).toBeDefined();
    expect(result.shareableItemCount).toBe(0);
  });

  it('applies ghost mode sharing', async () => {
    const result = await t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: workoutSessionId,
      isPublic: false,
      ghostMode: true,
      clusteringCriteria: ["workout_type", "experience_level"],
    });

    expect(result.privacyLevel).toBe("ghost");
    expect(result.userIdentityHidden).toBe(true);
    expect(result.personalDataRedacted).toBe(true);
    expect(result.expectedReach).toBeGreaterThan(0);
  });

  it('validates content ownership', async () => {
    // Create content for different user
    const otherUserId = await t.db.insert("users", {
      name: "Other User",
      email: "other@example.com",
      role: "user", 
      createdAt: Date.now(),
    });

    const otherUserWorkoutId = await t.db.insert("workoutSessions", {
      userId: otherUserId,
      startTime: Date.now(),
      endTime: Date.now(),
      isActive: false,
      exerciseIds: [],
    });

    await expect(t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: otherUserWorkoutId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: [],
    })).rejects.toThrow("Cannot share content owned by another user");
  });

  it('applies clustering criteria for targeted sharing', async () => {
    const result = await t.mutation(api.social.shareContent, {
      contentType: "supplement_stack",
      contentId: supplementStackId,
      isPublic: false,
      ghostMode: false,
      clusteringCriteria: ["age_range:25-35", "fitness_level:intermediate", "goals:wellness"],
    });

    expect(result.privacyLevel).toBe("clustered");
    expect(result.targetClusters).toEqual(["age_range:25-35", "fitness_level:intermediate", "goals:wellness"]);
    expect(result.expectedReach).toBeLessThan(1000); // Targeted reach
    expect(result.clusteringApplied).toBe(true);
  });

  it('validates content type and ID matching', async () => {
    await expect(t.mutation(api.social.shareContent, {
      contentType: "workout", // Mismatch: should be supplement_stack
      contentId: supplementStackId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: [],
    })).rejects.toThrow("Content type does not match content ID");
  });

  it('handles exercise demo sharing', async () => {
    // Create exercise demo content
    const exerciseDemoId = await t.db.insert("exerciseDemos", {
      userId,
      exerciseId: "demo_exercise_123",
      videoUrl: "https://example.com/demo.mp4",
      title: "Perfect Form Squat Demo",
      description: "Demonstration of proper squat technique",
      isPublic: true,
      createdAt: Date.now(),
    });

    const result = await t.mutation(api.social.shareContent, {
      contentType: "exercise_demo",
      contentId: exerciseDemoId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: ["exercise_type:strength"],
    });

    expect(result.shareId).toBeDefined();
    expect(result.contentType).toBe("exercise_demo");
    expect(result.videoProcessingRequired).toBe(true);
  });

  it('prevents sharing of incomplete content', async () => {
    // Create incomplete workout session
    const incompleteWorkoutId = await t.db.insert("workoutSessions", {
      userId,
      startTime: Date.now(),
      isActive: true, // Still active
      exerciseIds: [],
    });

    await expect(t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: incompleteWorkoutId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: [],
    })).rejects.toThrow("Cannot share incomplete or active content");
  });

  it('applies privacy settings based on user preferences', async () => {
    // Update user privacy settings
    await t.db.patch(userId, { 
      privacySettings: {
        allowPublicSharing: false,
        allowClusteredSharing: true,
        medicalDataSharingConsent: false,
      }
    });

    const result = await t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: workoutSessionId,
      isPublic: true, // User wants public but settings prevent it
      ghostMode: false,
      clusteringCriteria: ["fitness_level"],
    });

    expect(result.privacyLevel).toBe("clustered"); // Downgraded from public
    expect(result.privacyDowngradeApplied).toBe(true);
    expect(result.downgradeReason).toBe("user_privacy_settings");
  });

  it('calculates expected reach accurately', async () => {
    const result = await t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: workoutSessionId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: [],
    });

    expect(result.expectedReach).toBeTypeOf('number');
    expect(result.reachCalculation.totalUsers).toBeTypeOf('number');
    expect(result.reachCalculation.activeUsers).toBeTypeOf('number');
    expect(result.reachCalculation.similarContent).toBeTypeOf('number');
  });

  it('validates clustering criteria format', async () => {
    await expect(t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: workoutSessionId,
      isPublic: false,
      ghostMode: false,
      clusteringCriteria: ["invalid_format"], // Should be key:value format
    })).rejects.toThrow("Invalid clustering criteria format");
  });

  it('prevents over-sharing by same user', async () => {
    // Share content first time
    await t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: workoutSessionId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: [],
    });

    // Try to share same content again
    await expect(t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: workoutSessionId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: [],
    })).rejects.toThrow("Content has already been shared");
  });

  it('requires authenticated user', async () => {
    t.withIdentity({ tokenIdentifier: "" });

    await expect(t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: workoutSessionId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: [],
    })).rejects.toThrow("Unauthorized");
  });

  it('stores sharing metadata correctly', async () => {
    const result = await t.mutation(api.social.shareContent, {
      contentType: "supplement_stack",
      contentId: supplementStackId,
      isPublic: false,
      ghostMode: true,
      clusteringCriteria: ["health_goals:muscle_gain"],
    });

    const storedShare = await t.db.get(result.shareId);
    expect(storedShare).toMatchObject({
      userId,
      contentType: "supplement_stack",
      contentId: supplementStackId,
      isPublic: false,
      ghostMode: true,
      clusteringCriteria: ["health_goals:muscle_gain"],
    });
    expect(storedShare?.sharedAt).toBeTypeOf('number');
  });

  it('tracks sharing analytics', async () => {
    const result = await t.mutation(api.social.shareContent, {
      contentType: "workout",
      contentId: workoutSessionId,
      isPublic: true,
      ghostMode: false,
      clusteringCriteria: ["workout_type:strength"],
    });

    expect(result.analyticsTracked).toBe(true);
    expect(result.shareMetrics.contentQualityScore).toBeTypeOf('number');
    expect(result.shareMetrics.engagementPrediction).toBeTypeOf('number');
  });
});