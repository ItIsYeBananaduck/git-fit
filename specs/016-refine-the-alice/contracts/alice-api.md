# Alice Orb API Contracts

## Convex Functions

### alice:updateState

**Purpose**: Update Alice's current state based on workout data changes

**Input Schema**:

```typescript
{
  strain: number;           // 0-100, current workout intensity
  isResting: boolean;       // whether in rest period
  restTimeRemaining?: number; // seconds remaining if resting
  setCompletionStatus?: 'good' | 'skip' | 'incomplete';
  musicActive?: boolean;    // whether workout music playing
  earbudsConnected?: boolean; // audio device status
}
```

**Output Schema**:

```typescript
{
  success: boolean;
  aliceState: {
    mood: 'neutral' | 'intense' | 'rhythmic';
    eyeExpression: 'neutral' | 'excited' | 'sad';
    displayMode: 'strain' | 'rest' | 'navigation' | 'offline';
    shouldMorph: boolean;   // true if strain change > 15%
    voiceTrigger?: string;  // voice coaching message if applicable
  }
}
```

**Business Rules**:

- Only trigger morphing if strain change > 15%
- eyeExpression changes only on set completion events
- voiceTrigger only included if earbuds connected

### alice:getUserPreferences

**Purpose**: Retrieve user's Alice customization settings

**Input Schema**:

```typescript
{
  userId: string;
}
```

**Output Schema**:

```typescript
{
  aliceColor: string;       // HSL hue 0-360°
  voiceCoachingEnabled: boolean;
  hapticsEnabled: boolean;
  interactionPreferences: {
    swipeActions: string[]; // custom action order
    enabledGestures: string[]; // tap, swipe, etc.
  };
  lastUpdated: string;      // ISO timestamp
}
```

### alice:updateUserPreferences

**Purpose**: Save user's Alice customization changes

**Input Schema**:

```typescript
{
  userId: string;
  preferences: {
    aliceColor?: string;    // HSL hue 0-360°
    voiceCoachingEnabled?: boolean;
    hapticsEnabled?: boolean;
    interactionPreferences?: {
      swipeActions?: string[];
      enabledGestures?: string[];
    };
  }
}
```

**Output Schema**:

```typescript
{
  success: boolean;
  updatedPreferences: UserPreferences; // full updated object
  error?: string;
}
```

**Validation Rules**:

- aliceColor must be 0-360 or valid CSS color
- Arrays must contain valid action/gesture names only

### alice:getWorkoutMetrics

**Purpose**: Subscribe to real-time workout data for Alice synchronization

**Input Schema**:

```typescript
{
  sessionId: string;
}
```

**Output Schema** (Subscription):

```typescript
{
  currentStrain: number;
  isResting: boolean;
  restStartTime?: string;   // ISO timestamp
  restDuration?: number;    // total seconds
  musicActive: boolean;
  earbudsConnected: boolean;
  performanceMetrics: {
    averageStrain: number;
    peakStrain: number;
    totalSets: number;
    completedSets: number;
  };
  lastUpdated: string;      // ISO timestamp
}
```

## Component Props Interface

### AliceOrb Component

**Purpose**: Enhanced Alice orb with morphing and interaction capabilities

**Props Interface**:

```typescript
interface AliceOrbProps {
  // Visual state
  strain: number; // 0-100 current intensity
  size: number; // diameter in pixels (min 100)
  mood?: "neutral" | "intense" | "rhythmic";
  eyeExpression?: "neutral" | "excited" | "sad";

  // Display content
  displayMode: "strain" | "rest" | "navigation" | "offline";
  eyeText?: string; // text to show in eye
  restTimeRemaining?: number; // countdown seconds

  // User preferences
  userColor?: string; // HSL hue or CSS color
  voiceEnabled?: boolean;
  hapticsEnabled?: boolean;

  // Interaction state
  isInteractive?: boolean; // allows touch/swipe
  availableActions?: string[]; // swipe cycle options
  currentPage?: string; // for context-aware behavior

  // Audio integration
  earbudsConnected?: boolean;
  musicActive?: boolean;
}
```

**Event Emissions**:

```typescript
// Strain changes (for data sync)
strainChange: {
  strain: number;
  timestamp: string;
}

// Morphing lifecycle
morphStart: {
  fromMood: string;
  toMood: string;
}
morphComplete: {
  mood: string;
  duration: number;
}

// User interactions
eyeTap: {
  timestamp: string;
}
swipeGesture: {
  direction: "left" | "right";
  action: string;
}
colorChange: {
  newColor: string;
}

// Voice coaching
voiceRequest: {
  trigger: string;
  context: object;
}

// Performance monitoring
performanceMetric: {
  fps: number;
  renderTime: number;
}
```

### AliceSettings Component

**Purpose**: User preference configuration interface

**Props Interface**:

```typescript
interface AliceSettingsProps {
  currentPreferences: UserPreferences;
  availableColors: string[]; // predefined color options
  availableActions: string[]; // action options for swipe
  onPreferenceChange: (key: string, value: any) => void;
  onReset: () => void; // restore defaults
}
```

## Voice Coaching API

### ElevenLabs Integration

**Purpose**: Generate and stream voice coaching audio

**Generate Audio Endpoint**:

```typescript
POST /api/voice/generate
{
  text: string;              // coaching message content
  voice: string;             // Alice voice ID
  context: {
    intensity: number;       // 0-100 current strain
    eventType: 'encouragement' | 'completion' | 'form_cue' | 'summary';
    userData?: object;       // personalization data
  }
}

Response:
{
  audioUrl: string;          // temporary audio file URL
  duration: number;          // audio length in seconds
  cacheKey: string;          // for repeated messages
}
```

**Coaching Message Templates**:

```typescript
interface CoachingTemplates {
  encouragement: {
    high_intensity: string[]; // strain > 85%
    moderate_intensity: string[]; // strain 50-85%
    low_intensity: string[]; // strain < 50%
  };
  completion: {
    good_set: string[]; // successful completion
    incomplete_set: string[]; // stopped early
    rest_reminder: string[]; // rest period guidance
  };
  form_cues: {
    breathing: string[];
    posture: string[];
    tempo: string[];
  };
  summary: {
    workout_complete: string[];
    personal_record: string[];
    improvement_noted: string[];
  };
}
```

## Error Handling

### API Error Responses

```typescript
interface ApiError {
  success: false;
  error: {
    code: string; // ERROR_CODE
    message: string; // human readable
    details?: object; // debug information
  };
  timestamp: string;
}
```

**Error Codes**:

- `ALICE_STATE_INVALID`: Invalid state transition
- `USER_PREFERENCES_INVALID`: Validation failed
- `WORKOUT_DATA_UNAVAILABLE`: Data sync failure
- `VOICE_GENERATION_FAILED`: Audio synthesis error
- `ANIMATION_PERFORMANCE_DEGRADED`: FPS below threshold

### Offline Behavior

```typescript
interface OfflineState {
  mode: "offline";
  cachedData: {
    lastKnownStrain: number;
    userPreferences: UserPreferences;
    workoutContext?: object;
  };
  limitations: string[]; // disabled features
  reconnectionStatus: "attempting" | "failed" | "unavailable";
}
```
