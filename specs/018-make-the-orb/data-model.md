# Data Model: Smooth Orb-to-Card Workout Interface

## Core Entities

### AliceCardState

**Purpose**: Manages the orb-to-card transformation state and card display mode

**Attributes**:

- `displayMode: 'orb' | 'card'` - Current view mode (orb or expanded card)
- `expansionProgress: number` - Animation progress from orb to card (0-1)
- `isExpanding: boolean` - Whether currently in expansion animation
- `cardLayout: 'centered' | 'responsive'` - Card positioning mode
- `glowIntensity: number` - Soft glow strength (0-1)
- `shadowDepth: number` - 3D floating effect depth (px)

**Relationships**:

- Extends existing `AliceAIState` interface
- Connected to `AliceAnimationState` for transition management
- Links to `AlicePreferences` for visual customization

### CardLayout

**Purpose**: Defines the responsive card layout structure and positioning

**Attributes**:

- `width: string` - Card width as screen percentage (e.g., "85vw")
- `height: string` - Card height relative to content
- `centerX: number` - Horizontal center position
- `centerY: number` - Vertical center position
- `borderRadius: string` - Rounded corners for card shape
- `padding: string` - Internal spacing for content areas

**Relationships**:

- Used by `AliceCardState` for layout calculation
- Responsive to screen size changes
- Integrated with existing CSS design system

### ExerciseDisplay

**Purpose**: Manages exercise information display in card top-left area

**Attributes**:

- `exerciseName: string` - Current exercise name
- `displayText: string` - Formatted display text
- `fadeState: 'in' | 'out' | 'visible'` - Text fade animation state
- `fontSize: string` - Responsive font size
- `color: string` - Text color (clean white + glow)
- `glowColor: string` - Text glow effect color

**Relationships**:

- Sources data from existing `Exercise` entity
- Controlled by `WorkoutSession` exercise transitions
- Styled by `AliceColorScheme` for consistent theming

### RepsDisplay

**Purpose**: Manages reps/duration display in card bottom-left area

**Attributes**:

- `repsValue: number | null` - Current rep count
- `durationValue: string | null` - Duration for time-based exercises
- `displayText: string` - Formatted display text
- `pulseState: 'idle' | 'pulsing'` - Heartbeat pulse animation state
- `pulseColor: string` - Pulse glow color matching exercise theme
- `lastUpdate: timestamp` - Last value change for pulse trigger

**Relationships**:

- Sources data from existing `WorkoutSet` entity
- Triggered by workout progress updates
- Shares styling with `ExerciseDisplay` for consistency

### ProgressBar

**Purpose**: Manages thin vertical progress bars on right side of card

**Attributes**:

- `metricType: 'calories' | 'intensity' | 'stress'` - Type of progress metric
- `currentValue: number` - Current metric value
- `maxValue: number` - Maximum scale value
- `fillPercentage: number` - Visual fill percentage (0-100)
- `isVisible: boolean` - Whether bar should be displayed
- `underglowColor: string` - Color-shifting underglow effect
- `thickness: string` - Bar thickness (small/thin requirement)

**Relationships**:

- Sources real-time data from `RealTimeMetrics` entity
- Multiple instances for different metric types
- Visibility controlled by movement/activity detection

### SpeechBubble

**Purpose**: Manages interactive speech bubble buttons that Alice presents

**Attributes**:

- `isVisible: boolean` - Whether bubble is currently shown
- `triggerType: 'gesture' | 'tap'` - How bubble was triggered
- `position: {x: number, y: number}` - Bubble position relative to Alice
- `buttons: Array<{text: string, action: string}>` - Available button options
- `animationState: 'appearing' | 'visible' | 'disappearing'` - Bubble animation
- `autoHideTimer: number` - Timeout for automatic hiding

**Relationships**:

- Triggered by user interaction with Alice orb/card
- Contains workout control actions (skip, complete, adjust)
- Positioned relative to `AliceCardState` layout

### ScreenResponsiveness

**Purpose**: Manages responsive behavior across different screen sizes

**Attributes**:

