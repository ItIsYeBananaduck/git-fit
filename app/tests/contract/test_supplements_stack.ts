import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

describe('Contract: supplements:createStack', () => {
  let t: ConvexTestingHelper;
  let userId: Id<"users">;
  let supplementItemIds: Id<"supplementItems">[];

  beforeEach(async () => {
    t = new ConvexTestingHelper();
    
    // Setup test user
    userId = await t.db.insert("users", {
      name: "Test Stack User",
      email: "stack@example.com",
      role: "user",
      createdAt: Date.now(),
    });

    t.withIdentity({ tokenIdentifier: `test_${userId}` });

    // Create test supplement items
    supplementItemIds = await Promise.all([
      t.db.insert("supplementItems", {
        userId,
        barcode: "123456789001",
        productName: "Vitamin D3",
        dosage: "1000 IU daily",
        userNotes: "With breakfast",
        categoryType: "vitamin",
        isRxCompound: false,
        scannedAt: Date.now(),
      }),
      t.db.insert("supplementItems", {
        userId,
        barcode: "123456789002", 
        productName: "Magnesium",
        dosage: "400mg before bed",
        userNotes: "For sleep",
        categoryType: "mineral",
        isRxCompound: false,
        scannedAt: Date.now(),
      }),
      t.db.insert("supplementItems", {
        userId,
        barcode: "123456789003",
        productName: "Omega-3",
        dosage: "2 capsules daily",
        userNotes: "With lunch",
        categoryType: "oil",
        isRxCompound: false,
        scannedAt: Date.now(),
      }),
    ]);
  });

  it('creates supplement stack successfully', async () => {
    const result = await t.mutation(api.supplements.createStack, {
      name: "Morning Stack",
      description: "Daily morning supplements",
      supplementItemIds: supplementItemIds.slice(0, 2),
      isPublic: false,
      tags: ["morning", "daily", "wellness"],
    });

    expect(result.stackId).toBeDefined();
    expect(result.itemCount).toBe(2);
    expect(result.stackCreated).toBe(true);
    expect(result.privacyLevel).toBe("private");
  });

  it('validates supplement items belong to user', async () => {
    // Create supplement item for different user
    const otherUserId = await t.db.insert("users", {
      name: "Other User",
      email: "other@example.com", 
      role: "user",
      createdAt: Date.now(),
    });

    const otherUserItemId = await t.db.insert("supplementItems", {
      userId: otherUserId,
      barcode: "999999999999",
      productName: "Unauthorized Item",
      dosage: "1 tablet",
      userNotes: "",
      categoryType: "other",
      isRxCompound: false,
      scannedAt: Date.now(),
    });

    await expect(t.mutation(api.supplements.createStack, {
      name: "Invalid Stack",
      description: "Contains unauthorized items",
      supplementItemIds: [supplementItemIds[0], otherUserItemId],
      isPublic: false,
      tags: [],
    })).rejects.toThrow("Unauthorized supplement items in stack");
  });

  it('creates public stack with privacy filtering', async () => {
    // Add Rx compound to test items
    const rxItemId = await t.db.insert("supplementItems", {
      userId,
      barcode: "RX123456789",
      productName: "Prescription Medication", 
      dosage: "5mg daily",
      userNotes: "Prescribed by doctor",
      categoryType: "medication",
      isRxCompound: true,
      scannedAt: Date.now(),
    });

    const result = await t.mutation(api.supplements.createStack, {
      name: "Public Wellness Stack",
      description: "Shareable supplement routine",
      supplementItemIds: [...supplementItemIds, rxItemId],
      isPublic: true,
      tags: ["wellness", "public"],
    });

    expect(result.stackCreated).toBe(true);
    expect(result.rxItemsFiltered).toBe(true);
    expect(result.publicItemCount).toBe(3); // Only non-Rx items
    expect(result.filteredItemCount).toBe(1); // Rx item filtered out
  });

  it('validates stack name requirements', async () => {
    await expect(t.mutation(api.supplements.createStack, {
      name: "", // Empty name
      description: "Test stack",
      supplementItemIds: [supplementItemIds[0]],
      isPublic: false,
      tags: [],
    })).rejects.toThrow("Stack name is required");
  });

  it('validates minimum item count', async () => {
    await expect(t.mutation(api.supplements.createStack, {
      name: "Empty Stack",
      description: "No items",
      supplementItemIds: [], // No items
      isPublic: false,
      tags: [],
    })).rejects.toThrow("Stack must contain at least one supplement");
  });

  it('validates maximum item count', async () => {
    // Create many supplement items
    const manyItemIds = await Promise.all(
      Array.from({ length: 21 }, async (_, i) => 
        t.db.insert("supplementItems", {
          userId,
          barcode: `MANY${i.toString().padStart(10, '0')}`,
          productName: `Supplement ${i}`,
          dosage: "1 tablet",
          userNotes: "",
          categoryType: "vitamin",
          isRxCompound: false,
          scannedAt: Date.now(),
        })
      )
    );

    await expect(t.mutation(api.supplements.createStack, {
      name: "Too Large Stack",
      description: "Exceeds maximum items",
      supplementItemIds: manyItemIds, // 21 items, exceeds limit of 20
      isPublic: false,
      tags: [],
    })).rejects.toThrow("Stack cannot contain more than 20 supplements");
  });

  it('detects interaction warnings', async () => {
    // Create items with potential interactions
    const interactionItemIds = await Promise.all([
      t.db.insert("supplementItems", {
        userId,
        barcode: "INTERACT001",
        productName: "Iron Supplement",
        dosage: "25mg daily",
        userNotes: "",
        categoryType: "mineral", 
        isRxCompound: false,
        scannedAt: Date.now(),
      }),
      t.db.insert("supplementItems", {
        userId,
        barcode: "INTERACT002", 
        productName: "Calcium Carbonate",
        dosage: "500mg daily",
        userNotes: "",
        categoryType: "mineral",
        isRxCompound: false,
        scannedAt: Date.now(),
      }),
    ]);

    const result = await t.mutation(api.supplements.createStack, {
      name: "Interaction Test Stack",
      description: "Testing supplement interactions",
      supplementItemIds: interactionItemIds,
      isPublic: false,
      tags: ["test"],
    });

    expect(result.interactionWarnings).toBeDefined();
    expect(result.interactionWarnings.length).toBeGreaterThan(0);
    expect(result.hasInteractionWarnings).toBe(true);
  });

  it('applies timing recommendations', async () => {
    const result = await t.mutation(api.supplements.createStack, {
      name: "Optimized Timing Stack",
      description: "Stack with timing optimization",
      supplementItemIds: supplementItemIds,
      isPublic: false,
      tags: ["optimized"],
    });

    expect(result.timingRecommendations).toBeDefined();
    expect(result.morningItems).toBeDefined();
    expect(result.eveningItems).toBeDefined();
    expect(result.withMealsItems).toBeDefined();
  });

  it('validates tag format and limits', async () => {
    await expect(t.mutation(api.supplements.createStack, {
      name: "Tag Test Stack",
      description: "Testing tag validation",
      supplementItemIds: [supplementItemIds[0]],
      isPublic: false,
      tags: ["valid", "tag_with_underscore", "123numeric", "way too many tags here exceeding the reasonable limit for stack organization"], // Invalid long tag
    })).rejects.toThrow("Tags must be alphanumeric and under 30 characters");
  });

  it('prevents duplicate stack names for same user', async () => {
    // Create first stack
    await t.mutation(api.supplements.createStack, {
      name: "Unique Stack Name",
      description: "First stack", 
      supplementItemIds: [supplementItemIds[0]],
      isPublic: false,
      tags: [],
    });

    // Try to create stack with same name
    await expect(t.mutation(api.supplements.createStack, {
      name: "Unique Stack Name", // Duplicate name
      description: "Second stack",
      supplementItemIds: [supplementItemIds[1]],
      isPublic: false,
      tags: [],
    })).rejects.toThrow("Stack name already exists");
  });

  it('calculates cost estimation', async () => {
    const result = await t.mutation(api.supplements.createStack, {
      name: "Cost Analysis Stack",
      description: "Stack for cost tracking",
      supplementItemIds: supplementItemIds,
      isPublic: false,
      tags: ["budget"],
    });

    expect(result.estimatedMonthlyCost).toBeTypeOf('number');
    expect(result.costBreakdown).toBeDefined();
    expect(result.budgetCategory).toBeDefined();
  });

  it('handles stack sharing permissions', async () => {
    const result = await t.mutation(api.supplements.createStack, {
      name: "Shareable Stack",
      description: "Stack with sharing controls",
      supplementItemIds: supplementItemIds.slice(0, 2),
      isPublic: true,
      tags: ["public", "sharing"],
    });

    expect(result.shareableLink).toBeDefined();
    expect(result.privacySettings.canShare).toBe(true);
    expect(result.privacySettings.requiresConsent).toBe(false);
  });

  it('requires authenticated user', async () => {
    t.withIdentity({ tokenIdentifier: "" });

    await expect(t.mutation(api.supplements.createStack, {
      name: "Test Stack",
      description: "Test description",
      supplementItemIds: [supplementItemIds[0]],
      isPublic: false,
      tags: [],
    })).rejects.toThrow("Unauthorized");
  });

  it('stores stack metadata correctly', async () => {
    const result = await t.mutation(api.supplements.createStack, {
      name: "Metadata Test Stack",
      description: "Testing metadata storage",
      supplementItemIds: supplementItemIds,
      isPublic: false,
      tags: ["metadata", "test"],
    });

    const storedStack = await t.db.get(result.stackId);
    expect(storedStack).toMatchObject({
      userId,
      name: "Metadata Test Stack",
      description: "Testing metadata storage",
      isPublic: false,
      tags: ["metadata", "test"],
    });
    expect(storedStack?.createdAt).toBeTypeOf('number');
    expect(storedStack?.supplementItemIds).toEqual(supplementItemIds);
  });
});