// Fitbit Web API Integration
// API Documentation: https://dev.fitbit.com/build/reference/web-api/

export interface FitbitTokens {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: string;
  user_id: string;
}

export interface FitbitUserProfile {
  user: {
    age: number;
    avatar: string;
    avatar150: string;
    avatar640: string;
    city: string;
    country: string;
    dateOfBirth: string;
    displayName: string;
    encodedId: string;
    firstName: string;
    fullName: string;
    gender: 'MALE' | 'FEMALE' | 'OTHER';
    height: number;
    heightUnit: string;
    lastName: string;
    locale: string;
    memberSince: string;
    state: string;
    timezone: string;
    weight: number;
    weightUnit: string;
  };
}

export interface FitbitSleepData {
  sleep: Array<{
    dateOfSleep: string; // YYYY-MM-DD
    duration: number; // milliseconds
    efficiency: number; // 0-100
    endTime: string; // ISO timestamp
    infoCode: number;
    isMainSleep: boolean;
    levels: {
      data: Array<{
        dateTime: string;
        level: 'wake' | 'light' | 'deep' | 'rem';
        seconds: number;
      }>;
      shortData: Array<{
        dateTime: string;
        level: 'wake';
        seconds: number;
      }>;
      summary: {
        deep: { count: number; minutes: number; thirtyDayAvgMinutes: number };
        light: { count: number; minutes: number; thirtyDayAvgMinutes: number };
        rem: { count: number; minutes: number; thirtyDayAvgMinutes: number };
        wake: { count: number; minutes: number; thirtyDayAvgMinutes: number };
      };
    };
    logId: number;
    minutesAfterWakeup: number;
    minutesAsleep: number;
    minutesAwake: number;
    minutesToFallAsleep: number;
    startTime: string; // ISO timestamp
    timeInBed: number; // minutes
    type: 'stages' | 'classic';
  }>;
  summary: {
    stages: {
      deep: number;
      light: number;
      rem: number;
      wake: number;
    };
    totalMinutesAsleep: number;
    totalSleepRecords: number;
    totalTimeInBed: number;
  };
}

export interface FitbitHeartRateData {
  'activities-heart': Array<{
    dateTime: string; // YYYY-MM-DD
    value: {
      customHeartRateZones: Array<any>;
      heartRateZones: Array<{
        caloriesOut: number;
        max: number;
        min: number;
        minutes: number;
        name: 'Out of Range' | 'Fat Burn' | 'Cardio' | 'Peak';
      }>;
      restingHeartRate: number;
    };
  }>;
}

export interface FitbitActivityData {
  activities: Array<{
    activityId: number;
    activityParentId: number;
    activityParentName: string;
    calories: number;
    description: string;
    distance: number;
    duration: number;
    hasActiveZoneMinutes: boolean;
    hasStartTime: boolean;
    isFavorite: boolean;
    lastModified: string;
    logId: number;
    name: string;
    startDate: string;
    startTime: string;
    steps: number;
  }>;
  goals: {
    activeMinutes: number;
    caloriesOut: number;
    distance: number;
    floors: number;
    steps: number;
  };
  summary: {
    activeScore: number;
    activityCalories: number;
    caloriesBMR: number;
    caloriesOut: number;
    distances: Array<{
      activity: string;
      distance: number;
    }>;
    elevation: number;
    fairlyActiveMinutes: number;
    floors: number;
    heartRateZones: Array<{
      caloriesOut: number;
      max: number;
      min: number;
      minutes: number;
      name: string;
    }>;
    lightlyActiveMinutes: number;
    marginalCalories: number;
    restingHeartRate: number;
    sedentaryMinutes: number;
    steps: number;
    veryActiveMinutes: number;
  };
}

export interface FitbitHRVData {
  hrv: Array<{
    dateTime: string; // YYYY-MM-DD
    value: {
      dailyRmssd: number; // Heart rate variability (milliseconds)
      deepRmssd: number; // HRV during deep sleep
    };
  }>;
}

