import { describe, it, expect, beforeEach, vi } from 'vitest';

// Contract test for GET /api/platform/capabilities
// This test validates the platform capabilities detection contract

describe('GET /api/platform/capabilities - Contract Test', () => {
  let mockFetch: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
  });
  
  it('should return iOS capabilities with correct structure', async () => {
    const expectedResponse = {
      platform: 'ios',
      version: '17.0',
      model: 'iPhone15,2',
      capabilities: {
        haptics: {
          supported: true,
          types: ['impact', 'notification', 'selection']
        },
        notifications: {
          supported: true,
          types: ['local', 'push', 'provisional']
        },
        backgroundSync: {
          supported: true,
          backgroundAppRefresh: true,
          backgroundProcessing: true
        },
        healthKit: {
          supported: true,
          permissions: ['read', 'write'],
          dataTypes: ['heartRate', 'steps', 'workouts', 'sleepAnalysis']
        },
        musicControl: {
          supported: true,
          mediaPlayer: true,
          nowPlayingInfo: true
        },
        camera: {
          supported: true,
          permissions: 'granted'
        },
        location: {
          supported: true,
          permissions: 'whenInUse',
          accuracy: 'best'
        },
        biometrics: {
          supported: true,
          type: 'faceId',
          enrolled: true
        }
      },
      limitations: [],
      lastChecked: expect.any(Number)
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => expectedResponse
    });
    
    // Make request with iOS user agent
    const response = await fetch('/api/platform/capabilities', {
      headers: {
        'Authorization': 'Bearer mock-token',
        'User-Agent': 'git-fit/1.0 CFNetwork/iPhone OS 17.0'
      }
    });
    
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(response.status).toBe(200);
    expect(data).toMatchObject(expectedResponse);
    expect(data.platform).toBe('ios');
    expect(data.capabilities.haptics.supported).toBe(true);
    expect(data.capabilities.healthKit.supported).toBe(true);
    expect(data.limitations).toBeInstanceOf(Array);
  });
  
  it('should return Android capabilities with correct structure', async () => {
    const androidResponse = {
      platform: 'android',
      version: '14',
      manufacturer: 'Google',
      model: 'Pixel 8',
      capabilities: {
        haptics: {
          supported: false,
          reason: 'Not available on this device'
        },
        notifications: {
          supported: true,
          types: ['local', 'push']
        },
        backgroundSync: {
          supported: true,
          backgroundAppRefresh: false,
          dozeMode: true
        },
        healthConnect: {
          supported: true,
          permissions: ['read'],
          dataTypes: ['steps', 'heartRate', 'sleep']
        },
        musicControl: {
          supported: true,
          mediaSession: true
        },
        biometrics: {
          supported: true,
          type: 'fingerprint',
          enrolled: true
        }
      },
      limitations: [
        'Battery optimization may affect background sync',
        'Some manufacturers limit background app refresh'
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => androidResponse
    });
    
    const response = await fetch('/api/platform/capabilities', {
      headers: {
        'Authorization': 'Bearer mock-token',
        'User-Agent': 'git-fit/1.0 Android/14 Pixel'
      }
    });
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.platform).toBe('android');
    expect(data.capabilities.haptics.supported).toBe(false);
    expect(data.capabilities.healthConnect.supported).toBe(true);
    expect(data.limitations.length).toBeGreaterThan(0);
  });
  
  it('should return Web capabilities with browser detection', async () => {
    const webResponse = {
      platform: 'web',
      browser: {
        name: 'Chrome',
        version: '120.0.0.0',
        engine: 'Blink'
      },
      capabilities: {
        notifications: {
          supported: true,
          permission: 'granted'
        },
        localStorage: {
          supported: true,
          quota: '10MB'
        },
        webAudio: {
          supported: true,
          contexts: ['AudioContext', 'webkitAudioContext']
        },
        mediaSession: {
          supported: true,
          actions: ['play', 'pause', 'seekbackward', 'seekforward']
        },
        geolocation: {
          supported: true,
          permission: 'prompt'
        },
        deviceMotion: {
          supported: false,
          reason: 'Requires HTTPS'
        }
      },
      limitations: [
        'Background sync limited by browser policies',
        'Notification permission required for push notifications'
      ]
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => webResponse
    });
    
    const response = await fetch('/api/platform/capabilities', {
      headers: {
        'Authorization': 'Bearer mock-token',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0'
      }
    });
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.platform).toBe('web');
    expect(data.browser).toBeDefined();
    expect(data.capabilities.webAudio.supported).toBe(true);
    expect(data.capabilities.deviceMotion.supported).toBe(false);
  });
  
  it('should support refresh parameter to re-check capabilities', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ lastChecked: Date.now() })
    });
    
    const response = await fetch('/api/platform/capabilities?refresh=true', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('refresh=true'),
      expect.any(Object)
    );
  });
  
  it('should cache capabilities and return cached version by default', async () => {
    const cachedResponse = {
      platform: 'ios',
      capabilities: {},
      lastChecked: Date.now() - 300000, // 5 minutes ago
      fromCache: true
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => cachedResponse
    });
    
    const response = await fetch('/api/platform/capabilities', {
      headers: { 'Authorization': 'Bearer mock-token' }
    });
    const data = await response.json();
    
    expect(response.ok).toBe(true);
    expect(data.fromCache).toBe(true);
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
    
    const response = await fetch('/api/platform/capabilities');
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data.error.code).toBe('AUTHENTICATION_REQUIRED');
  });
});

// This test should FAIL initially - validates TDD approach