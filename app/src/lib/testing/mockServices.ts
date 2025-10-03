// Mock services for integration testing
import { vi } from 'vitest';
import type { 
  OrbPreferences, 
  StrainData, 
  WatchInterfaceState, 
  AudioDeviceInfo, 
  WatchSyncData 
} from '../types/sharedTypes.js';

// Mock user for testing
export const MOCK_USER_ID = 'test-user-123';

// Mock data factories
export function createMockOrbPreferences(overrides: Partial<OrbPreferences> = {}): OrbPreferences {
  return {
    _id: 'orb-pref-123',
    userId: MOCK_USER_ID,
    baseColor: { h: 240, s: 100, l: 50 }, // Blue
    enableStrainAdjustment: true,
    strainAdjustmentAmount: 20,
    customName: 'Alice',
    lastUpdated: Date.now(),
    ...overrides
  };
}

export function createMockStrainData(overrides: Partial<StrainData> = {}): StrainData {
  return {
    _id: 'strain-data-123',
    userId: MOCK_USER_ID,
    currentStrain: 95,
    optimalRange: { min: 90, max: 100 },
    workoutActive: true,
    exerciseName: 'Bench Press',
    setNumber: 2,
    lastUpdated: Date.now(),
    ...overrides
  };
}

export function createMockWatchInterfaceState(overrides: Partial<WatchInterfaceState> = {}): WatchInterfaceState {
  return {
    _id: 'watch-state-123',
    userId: MOCK_USER_ID,
    isConnected: true,
    deviceName: 'Apple Watch',
    currentExercise: {
      name: 'Bench Press',
      reps: 10,
      weight: 185,
      targetReps: 10,
      targetWeight: 185,
      setNumber: 2,
      totalSets: 3
    },
    workoutState: 'active',
    restTimer: {
      duration: 90,
      remaining: 45,
      active: true
    },
    lastSync: Date.now(),
    ...overrides
  };
}

export function createMockAudioDeviceInfo(overrides: Partial<AudioDeviceInfo> = {}): AudioDeviceInfo {
  return {
    _id: 'audio-device-123',
    userId: MOCK_USER_ID,
    deviceId: 'airpods-pro-123',
    deviceName: 'AirPods Pro',
    deviceType: 'earbuds',
    isConnected: true,
    isPreferred: true,
    batteryLevel: 85,
    lastConnected: Date.now(),
    ...overrides
  };
}

export function createMockWatchSyncData(overrides: Partial<WatchSyncData> = {}): WatchSyncData {
  return {
    _id: 'sync-data-123',
    userId: MOCK_USER_ID,
    pendingChanges: [
      {
        id: 'change-1',
        type: 'exercise_param',
        data: { reps: 12 },
        timestamp: Date.now() - 1000,
        synced: false
      }
    ],
    lastSyncTimestamp: Date.now() - 5000,
    offlineChangesCount: 1,
    syncStatus: 'online',
    maxOfflineChanges: 50,
    ...overrides
  };
}

// Mock Convex integration service
export class MockConvexIntegrationService {
  private mockData = {
    orbPreferences: createMockOrbPreferences(),
    strainData: createMockStrainData(),
    watchInterfaceState: createMockWatchInterfaceState(),
    audioDevices: [createMockAudioDeviceInfo()],
    watchSyncData: createMockWatchSyncData()
  };

  private subscribers: {
    orbPreferences: Array<(data: OrbPreferences | null) => void>;
    strainData: Array<(data: StrainData | null) => void>;
    watchInterfaceState: Array<(data: WatchInterfaceState | null) => void>;
    audioDevices: Array<(data: AudioDeviceInfo[]) => void>;
    watchSyncData: Array<(data: WatchSyncData | null) => void>;
  } = {
    orbPreferences: [],
    strainData: [],
    watchInterfaceState: [],
    audioDevices: [],
    watchSyncData: []
  };

  async getOrbPreferences(_userId: string): Promise<OrbPreferences | null> {
    return Promise.resolve(this.mockData.orbPreferences);
  }

  async updateOrbPreferences(preferences: OrbPreferences): Promise<boolean> {
    this.mockData.orbPreferences = { ...this.mockData.orbPreferences, ...preferences };
    this.notifySubscribers('orbPreferences', this.mockData.orbPreferences);
    return Promise.resolve(true);
  }

  subscribeToOrbPreferences(_userId: string, callback: (preferences: OrbPreferences | null) => void) {
    this.subscribers.orbPreferences.push(callback);
    callback(this.mockData.orbPreferences);
    return () => {
      const arr = this.subscribers.orbPreferences;
      const idx = arr.indexOf(callback);
      if (idx >= 0) arr.splice(idx, 1);
    };
  }

