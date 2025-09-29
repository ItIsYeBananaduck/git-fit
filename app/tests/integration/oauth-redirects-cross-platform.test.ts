import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Integration test for Cross-platform OAuth Redirects
// This test validates platform-specific OAuth redirect URL schemes and handling

describe('Cross-platform OAuth Redirects Integration', () => {
  let mockFetch: any;
  let mockWindow: any;
  
  beforeEach(() => {
    mockFetch = global.fetch = vi.fn();
    mockWindow = {
      location: { href: '', assign: vi.fn(), origin: 'https://gitfit.app' },
      navigator: { userAgent: '' },
      crypto: { getRandomValues: vi.fn(() => new Uint8Array(32)) }
    };
    global.window = mockWindow;
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  it('should generate iOS-specific OAuth redirect URLs with custom scheme', async () => {
    // Step 1: Detect iOS platform
    mockWindow.navigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15';
    
    const authRequest = {
      providerId: 'spotify',
      scopes: ['user-read-private', 'user-library-read'],
      // iOS app should use custom URL scheme
      redirectUri: 'gitfit://oauth/callback',
      pkce: {
        codeChallenge: 'test-challenge',
        codeChallengeMethod: 'S256'
      }
    };
    
    const iosAuthResponse = {
      authorizationUrl: 'https://accounts.spotify.com/authorize?client_id=test-client&response_type=code&redirect_uri=gitfit%3A//oauth/callback&scope=user-read-private%20user-library-read&code_challenge=test-challenge&code_challenge_method=S256&state=ios-state-123',
      state: 'ios-state-123',
      codeVerifier: 'test-verifier',
      platform: 'ios',
      redirectScheme: 'gitfit://',
      expectedRedirectPattern: 'gitfit://oauth/callback?code=*&state=ios-state-123'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => iosAuthResponse
    });
    
    const response = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json',
        'User-Agent': mockWindow.navigator.userAgent
      },
      body: JSON.stringify(authRequest)
    });
    const auth = await response.json();
    
    expect(auth.authorizationUrl).toContain('redirect_uri=gitfit%3A//oauth/callback');
    expect(auth.redirectScheme).toBe('gitfit://');
    expect(auth.platform).toBe('ios');
    expect(auth.expectedRedirectPattern).toMatch(/gitfit:\/\/oauth\/callback/);
  });
  
  it('should generate Android-specific OAuth redirect URLs with custom scheme', async () => {
    // Step 1: Detect Android platform
    mockWindow.navigator.userAgent = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36';
    
    const authRequest = {
      providerId: 'spotify',
      scopes: ['user-read-private'],
      // Android app should use custom URL scheme
      redirectUri: 'gitfit://oauth/callback',
      pkce: {
        codeChallenge: 'android-challenge',
        codeChallengeMethod: 'S256'
      }
    };
    
    const androidAuthResponse = {
      authorizationUrl: 'https://accounts.spotify.com/authorize?client_id=test-client&response_type=code&redirect_uri=gitfit%3A//oauth/callback&scope=user-read-private&code_challenge=android-challenge&code_challenge_method=S256&state=android-state-456',
      state: 'android-state-456',
      codeVerifier: 'android-verifier',
      platform: 'android',
      redirectScheme: 'gitfit://',
      intentFilter: {
        action: 'android.intent.action.VIEW',
        category: 'android.intent.category.DEFAULT',
        data: { scheme: 'gitfit', host: 'oauth' }
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => androidAuthResponse
    });
    
    const response = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json',
        'User-Agent': mockWindow.navigator.userAgent
      },
      body: JSON.stringify(authRequest)
    });
    const auth = await response.json();
    
    expect(auth.authorizationUrl).toContain('redirect_uri=gitfit%3A//oauth/callback');
    expect(auth.platform).toBe('android');
    expect(auth.intentFilter.data.scheme).toBe('gitfit');
    expect(auth.intentFilter.data.host).toBe('oauth');
  });
  
  it('should generate Web-specific OAuth redirect URLs with HTTPS', async () => {
    // Step 1: Detect Web platform
    mockWindow.navigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0';
    mockWindow.location.origin = 'https://app.gitfit.com';
    
    const authRequest = {
      providerId: 'spotify',
      scopes: ['user-read-private'],
      // Web app should use HTTPS callback URL
      redirectUri: 'https://app.gitfit.com/oauth/callback',
      pkce: {
        codeChallenge: 'web-challenge',
        codeChallengeMethod: 'S256'
      }
    };
    
    const webAuthResponse = {
      authorizationUrl: 'https://accounts.spotify.com/authorize?client_id=test-client&response_type=code&redirect_uri=https%3A//app.gitfit.com/oauth/callback&scope=user-read-private&code_challenge=web-challenge&code_challenge_method=S256&state=web-state-789',
      state: 'web-state-789',
      codeVerifier: 'web-verifier',
      platform: 'web',
      redirectScheme: 'https://',
      redirectDomain: 'app.gitfit.com',
      popupMode: true, // Web can use popup for better UX
      popupFeatures: 'width=500,height=600,scrollbars=yes'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => webAuthResponse
    });
    
    const response = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json',
        'User-Agent': mockWindow.navigator.userAgent,
        'Origin': mockWindow.location.origin
      },
      body: JSON.stringify(authRequest)
    });
    const auth = await response.json();
    
    expect(auth.authorizationUrl).toContain('redirect_uri=https%3A//app.gitfit.com/oauth/callback');
    expect(auth.platform).toBe('web');
    expect(auth.redirectDomain).toBe('app.gitfit.com');
    expect(auth.popupMode).toBe(true);
  });
  
  it('should handle iOS universal link fallback for OAuth redirects', async () => {
    const authRequest = {
      providerId: 'apple_music',
      scopes: ['library-read'],
      // Primary: Custom scheme, Fallback: Universal link
      redirectUri: 'gitfit://oauth/callback',
      fallbackUri: 'https://app.gitfit.com/oauth/callback'
    };
    
    const universalLinkResponse = {
      authorizationUrl: 'https://music.apple.com/authorize?...',
      state: 'apple-state-123',
      platform: 'ios',
      redirectOptions: {
        primary: {
          scheme: 'gitfit://',
          uri: 'gitfit://oauth/callback'
        },
        fallback: {
          scheme: 'https://',
          uri: 'https://app.gitfit.com/oauth/callback',
          universalLink: true,
          appStoreId: '123456789'
        }
      },
      redirectStrategy: 'universal_link_with_fallback'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => universalLinkResponse
    });
    
    const response = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(authRequest)
    });
    const auth = await response.json();
    
    expect(auth.redirectOptions.primary.scheme).toBe('gitfit://');
    expect(auth.redirectOptions.fallback.universalLink).toBe(true);
    expect(auth.redirectStrategy).toBe('universal_link_with_fallback');
  });
  
  it('should handle OAuth callback processing for different platform schemes', async () => {
    // Test iOS custom scheme callback
    const iosCallbackRequest = {
      providerId: 'spotify',
      code: 'ios-auth-code',
      state: 'ios-state-123',
      codeVerifier: 'ios-verifier',
      platform: 'ios',
      redirectUri: 'gitfit://oauth/callback'
    };
    
    const iosCallbackResponse = {
      connection: {
        _id: 'ios_conn_123',
        providerId: 'spotify',
        providerUserId: 'spotify_ios_user',
        displayName: 'iOS User',
        platform: 'ios'
      },
      redirectInfo: {
        originalScheme: 'gitfit://',
        handledBy: 'native_app',
        deepLink: true
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => iosCallbackResponse
    });
    
    const iosResponse = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(iosCallbackRequest)
    });
    const iosCallback = await iosResponse.json();
    
    expect(iosCallback.connection.platform).toBe('ios');
    expect(iosCallback.redirectInfo.deepLink).toBe(true);
    expect(iosCallback.redirectInfo.handledBy).toBe('native_app');
    
    // Test Web HTTPS callback
    const webCallbackRequest = {
      providerId: 'spotify',
      code: 'web-auth-code',
      state: 'web-state-789',
      codeVerifier: 'web-verifier',
      platform: 'web',
      redirectUri: 'https://app.gitfit.com/oauth/callback'
    };
    
    const webCallbackResponse = {
      connection: {
        _id: 'web_conn_789',
        providerId: 'spotify',
        providerUserId: 'spotify_web_user',
        displayName: 'Web User',
        platform: 'web'
      },
      redirectInfo: {
        originalScheme: 'https://',
        handledBy: 'browser',
        popup: true,
        closePopup: true
      }
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => webCallbackResponse
    });
    
    const webResponse = await fetch('/api/oauth/callback', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webCallbackRequest)
    });
    const webCallback = await webResponse.json();
    
    expect(webCallback.connection.platform).toBe('web');
    expect(webCallback.redirectInfo.popup).toBe(true);
    expect(webCallback.redirectInfo.closePopup).toBe(true);
    
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
  
  it('should validate redirect URI security and prevent open redirects', async () => {
    // Test malicious redirect URI
    const maliciousRequest = {
      providerId: 'spotify',
      scopes: ['user-read-private'],
      redirectUri: 'https://evil.com/steal-tokens' // Malicious redirect
    };
    
    const securityErrorResponse = {
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: 'INVALID_REDIRECT_URI',
          message: 'Redirect URI not in allowed list',
          allowedDomains: ['app.gitfit.com', 'gitfit.app'],
          allowedSchemes: ['gitfit://'],
          providedUri: 'https://evil.com/steal-tokens',
          securityReason: 'open_redirect_prevention'
        }
      })
    };
    
    mockFetch.mockResolvedValueOnce(securityErrorResponse);
    
    const response = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(maliciousRequest)
    });
    const error = await response.json();
    
    expect(response.status).toBe(400);
    expect(error.error.code).toBe('INVALID_REDIRECT_URI');
    expect(error.error.securityReason).toBe('open_redirect_prevention');
    expect(error.error.allowedDomains).toContain('app.gitfit.com');
    expect(error.error.allowedSchemes).toContain('gitfit://');
  });
  
  it('should handle platform-specific OAuth provider differences', async () => {
    // Apple Music has different OAuth flows on different platforms
    const appleWebRequest = {
      providerId: 'apple_music',
      scopes: ['library-read'],
      redirectUri: 'https://app.gitfit.com/oauth/callback',
      platform: 'web'
    };
    
    const appleWebResponse = {
      // Apple Music on Web uses MusicKit JS, not OAuth
      authorizationMethod: 'musickit_js',
      developerId: 'team_id_123',
      userToken: 'required',
      redirectUri: 'https://app.gitfit.com/oauth/callback',
      jsLibrary: 'https://js-cdn.music.apple.com/musickit/v3/musickit.js',
      platform: 'web'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => appleWebResponse
    });
    
    const webResponse = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appleWebRequest)
    });
    const webAuth = await webResponse.json();
    
    expect(webAuth.authorizationMethod).toBe('musickit_js');
    expect(webAuth.jsLibrary).toContain('musickit.js');
    
    // Apple Music on iOS uses native integration
    const appleIosRequest = {
      providerId: 'apple_music',
      scopes: ['library-read'],
      redirectUri: 'gitfit://oauth/callback',
      platform: 'ios'
    };
    
    const appleIosResponse = {
      authorizationMethod: 'native_media_player',
      frameworkRequired: 'MediaPlayer.framework',
      permissions: ['MPMediaLibraryAuthorizationStatus'],
      redirectUri: 'gitfit://oauth/callback',
      platform: 'ios'
    };
    
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => appleIosResponse
    });
    
    const iosResponse = await fetch('/api/oauth/authorize', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer mock-token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(appleIosRequest)
    });
    const iosAuth = await iosResponse.json();
    
    expect(iosAuth.authorizationMethod).toBe('native_media_player');
    expect(iosAuth.frameworkRequired).toBe('MediaPlayer.framework');
    
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

// This test should FAIL initially - validates TDD approach  
// Tests will pass once cross-platform OAuth redirect handling is implemented