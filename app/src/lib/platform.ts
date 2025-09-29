import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

export type Platform = 'ios' | 'android' | 'web';

export interface DeviceCapabilities {
  platform: Platform;
  version: string;
  model?: string;
  screenSize: {
    width: number;
    height: number;
    density: number;
  };
  capabilities: {
    hasNotch: boolean;
    hasHomeIndicator: boolean;
    supportsDarkMode: boolean;
    supportsHaptics: boolean;
  };
}

export interface PlatformContext {
  platform: Platform;
  isNative: boolean;
  isWeb: boolean;
  isMobile: boolean;
  capabilities: DeviceCapabilities;
}

// Cached platform context
let platformContext: PlatformContext | null = null;

// Detect current platform and capabilities
export async function detectPlatform(): Promise<PlatformContext> {
  if (platformContext) {
    return platformContext;
  }

  const platform = Capacitor.getPlatform() as Platform;
  const isNative = Capacitor.isNativePlatform();
  const isWeb = !isNative;
  const isMobile = platform === 'ios' || platform === 'android';

  let capabilities: DeviceCapabilities;

  if (isNative) {
    // Get device info from Capacitor
    const deviceInfo = await Device.getInfo();
    
    capabilities = {
      platform: platform,
      version: deviceInfo.osVersion,
      model: deviceInfo.model,
      screenSize: await getScreenSize(),
      capabilities: {
        hasNotch: await hasNotch(platform),
        hasHomeIndicator: await hasHomeIndicator(platform),
        supportsDarkMode: await supportsDarkMode(),
        supportsHaptics: await supportsHaptics(platform)
      }
    };
  } else {
    // Web platform detection
    capabilities = {
      platform: 'web',
      version: getBrowserInfo().version,
      model: getBrowserInfo().name,
      screenSize: getWebScreenSize(),
      capabilities: {
        hasNotch: false,
        hasHomeIndicator: false,
        supportsDarkMode: supportsDarkModeWeb(),
        supportsHaptics: supportsHapticsWeb()
      }
    };
  }

  platformContext = {
    platform,
    isNative,
    isWeb,
    isMobile,
    capabilities
  };

  return platformContext;
}

// Get screen dimensions
async function getScreenSize(): Promise<{ width: number; height: number; density: number }> {
  if (Capacitor.isNativePlatform()) {
    // On native platforms, use screen dimensions
    return {
      width: window.screen.width,
      height: window.screen.height,
      density: window.devicePixelRatio || 1
    };
  } else {
    return getWebScreenSize();
  }
}

function getWebScreenSize(): { width: number; height: number; density: number } {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    density: window.devicePixelRatio || 1
  };
}

// Check if device has notch (iOS X and newer)
async function hasNotch(platform: Platform): Promise<boolean> {
  if (platform === 'ios') {
    const deviceInfo = await Device.getInfo();
    const version = parseFloat(deviceInfo.osVersion);
    
    // iOS 11+ with notch detection
    if (version >= 11) {
      const screenHeight = window.screen.height;
      const screenWidth = window.screen.width;
      
      // Common notch screen dimensions
      const notchDevices = [
        { width: 375, height: 812 }, // iPhone X, XS
        { width: 414, height: 896 }, // iPhone XR, XS Max
        { width: 390, height: 844 }, // iPhone 12, 12 Pro
        { width: 428, height: 926 }, // iPhone 12 Pro Max
        { width: 393, height: 852 }, // iPhone 14
        { width: 430, height: 932 }, // iPhone 14 Pro Max
      ];
      
      return notchDevices.some(device => 
        (screenWidth === device.width && screenHeight === device.height) ||
        (screenHeight === device.width && screenWidth === device.height)
      );
    }
  }
  return false;
}

// Check if device has home indicator (iOS without home button)
async function hasHomeIndicator(platform: Platform): Promise<boolean> {
  if (platform === 'ios') {
    return await hasNotch(platform); // Same devices typically
  }
  return false;
}

// Check dark mode support
async function supportsDarkMode(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    return true; // Both iOS and Android support dark mode
  }
  return supportsDarkModeWeb();
}

function supportsDarkModeWeb(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches !== undefined;
}

// Check haptic feedback support
async function supportsHaptics(platform: Platform): Promise<boolean> {
  if (platform === 'ios' || platform === 'android') {
    return true;
  }
  return false;
}

function supportsHapticsWeb(): boolean {
  return 'vibrate' in navigator;
}

// Get browser information for web platform
function getBrowserInfo(): { name: string; version: string } {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Chrome')) {
    const match = userAgent.match(/Chrome\/(\d+)/);
    return { name: 'Chrome', version: match?.[1] || 'unknown' };
  }
  
  if (userAgent.includes('Firefox')) {
    const match = userAgent.match(/Firefox\/(\d+)/);
    return { name: 'Firefox', version: match?.[1] || 'unknown' };
  }
  
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    const match = userAgent.match(/Version\/(\d+)/);
    return { name: 'Safari', version: match?.[1] || 'unknown' };
  }
  
  return { name: 'Unknown', version: 'unknown' };
}

// Check if running in specific platform context
export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android';
}

export function isWeb(): boolean {
  return Capacitor.getPlatform() === 'web';
}

export function isMobile(): boolean {
  return isIOS() || isAndroid();
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

// Get platform-specific OAuth redirect URI
export function getOAuthRedirectURI(providerId: string): string {
  const platform = Capacitor.getPlatform();
  const baseUrl = import.meta.env.VITE_APP_BASE_URL || 'http://localhost:5173';
  
  if (platform === 'ios' || platform === 'android') {
    // Use custom URL scheme for native apps
    return `gitfit://oauth/callback/${providerId}`;
  }
  
  // Web platform
  return `${baseUrl}/oauth/callback/${providerId}`;
}

// Get platform-specific UI preferences
export function getPlatformUIDefaults(platform: Platform) {
  switch (platform) {
    case 'ios':
      return {
        theme: 'system',
        animations: true,
        hapticFeedback: true,
        useSystemColors: true,
        preferLargeText: false,
        voiceOverOptimized: false
      };
      
    case 'android':
      return {
        theme: 'system',
        animations: true,
        hapticFeedback: true,
        materialYou: true,
        adaptiveIcons: true,
        edgeToEdge: false
      };
      
    case 'web':
      return {
        theme: 'system',
        animations: true,
        hapticFeedback: false,
        keyboardShortcuts: true,
        desktopNotifications: true,
        fullscreenMode: false
      };
      
    default:
      return {
        theme: 'light',
        animations: true,
        hapticFeedback: false
      };
  }
}

// Clear cached platform context (for testing)
export function clearPlatformCache(): void {
  platformContext = null;
}