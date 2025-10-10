# Alice Card Quickstart Guide

## Overview

This feature extends the existing `AliceUnified.svelte` component with smooth orb-to-card transformation, creating an intuitive workout interface that maintains Alice's personality while providing essential exercise information.

## Quick Start (5 minutes)

### 1. Verify Dependencies

```bash
# Check that required dependencies are available
cd app
npm list animejs tailwindcss @capacitor/haptics
```

All dependencies are already installed in the current project.

### 2. Component Extension Points

The feature extends `AliceUnified.svelte` at these key locations:

```typescript
// app/src/lib/components/AliceUnified.svelte
// Add new props for card mode
export let displayMode: "orb" | "card" | "auto" = "auto";
export let cardEnabled: boolean = true;
export let cardWidth: string = "85vw";

// Add card state management
let cardState = {
  isExpanded: false,
  expansionProgress: 0,
  animating: false,
};
```

### 3. Core Animation Integration

Extend existing anime.js usage for card expansion:

```javascript
// Breathing expansion animation
const expandToCard = () => {
  anime({
    targets: ".alice-container",
    width: cardWidth,
    height: "auto",
    borderRadius: "16px",
    duration: 800, // <1s requirement
    easing: "easeOutQuart",
    update: (anim) => {
      cardState.expansionProgress = anim.progress / 100;
    },
  });
};
```

### 4. Layout Structure

Add responsive card layout:

```html
<!-- Card mode layout -->
{#if displayMode === 'card'}
<div class="alice-card" style="width: {cardWidth}">
  <!-- Top-left: Exercise name -->
  <div class="exercise-display">
    <span class="exercise-name">{exerciseName}</span>
  </div>

  <!-- Bottom-left: Reps/duration -->
  <div class="reps-display">
    <span class="reps-text">{currentReps || currentDuration}</span>
  </div>

  <!-- Right side: Progress bars -->
  <div class="progress-bars">
    {#each progressMetrics as metric}
    <div class="progress-bar" data-metric="{metric.type}">
      <!-- Progress visualization -->
    </div>
    {/each}
  </div>

  <!-- Alice orb in center -->
  <div class="alice-orb-center">
    <!-- Existing Alice orb -->
  </div>
</div>
{/if}
```

## Implementation Steps

### Phase 1: Basic Card Structure (15 minutes)

1. **Add Card Mode State**:

   ```typescript
   // In AliceUnified.svelte <script>
   let displayMode: "orb" | "card" = "orb";
   let isExpanding = false;
   let expansionProgress = 0;
   ```

2. **Create CSS Grid Layout**:

   ```css
   .alice-card {
     display: grid;
     grid-template-areas:
       "exercise . progress"
       ". alice progress"
       "reps . progress";
     grid-template-columns: 1fr 2fr 100px;
     grid-template-rows: auto 1fr auto;
     width: var(--card-width, 85vw);
     max-width: 500px;
     padding: 1rem;
     border-radius: 16px;
     position: relative;
   }
   ```

3. **Add Responsive Width Calculation**:
   ```javascript
   $: cardWidth = `${Math.min(85, screenWidth * 0.85)}vw`;
   ```

### Phase 2: Animation System (20 minutes)

1. **Orb-to-Card Expansion**:

   ```javascript
   const expandToCard = async () => {
     isExpanding = true;

     await anime({
       targets: ".alice-container",
       width: cardWidth,
       height: "auto",
       borderRadius: ["50%", "16px"],
       duration: 800,
       easing: "easeOutQuart",
     }).finished;

     displayMode = "card";
     isExpanding = false;
   };
   ```

2. **Breathing Effect**:
   ```javascript
   const breathingAnimation = anime({
     targets: ".alice-card",
     scale: [1, 1.02, 1],
     duration: 3000,
     loop: true,
     easing: "easeInOutSine",
   });
   ```

### Phase 3: Content Display (25 minutes)

1. **Exercise Name Fade System**:

   ```javascript
   const updateExerciseName = async (newName) => {
     // Fade out current name
     await anime({
       targets: ".exercise-name",
       opacity: 0,
       duration: 300,
     }).finished;

     // Update text
     exerciseName = newName;

     // Fade in new name
     await anime({
       targets: ".exercise-name",
       opacity: 1,
       duration: 300,
     }).finished;
   };
   ```

2. **Heartbeat Pulse for Reps**:

   ```javascript
   const pulseReps = () => {
     anime({
       targets: ".reps-text",
       scale: [1, 1.1, 1],
       duration: 600,
       easing: "easeOutBounce",
     });
   };

   // Trigger on reps update
   $: if (currentReps !== previousReps) {
     pulseReps();
     previousReps = currentReps;
   }
   ```

