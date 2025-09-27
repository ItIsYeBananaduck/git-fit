import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

describe('Contract: supplements:scanItem', () => {
  let t: ConvexTestingHelper;
  let userId: Id<"users">;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
    
    // Setup test user
    userId = await t.db.insert("users", {
      name: "Test User",
      email: "test@example.com",
      role: "user",
      createdAt: Date.now(),
    });

    t.withIdentity({ tokenIdentifier: `test_${userId}` });
  });

  it('scans valid supplement barcode successfully', async () => {
    const result = await t.mutation(api.supplements.scanItem, {
      barcode: "737628064502", // Valid OpenFoodFacts barcode
      dosage: "2 capsules daily",
      userNotes: "Taking with breakfast",
    });

    expect(result.supplementItemId).toBeDefined();
    expect(result.productName).toBeDefined();
    expect(result.categoryType).toBeDefined();
    expect(result.isRxCompound).toBe(false);
    expect(result.scanSuccessful).toBe(true);
  });

  it('detects Rx compounds automatically', async () => {
    const result = await t.mutation(api.supplements.scanItem, {
      barcode: "000000000001", // Mock barcode for Rx compound
      dosage: "5mg once daily",
      userNotes: "Prescribed by Dr. Smith",
    });

    expect(result.isRxCompound).toBe(true);
    expect(result.privacyWarning).toBeDefined();
    expect(result.sharingRestricted).toBe(true);
  });

  it('handles unknown/invalid barcodes gracefully', async () => {
    const result = await t.mutation(api.supplements.scanItem, {
      barcode: "999999999999", // Invalid barcode
      dosage: "Unknown",
      userNotes: "Manual entry",
    });

    expect(result.scanSuccessful).toBe(false);
    expect(result.manualEntryRequired).toBe(true);
    expect(result.productName).toBe("Unknown Product");
    expect(result.openFoodFactsFound).toBe(false);
  });

  it('validates barcode format', async () => {
    await expect(t.mutation(api.supplements.scanItem, {
      barcode: "123", // Too short
      dosage: "1 tablet",
      userNotes: "",
    })).rejects.toThrow("Invalid barcode format");
  });

  it('validates dosage information is provided', async () => {
    await expect(t.mutation(api.supplements.scanItem, {
      barcode: "737628064502",
      dosage: "", // Empty dosage
      userNotes: "Test notes",
    })).rejects.toThrow("Dosage information is required");
  });

  it('stores supplement item with correct metadata', async () => {
    const result = await t.mutation(api.supplements.scanItem, {
      barcode: "737628064502",
      dosage: "1 tablet twice daily",
      userNotes: "With meals",
    });

    const storedItem = await t.db.get(result.supplementItemId);
    expect(storedItem).toMatchObject({
      userId,
      barcode: "737628064502",
      dosage: "1 tablet twice daily",
      userNotes: "With meals",
    });
    expect(storedItem?.scannedAt).toBeTypeOf('number');
  });

  it('detects duplicate scans within same session', async () => {
    // First scan
    await t.mutation(api.supplements.scanItem, {
      barcode: "737628064502",
      dosage: "1 tablet daily",
      userNotes: "First scan",
    });

    // Duplicate scan
    const result = await t.mutation(api.supplements.scanItem, {
      barcode: "737628064502",
      dosage: "1 tablet daily", 
      userNotes: "Duplicate scan",
    });

    expect(result.isDuplicate).toBe(true);
    expect(result.existingItemId).toBeDefined();
    expect(result.duplicateAction).toBe("update_notes");
  });

  it('fetches nutrition facts from OpenFoodFacts API', async () => {
    const result = await t.mutation(api.supplements.scanItem, {
      barcode: "737628064502",
      dosage: "As directed",
      userNotes: "",
    });

    expect(result.nutritionFacts).toBeDefined();
    expect(result.ingredients).toBeInstanceOf(Array);
    expect(result.openFoodFactsData).toBeDefined();
  });

  it('applies medical compound detection rules', async () => {
    // Test various compound names that should trigger Rx detection
    const testCases = [
      { notes: "Contains metformin", expected: true },
      { notes: "Vitamin D3 supplement", expected: false },
      { notes: "Taking with lisinopril", expected: true },
      { notes: "Regular protein powder", expected: false },
    ];

    for (const testCase of testCases) {
      const result = await t.mutation(api.supplements.scanItem, {
        barcode: `${Date.now()}${Math.random()}`, // Unique barcode
        dosage: "As needed",
        userNotes: testCase.notes,
      });

      expect(result.isRxCompound).toBe(testCase.expected);
    }
  });

  it('respects privacy settings for Rx compounds', async () => {
    const result = await t.mutation(api.supplements.scanItem, {
      barcode: "000000000001", // Rx compound mock
      dosage: "10mg daily",
      userNotes: "Prescribed medication",
    });

    expect(result.isRxCompound).toBe(true);
    expect(result.shareablePublicly).toBe(false);
    expect(result.requiresPrivacyConsent).toBe(true);
  });

  it('handles OpenFoodFacts API timeout gracefully', async () => {
    // Mock timeout scenario
    const result = await t.mutation(api.supplements.scanItem, {
      barcode: "000000TIMEOUT", // Special barcode to simulate timeout
      dosage: "Unknown",
      userNotes: "API timeout test",
    });

    expect(result.scanSuccessful).toBe(false);
    expect(result.apiTimeout).toBe(true);
    expect(result.fallbackDataUsed).toBe(true);
  });

  it('validates user notes length', async () => {
    const longNotes = "A".repeat(1001); // Exceeds 1000 character limit

    await expect(t.mutation(api.supplements.scanItem, {
      barcode: "737628064502",
      dosage: "1 tablet",
      userNotes: longNotes,
    })).rejects.toThrow("User notes must be 1000 characters or less");
  });

  it('requires authenticated user', async () => {
    t.withIdentity({ tokenIdentifier: "" });

    await expect(t.mutation(api.supplements.scanItem, {
      barcode: "737628064502",
      dosage: "1 tablet",
      userNotes: "Test",
    })).rejects.toThrow("Unauthorized");
  });

  it('tracks scanning analytics', async () => {
    const result = await t.mutation(api.supplements.scanItem, {
      barcode: "737628064502",
      dosage: "2 capsules",
      userNotes: "Morning routine",
    });

    expect(result.analyticsTracked).toBe(true);
    expect(result.scanDuration).toBeTypeOf('number');
    expect(result.deviceType).toBeDefined();
  });
});