- `screenWidth: number` - Current viewport width
- `screenHeight: number` - Current viewport height
- `cardWidthPercentage: number` - Card width as percentage of screen
- `breakpoint: 'mobile' | 'tablet' | 'desktop'` - Current device category
- `scaleFactor: number` - UI scaling factor for device

**Relationships**:

- Influences `CardLayout` dimensions
- Affects `ProgressBar` thickness and positioning
- Controls responsive text sizing for displays

## Extended Entities

### AliceAnimationState (Extended)

**Purpose**: Enhanced animation state for orb-to-card transitions

**New Attributes**:

- `cardExpansionPath: string` - SVG path for expansion animation
- `breathingAmplitude: number` - Breathing effect intensity
- `blendingActive: boolean` - Whether animation blending is active
- `transitionQueue: Array<string>` - Queued animation requests

### AlicePreferences (Extended)

**Purpose**: Enhanced user preferences for card interface

**New Attributes**:

- `preferredCardSize: 'compact' | 'standard' | 'expanded'` - Card size preference
- `enableBreathingEffect: boolean` - Whether to show breathing expansion
- `progressBarStyle: 'minimal' | 'standard'` - Progress bar visual style
- `speechBubbleTimeout: number` - Auto-hide timeout for speech bubbles

### RealTimeMetrics (Extended)

**Purpose**: Enhanced metrics for card progress display

**New Attributes**:

- `isMoving: boolean` - Movement detection for progress bar visibility
- `movementThreshold: number` - Sensitivity for movement detection
- `lastMovementTime: timestamp` - Last detected movement time
- `colorShiftingEnabled: boolean` - Whether to use color-shifting underglow

## State Transitions

### Orb-to-Card Expansion

1. **Trigger**: Workout begins or card mode requested
2. **States**: `orb` → `expanding` → `card`
3. **Animation**: Breathing expansion with <1s constraint
4. **Data Flow**: `AliceCardState.expansionProgress` drives visual transition

### Exercise Transition

1. **Trigger**: User swipes or exercise changes in workout
2. **States**: `visible` → `fading out` → `fading in` → `visible`
3. **Animation**: Text fade with clean transitions
4. **Data Flow**: `ExerciseDisplay.fadeState` controls text animation

### Progress Update

1. **Trigger**: Real-time metrics change during movement
2. **States**: `hidden` → `appearing` → `visible` → `updating`
3. **Animation**: Progress bar fill and color-shifting underglow
4. **Data Flow**: `RealTimeMetrics.isMoving` triggers `ProgressBar.isVisible`

### Speech Bubble Interaction

1. **Trigger**: User gesture or tap on Alice
2. **States**: `hidden` → `appearing` → `visible` → `action` → `disappearing`
3. **Animation**: Bubble appearance with button presentation
4. **Data Flow**: User interaction triggers `SpeechBubble.isVisible`

## Data Validation Rules

### Animation Performance

- All animations MUST complete in <1s (functional requirement FR-014)
- Animation blending MUST be smooth when overlapping (clarification answer)
- Breathing expansion MUST be smooth and organic

### Responsive Layout

- Card width MUST use screen width percentage (clarification answer)
- Layout MUST remain centered across all screen sizes
- Progress bars MUST stay thin and small on all devices

### Visual Consistency

- Glow color MUST match Alice's iris color (functional requirement FR-003)
- Text color MUST be clean white (functional requirement FR-005)
- Progress bars MUST have color-shifting underglow (functional requirement FR-010)

### Interaction Requirements

- Speech bubbles MUST only appear on user gesture/tap (clarification answer)
- Progress bars MUST only show during movement (functional requirement FR-009)
- Card MUST maintain Alice appearance, not generic interface (functional requirement FR-015)

## Performance Considerations

### Memory Efficiency

- Reuse existing `AliceUnified` component instance
- Avoid creating/destroying DOM elements during transitions
- Cache animation states for smooth blending

### Rendering Optimization

- Use CSS transforms for GPU acceleration
- Minimize layout recalculations during animations
- Batch progress bar updates to prevent excessive redraws
