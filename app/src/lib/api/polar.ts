import type { TrackerData } from '../types/fitnessTrackers.js';

export interface PolarAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface PolarUser {
  'member-id': string;
  'polar-user-id'?: number;
  'registration-date'?: string;
}

export interface PolarExercise {
  id: number;
  'upload-time': string;
  'polar-user': string;
  device: string;
  'device-id': string;
  'start-time': string;
  'start-time-utc-offset': number;
  duration: string;
  calories: number;
  distance: number;
  'heart-rate': {
    average: number;
    maximum: number;
  };
  'training-load': number;
  sport: string;
  'has-route': boolean;
  'club-id': number;
  'detailed-sport-info': string;
}

export interface PolarSleep {
  'polar-user': string;
  date: string;
  'sleep-start-time': string;
  'sleep-end-time': string;
  'light-sleep': number;
  'deep-sleep': number;
  'rem-sleep': number;
  'unrecognized-sleep-stage': number;
  'sleep-score': number;
  'total-interruption-duration': number;
  'sleep-charge': number;
  'sleep-rating': number;
  'short-interruption': number;
  'long-interruption': number;
  'sleep-cycles': number;
  'group-duration-score': number;
  'group-solidity-score': number;
  'group-regeneration-score': number;
}

export interface PolarNightlyRecharge {
  'polar-user': string;
  date: string;
  'nightly-recharge-status': number;
  'ans-charge': number;
  'ans-change': number;
  'hrv-avg': number;
  'breathing-rate-avg': number;
  'heart-rate-avg': number;
  'heart-rate-variability-avg': number;
  'sleep-charge': number;
}

export interface PolarActivitySummary {
  'polar-user': string;
  date: string;
  'calories-total': number;
  'calories-bmr': number;
  'calories-activity': number;
  'active-time': string;
  steps: number;
  'active-steps': number;
  'inactivity-stamps': number;
  'inactivity-alerts': number;
  'met-avg': number;
  'training-time': string;
}

class PolarAPI {
  private static instance: PolarAPI;
  private baseUrl = 'https://www.polaraccesslink.com/v3';
  private authUrl = 'https://flow.polar.com/oauth2/authorization';
  private tokenUrl = 'https://polarremote.com/v2/oauth2/token';
  private clientId: string | null = null;
  private clientSecret: string | null = null;
  private accessToken: string | null = null;

  private constructor() {}

  static getInstance(): PolarAPI {
    if (!PolarAPI.instance) {
      PolarAPI.instance = new PolarAPI();
    }
    return PolarAPI.instance;
  }

  setCredentials(clientId: string, clientSecret: string) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  getAuthUrl(redirectUri: string, state?: string): string {
    if (!this.clientId) {
      throw new Error('Client ID not set. Call setCredentials() first.');
    }
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      ...(state && { state })
    });

    return `${this.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string, redirectUri: string): Promise<PolarAuthResponse> {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Client credentials not set. Call setCredentials() first.');
    }

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token exchange failed: ${response.status} ${error}`);
    }

    const authData: PolarAuthResponse = await response.json();
    this.accessToken = authData.access_token;
    return authData;
  }

  setAccessToken(token: string) {
    this.accessToken = token;
  }

  private getHeaders(): HeadersInit {
    if (!this.accessToken) {
      throw new Error('Access token not set. Authenticate first.');
    }

    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'Accept': 'application/json'
    };
  }

  async registerUser(memberId: string): Promise<PolarUser> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'member-id': memberId
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`User registration failed: ${response.status} ${error}`);
    }

    return await response.json();
  }

  async deleteUser(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/users`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`User deletion failed: ${response.status} ${error}`);
    }
  }

  async getExercises(): Promise<PolarExercise[]> {
    const response = await fetch(`${this.baseUrl}/exercises`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get exercises: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.exercises || [];
  }

  async getSleep(fromDate?: string, toDate?: string): Promise<PolarSleep[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);

    const url = `${this.baseUrl}/users/sleep${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get sleep data: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.nights || [];
  }

  async getNightlyRecharge(fromDate?: string, toDate?: string): Promise<PolarNightlyRecharge[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);

    const url = `${this.baseUrl}/users/nightly-recharge${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get nightly recharge data: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.recharge || [];
  }

  async getActivitySummary(fromDate?: string, toDate?: string): Promise<PolarActivitySummary[]> {
    const params = new URLSearchParams();
    if (fromDate) params.append('from', fromDate);
    if (toDate) params.append('to', toDate);

    const url = `${this.baseUrl}/users/activity-summary${params.toString() ? '?' + params.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get activity summary: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data['activity-summary'] || [];
  }

  async getContinuousHeartRate(fromDate: string, toDate: string): Promise<any[]> {
    const params = new URLSearchParams({
      from: fromDate,
      to: toDate
    });

    const response = await fetch(`${this.baseUrl}/users/continuous-heart-rate?${params.toString()}`, {
      headers: this.getHeaders()
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get heart rate data: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data['continuous-heart-rate'] || [];
  }

  // Convert Polar data to normalized TrackerData format
  async getTrackerData(): Promise<TrackerData | null> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get latest data from multiple endpoints
      const [recharge, sleep, activity, exercises] = await Promise.all([
        this.getNightlyRecharge(yesterday, today).catch(() => []),
        this.getSleep(yesterday, today).catch(() => []),
        this.getActivitySummary(yesterday, today).catch(() => []),
        this.getExercises().catch(() => [])
      ]);

      const latestRecharge = recharge[recharge.length - 1];
      const latestSleep = sleep[sleep.length - 1];
      const latestActivity = activity[activity.length - 1];
      const latestExercise = exercises[exercises.length - 1];

      return {
        recovery: latestRecharge ? latestRecharge['nightly-recharge-status'] : undefined,
        hrv: latestRecharge ? latestRecharge['hrv-avg'] : undefined,
        heartRate: latestExercise ? latestExercise['heart-rate']?.average : undefined,
        restingHeartRate: latestRecharge ? latestRecharge['heart-rate-avg'] : undefined,
        sleep: latestSleep ? {
          duration: (latestSleep['light-sleep'] + latestSleep['deep-sleep'] + latestSleep['rem-sleep']) / 60, // Convert to hours
          quality: latestSleep['sleep-score'],
          efficiency: Math.max(0, 100 - (latestSleep['total-interruption-duration'] / 10)) // Rough estimate
        } : undefined,
        steps: latestActivity?.steps,
        calories: latestActivity ? latestActivity['calories-total'] : undefined,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error fetching Polar data:', error);
      return null;
    }
  }
}

export const polarAPI = PolarAPI.getInstance();