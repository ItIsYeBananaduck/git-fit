// T015 [P] Contract test GET /api/user/export
// This test MUST FAIL until the user data export API is implemented

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

describe('GET /api/user/export', () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should export complete user data', async () => {
    const expectedResponse = {
      success: true,
      exportData: {
        profile: {
          userId: 'user_123',
          email: 'user@example.com',
          createdAt: '2023-06-15T10:30:00Z',
          subscriptionTier: 'member',
          preferences: {
            aliceCustomization: {
              bodyPattern: 'stripes',
              bodyColor: '#FF5722'
            },
            notifications: true,
            privacy: 'public'
          }
        },
        fitnessData: {
          calibrationHistory: [
            {
              calibrationId: 'cal_abc123',
              date: '2024-01-10T10:00:00Z',
              heartRateZones: {
                recovery: { min: 117, max: 137 },
                aerobic: { min: 137, max: 156 }
              }
            }
          ],
          workoutSessions: [
            {
              sessionId: 'session_def456',
              exerciseId: 'ex_push_ups_123',
              date: '2024-01-15T10:30:00Z',
              duration: 1800,
              caloriesBurned: 287,
              adaptiveScore: 8.2
            }
          ],
          heartRateData: {
            totalReadings: 1250,
            dateRange: {
              from: '2024-01-01T00:00:00Z',
              to: '2024-01-15T23:59:59Z'
            },
            note: 'Raw heart rate data available in separate download'
          }
        },
        communityActivity: {
          posts: [
            {
              postId: 'post_abc123',
              content: 'Just completed my 30-day streak!',
              type: 'streak_celebration',
              createdAt: '2024-01-15T10:30:00Z',
              engagement: { likes: 5, comments: 2 }
            }
          ],
          votes: [
            {
              voteId: 'vote_def456',
              exerciseId: 'ex_pending_abc123',
              vote: 'approve',
              reason: 'Good technique demonstration',
              date: '2024-01-14T15:20:00Z'
            }
          ],
          submissions: [
            {
              exerciseId: 'ex_pending_ghi789',
              title: 'Advanced Push-up Variations',
              status: 'approved',
              submissionDate: '2024-01-10T12:00:00Z'
            }
          ]
        },
        purchases: [
          {
            purchaseId: 'pur_abc123',
            videoId: 'vid_premium_abc123',
            videoTitle: 'Advanced Strength Training',
            amount: 29.99,
            purchaseDate: '2024-01-12T14:30:00Z'
          }
        ]
      },
      downloadLinks: {
        completeArchive: 'https://exports.gitfit.com/user_123_complete.zip',
        heartRateData: 'https://exports.gitfit.com/user_123_heartrate.csv',
        workoutHistory: 'https://exports.gitfit.com/user_123_workouts.json',
        expiresAt: '2024-01-22T10:30:00Z'
      },
      gdprCompliance: {
        requestId: 'gdpr_export_789',
        processedAt: '2024-01-15T10:30:00Z',
        dataRetentionPolicy: 'https://gitfit.com/privacy#retention',
        deletionRights: 'https://gitfit.com/privacy#deletion'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 200, true));

    const response = await fetch('/api/user/export', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test_token_123'
      }
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.exportData.profile.userId).toBe('user_123');
    expect(result.exportData.fitnessData.workoutSessions).toHaveLength(1);
    expect(result.downloadLinks.completeArchive).toContain('exports.gitfit.com');
    expect(result.gdprCompliance.requestId).toMatch(/^gdpr_export_/);
  });

  it('should handle export with specific data types', async () => {
    const expectedResponse = {
      success: true,
      exportData: {
        profile: {
          userId: 'user_456',
          email: 'user456@example.com',
          subscriptionTier: 'free'
        },
        fitnessData: {
          workoutSessions: [],
          note: 'No workout data available'
        },
        communityActivity: {
          posts: [],
          votes: [],
          submissions: []
        },
        purchases: []
      },
      downloadLinks: {
        completeArchive: 'https://exports.gitfit.com/user_456_minimal.zip',
        expiresAt: '2024-01-22T10:30:00Z'
      },
      gdprCompliance: {
        requestId: 'gdpr_export_minimal_123',
        processedAt: '2024-01-15T10:30:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 200, true));

    const response = await fetch('/api/user/export?types=profile,community', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test_token_456'
      }
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.exportData.profile).toBeDefined();
    expect(result.exportData.communityActivity).toBeDefined();
    expect(result.exportData.purchases).toEqual([]);
  });

  it('should enforce rate limiting for exports', async () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'EXPORT_RATE_LIMITED',
        message: 'Data exports limited to once per 24 hours'
      },
      lastExport: {
        requestId: 'gdpr_export_previous_456',
        exportDate: '2024-01-14T10:30:00Z',
        nextAllowedExport: '2024-01-15T10:30:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 429, false));

    const response = await fetch('/api/user/export', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test_token_rate_limited'
      }
    });

    const result = await response.json();

    expect(response.status).toBe(429);
    expect(result.error.code).toBe('EXPORT_RATE_LIMITED');
    expect(result.lastExport.nextAllowedExport).toBeDefined();
  });

  it('should require authentication', async () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required for data export'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 401, false));

    const response = await fetch('/api/user/export', {
      method: 'GET'
      // Note: no auth headers
    });

    const result = await response.json();

    expect(response.status).toBe(401);
    expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it('should validate export data types', async () => {
    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data types specified',
        details: {
          validTypes: ['profile', 'fitness', 'community', 'purchases', 'heartrate'],
          invalidTypes: ['invalid_type']
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/user/export?types=profile,invalid_type', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test_token_123'
      }
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.details.validTypes).toContain('profile');
  });
});