  // Strain Data Mock Methods
  async getCurrentStrainData(_userId: string): Promise<StrainData | null> {
    return Promise.resolve(this.mockData.strainData);
  }

  async updateStrainData(strainData: StrainData): Promise<boolean> {
    this.mockData.strainData = { ...this.mockData.strainData, ...strainData };
    this.notifySubscribers('strainData', this.mockData.strainData);
    return Promise.resolve(true);
  }

  subscribeToStrainData(_userId: string, callback: (strainData: StrainData | null) => void) {
    this.subscribers.strainData.push(callback);
    callback(this.mockData.strainData);
    return () => {
      const arr = this.subscribers.strainData;
      const idx = arr.indexOf(callback);
      if (idx >= 0) arr.splice(idx, 1);
    };
  }

  // Watch Interface Mock Methods
  async getWatchInterfaceState(_userId: string): Promise<WatchInterfaceState | null> {
    return Promise.resolve(this.mockData.watchInterfaceState);
  }

  async updateWatchInterfaceState(state: WatchInterfaceState): Promise<boolean> {
    this.mockData.watchInterfaceState = { ...this.mockData.watchInterfaceState, ...state };
    this.notifySubscribers('watchInterfaceState', this.mockData.watchInterfaceState);
    return Promise.resolve(true);
  }

  subscribeToWatchInterfaceState(_userId: string, callback: (state: WatchInterfaceState | null) => void) {
    this.subscribers.watchInterfaceState.push(callback);
    callback(this.mockData.watchInterfaceState);
    return () => {
      const arr = this.subscribers.watchInterfaceState;
      const idx = arr.indexOf(callback);
      if (idx >= 0) arr.splice(idx, 1);
    };
  }

  // Audio Device Mock Methods
  async getAudioDevices(_userId: string): Promise<AudioDeviceInfo[]> {
    return Promise.resolve(this.mockData.audioDevices);
  }

  async updateAudioDevice(deviceInfo: AudioDeviceInfo): Promise<boolean> {
    const index = this.mockData.audioDevices.findIndex(d => d.deviceId === deviceInfo.deviceId);
    if (index >= 0) {
      this.mockData.audioDevices[index] = { ...this.mockData.audioDevices[index], ...deviceInfo };
    } else {
      this.mockData.audioDevices.push(deviceInfo);
    }
    this.notifySubscribers('audioDevices', this.mockData.audioDevices);
    return Promise.resolve(true);
  }

  subscribeToAudioDevices(_userId: string, callback: (devices: AudioDeviceInfo[]) => void) {
    this.subscribers.audioDevices.push(callback);
    callback(this.mockData.audioDevices);
    return () => {
      const arr = this.subscribers.audioDevices;
      const idx = arr.indexOf(callback);
      if (idx >= 0) arr.splice(idx, 1);
    };
  }

  // Watch Sync Mock Methods
  async getWatchSyncData(_userId: string): Promise<WatchSyncData | null> {
    return Promise.resolve(this.mockData.watchSyncData);
  }

  async updateWatchSyncData(syncData: WatchSyncData): Promise<boolean> {
    this.mockData.watchSyncData = { ...this.mockData.watchSyncData, ...syncData };
    this.notifySubscribers('watchSyncData', this.mockData.watchSyncData);
    return Promise.resolve(true);
  }

  subscribeToWatchSyncData(_userId: string, callback: (syncData: WatchSyncData | null) => void) {
    this.subscribers.watchSyncData.push(callback);
    callback(this.mockData.watchSyncData);
    return () => {
      const arr = this.subscribers.watchSyncData;
      const idx = arr.indexOf(callback);
      if (idx >= 0) arr.splice(idx, 1);
    };
  }

  // Batch operations
  async batchUpdatePreferences(updates: any, _userId: string): Promise<boolean> {
    if (updates.orb) {
      const orb = { ...this.mockData.orbPreferences, ...updates.orb } as OrbPreferences;
      await this.updateOrbPreferences(orb);
    }
    if (updates.strain) {
      const strain = { ...this.mockData.strainData, ...updates.strain } as StrainData;
      await this.updateStrainData(strain);
    }
    if (updates.watch) {
      const watch = { ...this.mockData.watchInterfaceState, ...updates.watch } as WatchInterfaceState;
      await this.updateWatchInterfaceState(watch);
    }
    if (updates.sync) {
      const sync = { ...this.mockData.watchSyncData, ...updates.sync } as WatchSyncData;
      await this.updateWatchSyncData(sync);
    }
    return Promise.resolve(true);
  }

