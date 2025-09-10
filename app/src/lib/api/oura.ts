// Oura Ring API Integration
// API Documentation: https://cloud.ouraring.com/v2/docs

export interface OuraTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

export interface OuraPersonalInfo {
  id: string;
  age: number;
  weight: number;
  height: number;
  biological_sex: string;
  email: string;
}

export interface OuraSleepData {
  id: string;
  day: string; // YYYY-MM-DD format
  score: number | null; // 0-100
  contributors: {
    deep_sleep: number;
    efficiency: number;
    latency: number;
    rem_sleep: number;
    restfulness: number;
    timing: number;
    total_sleep: number;
  };
  timestamp: string;
  bedtime_start: string;
  bedtime_end: string;
  average_heart_rate: number;
  lowest_heart_rate: number;
  average_hrv: number;
  total_sleep_duration: number;
  deep_sleep_duration: number;
  light_sleep_duration: number;
  rem_sleep_duration: number;
  awake_time: number;
  sleep_efficiency: number;
}

export interface OuraReadinessData {
  id: string;
  day: string; // YYYY-MM-DD format
  score: number | null; // 0-100
  contributors: {
    activity_balance: number;
    body_temperature: number;
    hrv_balance: number;
    previous_day_activity: number;
    previous_night: number;
    recovery_index: number;
    resting_heart_rate: number;
    sleep_balance: number;
  };
  timestamp: string;
  temperature_deviation: number;
  temperature_trend_deviation: number;
}

export interface OuraActivityData {
  id: string;
  day: string; // YYYY-MM-DD format
  score: number | null; // 0-100
  active_calories: number;
  average_met_minutes: number;
  contributors: {
    meet_daily_targets: number;
    move_every_hour: number;
    recovery_time: number;
    stay_active: number;
    training_frequency: number;
    training_volume: number;
  };
  equivalent_walking_distance: number;
  high_activity_met_minutes: number;
  high_activity_time: number;
  inactivity_alerts: number;
  low_activity_met_minutes: number;
  low_activity_time: number;
  medium_activity_met_minutes: number;
  medium_activity_time: number;
  met: {
    interval: number;
    items: number[];
    timestamp: string;
  };
  meters_to_target: number;
  non_wear_time: number;
  resting_time: number;
  sedentary_met_minutes: number;
  sedentary_time: number;
  steps: number;
  target_calories: number;
  target_meters: number;
  total_calories: number;
  total_distance: number;
  timestamp: string;
}

export interface OuraHeartRateData {
  bpm: number;
  source: string;
  timestamp: string;
}

export class OuraAPI {
  private baseUrl = 'https://api.ouraring.com/v2/usercollection';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Oura API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get personal info for the authenticated user
   */
  async getPersonalInfo(): Promise<OuraPersonalInfo> {
    const response = await this.makeRequest<{ data: OuraPersonalInfo }>('/personal_info');
    return response.data;
  }

  /**
   * Get sleep data for a date range
   */
  async getSleep(startDate?: string, endDate?: string): Promise<OuraSleepData[]> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await this.makeRequest<{ data: OuraSleepData[] }>('/sleep', params);
    return response.data;
  }

  /**
   * Get readiness (recovery) data for a date range
   */
  async getReadiness(startDate?: string, endDate?: string): Promise<OuraReadinessData[]> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await this.makeRequest<{ data: OuraReadinessData[] }>('/daily_readiness', params);
    return response.data;
  }

  /**
   * Get activity data for a date range
   */
  async getActivity(startDate?: string, endDate?: string): Promise<OuraActivityData[]> {
    const params: Record<string, string> = {};
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;

    const response = await this.makeRequest<{ data: OuraActivityData[] }>('/daily_activity', params);
    return response.data;
  }

  /**
   * Get heart rate data for a date range
   */
  async getHeartRate(startDate?: string, endDate?: string): Promise<OuraHeartRateData[]> {
    const params: Record<string, string> = {};
    if (startDate) params.start_datetime = startDate;
    if (endDate) params.end_datetime = endDate;

    const response = await this.makeRequest<{ data: OuraHeartRateData[] }>('/heartrate', params);
    return response.data;
  }

  /**
   * Get the most recent data summary for adaptive training
   */
  async getLatestSummary(): Promise<{
    sleep: OuraSleepData | null;
    readiness: OuraReadinessData | null;
    activity: OuraActivityData | null;
    averageHRV: number | null;
  }> {
    const endDate = new Date().toISOString().split('T')[0]; // Today
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 7 days ago

    try {
      const [sleepData, readinessData, activityData] = await Promise.all([
        this.getSleep(startDate, endDate),
        this.getReadiness(startDate, endDate),
        this.getActivity(startDate, endDate)
      ]);

      // Get most recent data
      const latestSleep = sleepData.length > 0 ? sleepData[sleepData.length - 1] : null;
      const latestReadiness = readinessData.length > 0 ? readinessData[readinessData.length - 1] : null;
      const latestActivity = activityData.length > 0 ? activityData[activityData.length - 1] : null;

      // Calculate average HRV from recent sleep data
      const recentSleepWithHRV = sleepData.filter(s => s.average_hrv > 0).slice(-7);
      const averageHRV = recentSleepWithHRV.length > 0 
        ? recentSleepWithHRV.reduce((sum, s) => sum + s.average_hrv, 0) / recentSleepWithHRV.length
        : null;

      return {
        sleep: latestSleep,
        readiness: latestReadiness,
        activity: latestActivity,
        averageHRV
      };
    } catch (error) {
      console.error('Error fetching Oura data:', error);
      return {
        sleep: null,
        readiness: null,
        activity: null,
        averageHRV: null
      };
    }
  }
}

/**
 * OAuth 2.0 Authorization URL generator
 */
export function getOuraAuthUrl(clientId: string, redirectUri: string, state?: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: 'personal daily',
    ...(state && { state })
  });

  return `https://cloud.ouraring.com/oauth/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeOuraCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OuraTokens> {
  const response = await fetch('https://api.ouraring.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshOuraToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<OuraTokens> {
  const response = await fetch('https://api.ouraring.com/oauth/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}