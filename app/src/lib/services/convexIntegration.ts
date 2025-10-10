// Integration layer between Svelte components and Convex backend
import { browser } from '$app/environment';
import type { ConvexReactClient } from 'convex/react';
import { api } from '../convex/_generated/api.js';
import type { 
  OrbPreferences, 
  StrainData, 
  WatchInterfaceState, 
  AudioDeviceInfo, 
  WatchSyncData 
} from '../types/sharedTypes.js';

// Global Convex client instance
let convexClient: ConvexReactClient | null = null;

export function initializeConvex(client: ConvexReactClient) {
  convexClient = client;
}

export function getConvexClient(): ConvexReactClient | null {
  return convexClient;
}

// Type-safe wrapper for Convex operations
export class ConvexIntegrationService {
  private client: ConvexReactClient;

  constructor(client: ConvexReactClient) {
    this.client = client;
  }

  // Orb Preferences Integration
  async getOrbPreferences(userId: string): Promise<OrbPreferences | null> {
    try {
      return await this.client.query(api.functions.orbPreferences.getOrbPreferences, { userId });
    } catch (error) {
      console.error('Failed to get orb preferences:', error);
      return null;
    }
  }

  async updateOrbPreferences(preferences: OrbPreferences): Promise<boolean> {
    try {
      await this.client.mutation(api.functions.orbPreferences.updateOrbPreferences, preferences);
      return true;
    } catch (error) {
      console.error('Failed to update orb preferences:', error);
      return false;
    }
  }

  subscribeToOrbPreferences(userId: string, callback: (preferences: OrbPreferences | null) => void) {
    if (!browser) return () => {};
    
    return this.client.watchQuery(
      api.functions.orbPreferences.getOrbPreferences,
      { userId },
      callback
    );
  }

  // Strain Data Integration
  async getCurrentStrainData(userId: string): Promise<StrainData | null> {
    try {
      return await this.client.query(api.functions.strainData.getCurrentStrainData, { userId });
    } catch (error) {
      console.error('Failed to get strain data:', error);
      return null;
    }
  }

  async updateStrainData(strainData: StrainData): Promise<boolean> {
    try {
      await this.client.mutation(api.functions.strainData.updateStrainData, strainData);
      return true;
    } catch (error) {
      console.error('Failed to update strain data:', error);
      return false;
    }
  }

  subscribeToStrainData(userId: string, callback: (strainData: StrainData | null) => void) {
    if (!browser) return () => {};
    
    return this.client.watchQuery(
      api.functions.strainData.getCurrentStrainData,
      { userId },
      callback
    );
  }

  // Watch Interface Integration
  async getWatchInterfaceState(userId: string): Promise<WatchInterfaceState | null> {
    try {
      return await this.client.query(api.functions.watchInterface.getWatchInterfaceState, { userId });
    } catch (error) {
      console.error('Failed to get watch interface state:', error);
      return null;
    }
  }

  async updateWatchInterfaceState(state: WatchInterfaceState): Promise<boolean> {
    try {
      await this.client.mutation(api.functions.watchInterface.updateWatchInterfaceState, state);
      return true;
    } catch (error) {
      console.error('Failed to update watch interface state:', error);
      return false;
    }
  }

  subscribeToWatchInterfaceState(userId: string, callback: (state: WatchInterfaceState | null) => void) {
    if (!browser) return () => {};
    
    return this.client.watchQuery(
      api.functions.watchInterface.getWatchInterfaceState,
      { userId },
      callback
    );
  }

  // Audio Device Integration
  async getAudioDevices(userId: string): Promise<AudioDeviceInfo[]> {
    try {
      return await this.client.query(api.functions.audioDevices.getAudioDevices, { userId }) || [];
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      return [];
    }
  }

  async updateAudioDevice(deviceInfo: AudioDeviceInfo): Promise<boolean> {
    try {
      await this.client.mutation(api.functions.audioDevices.updateAudioDevice, deviceInfo);
      return true;
    } catch (error) {
      console.error('Failed to update audio device:', error);
      return false;
    }
  }

