/**
 * Alice Color System Utilities
 * 
 * Provides color manipulation and customization for Alice AI companion
 */

import type { AliceConfig } from '$types/alice.js';

// Color format validation
export function isValidHexColor(color: string): boolean {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

export function isValidRgbColor(color: string): boolean {
  return /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/.test(color);
}

export function isValidRgbaColor(color: string): boolean {
  return /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/.test(color);
}

export function isValidColor(color: string): boolean {
  return isValidHexColor(color) || isValidRgbColor(color) || isValidRgbaColor(color);
}

// Color conversion utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r: number, g: number, b: number;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  };
}

// Alice-specific color utilities
export function generateAliceColorScheme(primaryColor: string): {
  primary: string;
  accent: string;
  glow: string;
  shadow: string;
  gradient: Array<{ offset: string; color: string; opacity: number }>;
} {
  const rgb = hexToRgb(primaryColor);
  if (!rgb) {
    throw new Error('Invalid primary color');
  }

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Generate complementary colors
  const glowHsl = { ...hsl, l: Math.min(hsl.l + 20, 90), s: Math.min(hsl.s + 10, 100) };
  const shadowHsl = { ...hsl, l: Math.max(hsl.l - 30, 10) };
  const accentHsl = { h: (hsl.h + 180) % 360, s: 80, l: 85 };

  const glowRgb = hslToRgb(glowHsl.h, glowHsl.s, glowHsl.l);
  const shadowRgb = hslToRgb(shadowHsl.h, shadowHsl.s, shadowHsl.l);
  const accentRgb = hslToRgb(accentHsl.h, accentHsl.s, accentHsl.l);

  return {
    primary: primaryColor,
    accent: rgbToHex(accentRgb.r, accentRgb.g, accentRgb.b),
    glow: rgbToHex(glowRgb.r, glowRgb.g, glowRgb.b),
    shadow: rgbToHex(shadowRgb.r, shadowRgb.g, shadowRgb.b),
    gradient: [
      { offset: '0%', color: rgbToHex(glowRgb.r, glowRgb.g, glowRgb.b), opacity: 0.8 },
      { offset: '50%', color: primaryColor, opacity: 1.0 },
      { offset: '100%', color: rgbToHex(shadowRgb.r, shadowRgb.g, shadowRgb.b), opacity: 0.9 }
    ]
  };
}

// Apply user color preferences
export function applyAliceColorConfig(config: AliceConfig): {
  cssVariables: Record<string, string>;
  svgGradientStops: Array<{ offset: string; color: string; opacity: number }>;
} {
  const scheme = generateAliceColorScheme(config.primaryColor);
  
  return {
    cssVariables: {
      '--alice-primary': scheme.primary,
      '--alice-accent': config.accentColor,
      '--alice-glow': scheme.glow,
      '--alice-shadow': scheme.shadow,
      '--alice-size': getSizePixels(config.size)
    },
    svgGradientStops: scheme.gradient
  };
}

// Size configuration
export function getSizePixels(size: AliceConfig['size']): string {
  switch (size) {
    case 'small': return '80px';
    case 'medium': return '120px';
    case 'large': return '160px';
    default: return '120px';
  }
}

// Generate strain-based color variations
export function getStrainColor(strain: number, baseColor: string): string {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return baseColor;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Adjust saturation and lightness based on strain
  const adjustedHsl = {
    h: hsl.h,
    s: Math.min(hsl.s + (strain * 0.3), 100), // Increase saturation with strain
    l: Math.max(hsl.l - (strain * 0.1), 20)    // Decrease lightness slightly with strain
  };

  const adjustedRgb = hslToRgb(adjustedHsl.h, adjustedHsl.s, adjustedHsl.l);
  return rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
}

// Animation color transitions
export function createColorTransition(
  fromColor: string,
  toColor: string,
  progress: number // 0-1
): string {
  const fromRgb = hexToRgb(fromColor);
  const toRgb = hexToRgb(toColor);
  
  if (!fromRgb || !toRgb) {
    return progress < 0.5 ? fromColor : toColor;
  }

  const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * progress);
  const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * progress);
  const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * progress);

  return rgbToHex(r, g, b);
}

// Accessibility helpers
export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return '#ffffff';

  // Calculate luminance
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  
  // Return white or black based on contrast
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export function ensureContrast(color: string, minContrast = 4.5): string {
  // Simplified contrast adjustment
  const rgb = hexToRgb(color);
  if (!rgb) return color;

  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  
  // Adjust lightness to ensure contrast
  const adjustedL = hsl.l < 50 ? Math.max(hsl.l, 20) : Math.min(hsl.l, 80);
  const adjustedRgb = hslToRgb(hsl.h, hsl.s, adjustedL);
  
  return rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
}