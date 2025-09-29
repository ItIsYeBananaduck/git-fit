import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../test-utils/server';

describe('GET /api/coaching/audio/{responseId}', () => {
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

    it('should return audio file for valid responseId', async () => {
        const responseId = 'test-response-with-audio-123';

        const response = await fetch(`${baseUrl}/api/coaching/audio/${responseId}`, {
            headers: {
                'Authorization': 'Bearer valid-test-token',
            },
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('content-type')).toBe('audio/mpeg');

        const audioData = await response.arrayBuffer();
        expect(audioData.byteLength).toBeGreaterThan(0);
    });

    it('should return 404 for non-existent responseId', async () => {
        const responseId = 'non-existent-response-123';

        const response = await fetch(`${baseUrl}/api/coaching/audio/${responseId}`, {
            headers: {
                'Authorization': 'Bearer valid-test-token',
            },
        });

        expect(response.status).toBe(404);

        const data = await response.json();
        expect(data).toHaveProperty('error');
        expect(data).toHaveProperty('message');
    });

    it('should return 401 without authentication', async () => {
        const responseId = 'test-response-with-audio-123';

        const response = await fetch(`${baseUrl}/api/coaching/audio/${responseId}`);

        expect(response.status).toBe(401);
    });
});