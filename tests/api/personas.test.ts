import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createServer } from '../test-utils/server';

describe('GET /api/coaching/personas', () => {
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

    it('should return list of available personas', async () => {
        const response = await fetch(`${baseUrl}/api/coaching/personas`);

        expect(response.status).toBe(200);

        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
        expect(data.length).toBe(2); // Alice and Aiden

        const alice = data.find((p: any) => p.id === 'alice');
        expect(alice).toBeDefined();
        expect(alice).toHaveProperty('name');
        expect(alice).toHaveProperty('description');
        expect(alice).toHaveProperty('voicePreview');
        expect(alice).toHaveProperty('personalityTraits');

        const aiden = data.find((p: any) => p.id === 'aiden');
        expect(aiden).toBeDefined();
        expect(aiden).toHaveProperty('name');
        expect(aiden).toHaveProperty('description');
        expect(aiden).toHaveProperty('voicePreview');
        expect(aiden).toHaveProperty('personalityTraits');
    });

    it('should return personas with valid personality traits', async () => {
        const response = await fetch(`${baseUrl}/api/coaching/personas`);
        const personas = await response.json();

        personas.forEach((persona: any) => {
            expect(persona.personalityTraits).toHaveProperty('enthusiasm');
            expect(persona.personalityTraits).toHaveProperty('supportiveness');
            expect(persona.personalityTraits).toHaveProperty('directness');

            expect(persona.personalityTraits.enthusiasm).toBeGreaterThanOrEqual(0);
            expect(persona.personalityTraits.enthusiasm).toBeLessThanOrEqual(1);
            expect(persona.personalityTraits.supportiveness).toBeGreaterThanOrEqual(0);
            expect(persona.personalityTraits.supportiveness).toBeLessThanOrEqual(1);
            expect(persona.personalityTraits.directness).toBeGreaterThanOrEqual(0);
            expect(persona.personalityTraits.directness).toBeLessThanOrEqual(1);
        });
    });

    it('should return valid voice preview URLs', async () => {
        const response = await fetch(`${baseUrl}/api/coaching/personas`);
        const personas = await response.json();

        personas.forEach((persona: any) => {
            expect(persona.voicePreview).toMatch(/^\/audio\/.*\.(mp3|wav)$/);
        });
    });

    it('should respond quickly', async () => {
        const startTime = Date.now();

        const response = await fetch(`${baseUrl}/api/coaching/personas`);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(response.status).toBe(200);
        expect(responseTime).toBeLessThan(100); // Should be very fast for static data
    });
});