3. **Progress Bars with Underglow**:

   ```css
   .progress-bar {
     width: 6px;
     height: 100px;
     background: linear-gradient(to top, transparent, var(--metric-color));
     position: relative;
   }

   .progress-bar::after {
     content: "";
     position: absolute;
     inset: 0;
     background: var(--metric-color);
     filter: blur(8px);
     opacity: 0.6;
     z-index: -1;
   }
   ```

### Phase 4: Interactive Elements (15 minutes)

1. **Speech Bubble Triggers**:

   ```javascript
   const handleAliceGesture = (event) => {
     if (event.type === "tap" || event.type === "gesture") {
       showSpeechBubble({
         position: { x: event.clientX, y: event.clientY },
         actions: [
           { text: "Skip Exercise", action: "skip" },
           { text: "Complete Set", action: "complete" },
           { text: "Adjust Weight", action: "adjust" },
         ],
       });
     }
   };
   ```

2. **Movement-Based Progress Visibility**:
   ```javascript
   const toggleProgressBarsOnMovement = (isMoving) => {
     anime({
       targets: ".progress-bars",
       opacity: isMoving ? 1 : 0,
       duration: 400,
       easing: "easeOutQuart",
     });
   };
   ```

## Integration with Existing Systems

### Alice Store Integration

```javascript
// Extend existing aliceStore
import { aliceActions } from "$lib/stores/aliceStore.js";

// Update card state in global store
aliceActions.updateCardState({
  displayMode,
  expansionProgress,
  isExpanding,
});
```

### Data Service Integration

```javascript
// Use existing data services
import { aliceDataService } from "$lib/services/aliceDataService.js";

// Subscribe to real-time metrics
aliceDataService.subscribeToMetrics((metrics) => {
  progressMetrics = {
    calories: metrics.calories,
    intensity: metrics.intensity,
    stress: metrics.stress,
  };
});
```

### Color System Integration

```javascript
// Use existing color utilities
import {
  generateAliceColorScheme,
  getStrainColor,
} from "$lib/utils/aliceColorUtils.js";

// Apply iris color to card glow
$: cardGlowColor = generateAliceColorScheme(irisColor).glow;
$: progressUnderglowColors = {
  calories: getStrainColor(caloriesBurn, baseColor),
  intensity: getStrainColor(intensityLevel, baseColor),
  stress: getStrainColor(stressLevel, baseColor),
};
```

## Testing Scenarios

### User Story Validation

1. **Smooth Expansion Test**:

   ```javascript
   // Test orb expands to card in <1s
   const startTime = performance.now();
   await expandToCard();
   const duration = performance.now() - startTime;
   expect(duration).toBeLessThan(1000);
   ```

2. **Exercise Transition Test**:

   ```javascript
   // Test exercise name fades properly
   updateExerciseName("Push-ups");
   await waitFor(() => expect(screen.getByText("Push-ups")).toBeVisible());
   ```

3. **Progress Bar Movement Test**:

   ```javascript
   // Test progress bars only show during movement
   simulateMovement();
   expect(screen.getByTestId("progress-bars")).toBeVisible();

   simulateStillness();
   expect(screen.getByTestId("progress-bars")).not.toBeVisible();
   ```

### Performance Validation

```javascript
// Animation performance test
const measureAnimationFPS = () => {
  let frames = 0;
  const start = performance.now();

  const countFrames = () => {
    frames++;
    if (performance.now() - start < 1000) {
      requestAnimationFrame(countFrames);
    } else {
      expect(frames).toBeGreaterThan(50); // 50+ FPS target
    }
  };

  requestAnimationFrame(countFrames);
};
```

## Troubleshooting

### Common Issues

1. **Animation Too Slow**:
   - Check anime.js duration settings
   - Verify CSS will-change properties are set
   - Enable GPU acceleration with transforms

2. **Layout Breaking on Small Screens**:
   - Verify responsive width calculation
   - Test CSS Grid fallbacks
   - Check minimum card dimensions

3. **Progress Bars Not Showing**:
   - Verify movement detection is working
   - Check real-time metrics data flow
   - Validate visibility toggle logic

### Performance Optimization

1. **Reduce Repaints**:

   ```css
   .alice-card {
     will-change: transform, opacity;
     contain: layout style paint;
   }
   ```

2. **Optimize Animations**:

   ```javascript
   // Use transform instead of changing layout properties
   anime({
     targets: ".alice-card",
     transform: "scale(1.02)",
     duration: 800,
   });
   ```

3. **Batch Updates**:
   ```javascript
   // Batch multiple property updates
   const batchUpdate = (updates) => {
     Object.assign(cardState, updates);
     requestAnimationFrame(() => applyUpdates());
   };
   ```

## Next Steps

After implementing this quickstart:

1. Run integration tests to validate user stories
2. Test performance across different devices
3. Validate responsive behavior on various screen sizes
4. Test animation blending with existing Alice behaviors
5. Verify accessibility with screen readers and keyboard navigation

The implementation should maintain all existing AliceUnified functionality while adding the new card transformation capabilities seamlessly.
