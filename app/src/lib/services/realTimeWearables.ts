import { WHOOPClient, getWHOOPTokens, isTokenExpired } from '$lib/api/whoop';
import { whoopActions } from '$lib/stores/whoop';

export interface RealTimeVitals {
  heartRate: number;
  spo2: number;
  source: 'whoop' | 'apple_watch' | 'mock';
  timestamp: number;
  confidence: number; // 0-1, how reliable this reading is
}

export class RealTimeWearableService {
  private userId: string;
  private currentVitals: RealTimeVitals | null = null;
  private vitalsCallbacks: ((vitals: RealTimeVitals) => void)[] = [];
  private updateInterval: NodeJS.Timeout | null = null;
  private whoopClient: WHOOPClient | null = null;

  constructor(userId: string) {
    this.userId = userId;
    this.initializeWHOOP();
  }

  /**
   * Initialize WHOOP client if tokens are available
   */
  private initializeWHOOP() {
    const tokens = getWHOOPTokens(this.userId);
    if (tokens && import.meta.env.VITE_WHOOP_CLIENT_ID) {
      this.whoopClient = new WHOOPClient(
        import.meta.env.VITE_WHOOP_CLIENT_ID,
        import.meta.env.VITE_WHOOP_CLIENT_SECRET,
        import.meta.env.VITE_WHOOP_REDIRECT_URI
      );
    }
  }

  /**
   * Start monitoring real-time vitals
   */
  async startMonitoring(): Promise<void> {
    // Try WHOOP first
    if (await this.tryWHOOPData()) {
      console.log('Using WHOOP for real-time vitals');
      this.scheduleWHOOPUpdates();
      return;
    }

    // Try Apple HealthKit next (if on iOS)
    if (await this.tryAppleHealthKit()) {
      console.log('Using Apple HealthKit for real-time vitals');
      this.scheduleHealthKitUpdates();
      return;
    }

    // Fallback to enhanced mock data
    console.log('Using enhanced mock data for vitals');
    this.scheduleEnhancedMockUpdates();
  }

  /**
   * Stop monitoring vitals
   */
  stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Subscribe to vitals updates
   */
  onVitalsUpdate(callback: (vitals: RealTimeVitals) => void): () => void {
    this.vitalsCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.vitalsCallbacks.indexOf(callback);
      if (index > -1) {
        this.vitalsCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Get current vitals (sync)
   */
  getCurrentVitals(): RealTimeVitals | null {
    return this.currentVitals;
  }

  /**
   * Try to get WHOOP data
   */
  private async tryWHOOPData(): Promise<boolean> {
    if (!this.whoopClient) return false;

    try {
      const tokens = getWHOOPTokens(this.userId);
      if (!tokens) return false;

      // Check token expiry
      const storedTime = parseInt(localStorage.getItem(`whoop_token_time_${this.userId}`) || '0');
      let accessToken = tokens.access_token;

      if (isTokenExpired(tokens, storedTime)) {
        const newTokens = await this.whoopClient.refreshAccessToken(tokens.refresh_token);
        accessToken = newTokens.access_token;
      }

      // Get most recent recovery data (contains heart rate and SpO2)
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // Last 24 hours

      const recoveryData = await this.whoopClient.getRecoveryData(accessToken, startDate, endDate);
      
      if (recoveryData && recoveryData.length > 0) {
        const latest = recoveryData[recoveryData.length - 1];
        if (latest.score_state === 'SCORED') {
          this.updateVitals({
            heartRate: latest.score.resting_heart_rate,
            spo2: latest.score.spo2_percentage,
            source: 'whoop',
            timestamp: Date.now(),
            confidence: 0.9
          });
          return true;
        }
      }
    } catch (error) {
      console.error('WHOOP data fetch failed:', error);
    }

    return false;
  }

  /**
   * Try to get Apple HealthKit data (requires Capacitor)
   */
  private async tryAppleHealthKit(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      // Check if we're in a Capacitor app on iOS
      if ((window as any).Capacitor?.isNativePlatform() && (window as any).Capacitor?.getPlatform() === 'ios') {
        // This would use the Capacitor HealthKit plugin
        // For now, we'll simulate this as it requires the actual plugin
        console.log('HealthKit integration would go here');
        
        // Mock HealthKit data for iOS
        this.updateVitals({
          heartRate: Math.floor(Math.random() * 30) + 130, // 130-160 BPM
          spo2: Math.floor(Math.random() * 3) + 97, // 97-99%
          source: 'apple_watch',
          timestamp: Date.now(),
          confidence: 0.85
        });
        return true;
      }
    } catch (error) {
      console.error('HealthKit check failed:', error);
    }

    return false;
  }

  /**
   * Schedule WHOOP updates (every 5 minutes, as WHOOP doesn't provide real-time data)
   */
  private scheduleWHOOPUpdates(): void {
    this.updateInterval = setInterval(async () => {
      await this.tryWHOOPData();
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Schedule HealthKit updates (every 30 seconds)
   */
  private scheduleHealthKitUpdates(): void {
    this.updateInterval = setInterval(async () => {
      await this.tryAppleHealthKit();
    }, 30 * 1000); // 30 seconds
  }

  /**
   * Schedule enhanced mock updates with realistic patterns
   */
  private scheduleEnhancedMockUpdates(): void {
    let baseHeartRate = 140;
    let baseSpo2 = 98;
    let exerciseIntensity = 0.5; // 0-1 scale
    
    this.updateInterval = setInterval(() => {
      // Simulate exercise intensity changes
      exerciseIntensity += (Math.random() - 0.5) * 0.1;
      exerciseIntensity = Math.max(0.2, Math.min(0.9, exerciseIntensity));

      // Heart rate responds to intensity
      const targetHR = 120 + (exerciseIntensity * 60); // 120-180 BPM range
      baseHeartRate += (targetHR - baseHeartRate) * 0.1 + (Math.random() - 0.5) * 5;
      baseHeartRate = Math.max(100, Math.min(190, baseHeartRate));

      // SpO2 slightly decreases with high intensity
      const targetSpo2 = 99 - (exerciseIntensity * 2); // 99-97% range
      baseSpo2 += (targetSpo2 - baseSpo2) * 0.1 + (Math.random() - 0.5) * 0.5;
      baseSpo2 = Math.max(95, Math.min(99, baseSpo2));

      this.updateVitals({
        heartRate: Math.round(baseHeartRate),
        spo2: Math.round(baseSpo2 * 10) / 10, // One decimal place
        source: 'mock',
        timestamp: Date.now(),
        confidence: 0.7
      });
    }, 3000); // Every 3 seconds
  }

  /**
   * Update vitals and notify subscribers
   */
  private updateVitals(vitals: RealTimeVitals): void {
    this.currentVitals = vitals;
    
    // Notify all subscribers
    this.vitalsCallbacks.forEach(callback => {
      try {
        callback(vitals);
      } catch (error) {
        console.error('Vitals callback error:', error);
      }
    });
  }
}