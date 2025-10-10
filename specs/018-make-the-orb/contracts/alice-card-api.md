# Alice Card API Contracts

## Component Interface

### AliceUnified Component (Extended)

**Purpose**: Extended Alice component with orb-to-card transformation capabilities

**New Props Interface**:

```typescript
interface AliceCardProps {
  // Card display mode
  displayMode?: "orb" | "card" | "auto"; // auto switches based on workout state
  cardEnabled?: boolean; // whether card transformation is available

  // Card layout configuration
  cardWidth?: string; // screen width percentage (default: "85vw")
  enableBreathing?: boolean; // breathing expansion animation
  glowIntensity?: number; // soft glow strength (0-1)
  shadowDepth?: number; // 3D floating effect depth in px

  // Exercise display (top-left)
  exerciseName?: string; // current exercise name
  showExerciseName?: boolean; // whether to display exercise name
  exerciseFadeEnabled?: boolean; // fade transitions on exercise change

  // Reps display (bottom-left)
  currentReps?: number | null; // current rep count
  currentDuration?: string | null; // duration for time-based exercises
  enableHeartbeatPulse?: boolean; // pulse animation on value updates

  // Progress bars (right side)
  showProgressBars?: boolean; // whether to show progress visualization
  progressMetrics?: {
    calories?: number;
    intensity?: number;
    stress?: number;
  };
  progressBarStyle?: "minimal" | "standard"; // visual style variant
  colorShiftingEnabled?: boolean; // color-shifting underglow effect

  // Speech bubble interaction
  speechBubblesEnabled?: boolean; // whether gesture-triggered bubbles are active
  bubbleTimeout?: number; // auto-hide timeout in ms
  availableActions?: Array<{ text: string; action: string }>; // available bubble actions

  // Animation configuration
  animationSpeed?: number; // animation duration multiplier (default: 1.0)
  enableAnimationBlending?: boolean; // smooth overlapping animation handling
  maxAnimationDuration?: number; // maximum animation time in ms (default: 1000)
}
```

**Extended Event Emissions**:

```typescript
// Card transformation events
cardExpansionStart: {
  fromMode: 'orb' | 'card';
  toMode: 'orb' | 'card';
  animationDuration: number;
}

cardExpansionComplete: {
  mode: 'orb' | 'card';
  duration: number;
}

// Exercise display events
exerciseNameChange: {
  previousExercise: string | null;
  newExercise: string;
  fadeDirection: 'out' | 'in';
}

// Reps display events
repsUpdate: {
  previousValue: number | null;
  newValue: number | null;
  pulseTriggered: boolean;
}

durationUpdate: {
  previousValue: string | null;
  newValue: string | null;
  pulseTriggered: boolean;
}

// Progress bar events
progressUpdate: {
  metricType: 'calories' | 'intensity' | 'stress';
  previousValue: number;
  newValue: number;
  isVisible: boolean;
}

progressBarsVisibilityChange: {
  visible: boolean;
  reason: 'movement_detected' | 'movement_stopped' | 'manual_toggle';
}

// Speech bubble events
speechBubbleShow: {
  trigger: 'gesture' | 'tap';
  position: {x: number, y: number};
  availableActions: Array<{text: string, action: string}>;
}

speechBubbleAction: {
  action: string;
  text: string;
  timestamp: number;
}

speechBubbleHide: {
  reason: 'timeout' | 'action_selected' | 'manual_dismiss';
  duration: number;
}

// Layout events
cardLayoutChange: {
  screenWidth: number;
  screenHeight: number;
  cardWidth: string;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

// Animation performance events
animationPerformance: {
  animationType: string;
  duration: number;
  fps: number;
  blendingActive: boolean;
}
```

## Service Interfaces

### Card State Management Service

**Purpose**: Manages orb-to-card transformation state and animations