  subscribeToAudioDevices(userId: string, callback: (devices: AudioDeviceInfo[]) => void) {
    if (!browser) return () => {};
    
    return this.client.watchQuery(
      api.functions.audioDevices.getAudioDevices,
      { userId },
      (devices: AudioDeviceInfo[] | null) => callback(devices || [])
    );
  }

  // Watch Sync Integration
  async getWatchSyncData(userId: string): Promise<WatchSyncData | null> {
    try {
      return await this.client.query(api.functions.watchSync.getWatchSyncData, { userId });
    } catch (error) {
      console.error('Failed to get watch sync data:', error);
      return null;
    }
  }

  async updateWatchSyncData(syncData: WatchSyncData): Promise<boolean> {
    try {
      await this.client.mutation(api.functions.watchSync.updateWatchSyncData, syncData);
      return true;
    } catch (error) {
      console.error('Failed to update watch sync data:', error);
      return false;
    }
  }

  subscribeToWatchSyncData(userId: string, callback: (syncData: WatchSyncData | null) => void) {
    if (!browser) return () => {};
    
    return this.client.watchQuery(
      api.functions.watchSync.getWatchSyncData,
      { userId },
      callback
    );
  }

  // Batch operations for efficiency
  async batchUpdatePreferences(updates: {
    orb?: Partial<OrbPreferences>;
    strain?: Partial<StrainData>;
    watch?: Partial<WatchInterfaceState>;
    sync?: Partial<WatchSyncData>;
  }, userId: string): Promise<boolean> {
    try {
      const promises: Promise<boolean>[] = [];

      if (updates.orb) {
        const current = await this.getOrbPreferences(userId);
        if (current) {
          promises.push(this.updateOrbPreferences({ ...current, ...updates.orb }));
        }
      }

      if (updates.strain) {
        const current = await this.getCurrentStrainData(userId);
        if (current) {
          promises.push(this.updateStrainData({ ...current, ...updates.strain }));
        }
      }

      if (updates.watch) {
        const current = await this.getWatchInterfaceState(userId);
        if (current) {
          promises.push(this.updateWatchInterfaceState({ ...current, ...updates.watch }));
        }
      }

      if (updates.sync) {
        const current = await this.getWatchSyncData(userId);
        if (current) {
          promises.push(this.updateWatchSyncData({ ...current, ...updates.sync }));
        }
      }

      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Failed to batch update preferences:', error);
      return false;
    }
  }
}

// Singleton service instance
export let convexService: ConvexIntegrationService | null = null;

export function createConvexService(client: ConvexReactClient): ConvexIntegrationService {
  convexService = new ConvexIntegrationService(client);
  return convexService;
}

export function getConvexService(): ConvexIntegrationService | null {
  return convexService;
}

// Browser-safe reactive stores for component integration
export function createReactiveStore<T>(
  queryFn: (userId: string) => Promise<T | null>,
  userId: string,
  defaultValue: T | null = null
) {
  if (!browser) {
    return {
      subscribe: () => () => {},
      value: defaultValue
    };
  }

  let subscribers: ((value: T | null) => void)[] = [];
  let currentValue: T | null = defaultValue;

  // Initial load
  queryFn(userId).then(value => {
    currentValue = value;
    subscribers.forEach(callback => callback(value));
  });

  return {
    subscribe: (callback: (value: T | null) => void) => {
      subscribers.push(callback);
      callback(currentValue); // Immediate call with current value
      
      return () => {
        subscribers = subscribers.filter(cb => cb !== callback);
      };
    },
    get value() {
      return currentValue;
    }
  };
}

// Utility functions for component integration
export function withConvexIntegration<T>(
  component: T
): T & { convexService: ConvexIntegrationService | null } {
  return {
    ...component,
    convexService: getConvexService()
  };
}

export function ensureConvexConnection(): boolean {
  if (!browser) return false;
  if (!convexClient || !convexService) {
    console.warn('Convex client not initialized. Call initializeConvex() first.');
    return false;
  }
  return true;
}