export class FitbitAPI {
  private baseUrl = 'https://api.fitbit.com';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' = 'GET'): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Try again later.');
      }
      throw new Error(`Fitbit API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<FitbitUserProfile> {
    return this.makeRequest<FitbitUserProfile>('/1/user/-/profile.json');
  }

  /**
   * Get sleep data for a specific date
   */
  async getSleep(date: string): Promise<FitbitSleepData> {
    return this.makeRequest<FitbitSleepData>(`/1/user/-/sleep/date/${date}.json`);
  }

  /**
   * Get sleep data for a date range
   */
  async getSleepRange(startDate: string, endDate: string): Promise<FitbitSleepData> {
    return this.makeRequest<FitbitSleepData>(`/1/user/-/sleep/date/${startDate}/${endDate}.json`);
  }

  /**
   * Get heart rate data for a specific date
   */
  async getHeartRate(date: string): Promise<FitbitHeartRateData> {
    return this.makeRequest<FitbitHeartRateData>(`/1/user/-/activities/heart/date/${date}.json`);
  }

  /**
   * Get heart rate data for a date range
   */
  async getHeartRateRange(startDate: string, endDate: string): Promise<FitbitHeartRateData> {
    return this.makeRequest<FitbitHeartRateData>(`/1/user/-/activities/heart/date/${startDate}/${endDate}.json`);
  }

  /**
   * Get activity data for a specific date
   */
  async getActivity(date: string): Promise<FitbitActivityData> {
    return this.makeRequest<FitbitActivityData>(`/1/user/-/activities/date/${date}.json`);
  }

  /**
   * Get Heart Rate Variability (HRV) data
   */
  async getHRV(date: string): Promise<FitbitHRVData> {
    return this.makeRequest<FitbitHRVData>(`/1/user/-/hrv/date/${date}.json`);
  }

  /**
   * Get HRV data for a date range
   */
  async getHRVRange(startDate: string, endDate: string): Promise<FitbitHRVData> {
    return this.makeRequest<FitbitHRVData>(`/1/user/-/hrv/date/${startDate}/${endDate}.json`);
  }

  /**
   * Get comprehensive summary for a specific date
   */
  async getDailySummary(date: string): Promise<{
    sleep: FitbitSleepData | null;
    heartRate: FitbitHeartRateData | null;
    activity: FitbitActivityData | null;
    hrv: FitbitHRVData | null;
  }> {
    try {
      const [sleepData, heartRateData, activityData, hrvData] = await Promise.allSettled([
        this.getSleep(date),
        this.getHeartRate(date),
        this.getActivity(date),
        this.getHRV(date).catch(() => null) // HRV might not be available for all users
      ]);

      return {
        sleep: sleepData.status === 'fulfilled' ? sleepData.value : null,
        heartRate: heartRateData.status === 'fulfilled' ? heartRateData.value : null,
        activity: activityData.status === 'fulfilled' ? activityData.value : null,
        hrv: hrvData.status === 'fulfilled' ? hrvData.value : null
      };
    } catch (error) {
      console.error('Error fetching Fitbit daily summary:', error);
      return {
        sleep: null,
        heartRate: null,
        activity: null,
        hrv: null
      };
    }
  }

  /**
   * Get latest data summary for adaptive training
   */
  async getLatestSummary(): Promise<{
    sleep: FitbitSleepData['sleep'][0] | null;
    heartRate: FitbitHeartRateData['activities-heart'][0] | null;
    activity: FitbitActivityData | null;
    restingHeartRate: number | null;
    hrv: number | null;
  }> {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      // Get recent data (today and yesterday)
      const [todayData, yesterdayData] = await Promise.all([
        this.getDailySummary(today),
        this.getDailySummary(yesterday)
      ]);

      // Get most recent sleep data
      const latestSleep = todayData.sleep?.sleep?.[0] || 
                         yesterdayData.sleep?.sleep?.[0] || 
                         null;

      // Get most recent heart rate data  
      const latestHeartRate = todayData.heartRate?.['activities-heart']?.[0] || 
                             yesterdayData.heartRate?.['activities-heart']?.[0] || 
                             null;

      // Get today's activity or yesterday's
      const latestActivity = todayData.activity || yesterdayData.activity || null;

      // Get resting heart rate
      const restingHeartRate = latestHeartRate?.value?.restingHeartRate || null;

      // Get HRV from most recent data
      const hrvValue = todayData.hrv?.hrv?.[0]?.value?.dailyRmssd || 
                      yesterdayData.hrv?.hrv?.[0]?.value?.dailyRmssd || 
                      null;

      return {
        sleep: latestSleep,
        heartRate: latestHeartRate,
        activity: latestActivity,
        restingHeartRate,
        hrv: hrvValue
      };
    } catch (error) {
      console.error('Error fetching Fitbit latest summary:', error);
      return {
        sleep: null,
        heartRate: null,
        activity: null,
        restingHeartRate: null,
        hrv: null
      };
    }
  }
}

/**
 * Generate Fitbit OAuth 2.0 authorization URL
 */
export function getFitbitAuthUrl(
  clientId: string, 
  redirectUri: string, 
  scopes: string[] = ['activity', 'heartrate', 'sleep', 'profile'],
  state?: string
): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: scopes.join(' '),
    expires_in: '31536000', // 1 year
    ...(state && { state })
  });

  return `https://www.fitbit.com/oauth2/authorize?${params.toString()}`;
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeFitbitCode(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<FitbitTokens> {
  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Fitbit token exchange error:', error);
    throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshFitbitToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<FitbitTokens> {
  const response = await fetch('https://api.fitbit.com/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}