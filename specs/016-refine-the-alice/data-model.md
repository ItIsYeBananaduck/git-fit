# Phase 1: Data Model Design

## Core Entities

### Alice AI State

**Purpose**: Represents the current state and appearance of Alice AI companion

**Fields**:

- `mood: 'neutral' | 'intense' | 'rhythmic'` - Current shape morphing state
- `eyeExpression: 'neutral' | 'excited' | 'sad'` - Eye positioning for emotional state
- `displayMode: 'strain' | 'rest' | 'navigation' | 'offline'` - Current information display mode
- `strain: number` - Current workout strain percentage (0-100)
- `restTimeRemaining: number` - Countdown seconds during rest periods
- `isVisible: boolean` - Whether Alice is currently displayed
- `size: number` - Current diameter in pixels (minimum 100px)
- `lastMorphTrigger: number` - Timestamp of last significant strain change for throttling
- `isInteracting: boolean` - Whether user is currently touching/swiping Alice

**Validation Rules**:

- strain must be between 0-100
- size must be >= 100
- restTimeRemaining must be >= 0
- eyeExpression only changes on set completion or significant events

**State Transitions**:

- `neutral` → `intense` when strain > 85%
- `neutral` → `rhythmic` when music active and strain 30-85%
- `intense/rhythmic` → `neutral` when strain < 30% or rest period
- Morphing only triggers when strain change > 15% (from clarifications)

### User Preferences

**Purpose**: Stores user customization settings for Alice appearance and behavior

**Fields**:

- `aliceColor: string` - HSL hue value (0-360°) for main color
- `voiceCoachingEnabled: boolean` - Whether voice features are active
- `hapticsEnabled: boolean` - Whether touch feedback is enabled
- `interactionPreferences: object` - Custom swipe action mappings
- `lastUpdated: timestamp` - When preferences were last modified

**Validation Rules**:

- aliceColor must be valid HSL hue (0-360)
- All boolean fields default to true
- Preferences persist across app sessions via localStorage

**Relationships**:

- One-to-one with user account
- Cached locally for offline access

### Workout Session Data

**Purpose**: Real-time workout metrics that drive Alice's visual responses

**Fields**:

- `currentStrain: number` - Live strain percentage (0-100)
- `isResting: boolean` - Whether in rest period
- `restStartTime: timestamp` - When current rest period began
- `restDuration: number` - Total rest time in seconds
- `setCompletionStatus: 'good' | 'skip' | 'incomplete'` - Last set result
- `musicActive: boolean` - Whether workout music is playing
- `earbudsConnected: boolean` - Audio device connection status
- `sessionStartTime: timestamp` - When workout began
- `performanceMetrics: object` - Historical data for workout summary

**Validation Rules**:

- currentStrain capped at 100% (from spec)
- restDuration typically 30-300 seconds
- performanceMetrics updated on set completion

**State Transitions**:

- Active exercise → Rest period (isResting: false → true)
- Rest period → Active exercise (isResting: true → false)
- Set completion triggers mood evaluation (good/skip affects eyeExpression)

### Interaction Context

**Purpose**: Manages Alice's interactive behavior based on current app state

**Fields**:

- `currentPage: string` - Current route/page identifier
- `availableActions: string[]` - Actions available for swipe cycling
- `selectedActionIndex: number` - Currently highlighted action
- `interactionMode: 'passive' | 'navigation' | 'workout'` - Interaction permissions
- `lastSwipeDirection: 'left' | 'right' | null` - Recent swipe gesture
- `touchStartPosition: {x: number, y: number}` - Initial touch coordinates

**Validation Rules**:

- availableActions for home page: ['Workouts', 'Nutrition', 'Progress', 'Settings']
- selectedActionIndex must be valid array index
- interactionMode 'workout' locks swipe actions during active exercise

**Business Logic**:

- Home page enables full swipe navigation
- Workout pages lock Alice to strain/rest display
- Settings pages allow color customization
- Offline mode disables most interactions

## Shape Definitions

### SVG Path Constants

**Purpose**: Defines the three morphing shapes for Alice's ferrofluid appearance

**Neutral Blob**:

```
viewBox: "0 0 100 100"
path: "M50 10 Q30 20, 20 40 Q15 60, 30 80 Q50 90, 70 80 Q85 60, 80 40 Q70 20, 50 10 Z"
description: Smooth, organic circular form with subtle variations
```

**Intense Pulse**:

```
viewBox: "0 0 100 100"
path: "M50 5 Q25 15, 15 50 Q25 85, 50 95 Q75 85, 85 50 Q75 15, 50 5 Z"
description: Vertically stretched with dynamic energy, taller than wide
```

**Rhythmic Ripple**:

```
viewBox: "0 0 100 100"
path: "M50 15 Q35 25, 25 50 Q35 75, 50 85 Q65 75, 75 50 Q65 25, 50 15 Z"
description: Gentle undulating waves, synchronized with music tempo
```

### Color System Constants

**Purpose**: Defines color calculations for strain-based appearance changes

**Base Colors**:

- `matteBlack: #0A0A0A` - Primary fill color
- `electricBlue: #00BFFF` - Default accent color (hue 195°)
- `offlineGray: #808080` - Offline mode color

**Strain-Based Adjustments**:

- strain < 90%: lighten accent color by 20%
- strain > 100%: darken accent color by 20%
- Offline mode: override all colors to gray
- Secondary overlay at 70% opacity

## Integration Patterns

### Convex Real-time Subscriptions

**Purpose**: Live data sync for workout metrics

**Subscription Pattern**:

```typescript
// convex/functions/aliceSync.ts
export const workoutMetrics = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("workouts")
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
  },
});
```

**Update Frequency**: Every 1-2 seconds during active sessions

### State Management Architecture

**Purpose**: Global state coordination across components

**Store Structure**:

```typescript
// aliceStore.ts extension
interface AliceState {
  // Visual state
  mood: MoodType;
  eyeExpression: EyeExpression;
  displayMode: DisplayMode;

  // Workout data
  strain: number;
  isResting: boolean;
  restTimeRemaining: number;

  // User preferences
  userColor: string;
  voiceEnabled: boolean;

  // Interaction state
  currentPage: string;
  isInteracting: boolean;
}
```

### Voice Coaching Integration

**Purpose**: ElevenLabs API integration for audio feedback

**Voice Triggers**:

- Set completion: "Great set! Take a 30-second rest."
- High intensity (strain > 85%): "Push through! You're in the zone!"
- Form cues: "Focus on your breathing" or "Keep your core tight"
- Workout summary: "Workout complete! You hit 85% intensity for 12 minutes."

**Audio Flow**:

1. Detect earbuds connection via Capacitor
2. Generate voice content based on workout events
3. Stream audio via ElevenLabs API
4. Play through device audio system
5. Coordinate with Alice visual feedback

## Testing Strategy

### Unit Test Coverage

- Alice state transitions and validation
- Color calculation functions
- SVG path morphing logic
- Strain change throttling (>15% rule)

### Integration Test Scenarios

- Real-time Convex subscription handling
- Voice coaching trigger coordination
- Cross-page Alice persistence
- Offline mode graceful degradation

### Performance Test Criteria

- Animation maintains 60fps during morphing
- State updates complete within 500ms
- Memory usage remains stable during long sessions
- Voice synthesis latency < 2 seconds
