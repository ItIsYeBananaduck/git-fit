import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Type declarations for testing globals
declare global {
  interface Window {
    Capacitor: typeof mockCapacitor;
  }
  const Capacitor: typeof mockCapacitor;
}

// Mock Capacitor for testing
const mockCapacitor = {
  Plugins: {
    Haptics: {
      impact: vi.fn(),
      notification: vi.fn(),
      selection: vi.fn(),
    },
    Camera: {
      getPhoto: vi.fn(),
      requestPermissions: vi.fn(),
    },
    BiometricAuth: {
      isAvailable: vi.fn(),
      authenticate: vi.fn(),
    },
    Device: {
      getInfo: vi.fn(() => Promise.resolve({
        platform: 'web',
        operatingSystem: 'unknown',
        osVersion: 'unknown',
        model: 'unknown',
        manufacturer: 'unknown',
        isVirtual: false,
        memUsed: 0,
        diskFree: 0,
        diskTotal: 0,
        realDiskFree: 0,
        realDiskTotal: 0,
      })),
    },
  },
  getPlatform: vi.fn(() => 'web'),
  isNativePlatform: vi.fn(() => false),
  registerPlugin: vi.fn(),
};

// Global mocks for mobile testing
Object.defineProperty(globalThis, 'Capacitor', {
  value: mockCapacitor,
  writable: true,
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock device-specific APIs
Object.defineProperty(window, 'DeviceMotionEvent', {
  writable: true,
  value: vi.fn(),
});

Object.defineProperty(window, 'DeviceOrientationEvent', {
  writable: true,
  value: vi.fn(),
});

// Mock localStorage for offline testing
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch for offline testing
global.fetch = vi.fn();