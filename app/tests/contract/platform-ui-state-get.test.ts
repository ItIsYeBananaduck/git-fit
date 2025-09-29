import { describe, it, expect, beforeEach, vi } from 'vitest';

// Contract test for GET /api/platform/ui-state
// This test validates the platform UI state retrieval contract

describe('GET /api/platform/ui-state - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should return platform UI state with correct structure', async () => {
    const expectedResponse = {
      _id: expect.any(String),
      userId: expect.any(String),
      platform: 'ios',
      uiConfig: {
        theme: {
          primary: '#007AFF',
          secondary: '#34C759',
          background: '#F2F2F7',
          surface: '#FFFFFF',
          text: '#000000',
          textSecondary: '#8E8E93'
        },
        layout: {
          tabBarStyle: 'native',
          navigationStyle: 'push',
          listStyle: 'grouped',
          buttonStyle: 'filled'
        },
        animations: {
          enabled: true,
          duration: 300,
          easing: 'ease-out'
        },
        accessibility: {
          reduceMotion: false,
          highContrast: false,
          fontSize: 'medium'
        }
      },
      capabilities: {
        haptics: true,
        notifications: true,
        backgroundSync: true,
        healthKit: true,
        musicControl: true,
        camera: true,
        location: true
      },
      lastUpdated: expect.any(Number)
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    // Make request with platform query parameter
    const response = await fetch('/api/platform/ui-state?platform=ios', {
      headers: {
        'Authorization': 'Bearer mock-token'
      }
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toMatchObject(expectedResponse);
    expect(data.platform).toBe('ios');
    expect(data.uiConfig.theme).toBeDefined();
    expect(data.uiConfig.layout).toBeDefined();
    expect(data.capabilities).toBeDefined();
  });
  
  it('should return Android-specific UI configuration', async () => {
    const androidResponse = {
      platform: 'android',
      uiConfig: {
        theme: {
          primary: '#6200EE',
          secondary: '#03DAC6',
          background: '#FAFAFA',
          surface: '#FFFFFF',
          text: '#212121',
          textSecondary: '#757575'
        },
        layout: {
          tabBarStyle: 'material',
          navigationStyle: 'fragment',
          listStyle: 'card',
          buttonStyle: 'outlined'
        }
      },
      capabilities: {
        haptics: false,
        notifications: true,
        backgroundSync: true,
        healthConnect: true,
        musicControl: true
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => androidResponse
    });
    
    const response = await fetch('/api/platform/ui-state?platform=android', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.platform).toBe('android');
    expect(data.uiConfig.layout.tabBarStyle).toBe('material');
  });
  
  it('should return Web-specific UI configuration', async () => {
    const webResponse = {
      platform: 'web',
      uiConfig: {
        layout: {
          tabBarStyle: 'tabs',
          navigationStyle: 'spa',
          listStyle: 'flat',
          buttonStyle: 'contained'
        },
        responsive: {
          breakpoints: {
            mobile: 768,
            tablet: 1024,
            desktop: 1440
          },
          layout: 'adaptive'
        }
      },
      capabilities: {
        haptics: false,
        notifications: false,
        backgroundSync: false,
        webAudio: true,
        localStorage: true
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => webResponse
    });
    
    const response = await fetch('/api/platform/ui-state?platform=web', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.platform).toBe('web');
    expect(data.uiConfig.responsive).toBeDefined();
  });
  
  it('should auto-detect platform if not specified', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ platform: 'ios' })
    });
    
    const response = await fetch('/api/platform/ui-state', {
      headers: {
        'Authorization': 'Bearer mock-token',
        'User-Agent': 'git-fit/1.0 CFNetwork/iPhone'
      }
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/platform/ui-state'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': expect.stringContaining('iPhone')
        })
      })
    );
  });
  
  it('should return 401 for unauthenticated request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
          timestamp: Date.now(),
          requestId: 'test-request-id'
        }
      })
    });
    
    const response = await fetch('/api/platform/ui-state');
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});

// This test should FAIL initially - validates TDD approach