import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../test-utils/server';

describe('POST /api/coaching/trigger', () => {
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

    it('should trigger AI coaching response with valid request', async () => {
        const request = {
            triggerId: 'pre-start',
            userId: 'test-user-001',
            personaId: 'alice',
            workoutContext: {
                exercise: 'Squats',
                reps: 10,
                weight: 135
            },
            deviceState: {
                hasEarbuds: false,
                audioEnabled: true
            }
        };

        const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('responseId');
        expect(data).toHaveProperty('text');
        expect(data).toHaveProperty('toastMessage');
        expect(data).toHaveProperty('hasAudio');
        expect(data.text.length).toBeLessThanOrEqual(200);
        expect(data.toastMessage.length).toBeLessThanOrEqual(50);
        expect(data.hasAudio).toBe(false); // No earbuds detected
    });

    it('should generate audio when earbuds detected', async () => {
        const request = {
            triggerId: 'set-end',
            userId: 'test-user-002',
            personaId: 'aiden',
            workoutContext: {
                exercise: 'Deadlifts',
                reps: 8,
                weight: 225,
                strain: 85
            },
            deviceState: {
                hasEarbuds: true,
                audioEnabled: true
            }
        };

        const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data.hasAudio).toBe(true);
        expect(data).toHaveProperty('audioUrl');
        expect(data.audioUrl).toMatch(/^\/audio_cache\/[a-f0-9]+\.mp3$/);
    });

    it('should return 400 for invalid trigger ID', async () => {
        const request = {
            triggerId: 'invalid-trigger',
            userId: 'test-user-003',
            workoutContext: {},
            deviceState: { hasEarbuds: false, audioEnabled: true }
        };

        const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(request),
        });

        expect(response.status).toBe(400);

        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('message');
    });

    it('should return 429 when rate limited', async () => {
        const request = {
            triggerId: 'onboarding',
            userId: 'test-user-rate-limit',
            workoutContext: {},
            deviceState: { hasEarbuds: false, audioEnabled: true }
        };

        // Make 60 rapid requests to trigger rate limit
        const promises = Array.from({ length: 60 }, () =>
            fetch(`${baseUrl}/api/coaching/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request),
            })
        );

        const responses = await Promise.all(promises);
        const rateLimitedResponses = responses.filter(r => r.status === 429);

        expect(rateLimitedResponses.length).toBeGreaterThan(0);

        const rateLimitResponse = await rateLimitedResponses[0].json();
        expect(rateLimitResponse).toHaveProperty('error', 'rate_limit_exceeded');
        expect(rateLimitResponse).toHaveProperty('retryAfter');
    });

    it('should respond within 500ms', async () => {
        const request = {
            triggerId: 'workout-end',
            userId: 'test-user-performance',
            personaId: 'alice',
            workoutContext: { exercise: 'Push-ups', reps: 20 },
            deviceState: { hasEarbuds: false, audioEnabled: true }
        };

        const startTime = Date.now();

        const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
        });

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(500);
    });
});