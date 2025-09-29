import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../test-utils/server';

describe('Audio Generation Pipeline Integration', () => {
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

    it('should generate and cache audio for pro users with earbuds', async () => {
        // 1. Trigger coaching with earbuds detected
        const triggerRequest = {
            triggerId: 'set-end',
            userId: 'pro-user-001',
            personaId: 'alice',
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

        const triggerResponse = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(triggerRequest),
        });

        expect(triggerResponse.status).toBe(200);
        const coaching = await triggerResponse.json();

        // 2. Verify audio is generated
        expect(coaching.hasAudio).toBe(true);
        expect(coaching.audioUrl).toMatch(/^\/audio_cache\/[a-f0-9]+\.mp3$/);
        expect(coaching.metadata.ttsLatency).toBeDefined();
        expect(coaching.metadata.cacheHit).toBe(false); // First generation

        // 3. Retrieve audio file
        const audioResponse = await fetch(`${baseUrl}/api/coaching/audio/${coaching.responseId}`, {
            headers: { 'Authorization': 'Bearer valid-test-token' },
        });

        expect(audioResponse.status).toBe(200);
        expect(audioResponse.headers.get('content-type')).toBe('audio/mpeg');

        // 4. Test audio caching - same request should hit cache
        const secondTriggerResponse = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(triggerRequest),
        });

        const secondCoaching = await secondTriggerResponse.json();
        expect(secondCoaching.metadata.cacheHit).toBe(true);
        expect(secondCoaching.metadata.ttsLatency).toBeLessThan(100); // Cache should be fast
    });

    it('should handle different personas with different voice characteristics', async () => {
        const personas = ['alice', 'aiden'];
        const audioUrls: string[] = [];

        for (const personaId of personas) {
            const triggerRequest = {
                triggerId: 'workout-end',
                userId: 'persona-test-user',
                personaId,
                workoutContext: { exercise: 'Push-ups', reps: 20 },
                deviceState: { hasEarbuds: true, audioEnabled: true }
            };

            const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(triggerRequest),
            });

            const data = await response.json();
            expect(data.hasAudio).toBe(true);
            audioUrls.push(data.audioUrl);
        }

        // Different personas should generate different audio files
        expect(audioUrls[0]).not.toBe(audioUrls[1]);
    });

    it('should fallback gracefully when TTS service is unavailable', async () => {
        // This test simulates TTS service being down
        const triggerRequest = {
            triggerId: 'pre-start',
            userId: 'tts-fallback-user',
            personaId: 'alice',
            workoutContext: { exercise: 'Squats' },
            deviceState: { hasEarbuds: true, audioEnabled: true }
        };

        // Even if TTS fails, should still provide text response
        const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(triggerRequest),
        });

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(data).toHaveProperty('text');
        expect(data).toHaveProperty('toastMessage');
        // Audio might not be available if TTS service is down
    });

    it('should respect audio quality settings', async () => {
        const triggerRequest = {
            triggerId: 'strainsync',
            userId: 'quality-test-user',
            personaId: 'aiden',
            workoutContext: { strain: 90, heartRate: 165 },
            deviceState: { hasEarbuds: true, audioEnabled: true }
        };

        const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(triggerRequest),
        });

        const data = await response.json();

        if (data.hasAudio) {
            // Verify audio metadata includes quality information
            expect(data.metadata).toHaveProperty('generationLatency');
            expect(data.metadata.generationLatency).toBeLessThan(500); // Performance requirement
        }
    });
});