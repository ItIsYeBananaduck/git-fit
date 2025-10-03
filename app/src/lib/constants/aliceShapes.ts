/**
 * Alice Ferrofluid Shape Definitions
 * 
 * SVG path definitions for Alice's three morphing shapes:
 * - Neutral: Calm blob state
 * - Rhythmic: Pulsing workout state  
 * - Intense: High-energy state
 */

export interface AliceShapeDefinition {
  id: string;
  name: string;
  description: string;
  path: string;
  strokeDasharray?: string;
  strokeDashoffset?: string;
  animationDuration: number; // ms
  energyLevel: number; // 0-1
}

// Neutral blob - calm, organic resting state
export const NEUTRAL_SHAPE: AliceShapeDefinition = {
  id: 'neutral',
  name: 'Neutral Blob',
  description: 'Calm, resting ferrofluid state',
  path: 'M60,30 C85,30 105,50 105,75 C105,100 85,120 60,120 C35,120 15,100 15,75 C15,50 35,30 60,30 Z',
  animationDuration: 800,
  energyLevel: 0.2
};

// Rhythmic pulse - moderate workout intensity
export const RHYTHMIC_SHAPE: AliceShapeDefinition = {
  id: 'rhythmic',
  name: 'Rhythmic Pulse',
  description: 'Pulsing ferrofluid for moderate workout intensity',
  path: 'M60,25 C90,25 115,45 115,75 C115,85 110,95 100,105 L85,115 C75,120 65,120 55,115 L40,105 C30,95 25,85 25,75 C25,45 30,25 60,25 Z M60,40 C75,40 85,50 85,65 C85,80 75,90 60,90 C45,90 35,80 35,65 C35,50 45,40 60,40 Z',
  strokeDasharray: '5,3',
  strokeDashoffset: '0',
  animationDuration: 600,
  energyLevel: 0.6
};

// Intense spikes - high energy workout state
export const INTENSE_SHAPE: AliceShapeDefinition = {
  id: 'intense',
  name: 'Intense Spikes',
  description: 'High-energy ferrofluid with dynamic spikes',
  path: 'M60,15 L70,25 L90,20 L95,35 L110,30 L105,50 L120,55 L100,70 L115,85 L95,90 L90,105 L75,100 L60,120 L45,100 L30,105 L25,90 L5,85 L20,70 L0,55 L15,50 L10,30 L25,35 L30,20 L50,25 Z M60,35 C75,35 85,45 85,60 C85,75 75,85 60,85 C45,85 35,75 35,60 C35,45 45,35 60,35 Z',
  strokeDasharray: '3,2',
  strokeDashoffset: '0',
  animationDuration: 400,
  energyLevel: 0.9
};

// Shape collection for easy access
export const ALICE_SHAPES = {
  neutral: NEUTRAL_SHAPE,
  rhythmic: RHYTHMIC_SHAPE,
  intense: INTENSE_SHAPE
} as const;

// Shape array for iteration
export const ALICE_SHAPE_LIST = [
  NEUTRAL_SHAPE,
  RHYTHMIC_SHAPE,
  INTENSE_SHAPE
];

// Strain-based shape selection logic
export function getShapeByStrain(strain: number): AliceShapeDefinition {
  if (strain < 30) return NEUTRAL_SHAPE;
  if (strain < 70) return RHYTHMIC_SHAPE;
  return INTENSE_SHAPE;
}

// Smooth transition path interpolation for morphing
export function interpolateShapePaths(
  fromShape: AliceShapeDefinition,
  toShape: AliceShapeDefinition,
  progress: number // 0-1
): string {
  // For now, return discrete shapes
  // TODO: Implement actual path interpolation with anime.js
  return progress < 0.5 ? fromShape.path : toShape.path;
}

// Electric blue ferrofluid color variations
export const ALICE_COLORS = {
  primary: '#00bfff',      // Electric blue
  accent: '#ffffff',       // White
  glow: '#4df7ff',         // Bright cyan glow
  shadow: '#0080cc',       // Darker blue shadow
  offline: '#666666',      // Gray when offline
  pulse: '#ff6b6b'         // Red for alerts/high intensity
} as const;

// SVG gradient definitions for ferrofluid effect
export const ALICE_GRADIENTS = {
  electric: {
    id: 'electric-gradient',
    stops: [
      { offset: '0%', color: '#4df7ff', opacity: 0.8 },
      { offset: '50%', color: '#00bfff', opacity: 1.0 },
      { offset: '100%', color: '#0080cc', opacity: 0.9 }
    ]
  },
  glow: {
    id: 'glow-gradient',
    stops: [
      { offset: '0%', color: '#ffffff', opacity: 0.3 },
      { offset: '70%', color: '#4df7ff', opacity: 0.6 },
      { offset: '100%', color: '#00bfff', opacity: 0.1 }
    ]
  },
  offline: {
    id: 'offline-gradient',
    stops: [
      { offset: '0%', color: '#999999', opacity: 0.5 },
      { offset: '50%', color: '#666666', opacity: 0.8 },
      { offset: '100%', color: '#333333', opacity: 0.6 }
    ]
  }
} as const;