// TypeScript types for Alice orb color manipulation

export type OrbColorHSL = {
  hue: number; // 0-360
  saturation: number; // 0-100
  lightness: number; // 0-100
};

export interface AliceOrbPreferences {
  userId: string;
  baseColorHue: number;
  customColorEnabled: boolean;
  lastModified: number;
  syncVersion: number;
}

export interface StrainData {
  currentStrain: number;
  timestamp: number;
  isActive: boolean;
  sessionId: string;
}
