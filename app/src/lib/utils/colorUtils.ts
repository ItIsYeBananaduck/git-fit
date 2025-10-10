/**
 * HSL Color Utilities
 * 
 * Purpose: Color conversion and manipulation functions for Alice orb customization
 * Features:
 * - HSL to RGB/Hex conversions
 * - Color validation and normalization
 * - Strain-based color adjustments
 * - Accessibility and contrast calculations
 */

/**
 * Type Definitions
 */
export interface HSLColor {
  h: number; // Hue: 0-360 degrees
  s: number; // Saturation: 0-100 percentage
  l: number; // Lightness: 0-100 percentage
}

export interface RGBColor {
  r: number; // Red: 0-255
  g: number; // Green: 0-255
  b: number; // Blue: 0-255
}

export interface HSVColor {
  h: number; // Hue: 0-360 degrees
  s: number; // Saturation: 0-100 percentage
  v: number; // Value: 0-100 percentage
}

/**
 * Validation Functions
 */

/**
 * Validate HSL color values
 * @param hsl - HSL color object
 * @returns Whether the HSL values are valid
 */
export function isValidHSL(hsl: HSLColor): boolean {
  return (
    typeof hsl.h === 'number' && hsl.h >= 0 && hsl.h <= 360 &&
    typeof hsl.s === 'number' && hsl.s >= 0 && hsl.s <= 100 &&
    typeof hsl.l === 'number' && hsl.l >= 0 && hsl.l <= 100
  );
}

/**
 * Validate RGB color values
 * @param rgb - RGB color object
 * @returns Whether the RGB values are valid
 */
export function isValidRGB(rgb: RGBColor): boolean {
  return (
    typeof rgb.r === 'number' && rgb.r >= 0 && rgb.r <= 255 &&
    typeof rgb.g === 'number' && rgb.g >= 0 && rgb.g <= 255 &&
    typeof rgb.b === 'number' && rgb.b >= 0 && rgb.b <= 255
  );
}

/**
 * Validate hex color string
 * @param hex - Hex color string
 * @returns Whether the hex string is valid
 */
