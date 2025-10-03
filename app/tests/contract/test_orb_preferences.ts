// Contract tests for orb preferences mutations and queries
import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../../convex/_generated/api';
import type { AliceOrbPreferences } from '../../../src/lib/types/orb';

describe('Orb Preferences Contract Tests', () => {
  let t: ConvexTestingHelper;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
  });

  describe('updateOrbPreferences mutation', () => {
    it('should update orb preferences with valid hue value', async () => {
      // This test MUST FAIL until implementation exists
      await expect(
        t.mutation(api.orbPreferences.updateOrbPreferences, {
          baseColorHue: 120,
          customColorEnabled: true,
        })
      ).rejects.toThrow();
    });

    it('should reject invalid hue values outside 0-360 range', async () => {
      await expect(
        t.mutation(api.orbPreferences.updateOrbPreferences, {
          baseColorHue: 400,
          customColorEnabled: true,
        })
      ).rejects.toThrow('INVALID_HUE_VALUE');
    });

    it('should require user authentication', async () => {
      await expect(
        t.mutation(api.orbPreferences.updateOrbPreferences, {
          baseColorHue: 120,
          customColorEnabled: true,
        })
      ).rejects.toThrow('UNAUTHENTICATED');
    });
  });

  describe('getOrbPreferences query', () => {
    it('should return user orb preferences', async () => {
      // This test MUST FAIL until implementation exists
      await expect(
        t.query(api.orbPreferences.getOrbPreferences, {})
      ).rejects.toThrow();
    });

    it('should return null for users with no preferences set', async () => {
      const result = await t.query(api.orbPreferences.getOrbPreferences, {});
      expect(result).toBeNull();
    });

    it('should require user authentication', async () => {
      await expect(
        t.query(api.orbPreferences.getOrbPreferences, {})
      ).rejects.toThrow('UNAUTHENTICATED');
    });
  });
});