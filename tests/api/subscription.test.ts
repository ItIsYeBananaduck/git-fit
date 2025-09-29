import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../test-utils/server';

describe('GET /api/coaching/subscription', () => {
    let server: any;
    let baseUrl: string;

    beforeAll(async () => {
        const testServer = await createServer();
        server = testServer.server;
        baseUrl = testServer.baseUrl;
    });

    afterAll(async () => {
        if (server) {
            await server.close();
        }
    });

    it('should return user subscription details with valid auth', async () => {
        const response = await fetch(`${baseUrl}/api/coaching/subscription`, {
            headers: {
                'Authorization': 'Bearer valid-test-token',
            },
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('userId');
        expect(data).toHaveProperty('subscriptionType');
        expect(data).toHaveProperty('voiceAccess');
        expect(data).toHaveProperty('preferredPersona');
        expect(data).toHaveProperty('devicePreferences');
        expect(data).toHaveProperty('privacySettings');

        expect(['free', 'pro', 'trainer']).toContain(data.subscriptionType);
        expect(['alice', 'aiden']).toContain(data.preferredPersona);
        expect(typeof data.voiceAccess).toBe('boolean');
    });

    it('should return 401 without authentication', async () => {
        const response = await fetch(`${baseUrl}/api/coaching/subscription`);

        expect(response.status).toBe(401);

        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('message');
    });

    it('should return device preferences with valid structure', async () => {
        const response = await fetch(`${baseUrl}/api/coaching/subscription`, {
            headers: {
                'Authorization': 'Bearer valid-test-token',
            },
        });

        const data = await response.json();

        expect(data.devicePreferences).toHaveProperty('autoDetectEarbuds');
        expect(data.devicePreferences).toHaveProperty('fallbackToSpeaker');
        expect(data.devicePreferences).toHaveProperty('toastDuration');

        expect(typeof data.devicePreferences.autoDetectEarbuds).toBe('boolean');
        expect(typeof data.devicePreferences.fallbackToSpeaker).toBe('boolean');
        expect(data.devicePreferences.toastDuration).toBeGreaterThanOrEqual(1000);
        expect(data.devicePreferences.toastDuration).toBeLessThanOrEqual(10000);
    });

    it('should return privacy settings with GDPR compliance', async () => {
        const response = await fetch(`${baseUrl}/api/coaching/subscription`, {
            headers: {
                'Authorization': 'Bearer valid-test-token',
            },
        });

        const data = await response.json();

        expect(data.privacySettings).toHaveProperty('allowDataCollection');
        expect(data.privacySettings).toHaveProperty('allowAITraining');
        expect(data.privacySettings).toHaveProperty('dataRetentionDays');

        expect(typeof data.privacySettings.allowDataCollection).toBe('boolean');
        expect(typeof data.privacySettings.allowAITraining).toBe('boolean');
        expect(data.privacySettings.dataRetentionDays).toBeGreaterThanOrEqual(1);
        expect(data.privacySettings.dataRetentionDays).toBeLessThanOrEqual(180);
    });

    it('should return 401 with invalid token', async () => {
        const response = await fetch(`${baseUrl}/api/coaching/subscription`, {
            headers: {
                'Authorization': 'Bearer invalid-token',
            },
        });

        expect(response.status).toBe(401);
    });
});