export function isValidHex(hex: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

/**
 * Color Conversion Functions
 */

/**
 * Convert HSL to RGB
 * @param hsl - HSL color object
 * @returns RGB color object
 */
export function hslToRgb(hsl: HSLColor): RGBColor {
  if (!isValidHSL(hsl)) {
    throw new Error(`Invalid HSL color: ${JSON.stringify(hsl)}`);
  }

  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // Achromatic (grayscale)
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Convert RGB to HSL
 * @param rgb - RGB color object
 * @returns HSL color object
 */
export function rgbToHsl(rgb: RGBColor): HSLColor {
  if (!isValidRGB(rgb)) {
    throw new Error(`Invalid RGB color: ${JSON.stringify(rgb)}`);
  }

  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h: number, s: number;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // Achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
      default: h = 0;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex string
 * @param hsl - HSL color object
 * @returns Hex color string (e.g., "#FF6B35")
 */
export function hslToHex(hsl: HSLColor): string {
  const rgb = hslToRgb(hsl);
  return rgbToHex(rgb);
}

/**
 * Convert RGB to hex string
 * @param rgb - RGB color object
 * @returns Hex color string (e.g., "#FF6B35")
 */
export function rgbToHex(rgb: RGBColor): string {
  if (!isValidRGB(rgb)) {
    throw new Error(`Invalid RGB color: ${JSON.stringify(rgb)}`);
  }

  const toHex = (n: number): string => {
    const hex = Math.round(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
}

/**
 * Convert hex string to RGB
 * @param hex - Hex color string (e.g., "#FF6B35" or "#F63")
 * @returns RGB color object
 */
export function hexToRgb(hex: string): RGBColor {
  if (!isValidHex(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  // Remove the hash symbol
  const cleanHex = hex.slice(1);
  
  // Handle 3-character hex codes
  if (cleanHex.length === 3) {
    return {
      r: parseInt(cleanHex[0] + cleanHex[0], 16),
      g: parseInt(cleanHex[1] + cleanHex[1], 16),
      b: parseInt(cleanHex[2] + cleanHex[2], 16),
    };
  }
  
  // Handle 6-character hex codes
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16),
  };
}

/**
 * Convert hex string to HSL
 * @param hex - Hex color string
 * @returns HSL color object
 */
export function hexToHsl(hex: string): HSLColor {
  const rgb = hexToRgb(hex);
  return rgbToHsl(rgb);
}

/**
 * Strain-Based Color Adjustment Functions
 */

/**
 * Calculate adjusted orb color based on workout strain
 * @param baseHue - User's preferred hue (0-360)
 * @param currentStrain - Current workout intensity (0-120)
 * @param options - Color adjustment options
 * @returns Adjusted HSL color
 */
export function calculateStrainAdjustedColor(
  baseHue: number,
  currentStrain: number,
  options: {
    maxLightnessAdjustment?: number; // Default: 20
    saturation?: number; // Default: 100
    baseLightness?: number; // Default: 50
  } = {}
): HSLColor {
  if (baseHue < 0 || baseHue > 360) {
    throw new Error(`Invalid hue value: ${baseHue}. Must be 0-360.`);
  }
  
  if (currentStrain < 0 || currentStrain > 120) {
    throw new Error(`Invalid strain value: ${currentStrain}. Must be 0-120.`);
  }

  const {
    maxLightnessAdjustment = 20,
    saturation = 100,
    baseLightness = 50,
  } = options;

  let lightness = baseLightness;

  // Strain-based lightness adjustment
  if (currentStrain < 90) {
    // Low strain: Lighten by percentage of max adjustment
    const strainRatio = currentStrain / 90;
    const adjustment = maxLightnessAdjustment * (1 - strainRatio);
    lightness = Math.min(baseLightness + adjustment, 100);
  } else if (currentStrain >= 90 && currentStrain <= 100) {
    // Target strain: Use exact base lightness
    lightness = baseLightness;
  } else {
    // High strain: Darken by percentage of max adjustment
    const overStrainRatio = (currentStrain - 100) / 20; // 0-1 for strain 100-120
    const adjustment = maxLightnessAdjustment * overStrainRatio;
    lightness = Math.max(baseLightness - adjustment, 0);
  }

  return {
    h: Math.round(baseHue),
    s: Math.round(saturation),
    l: Math.round(lightness),
  };
}

/**
 * Create a smooth color transition for animations
 * @param fromColor - Starting HSL color
 * @param toColor - Target HSL color
 * @param progress - Transition progress (0-1)
 * @returns Interpolated HSL color
 */
export function interpolateHSL(fromColor: HSLColor, toColor: HSLColor, progress: number): HSLColor {
  if (!isValidHSL(fromColor) || !isValidHSL(toColor)) {
    throw new Error('Invalid HSL colors for interpolation');
  }
  
  if (progress < 0 || progress > 1) {
    throw new Error(`Invalid progress value: ${progress}. Must be 0-1.`);
  }

  // Handle hue interpolation (shortest path around color wheel)
  let hueDiff = toColor.h - fromColor.h;
  if (hueDiff > 180) hueDiff -= 360;
  if (hueDiff < -180) hueDiff += 360;
  const interpolatedHue = (fromColor.h + hueDiff * progress + 360) % 360;

  return {
    h: Math.round(interpolatedHue),
    s: Math.round(fromColor.s + (toColor.s - fromColor.s) * progress),
    l: Math.round(fromColor.l + (toColor.l - fromColor.l) * progress),
  };
}

/**
 * Color Accessibility Functions
 */

/**
 * Calculate relative luminance of a color (for contrast calculations)
 * @param rgb - RGB color object
 * @returns Relative luminance (0-1)
 */
export function getRelativeLuminance(rgb: RGBColor): number {
  if (!isValidRGB(rgb)) {
    throw new Error(`Invalid RGB color: ${JSON.stringify(rgb)}`);
  }

  const toLinear = (value: number): number => {
    const normalized = value / 255;
    return normalized <= 0.03928 
      ? normalized / 12.92 
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  };

  const r = toLinear(rgb.r);
  const g = toLinear(rgb.g);
  const b = toLinear(rgb.b);

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 - First RGB color
 * @param color2 - Second RGB color
 * @returns Contrast ratio (1-21)
 */
export function getContrastRatio(color1: RGBColor, color2: RGBColor): number {
  const lum1 = getRelativeLuminance(color1);
  const lum2 = getRelativeLuminance(color2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if a color meets WCAG contrast requirements
 * @param foreground - Foreground RGB color
 * @param background - Background RGB color
 * @param level - WCAG level ('AA' or 'AAA')
 * @returns Whether the contrast meets requirements
 */
export function meetsContrastRequirement(
  foreground: RGBColor,
  background: RGBColor,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const minRatio = level === 'AAA' ? 7 : 4.5;
  return ratio >= minRatio;
}

/**
 * Utility Functions
 */

/**
 * Normalize hue value to 0-360 range
 * @param hue - Hue value (any number)
 * @returns Normalized hue (0-360)
 */
export function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360;
}

/**
 * Clamp value to a range
 * @param value - Value to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns Clamped value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Generate complementary color (opposite on color wheel)
 * @param hsl - Base HSL color
 * @returns Complementary HSL color
 */
export function getComplementaryColor(hsl: HSLColor): HSLColor {
  if (!isValidHSL(hsl)) {
    throw new Error(`Invalid HSL color: ${JSON.stringify(hsl)}`);
  }

  return {
    h: (hsl.h + 180) % 360,
    s: hsl.s,
    l: hsl.l,
  };
}

/**
 * Generate triadic colors (120° apart on color wheel)
 * @param hsl - Base HSL color
 * @returns Array of triadic HSL colors
 */
export function getTriadicColors(hsl: HSLColor): [HSLColor, HSLColor, HSLColor] {
  if (!isValidHSL(hsl)) {
    throw new Error(`Invalid HSL color: ${JSON.stringify(hsl)}`);
  }

  return [
    hsl,
    { h: (hsl.h + 120) % 360, s: hsl.s, l: hsl.l },
    { h: (hsl.h + 240) % 360, s: hsl.s, l: hsl.l },
  ];
}

/**
 * Generate analogous colors (adjacent on color wheel)
 * @param hsl - Base HSL color
 * @param angle - Angle between colors (default: 30°)
 * @returns Array of analogous HSL colors
 */
export function getAnalogousColors(hsl: HSLColor, angle: number = 30): [HSLColor, HSLColor, HSLColor] {
  if (!isValidHSL(hsl)) {
    throw new Error(`Invalid HSL color: ${JSON.stringify(hsl)}`);
  }

  return [
    { h: normalizeHue(hsl.h - angle), s: hsl.s, l: hsl.l },
    hsl,
    { h: normalizeHue(hsl.h + angle), s: hsl.s, l: hsl.l },
  ];
}

/**
 * Format HSL color as CSS string
 * @param hsl - HSL color object
 * @returns CSS HSL string (e.g., "hsl(195, 100%, 50%)")
 */
export function formatHSLAsCSS(hsl: HSLColor): string {
  if (!isValidHSL(hsl)) {
    throw new Error(`Invalid HSL color: ${JSON.stringify(hsl)}`);
  }
  
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
}

/**
 * Format RGB color as CSS string
 * @param rgb - RGB color object
 * @returns CSS RGB string (e.g., "rgb(255, 107, 53)")
 */
export function formatRGBAsCSS(rgb: RGBColor): string {
  if (!isValidRGB(rgb)) {
    throw new Error(`Invalid RGB color: ${JSON.stringify(rgb)}`);
  }
  
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}

/**
 * Parse CSS color string to RGB
 * @param cssColor - CSS color string (hex, rgb, hsl)
 * @returns RGB color object
 */
export function parseCSSColor(cssColor: string): RGBColor {
  const trimmed = cssColor.trim();
  
  // Handle hex colors
  if (trimmed.startsWith('#')) {
    return hexToRgb(trimmed);
  }
  
  // Handle rgb colors
  const rgbMatch = trimmed.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }
  
  // Handle hsl colors
  const hslMatch = trimmed.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/);
  if (hslMatch) {
    const hsl: HSLColor = {
      h: parseInt(hslMatch[1], 10),
      s: parseInt(hslMatch[2], 10),
      l: parseInt(hslMatch[3], 10),
    };
    return hslToRgb(hsl);
  }
  
  throw new Error(`Unsupported CSS color format: ${cssColor}`);
}

/**
 * Default colors for Alice orb
 */
export const DEFAULT_ALICE_COLORS = {
  DEFAULT_HUE: 195, // DeepSkyBlue #00BFFF
  SATURATION: 100,
  LIGHTNESS: 50,
  
  // Predefined color themes
  THEMES: {
    ocean: { h: 195, s: 100, l: 50 }, // Default blue
    forest: { h: 120, s: 100, l: 40 }, // Green
    sunset: { h: 20, s: 100, l: 50 },  // Orange
    lavender: { h: 280, s: 100, l: 70 }, // Purple
    rose: { h: 350, s: 100, l: 60 },   // Pink
    amber: { h: 45, s: 100, l: 50 },   // Yellow
  },
} as const;

/**
 * Error classes
 */
export class ColorValidationError extends Error {
  constructor(message: string) {
    super(`Color validation error: ${message}`);
    this.name = 'ColorValidationError';
  }
}

export class ColorConversionError extends Error {
  constructor(message: string) {
    super(`Color conversion error: ${message}`);
    this.name = 'ColorConversionError';
  }
}