  // Notify correct subscribers for each key
  private notifySubscribers(
    key: keyof MockConvexIntegrationService['subscribers'],
    data: OrbPreferences | StrainData | WatchInterfaceState | AudioDeviceInfo[] | WatchSyncData | null
  ): void {
    switch (key) {
      case 'orbPreferences':
        this.subscribers.orbPreferences.forEach(cb => cb(data as OrbPreferences | null));
        break;
      case 'strainData':
        this.subscribers.strainData.forEach(cb => cb(data as StrainData | null));
        break;
      case 'watchInterfaceState':
        this.subscribers.watchInterfaceState.forEach(cb => cb(data as WatchInterfaceState | null));
        break;
      case 'audioDevices':
        this.subscribers.audioDevices.forEach(cb => cb(data as AudioDeviceInfo[]));
        break;
      case 'watchSyncData':
        this.subscribers.watchSyncData.forEach(cb => cb(data as WatchSyncData | null));
        break;
    }
  }

  // Test utilities
  setMockData(key: keyof typeof this.mockData, data: unknown) {
    (this.mockData as Record<string, unknown>)[key] = data;
    switch (key) {
      case 'orbPreferences':
        this.notifySubscribers('orbPreferences', data as OrbPreferences | null);
        break;
      case 'strainData':
        this.notifySubscribers('strainData', data as StrainData | null);
        break;
      case 'watchInterfaceState':
        this.notifySubscribers('watchInterfaceState', data as WatchInterfaceState | null);
        break;
      case 'audioDevices':
        this.notifySubscribers('audioDevices', data as AudioDeviceInfo[]);
        break;
      case 'watchSyncData':
        this.notifySubscribers('watchSyncData', data as WatchSyncData | null);
        break;
    }
  }

  resetMockData() {
    this.mockData = {
      orbPreferences: createMockOrbPreferences(),
      strainData: createMockStrainData(),
      watchInterfaceState: createMockWatchInterfaceState(),
      audioDevices: [createMockAudioDeviceInfo()],
      watchSyncData: createMockWatchSyncData()
    };
  }

  simulateNetworkError() {
    // Mock network failure for testing error handling
    vi.spyOn(this, 'updateOrbPreferences').mockRejectedValueOnce(new Error('Network error'));
    vi.spyOn(this, 'updateStrainData').mockRejectedValueOnce(new Error('Network error'));
  }
}

// Global mock instance for tests
export const mockConvexService = new MockConvexIntegrationService();

// Mock context utilities
export function createMockConvexContext() {
  return {
    client: null,
    service: mockConvexService,
    isInitialized: true,
    error: null
  };
}

// Vitest setup helpers
export function setupMockConvex() {
  beforeEach(() => {
    mockConvexService.resetMockData();
    vi.clearAllMocks();
  });

  return mockConvexService;
}

// Color calculation mocks for testing
export const mockColorCalculations = {
  calculateStrainAdjustedColor: vi.fn((baseColor: { h: number; s: number; l: number }, strain: number) => {
    if (strain < 90) {
      return { h: baseColor.h, s: baseColor.s, l: Math.min(70, baseColor.l + 20) };
    } else if (strain <= 100) {
      return baseColor;
    } else {
      return { h: baseColor.h, s: baseColor.s, l: Math.max(30, baseColor.l - 20) };
    }
  }),

  hslToRgb: vi.fn((h: number, s: number, l: number) => ({
    r: Math.round(255 * l / 100),
    g: Math.round(255 * l / 100),
    b: Math.round(255 * l / 100)
  })),

  rgbToHex: vi.fn((r: number, g: number, b: number) => 
    `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  )
};

// DOM testing utilities
export function createMockDOM() {
  const createElement = vi.fn((tagName: string) => {
    const element = {
      tagName: tagName.toUpperCase(),
      style: {},
      value: '',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      click: vi.fn(),
      focus: vi.fn(),
      blur: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
      classList: {
        add: vi.fn(),
        remove: vi.fn(),
        contains: vi.fn(),
        toggle: vi.fn()
      }
    };
    return element;
  });

  return {
    createElement,
    getElementById: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn()
  };
}

// Storage mocks
export function createMockStorage() {
  const storage = new Map<string, string>();
  
  return {
    getItem: vi.fn((key: string) => storage.get(key) || null),
    setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
    removeItem: vi.fn((key: string) => storage.delete(key)),
    clear: vi.fn(() => storage.clear()),
    get length() { return storage.size; },
    key: vi.fn((index: number) => [...storage.keys()][index] || null)
  };
}