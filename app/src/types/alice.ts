/**
 * Alice AI Voice Coach Types
 * 
 * Defines the interfaces and types for the Alice AI companion system,
 * including morphing shapes, voice coaching, and interaction states.
 */

// Morphing shapes based on strain levels
export type AliceMorphShape = 'neutral' | 'intense' | 'rhythmic';

// Alice interaction modes
export type AliceInteractionMode = 'idle' | 'listening' | 'speaking' | 'coaching';

// Alice visibility states across pages
export type AliceVisibilityState = 'visible' | 'hidden' | 'minimized';

// Voice coaching response types
export interface VoiceCoachingResponse {
  text: string;
  audioUrl?: string;
  duration?: number;
  emotion: 'encouraging' | 'motivating' | 'celebratory' | 'gentle';
}

// Strain-based morphing context
export interface StrainMorphContext {
  currentStrain: number;
  previousStrain: number;
  strainDelta: number;
  timestamp: number;
}

// Alice AI state interface
export interface AliceAIState {
  // Visual state
  currentShape: AliceMorphShape;
  morphProgress: number;
  isAnimating: boolean;
  
  // Interaction state
  interactionMode: AliceInteractionMode;
  visibilityState: AliceVisibilityState;
  isInteractive: boolean;
  
  // Voice coaching state
  isVoiceEnabled: boolean;
  isSpeaking: boolean;
  currentMessage?: string;
  
  // Data sync state
  lastSyncTimestamp: number;
  isOnline: boolean;
  
  // Page context
  currentPage: string;
  shouldShowOnPage: boolean;
  
  // Enhanced state properties
  id?: string;
  userId?: string;
  targetShape?: AliceMorphShape;
  isMorphing?: boolean;
  isIdle?: boolean;
  emotionalState?: AliceEmotionalState;
  isActive?: boolean;
  currentMode?: 'idle' | 'workout' | 'recovery' | 'coaching';
  morphingConfig?: AliceMorphingConfig;
  workoutSession?: WorkoutSession;
  lastUpdated?: number;
}

// Alice configuration options
export interface AliceConfig {
  // Visual configuration
  primaryColor: string;
  accentColor: string;
  size: 'small' | 'medium' | 'large';
  
  // Voice coaching configuration
  voiceEnabled: boolean;
  coachingFrequency: 'low' | 'medium' | 'high';
  
  // Interaction configuration
  hapticsEnabled: boolean;
  autoHide: boolean;
  
  // Data sync configuration
  syncInterval: number;
  offlineMode: boolean;
}

// Alice event types for global state management
export interface AliceEvents {
  onShapeChange: (newShape: AliceMorphShape) => void;
  onInteractionModeChange: (newMode: AliceInteractionMode) => void;
  onVoiceCoachingTrigger: (context: StrainMorphContext) => void;
  onVisibilityChange: (newState: AliceVisibilityState) => void;
}

// ElevenLabs API types
export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
}

export interface ElevenLabsVoiceRequest {
  text: string;
  voice_settings?: {
    stability: number;
    similarity_boost: number;
  };
}

export interface ElevenLabsVoiceResponse {
  audio_base64: string;
  characters: number;
  request_id: string;
}

// Alice orb position and interaction areas
export interface AlicePosition {
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

// Alice animation state for anime.js integration
export interface AliceAnimationState {
  morphPath: string;
  strokeDasharray: string;
  strokeDashoffset: number;
  fillOpacity: number;
  strokeOpacity: number;
}

// Enhanced strain context with workout phases
export interface EnhancedStrainMorphContext extends StrainMorphContext {
  workoutPhase: 'warmup' | 'active' | 'recovery' | 'cooldown';
  sessionDuration: number;
}

// Alice emotional states
export type AliceEmotionalState = 'neutral' | 'excited' | 'focused' | 'encouraging' | 'celebratory';

// Alice morphing configuration
export interface AliceMorphingConfig {
  autoMorph: boolean;
  strainThreshold: number;
  morphDuration: number;
  enableHaptics: boolean;
}

// Alice user preferences
export interface AlicePreferences {
  userId: string;
  voiceCoachingEnabled: boolean;
  hapticsEnabled: boolean;
  morphingEnabled: boolean;
  colorScheme: string;
  coachingIntensity: 'low' | 'medium' | 'high';
  autoMorphThreshold: number;
  voiceVolume: number;
  lastUpdated: number;
}

// Real-time metrics interface
export interface RealTimeMetrics {
  strain?: number;
  heartRate?: number;
  calories?: number;
  power?: number;
  cadence?: number;
  timestamp: number;
}

// Workout session interface
export interface WorkoutSession {
  id: string;
  userId: string;
  workoutType: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  metrics?: RealTimeMetrics;
}

// Health data interface
export interface HealthData {
  heartRateVariability?: number;
  sleepQuality?: number;
  stressLevel?: number;
  recoveryScore?: number;
  timestamp: number;
}