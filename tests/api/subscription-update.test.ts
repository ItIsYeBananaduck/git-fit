import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../test-utils/server';

describe('PUT /api/coaching/subscription', () => {
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

    it('should update subscription preferences successfully', async () => {
        const updateData = {
            preferredPersona: 'aiden',
            devicePreferences: {
                autoDetectEarbuds: true,
                fallbackToSpeaker: false,
                toastDuration: 3000
            },
            privacySettings: {
                allowDataCollection: true,
                allowAITraining: false,
                dataRetentionDays: 30
            }
        };

        const response = await fetch(`${baseUrl}/api/coaching/subscription`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer valid-test-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.preferredPersona).toBe('aiden');
        expect(data.devicePreferences.toastDuration).toBe(3000);
        expect(data.privacySettings.dataRetentionDays).toBe(30);
    });

    it('should return 400 for invalid persona', async () => {
        const updateData = {
            preferredPersona: 'invalid-persona'
        };

        const response = await fetch(`${baseUrl}/api/coaching/subscription`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer valid-test-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('message');
    });

    it('should return 401 without authentication', async () => {
        const updateData = { preferredPersona: 'alice' };

        const response = await fetch(`${baseUrl}/api/coaching/subscription`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        expect(response.status).toBe(401);
    });
});