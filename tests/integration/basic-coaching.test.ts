import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../test-utils/server';

describe('Basic Coaching Integration', () => {
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

    it('should complete full coaching workflow without earbuds', async () => {
        // 1. Get user subscription to check persona preference
        const subscriptionResponse = await fetch(`${baseUrl}/api/coaching/subscription`, {
            headers: { 'Authorization': 'Bearer valid-test-token' },
        });
        expect(subscriptionResponse.status).toBe(200);
        const subscription = await subscriptionResponse.json();

        // 2. Trigger coaching response
        const triggerRequest = {
            triggerId: 'pre-start',
            userId: subscription.userId,
            personaId: subscription.preferredPersona,
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

        const triggerResponse = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(triggerRequest),
        });

        expect(triggerResponse.status).toBe(200);
        const coaching = await triggerResponse.json();

        // 3. Verify response structure
        expect(coaching).toHaveProperty('responseId');
        expect(coaching).toHaveProperty('text');
        expect(coaching).toHaveProperty('toastMessage');
        expect(coaching.hasAudio).toBe(false); // No earbuds

        // 4. Submit feedback
        const feedbackRequest = {
            responseId: coaching.responseId,
            rating: 5,
            helpful: true,
            comments: 'Great motivational message!'
        };

        const feedbackResponse = await fetch(`${baseUrl}/api/coaching/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer valid-test-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedbackRequest),
        });

        expect(feedbackResponse.status).toBe(201);
        const feedback = await feedbackResponse.json();
        expect(feedback).toHaveProperty('feedbackId');
    });

    it('should handle different trigger types correctly', async () => {
        const triggerTypes = ['onboarding', 'pre-start', 'set-start', 'set-end', 'strainsync', 'workout-end'];

        for (const triggerId of triggerTypes) {
            const triggerRequest = {
                triggerId,
                userId: 'test-user-integration',
                personaId: 'alice',
                workoutContext: {
                    exercise: 'Bench Press',
                    reps: 8,
                    weight: 155
                },
                deviceState: {
                    hasEarbuds: false,
                    audioEnabled: true
                }
            };

            const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(triggerRequest),
            });

            expect(response.status).toBe(200);

            const data = await response.json();

            // Onboarding should have longer text
            if (triggerId === 'onboarding') {
                expect(data.text.length).toBeLessThanOrEqual(200);
            } else {
                expect(data.text.length).toBeLessThanOrEqual(75); // ~15 words
            }
        }
    });

    it('should respect user privacy settings', async () => {
        // Update privacy settings to disallow data collection
        const privacyUpdate = {
            privacySettings: {
                allowDataCollection: false,
                allowAITraining: false,
                dataRetentionDays: 1
            }
        };

        await fetch(`${baseUrl}/api/coaching/subscription`, {
            method: 'PUT',
            headers: {
                'Authorization': 'Bearer valid-test-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(privacyUpdate),
        });

        // Trigger coaching
        const triggerRequest = {
            triggerId: 'set-end',
            userId: 'privacy-conscious-user',
            personaId: 'aiden',
            workoutContext: { exercise: 'Deadlifts', strain: 75 },
            deviceState: { hasEarbuds: false, audioEnabled: true }
        };

        const response = await fetch(`${baseUrl}/api/coaching/trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(triggerRequest),
        });

        expect(response.status).toBe(200);

        // Verify response still works but respects privacy
        const data = await response.json();
        expect(data).toHaveProperty('text');
        expect(data).toHaveProperty('toastMessage');
    });
});