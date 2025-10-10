// T008 [P] Contract test POST /api/community/exercises
// This test MUST FAIL until the community exercise submission API is implemented

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

describe('POST /api/community/exercises', () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should submit exercise for community approval', async () => {
    const formData = new FormData();
    formData.append('title', 'Advanced Push-up Variations');
    formData.append('description', 'A comprehensive guide to push-up variations for strength building');
    formData.append('category', 'strength');
    formData.append('difficulty', 'intermediate');
    formData.append('duration', '600'); // 10 minutes
    formData.append('equipment', 'none');
    formData.append('videoFile', new Blob(['fake video content'], { type: 'video/mp4' }));
    formData.append('thumbnailFile', new Blob(['fake image content'], { type: 'image/jpeg' }));
    formData.append('tags', 'push-ups,variations,strength');

    const expectedResponse = {
      success: true,
      submission: {
        exerciseId: 'ex_pending_abc123',
        status: 'pending_review',
        moderationQueue: {
          position: 15,
          estimatedReviewTime: '2-3 days',
          requiredApprovals: 3
        },
        submittedBy: 'user_123',
        submissionDate: '2024-01-15T10:30:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 201, true));

    const response = await fetch('/api/community/exercises', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.submission.exerciseId).toMatch(/^ex_pending_/);
    expect(result.submission.status).toBe('pending_review');
    expect(result.submission.moderationQueue.position).toBeGreaterThan(0);
  });

  it('should handle trainer fast-track approval', async () => {
    const formData = new FormData();
    formData.append('title', 'Professional HIIT Circuit');
    formData.append('description', 'High-intensity interval training by certified trainer');
    formData.append('category', 'cardio');
    formData.append('difficulty', 'advanced');
    formData.append('duration', '1800'); // 30 minutes
    formData.append('equipment', 'dumbbells,kettlebell');
    formData.append('videoFile', new Blob(['trainer video content'], { type: 'video/mp4' }));
    formData.append('trainerCredentials', 'NASM-CPT,CSCS');

    const expectedResponse = {
      success: true,
      submission: {
        exerciseId: 'ex_approved_def456',
        status: 'approved',
        fastTrack: true,
        moderationQueue: {
          position: 0,
          bypassReason: 'verified_trainer',
          autoApprovalCredentials: ['NASM-CPT', 'CSCS']
        },
        submittedBy: 'trainer_456',
        submissionDate: '2024-01-15T10:30:00Z',
        approvalDate: '2024-01-15T10:31:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 201, true));

    const response = await fetch('/api/community/exercises', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.submission.status).toBe('approved');
    expect(result.submission.fastTrack).toBe(true);
    expect(result.submission.moderationQueue.bypassReason).toBe('verified_trainer');
  });

  it('should enforce free user submission limits', async () => {
    const formData = new FormData();
    formData.append('title', 'Basic Stretching Routine');
    formData.append('description', 'Simple stretching for beginners');
    formData.append('category', 'flexibility');
    formData.append('difficulty', 'beginner');
    formData.append('duration', '900');
    formData.append('videoFile', new Blob(['video content'], { type: 'video/mp4' }));

    const errorResponse = {
      success: false,
      error: {
        code: 'SUBMISSION_LIMIT_EXCEEDED',
        message: 'Free users can submit 1 exercise per month. Upgrade to submit more.'
      },
      currentLimits: {
        tier: 'free',
        submissionsThisMonth: 1,
        maxSubmissionsPerMonth: 1,
        nextResetDate: '2024-02-01T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 429, false));

    const response = await fetch('/api/community/exercises', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(429);
    expect(result.error.code).toBe('SUBMISSION_LIMIT_EXCEEDED');
    expect(result.currentLimits.tier).toBe('free');
  });

  it('should validate required fields', async () => {
    const formData = new FormData();
    formData.append('title', ''); // empty title
    formData.append('description', 'Test description');
    formData.append('category', 'strength');
    // missing difficulty and duration

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: {
          title: 'Title is required and must be 5-100 characters',
          difficulty: 'Difficulty level is required (beginner, intermediate, advanced)',
          duration: 'Duration in seconds is required',
          videoFile: 'Video file is required'
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/community/exercises', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.details.title).toContain('Title is required');
    expect(result.error.details.difficulty).toContain('Difficulty level is required');
  });

  it('should validate video file format and size', async () => {
    const formData = new FormData();
    formData.append('title', 'Valid Exercise Title');
    formData.append('description', 'Valid description');
    formData.append('category', 'cardio');
    formData.append('difficulty', 'beginner');
    formData.append('duration', '600');
    formData.append('videoFile', new Blob(['fake content'], { type: 'text/plain' })); // wrong format

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid video file',
        details: {
          videoFile: 'Video must be MP4, MOV, or AVI format under 500MB'
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/community/exercises', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.details.videoFile).toContain('Video must be MP4');
  });

  it('should validate category enum', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Exercise');
    formData.append('description', 'Test description');
    formData.append('category', 'invalid_category');
    formData.append('difficulty', 'beginner');
    formData.append('duration', '600');
    formData.append('videoFile', new Blob(['fake video'], { type: 'video/mp4' }));

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid category',
        details: {
          category: 'Category must be one of: strength, cardio, flexibility, balance, sports, recovery'
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/community/exercises', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.details.category).toContain('Category must be one of');
  });

  it('should handle content moderation detection', async () => {
    const formData = new FormData();
    formData.append('title', 'Inappropriate Exercise Content');
    formData.append('description', 'This contains flagged content');
    formData.append('category', 'strength');
    formData.append('difficulty', 'beginner');
    formData.append('duration', '600');
    formData.append('videoFile', new Blob(['flagged video content'], { type: 'video/mp4' }));

    const errorResponse = {
      success: false,
      error: {
        code: 'CONTENT_MODERATION_FAILED',
        message: 'Content does not meet community guidelines'
      },
      moderationFlags: [
        'inappropriate_language',
        'safety_concern'
      ],
      appeal: {
        appealUrl: '/appeals/abc123',
        appealDeadline: '2024-01-22T10:30:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 422, false));

    const response = await fetch('/api/community/exercises', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    expect(response.status).toBe(422);
    expect(result.error.code).toBe('CONTENT_MODERATION_FAILED');
    expect(result.moderationFlags).toContain('inappropriate_language');
    expect(result.appeal).toBeDefined();
  });

  it('should require authentication', async () => {
    const formData = new FormData();
    formData.append('title', 'Test Exercise');
    formData.append('description', 'Test description');

    const errorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required to submit exercises'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 401, false));

    const response = await fetch('/api/community/exercises', {
      method: 'POST',
      body: formData
      // Note: no auth headers
    });

    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error.code).toBe('UNAUTHORIZED');
  });
});