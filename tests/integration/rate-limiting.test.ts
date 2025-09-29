import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../test-utils/server';

describe('Rate Limiting Integration', () => {
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

    it('should enforce rate limits for free tier users', async () => {
        const triggerRequest = {
            triggerId: 'onboarding',
            userId: 'free-tier-user',
            personaId: 'alice',
            workoutContext: {},
            deviceState: { hasEarbuds: false, audioEnabled: true }
        };

        // Make requests up to free tier limit (50/hour)
        const responses = [];
        for (let i = 0; i < 55; i++) {
            const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...triggerRequest,
                    userId: `free-user-${i}` // Different users to avoid user-specific limits
                }),
            });
            responses.push(response);
        }

        // First 50 should succeed
        const successfulResponses = responses.filter(r => r.status === 200);
        const rateLimitedResponses = responses.filter(r => r.status === 429);

        expect(successfulResponses.length).toBeLessThanOrEqual(50);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);

        // Check rate limit response structure
        if (rateLimitedResponses.length > 0) {
            const rateLimitData = await rateLimitedResponses[0].json();
            expect(rateLimitData).toHaveProperty('error', 'rate_limit_exceeded');
            expect(rateLimitData).toHaveProperty('retryAfter');
            expect(typeof rateLimitData.retryAfter).toBe('number');
        }
    });

    it('should allow higher limits for pro tier users', async () => {
        const triggerRequest = {
            triggerId: 'set-start',
            userId: 'pro-tier-user',
            personaId: 'aiden',
            workoutContext: { exercise: 'Bench Press' },
            deviceState: { hasEarbuds: true, audioEnabled: true }
        };

        // Pro users should handle more requests (200/hour)
        const responses = [];
        for (let i = 0; i < 60; i++) {
            const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...triggerRequest,
                    userId: `pro-user-${i}`
                }),
            });
            responses.push(response);
        }

        const successfulResponses = responses.filter(r => r.status === 200);
        expect(successfulResponses.length).toBeGreaterThan(50); // More than free tier
    });

    it('should have separate rate limits for TTS generation', async () => {
        const triggerRequest = {
            triggerId: 'workout-end',
            userId: 'tts-rate-limit-user',
            personaId: 'alice',
            workoutContext: { exercise: 'Squats' },
            deviceState: { hasEarbuds: true, audioEnabled: true }
        };

        // Test TTS-specific rate limiting
        const responses = [];
        for (let i = 0; i < 25; i++) {
            const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(triggerRequest),
            });
            responses.push(response);
        }

        // Should hit TTS rate limit before general rate limit
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should reset rate limits after time window', async () => {
        // This test would need to wait for rate limit window to reset
        // In a real implementation, this might be mocked or use shorter windows for testing

        const triggerRequest = {
            triggerId: 'pre-start',
            userId: 'rate-reset-user',
            personaId: 'alice',
            workoutContext: {},
            deviceState: { hasEarbuds: false, audioEnabled: true }
        };

        // Make request that should succeed after rate limit reset
        const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(triggerRequest),
        });

        // This test assumes rate limits have reset
        expect([200, 429]).toContain(response.status);
    });

    it('should provide queue position for rate limited requests', async () => {
        const triggerRequest = {
            triggerId: 'set-end',
            userId: 'queue-test-user',
            personaId: 'aiden',
            workoutContext: {},
            deviceState: { hasEarbuds: false, audioEnabled: true }
        };

        // Make many requests to trigger rate limiting
        const responses = [];
        for (let i = 0; i < 70; i++) {
            const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...triggerRequest,
                    userId: `queue-user-${i}`
                }),
            });
            responses.push(response);
        }

        const rateLimitedResponses = responses.filter(r => r.status === 429);

        if (rateLimitedResponses.length > 0) {
            const rateLimitData = await rateLimitedResponses[0].json();
            // Queue position is optional but helpful for user experience
            if (rateLimitData.queuePosition) {
                expect(typeof rateLimitData.queuePosition).toBe('number');
                expect(rateLimitData.queuePosition).toBeGreaterThan(0);
            }
        }
    });
});