```typescript
interface CardStateService {
  // Transformation control
  expandToCard(animationDuration?: number): Promise<void>;
  collapseToOrb(animationDuration?: number): Promise<void>;
  toggleCardMode(): Promise<void>;

  // State queries
  getCurrentMode(): "orb" | "card" | "transitioning";
  getExpansionProgress(): number; // 0-1
  isAnimating(): boolean;

  // Layout management
  updateCardLayout(screenDimensions: { width: number; height: number }): void;
  getCardDimensions(): { width: string; height: string };

  // Animation configuration
  setAnimationSpeed(multiplier: number): void;
  enableAnimationBlending(enabled: boolean): void;
  queueAnimation(animationType: string): void;
  clearAnimationQueue(): void;
}
```

### Exercise Display Service

**Purpose**: Manages exercise name display and fade transitions

```typescript
interface ExerciseDisplayService {
  // Exercise name management
  updateExerciseName(newName: string, fadeTransition?: boolean): Promise<void>;
  getCurrentExerciseName(): string | null;
  clearExerciseName(): Promise<void>;

  // Fade animation control
  fadeOut(duration?: number): Promise<void>;
  fadeIn(duration?: number): Promise<void>;
  setFadeSpeed(duration: number): void;

  // Text styling
  updateTextColor(color: string): void;
  updateGlowColor(color: string): void;
  setFontSize(size: string): void;
}
```

### Reps Display Service

**Purpose**: Manages reps/duration display and heartbeat pulse animation

```typescript
interface RepsDisplayService {
  // Value updates
  updateReps(newReps: number | null, triggerPulse?: boolean): Promise<void>;
  updateDuration(
    newDuration: string | null,
    triggerPulse?: boolean
  ): Promise<void>;

  // Pulse animation
  triggerHeartbeatPulse(): Promise<void>;
  setPulseColor(color: string): void;
  setPulseIntensity(intensity: number): void; // 0-1

  // Value queries
  getCurrentReps(): number | null;
  getCurrentDuration(): string | null;
  isPulsing(): boolean;
}
```

### Progress Bar Service

**Purpose**: Manages vertical progress bars and real-time metric display

```typescript
interface ProgressBarService {
  // Visibility control
  showProgressBars(): void;
  hideProgressBars(): void;
  toggleProgressBars(): void;
  setVisibilityBasedOnMovement(enabled: boolean): void;

  // Metric updates
  updateCalories(value: number): void;
  updateIntensity(value: number): void;
  updateStress(value: number): void;
  updateMetrics(metrics: {
    calories?: number;
    intensity?: number;
    stress?: number;
  }): void;

  // Visual configuration
  setUnderglowColor(metricType: string, color: string): void;
  enableColorShifting(enabled: boolean): void;
  setBarThickness(thickness: "thin" | "standard"): void;

  // Movement detection
  onMovementDetected(): void;
  onMovementStopped(): void;
  setMovementThreshold(threshold: number): void;
}
```

### Speech Bubble Service

**Purpose**: Manages interactive speech bubble display and user actions

```typescript
interface SpeechBubbleService {
  // Bubble display
  showBubble(
    trigger: "gesture" | "tap",
    position: { x: number; y: number }
  ): void;
  hideBubble(): void;
  isVisible(): boolean;

  // Action management
  setAvailableActions(actions: Array<{ text: string; action: string }>): void;
  getAvailableActions(): Array<{ text: string; action: string }>;
  executeAction(action: string): void;

  // Timing configuration
  setAutoHideTimeout(timeoutMs: number): void;
  resetAutoHideTimer(): void;
  clearAutoHideTimer(): void;

  // Position calculation
  calculateOptimalPosition(cardBounds: DOMRect): { x: number; y: number };
  updatePosition(position: { x: number; y: number }): void;
}
```

## Data Contracts

### Card State Data

```typescript
interface AliceCardState {
  displayMode: "orb" | "card";
  expansionProgress: number; // 0-1
  isExpanding: boolean;
  cardLayout: {
    width: string;
    height: string;
    centerX: number;
    centerY: number;
  };
  glowIntensity: number;
  shadowDepth: number;
  animationQueue: string[];
  lastTransition: timestamp;
}

interface CardLayoutConfig {
  screenWidth: number;
  screenHeight: number;
  cardWidthPercentage: number;
  breakpoint: "mobile" | "tablet" | "desktop";
  scaleFactor: number;
}
```

