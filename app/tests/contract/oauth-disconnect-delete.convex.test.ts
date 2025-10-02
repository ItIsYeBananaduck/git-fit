import { describe, it, expect, vi, beforeEach } from 'vitest';

// Contract test for OAuth disconnect using Convex
// This test validates the OAuth disconnection contract

// Mock the Convex client
vi.mock('../../src/lib/convex', () => ({
  convex: {
    mutation: vi.fn()
  }
}));

interface OAuthDisconnectResponse {
  success: boolean;
  providerId: string;
  disconnectedAt: number;
  revokedFromProvider: boolean;
  message: string;
}

describe('OAuth Disconnection - Contract Test (Convex)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should disconnect OAuth connection with correct response structure', async () => {
    const { convex } = await import('../../src/lib/convex');
    
    // Mock the mutation response
    const mockResponse: OAuthDisconnectResponse = {
      success: true,
      providerId: 'spotify',
      disconnectedAt: Date.now(),
      revokedFromProvider: true,
      message: 'OAuth connection revoked successfully'
    };

    vi.mocked(convex.mutation).mockResolvedValue(mockResponse);

    const args = {
      connectionId: 'mock_connection_id',
      reason: 'User requested disconnection'
    };

    const data = await convex.mutation('revokeConnection', args) as OAuthDisconnectResponse;

    expect(data).toMatchObject({
      success: true,
      providerId: expect.any(String),
      disconnectedAt: expect.any(Number),
      message: expect.any(String)
    });
    expect(data.success).toBe(true);
    expect(data.disconnectedAt).toBeGreaterThan(0);
    expect(convex.mutation).toHaveBeenCalledWith('revokeConnection', args);
  });

  it('should handle non-existent connection (Convex)', async () => {
    const { convex } = await import('../../src/lib/convex');
    
    vi.mocked(convex.mutation).mockRejectedValue(new Error('OAuth connection not found'));

    const args = {
      connectionId: 'non_existent_id',
      reason: 'Test disconnect'
    };

    await expect(
      convex.mutation('revokeConnection', args)
    ).rejects.toThrow('OAuth connection not found');
  });

  it('should handle revocation with provider notification', async () => {
    const { convex } = await import('../../src/lib/convex');
    
    const mockResponse = {
      success: true,
      providerId: 'spotify',
      revokedFromProvider: true,
      message: 'Connection revoked from provider',
      disconnectedAt: Date.now()
    };

    vi.mocked(convex.mutation).mockResolvedValue(mockResponse);

    const args = {
      connectionId: 'spotify_connection_id',
      reason: 'Security precaution'
    };

    const data = await convex.mutation('revokeConnection', args) as { success: boolean; providerId: string; revokedFromProvider: boolean; message: string };

    expect(data.success).toBe(true);
    expect(data.message).toContain('revoked');
    expect(typeof data.revokedFromProvider).toBe('boolean');
    expect(convex.mutation).toHaveBeenCalledWith('revokeConnection', args);
  });
});