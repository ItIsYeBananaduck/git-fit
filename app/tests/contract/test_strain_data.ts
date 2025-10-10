// Contract tests for strain data queries
import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../../convex/_generated/api';
import type { StrainData } from '../../../src/lib/types/orb';

describe('Strain Data Contract Tests', () => {
  let t: ConvexTestingHelper;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
  });

  describe('getCurrentStrain query', () => {
    it('should return current strain data for active workout', async () => {
      // This test MUST FAIL until implementation exists
      await expect(
        t.query(api.strainData.getCurrentStrain, {})
      ).rejects.toThrow();
    });

    it('should return null when no active workout', async () => {
      const result = await t.query(api.strainData.getCurrentStrain, {});
      expect(result).toBeNull();
    });

    it('should validate strain data is not stale (< 5 minutes)', async () => {
      const result = await t.query(api.strainData.getCurrentStrain, {});
      if (result) {
        const ageInMinutes = (Date.now() - result.timestamp) / (1000 * 60);
        expect(ageInMinutes).toBeLessThan(5);
      }
    });

    it('should require user authentication', async () => {
      await expect(
        t.query(api.strainData.getCurrentStrain, {})
      ).rejects.toThrow('UNAUTHENTICATED');
    });

    it('should return strain values within 0-120 range', async () => {
      const result = await t.query(api.strainData.getCurrentStrain, {});
      if (result) {
        expect(result.currentStrain).toBeGreaterThanOrEqual(0);
        expect(result.currentStrain).toBeLessThanOrEqual(120);
      }
    });
  });
});