// T010 [P] Contract test POST /api/community/posts
// This test MUST FAIL until the community posts API is implemented

import { describe, it, expect, beforeEach, vi, MockedFunction } from 'vitest';

// Helper to create mock Response
const createMockResponse = (data: unknown, status = 200, ok = true): Response => {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Error',
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    body: null,
    bodyUsed: false,
    clone: vi.fn(),
    arrayBuffer: vi.fn(),
    blob: vi.fn(),
    formData: vi.fn(),
    text: vi.fn(),
    bytes: vi.fn(),
    json: vi.fn().mockResolvedValue(data)
  } as Response;
};

describe('POST /api/community/posts', () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should create team feed post successfully', async () => {
    const formData = new FormData();
    formData.append('content', 'Just completed my 30-day fitness streak! Feeling amazing 💪');
    formData.append('type', 'streak_celebration');
    formData.append('streakData', JSON.stringify({
      streakType: 'daily_workout',
      currentStreak: 30,
      category: 'strength'
    }));
    formData.append('image', new Blob(['fake image'], { type: 'image/jpeg' }));

    const expectedResponse = {
      success: true,
      post: {
        postId: 'post_abc123',
        userId: 'user_123',
        content: 'Just completed my 30-day fitness streak! Feeling amazing 💪',
        type: 'streak_celebration',
        streakData: {
          streakType: 'daily_workout',
          currentStreak: 30,
          category: 'strength'
        },
        imageUrl: 'https://storage.gitfit.com/posts/abc123.jpg',
        createdAt: '2024-01-15T10:30:00Z',
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 201, true));

    const response = await fetch('/api/community/posts', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.post.postId).toMatch(/^post_/);
    expect(result.post.type).toBe('streak_celebration');
    expect(result.post.streakData.currentStreak).toBe(30);
  });

  it('should create workout completion post', async () => {
    const formData = new FormData();
    formData.append('content', 'Crushed this HIIT session! Alice was glowing the whole time ✨');
    formData.append('type', 'workout_completion');
    formData.append('workoutData', JSON.stringify({
      exerciseId: 'ex_hiit_123',
      duration: 1800,
      caloriesBurned: 320,
      adaptiveScore: 8.5
    }));

    const expectedResponse = {
      success: true,
      post: {
        postId: 'post_workout_456',
        userId: 'user_456',
        content: 'Crushed this HIIT session! Alice was glowing the whole time ✨',
        type: 'workout_completion',
        workoutData: {
          exerciseId: 'ex_hiit_123',
          exerciseName: 'HIIT Cardio Blast',
          duration: 1800,
          caloriesBurned: 320,
          adaptiveScore: 8.5
        },
        createdAt: '2024-01-15T11:00:00Z',
        engagement: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 201, true));

    const response = await fetch('/api/community/posts', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.post.type).toBe('workout_completion');
    expect(result.post.workoutData.adaptiveScore).toBe(8.5);
  });

  it('should enforce free user post limits', async () => {
    const formData = new FormData();
    formData.append('content', 'Another post attempt');
    formData.append('type', 'general');

    const errorResponse = {
      success: false,
      error: {
        code: 'POST_LIMIT_EXCEEDED',
        message: 'Free users can post 5 times per day'
      },
      limits: {
        tier: 'free',
        postsToday: 5,
        maxPostsPerDay: 5,
        nextResetTime: '2024-01-16T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 429, false));

    const response = await fetch('/api/community/posts', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(429);
    expect(result.error.code).toBe('POST_LIMIT_EXCEEDED');
    expect(result.limits.tier).toBe('free');
  });

  it('should validate content length', async () => {
    const formData = new FormData();
    formData.append('content', ''); // empty content
    formData.append('type', 'general');

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Post content must be 10-500 characters'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/community/posts', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.message).toContain('10-500 characters');
  });

  it('should validate post type', async () => {
    const formData = new FormData();
    formData.append('content', 'Valid content length here');
    formData.append('type', 'invalid_type');

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Post type must be: general, streak_celebration, workout_completion, achievement, motivation'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/community/posts', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.message).toContain('Post type must be');
  });
});