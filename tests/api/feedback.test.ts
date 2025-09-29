import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../test-utils/server';

describe('POST /api/coaching/feedback', () => {
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

    it('should submit feedback successfully', async () => {
        const feedbackData = {
            responseId: 'test-response-123',
            rating: 5,
            helpful: true,
            comments: 'Very motivating and timely advice!'
        };

        const response = await fetch(`${baseUrl}/api/coaching/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer valid-test-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedbackData),
        });

        expect(response.status).toBe(201);

        const data = await response.json();
        expect(data).toHaveProperty('feedbackId');
        expect(data).toHaveProperty('status');
        expect(['received', 'processed']).toContain(data.status);
    });

    it('should return 400 for invalid rating', async () => {
        const feedbackData = {
            responseId: 'test-response-123',
            rating: 6, // Invalid: max is 5
            helpful: true
        };

        const response = await fetch(`${baseUrl}/api/coaching/feedback`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer valid-test-token',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedbackData),
        });

        expect(response.status).toBe(400);
    });

    it('should return 401 without authentication', async () => {
        const feedbackData = {
            responseId: 'test-response-123',
            rating: 4
        };

        const response = await fetch(`${baseUrl}/api/coaching/feedback`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(feedbackData),
        });

        expect(response.status).toBe(401);
    });
});