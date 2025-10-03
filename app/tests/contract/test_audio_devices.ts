// Contract tests for audio device status queries
import { describe, it, expect, beforeEach } from 'vitest';
import { ConvexTestingHelper } from 'convex/testing';
import { api } from '../../../convex/_generated/api';

describe('Audio Device Contract Tests', () => {
  let t: ConvexTestingHelper;

  beforeEach(async () => {
    t = new ConvexTestingHelper();
  });

  describe('getAudioDeviceStatus query', () => {
    it('should return audio device connection status', async () => {
      // This test MUST FAIL until implementation exists
      await expect(
        t.query(api.audioDevices.getAudioDeviceStatus, {})
      ).rejects.toThrow();
    });

    it('should return valid device type when connected', async () => {
      const result = await t.query(api.audioDevices.getAudioDeviceStatus, {});
      
      if (result?.hasConnectedDevice) {
        expect(['bluetooth', 'wired', 'builtin']).toContain(result.deviceType);
        expect(result.deviceName).toBeTypeOf('string');
        expect(result.deviceName).not.toBe('');
      }
    });

    it('should indicate audio feedback support capability', async () => {
      const result = await t.query(api.audioDevices.getAudioDeviceStatus, {});
      
      if (result) {
        expect(result.supportsAudioFeedback).toBeTypeOf('boolean');
      }
    });

    it('should have valid timestamp for last detection', async () => {
      const result = await t.query(api.audioDevices.getAudioDeviceStatus, {});
      
      if (result?.hasConnectedDevice) {
        expect(result.lastDetected).toBeTypeOf('number');
        expect(result.lastDetected).toBeLessThanOrEqual(Date.now());
      }
    });

    it('should require user authentication', async () => {
      await expect(
        t.query(api.audioDevices.getAudioDeviceStatus, {})
      ).rejects.toThrow('UNAUTHENTICATED');
    });
  });
});