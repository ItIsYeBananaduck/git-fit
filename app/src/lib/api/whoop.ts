import { browser } from '$app/environment';

// WHOOP API Configuration
const WHOOP_API_BASE = 'https://api.prod.whoop.com';
const WHOOP_AUTH_URL = `${WHOOP_API_BASE}/oauth/oauth2/auth`;
const WHOOP_TOKEN_URL = `${WHOOP_API_BASE}/oauth/oauth2/token`;

// Available WHOOP scopes
const WHOOP_SCOPES = [
  'offline',           // Required for refresh tokens
  'read:profile',      // Basic user profile
  'read:body_measurement', // Height, weight, max heart rate
  'read:cycles',       // Physiological cycles
  'read:recovery',     // Recovery data
  'read:sleep',        // Sleep data
  'read:workout'       // Workout/activity data
];

export interface WHOOPTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

export interface WHOOPUser {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
}

export interface WHOOPRecovery {
  cycle_id: number;
  sleep_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  score_state: string;
  score: {
    user_calibrating: boolean;
    recovery_score: number;
    resting_heart_rate: number;
    hrv_rmssd_milli: number;
    spo2_percentage: number;
    skin_temp_celsius: number;
  };
}

export interface WHOOPStrain {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  score_state: string;
  score: {
    strain: number;
    average_heart_rate: number;
    max_heart_rate: number;
    kilojoule: number;
    percent_recorded: number;
    distance_meter: number;
    altitude_gain_meter: number;
    altitude_change_meter: number;
    zone_duration: {
      zone_zero_milli: number;
      zone_one_milli: number;
      zone_two_milli: number;
      zone_three_milli: number;
      zone_four_milli: number;
      zone_five_milli: number;
    };
  };
}

export interface WHOOPSleep {
  id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
  start: string;
  end: string;
  timezone_offset: string;
  nap: boolean;
  score_state: string;
  score: {
    stage_summary: {
      total_in_bed_time_milli: number;
      total_awake_time_milli: number;
      total_no_data_time_milli: number;
      total_light_sleep_time_milli: number;
      total_slow_wave_sleep_time_milli: number;
      total_rem_sleep_time_milli: number;
      sleep_cycle_count: number;
      disturbance_count: number;
    };
    sleep_needed: {
      baseline_milli: number;
      need_from_sleep_debt_milli: number;
      need_from_recent_strain_milli: number;
      need_from_recent_nap_milli: number;
    };
    respiratory_rate: number;
    sleep_performance_percentage: number;
    sleep_consistency_percentage: number;
    sleep_efficiency_percentage: number;
  };
}

export class WHOOPClient {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  /**
   * Generate OAuth authorization URL
   */
  getAuthUrl(state: string): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: WHOOP_SCOPES.join(' '),
      state: state
    });

    return `${WHOOP_AUTH_URL}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string): Promise<WHOOPTokens> {
    const response = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WHOOP token exchange failed: ${error.error_description || error.error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<WHOOPTokens> {
    const response = await fetch(WHOOP_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: 'offline'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`WHOOP token refresh failed: ${error.error_description || error.error}`);
    }

    return response.json();
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken: string): Promise<WHOOPUser> {
    const response = await fetch(`${WHOOP_API_BASE}/developer/v1/user/profile/basic`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get recovery data
   */
  async getRecoveryData(accessToken: string, startDate?: string, endDate?: string): Promise<WHOOPRecovery[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);

    const response = await fetch(`${WHOOP_API_BASE}/developer/v1/recovery?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch recovery data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records || [];
  }

  /**
   * Get cycle (strain) data
   */
  async getCycleData(accessToken: string, startDate?: string, endDate?: string): Promise<WHOOPStrain[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);

    const response = await fetch(`${WHOOP_API_BASE}/developer/v1/cycle?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch cycle data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records || [];
  }

  /**
   * Get sleep data
   */
  async getSleepData(accessToken: string, startDate?: string, endDate?: string): Promise<WHOOPSleep[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('start', startDate);
    if (endDate) params.append('end', endDate);

    const response = await fetch(`${WHOOP_API_BASE}/developer/v1/activity/sleep?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch sleep data: ${response.statusText}`);
    }

    const data = await response.json();
    return data.records || [];
  }
}

/**
 * Generate secure random state for OAuth
 */
export function generateOAuthState(): string {
  if (browser) {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for server-side
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Store tokens securely (implement based on your storage preference)
 */
export function storeWHOOPTokens(userId: string, tokens: WHOOPTokens): void {
  if (browser) {
    // Store in localStorage for demo - use secure storage in production
    localStorage.setItem(`whoop_tokens_${userId}`, JSON.stringify(tokens));
  }
}

/**
 * Retrieve stored tokens
 */
export function getWHOOPTokens(userId: string): WHOOPTokens | null {
  if (browser) {
    const stored = localStorage.getItem(`whoop_tokens_${userId}`);
    return stored ? JSON.parse(stored) : null;
  }
  return null;
}

/**
 * Check if access token is expired
 */
export function isTokenExpired(tokens: WHOOPTokens, createdAt: number): boolean {
  const now = Date.now();
  const expiresAt = createdAt + (tokens.expires_in * 1000);
  return now >= expiresAt;
}