### Exercise Display Data

```typescript
interface ExerciseDisplayData {
  exerciseName: string | null;
  displayText: string;
  fadeState: "in" | "out" | "visible" | "hidden";
  fontSize: string;
  color: string;
  glowColor: string;
  lastUpdate: timestamp;
}
```

### Progress Data

```typescript
interface ProgressMetricsData {
  calories: {
    value: number;
    isVisible: boolean;
    underglowColor: string;
  };
  intensity: {
    value: number;
    isVisible: boolean;
    underglowColor: string;
  };
  stress: {
    value: number;
    isVisible: boolean;
    underglowColor: string;
  };
  movementDetected: boolean;
  lastMovementTime: timestamp;
  colorShiftingEnabled: boolean;
}
```

### Speech Bubble Data

```typescript
interface SpeechBubbleData {
  isVisible: boolean;
  position: { x: number; y: number };
  availableActions: Array<{
    text: string;
    action: string;
    icon?: string;
  }>;
  triggerType: "gesture" | "tap";
  showTime: timestamp;
  autoHideTimeout: number;
}
```

## Animation Contracts

### Expansion Animation

```typescript
interface ExpansionAnimationConfig {
  duration: number; // max 1000ms
  easing: string; // anime.js easing function
  breathingAmplitude: number; // breathing effect intensity
  expandFromCenter: boolean;
  preserveAspectRatio: boolean;
}
```

### Fade Animation

```typescript
interface FadeAnimationConfig {
  duration: number;
  easing: string;
  fadeType: "opacity" | "transform" | "combined";
  direction: "in" | "out";
}
```

### Pulse Animation

```typescript
interface PulseAnimationConfig {
  duration: number;
  intensity: number; // scale multiplier
  color: string;
  repeatCount: number; // 1 for heartbeat
  easing: string;
}
```

### Progress Bar Animation

```typescript
interface ProgressBarAnimationConfig {
  fillDuration: number;
  underglowDuration: number;
  colorShiftSpeed: number;
  appearanceTransition: FadeAnimationConfig;
}
```

## Performance Contracts

### Animation Performance Requirements

```typescript
interface AnimationPerformanceContract {
  maxDuration: 1000; // ms - constitutional requirement
  targetFps: 60;
  gpuAcceleration: true;
  willChange: string[]; // CSS properties that will animate

  // Performance monitoring
  measureFramerate(): number;
  measureAnimationDuration(animationType: string): number;
  detectPerformanceIssues(): string[];

  // Fallback strategies
  enablePerformanceMode(): void; // reduced animations if performance poor
  disableExpensiveEffects(): void; // disable 3D effects if needed
}
```

### Memory Usage Contract

```typescript
interface MemoryUsageContract {
  maxComponentInstances: 1; // reuse existing AliceUnified
  avoidDomMountUnmount: true;
  cacheAnimationStates: true;

  // Memory monitoring
  getCurrentMemoryUsage(): number;
  detectMemoryLeaks(): boolean;
  cleanupUnusedResources(): void;
}
```

## Integration Contracts

### Existing Alice System Integration

```typescript
interface AliceSystemIntegration {
  // Existing store integration
  extendAliceStore(newState: Partial<AliceCardState>): void;
  subscribeToWorkoutUpdates(callback: (data: WorkoutData) => void): void;

  // Existing color system integration
  useExistingColorScheme(): AliceColorScheme;
  applyIrisColorToGlow(irisColor: string): string;

  // Existing animation system integration
  useExistingAnimejsInstance(): anime.AnimeInstance;
  blendWithExistingAnimations(newAnimation: anime.AnimeParams): void;

  // Existing data service integration
  subscribeToRealTimeMetrics(): RealTimeMetrics;
  getCurrentWorkoutSession(): WorkoutSession | null;
}
```
