import { build } from 'esbuild';
import { sveltekit } from '@sveltejs/kit/vite';

export async function createServer() {
    // Mock server for testing API endpoints
    // This will be a simplified test server that doesn't implement the actual API
    // but provides the structure for contract testing

    const mockServer = {
        close: async () => { },
        listen: async (port: number) => port,
    };

    return {
        server: mockServer,
        baseUrl: 'http://localhost:3001', // Mock URL
    };
}

export const mockApiResponses = {
    '/api/coaching/trigger': {
        POST: {
            200: {
                responseId: 'test-response-123',
                text: 'Great job on those squats! Keep up the momentum.',
                toastMessage: 'Great job! Keep it up.',
                hasAudio: false,
                metadata: {
                    generationLatency: 150,
                    cacheHit: false,
                    modelVersion: 'gpt2-fine-tuned-v1'
                }
            },
            400: {
                error: 'invalid_trigger',
                message: 'Invalid trigger ID provided'
            },
            429: {
                error: 'rate_limit_exceeded',
                message: 'Rate limit exceeded. Please try again later.',
                retryAfter: 3600
            }
        }
    },
    '/api/coaching/personas': {
        GET: {
            200: [
                {
                    id: 'alice',
                    name: 'Alice',
                    description: 'Enthusiastic and supportive coach',
                    voicePreview: '/audio/alice-preview.mp3',
                    personalityTraits: {
                        enthusiasm: 0.9,
                        supportiveness: 0.8,
                        directness: 0.6
                    }
                },
                {
                    id: 'aiden',
                    name: 'Aiden',
                    description: 'Direct and motivational coach',
                    voicePreview: '/audio/aiden-preview.mp3',
                    personalityTraits: {
                        enthusiasm: 0.7,
                        supportiveness: 0.7,
                        directness: 0.9
                    }
                }
            ]
        }
    }
};

// Helper for mocking fetch in tests
export function mockFetch(url: string, options?: RequestInit) {
    // This is a placeholder - actual implementation would mock the fetch responses
    // For now, these tests will fail as expected since no implementation exists
    return Promise.reject(new Error('No implementation available - test should fail'));
}