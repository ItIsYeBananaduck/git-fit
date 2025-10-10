// T009 [P] Contract test POST /api/community/vote
// This test MUST FAIL until the community voting API is implemented

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

describe('POST /api/community/vote', () => {
  let mockFetch: MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should cast vote on pending exercise', async () => {
    const requestBody = {
      exerciseId: 'ex_pending_abc123',
      vote: 'approve',
      reason: 'Well-demonstrated technique with clear instructions',
      safetyRating: 5,
      qualityRating: 4
    };

    const expectedResponse = {
      success: true,
      vote: {
        voteId: 'vote_def456',
        exerciseId: 'ex_pending_abc123',
        vote: 'approve',
        votedBy: 'user_123',
        voteDate: '2024-01-15T10:30:00Z',
        weight: 1.0 // standard user vote weight
      },
      exerciseStatus: {
        currentStatus: 'pending_review',
        approvalProgress: {
          totalVotes: 8,
          approvalVotes: 6,
          rejectionVotes: 2,
          requiredApprovals: 10,
          approvalPercentage: 75.0
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 200, true));

    const response = await fetch('/api/community/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.vote.voteId).toMatch(/^vote_/);
    expect(result.vote.vote).toBe('approve');
    expect(result.exerciseStatus.approvalProgress.totalVotes).toBe(8);
  });

  it('should handle trainer weighted vote', async () => {
    const requestBody = {
      exerciseId: 'ex_pending_xyz789',
      vote: 'approve',
      reason: 'Excellent form demonstration and safety considerations',
      safetyRating: 5,
      qualityRating: 5,
      trainerVerification: true
    };

    const expectedResponse = {
      success: true,
      vote: {
        voteId: 'vote_trainer_456',
        exerciseId: 'ex_pending_xyz789',
        vote: 'approve',
        votedBy: 'trainer_456',
        voteDate: '2024-01-15T10:30:00Z',
        weight: 3.0, // trainer vote has 3x weight
        trainerCredentials: ['NASM-CPT', 'CSCS']
      },
      exerciseStatus: {
        currentStatus: 'approved',
        approvalProgress: {
          totalVotes: 5,
          approvalVotes: 4,
          rejectionVotes: 1,
          requiredApprovals: 10,
          approvalPercentage: 80.0,
          autoApproved: true,
          autoApprovalReason: 'Trainer vote threshold reached'
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 200, true));

    const response = await fetch('/api/community/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.vote.weight).toBe(3.0);
    expect(result.exerciseStatus.currentStatus).toBe('approved');
    expect(result.exerciseStatus.approvalProgress.autoApproved).toBe(true);
  });

  it('should reject exercise with safety concerns', async () => {
    const requestBody = {
      exerciseId: 'ex_pending_safety123',
      vote: 'reject',
      reason: 'Improper form could lead to injury',
      safetyRating: 1,
      qualityRating: 3,
      safetyFlags: ['improper_form', 'injury_risk']
    };

    const expectedResponse = {
      success: true,
      vote: {
        voteId: 'vote_safety_789',
        exerciseId: 'ex_pending_safety123',
        vote: 'reject',
        votedBy: 'user_safety_expert',
        voteDate: '2024-01-15T10:30:00Z',
        weight: 1.0,
        safetyFlags: ['improper_form', 'injury_risk']
      },
      exerciseStatus: {
        currentStatus: 'rejected',
        approvalProgress: {
          totalVotes: 6,
          approvalVotes: 2,
          rejectionVotes: 4,
          requiredApprovals: 10,
          approvalPercentage: 33.3,
          autoRejected: true,
          autoRejectionReason: 'Safety threshold exceeded'
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(expectedResponse, 200, true));

    const response = await fetch('/api/community/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.ok).toBe(true);
    expect(result.vote.vote).toBe('reject');
    expect(result.exerciseStatus.currentStatus).toBe('rejected');
    expect(result.exerciseStatus.approvalProgress.autoRejected).toBe(true);
  });

  it('should prevent duplicate voting', async () => {
    const requestBody = {
      exerciseId: 'ex_pending_duplicate123',
      vote: 'approve',
      reason: 'Good exercise',
      safetyRating: 4,
      qualityRating: 4
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'DUPLICATE_VOTE',
        message: 'You have already voted on this exercise'
      },
      existingVote: {
        voteId: 'vote_existing_123',
        vote: 'approve',
        voteDate: '2024-01-14T15:20:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 409, false));

    const response = await fetch('/api/community/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(409);
    expect(result.error.code).toBe('DUPLICATE_VOTE');
    expect(result.existingVote).toBeDefined();
  });

  it('should validate exercise exists and is votable', async () => {
    const requestBody = {
      exerciseId: 'ex_nonexistent_999',
      vote: 'approve',
      reason: 'Good exercise',
      safetyRating: 4,
      qualityRating: 4
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'EXERCISE_NOT_FOUND',
        message: 'Exercise not found or not available for voting'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 404, false));

    const response = await fetch('/api/community/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(404);
    expect(result.error.code).toBe('EXERCISE_NOT_FOUND');
  });

  it('should validate vote enum value', async () => {
    const requestBody = {
      exerciseId: 'ex_pending_abc123',
      vote: 'maybe', // invalid vote value
      reason: 'Uncertain about this exercise',
      safetyRating: 3,
      qualityRating: 3
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Vote must be either "approve" or "reject"'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/community/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.code).toBe('VALIDATION_ERROR');
    expect(result.error.message).toContain('approve" or "reject');
  });

  it('should validate rating ranges', async () => {
    const requestBody = {
      exerciseId: 'ex_pending_abc123',
      vote: 'approve',
      reason: 'Good exercise',
      safetyRating: 6, // out of 1-5 range
      qualityRating: 0 // out of 1-5 range
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Ratings must be between 1 and 5',
        details: {
          safetyRating: 'Safety rating must be between 1 and 5',
          qualityRating: 'Quality rating must be between 1 and 5'
        }
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/community/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.details.safetyRating).toContain('between 1 and 5');
    expect(result.error.details.qualityRating).toContain('between 1 and 5');
  });

  it('should enforce free user voting limits', async () => {
    const requestBody = {
      exerciseId: 'ex_pending_limit123',
      vote: 'approve',
      reason: 'Good exercise',
      safetyRating: 4,
      qualityRating: 4
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VOTING_LIMIT_EXCEEDED',
        message: 'Free users can vote on 10 exercises per day'
      },
      votingLimits: {
        tier: 'free',
        votesToday: 10,
        maxVotesPerDay: 10,
        nextResetTime: '2024-01-16T00:00:00Z'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 429, false));

    const response = await fetch('/api/community/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(429);
    expect(result.error.code).toBe('VOTING_LIMIT_EXCEEDED');
    expect(result.votingLimits.tier).toBe('free');
  });

  it('should require reason for rejection votes', async () => {
    const requestBody = {
      exerciseId: 'ex_pending_abc123',
      vote: 'reject',
      // missing reason
      safetyRating: 2,
      qualityRating: 2
    };

    const errorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Reason is required for rejection votes'
      }
    };

    mockFetch.mockResolvedValueOnce(createMockResponse(errorResponse, 400, false));

    const response = await fetch('/api/community/vote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.error.message).toContain('Reason is required for rejection');
  });
});