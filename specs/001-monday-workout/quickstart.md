# Quickstart: Monday Workout Intensity Analysis

**Feature**: Monday Workout Intensity Analysis Integration
**Target**: Developers integrating with existing WorkoutExecutionService
**Time**: 15-30 minutes

## Prerequisites

- [x] SvelteKit app with Capacitor configured
- [x] Convex backend connected
- [x] Existing WorkoutExecutionService in place
- [x] Device with wearable data access (HealthKit/Health Connect)
- [x] User authentication working

## Quick Integration Steps

### Step 1: Install Dependencies (5 minutes)
```bash
# Add health data access
npm install @capacitor-community/health

# Add crypto utilities (if not already available)
# Web Crypto API is built-in to modern browsers
```

### Step 2: Configure Health Data Access (10 minutes)

**iOS (HealthKit)**:
```xml
<!-- ios/App/App/Info.plist -->
<key>NSHealthShareUsageDescription</key>
<string>Technically Fit needs access to your health data to calculate workout intensity and provide personalized recommendations.</string>
```

**Android (Health Connect)**:
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.health.READ_HEART_RATE" />
<uses-permission android:name="android.permission.health.READ_BLOOD_OXYGEN" />
<uses-permission android:name="android.permission.health.READ_SLEEP" />
```

### Step 3: Extend Workout Service (10 minutes)

```typescript
// lib/services/workoutExecution.ts (extend existing service)
import { generateWorkoutHash } from './crypto.ts';
import { collectHealthMetrics } from './health.ts';

export class WorkoutExecutionService {
  // ... existing methods ...

  async completeWorkoutWithMonday(workout: WorkoutState) {
    // Complete workout normally
    const completedWorkout = await this.completeWorkout(workout);
    
    // Add Monday analysis data collection
    const rawData = {
      reps: workout.reps,
      sets: workout.sets,
      weight: workout.weight,
      time: workout.completionTime,
      estimatedCalories: workout.estimatedCalories,
      intensity: workout.perceivedIntensity
    };
    
    // Hash the raw data
    const rawDataHash = await generateWorkoutHash(rawData);
    
    // Store hashed workout data
    await this.convex.mutation(api.workouts.createMondaySession, {
      ...completedWorkout,
      rawDataHash
    });
    
    // Collect health metrics (non-blocking)
    this.collectHealthMetricsAsync(workout.userId, workout.date);
    
    return completedWorkout;
  }
  
  private async collectHealthMetricsAsync(userId: string, date: Date) {
    try {
      const healthData = await collectHealthMetrics(date);
      if (healthData) {
        await this.convex.mutation(api.health.submitMetrics, {
          userId,
          date: date.toISOString().split('T')[0],
          ...healthData
        });
      }
    } catch (error) {
      console.warn('Health metrics collection failed:', error);
      // Non-critical, don't block workout completion
    }
  }
}
```

### Step 4: Add User Feedback Component (5 minutes)

```svelte
<!-- components/WorkoutFeedback.svelte -->
<script lang="ts">
  import { api } from '$lib/convex';
  
  export let workoutSessionId: string;
  export let userId: string;
  
  let selectedRating = '';
  let notes = '';
  
  const difficultyOptions = [
    { value: 'keep going', label: 'Keep Going! 💪', impact: '+20' },
    { value: 'challenge', label: 'Good Challenge 🔥', impact: '+10' },
    { value: 'neutral', label: 'Just Right ✅', impact: '0' },
    { value: 'easy killer', label: 'Easy Killer 😮‍💨', impact: '-15' },
    { value: 'flag', label: 'Something Off 🚩', impact: '-5' }
  ];
  
  async function submitFeedback() {
    if (!selectedRating) return;
    
    await api.mutation(api.feedback.submit, {
      workoutSessionId,
      userId,
      difficultyRating: selectedRating,
      notes: notes || null
    });
    
    // Show success feedback
    console.log('Feedback submitted for Monday analysis');
  }
</script>

<div class="feedback-container">
  <h3>How did that feel?</h3>
  <p class="subtitle">Your feedback helps adjust next week's workout</p>
  
  <div class="rating-options">
    {#each difficultyOptions as option}
      <button 
        class="rating-btn"
        class:selected={selectedRating === option.value}
        on:click={() => selectedRating = option.value}
      >
        <span class="rating-label">{option.label}</span>
        <span class="rating-impact">({option.impact})</span>
      </button>
    {/each}
  </div>
  
  <textarea 
    bind:value={notes}
    placeholder="Any additional notes? (optional)"
    maxlength="500"
  ></textarea>
  
  <button 
    class="submit-btn"
    disabled={!selectedRating}
    on:click={submitFeedback}
  >
    Submit Feedback
  </button>
</div>

<style>
  .feedback-container {
    @apply p-4 bg-white rounded-lg shadow;
  }
  
  .rating-options {
    @apply grid grid-cols-1 gap-2 my-4;
  }
  
  .rating-btn {
    @apply p-3 border rounded-lg text-left transition-colors;
  }
  
  .rating-btn.selected {
    @apply border-blue-500 bg-blue-50;
  }
  
  .rating-label {
    @apply block font-medium;
  }
  
  .rating-impact {
    @apply text-sm text-gray-600;
  }
  
  .submit-btn {
    @apply w-full p-3 bg-blue-600 text-white rounded-lg;
    @apply disabled:bg-gray-300 disabled:cursor-not-allowed;
  }
</style>
```

### Step 5: Add Monday Updates Display (5 minutes)

```svelte
<!-- components/MondayUpdates.svelte -->
<script lang="ts">
  import { api } from '$lib/convex';
  import { onMount } from 'svelte';
  
  export let userId: string;
  
  let intensityData = null;
  let loading = true;
  
  onMount(async () => {
    try {
      intensityData = await api.query(api.intensity.getWeekly, { userId });
    } catch (error) {
      console.warn('No Monday updates available yet');
    } finally {
      loading = false;
    }
  });
  
  function getIntensityColor(intensity: number) {
    if (intensity > 100) return 'text-red-600';
    if (intensity > 80) return 'text-orange-600';
    if (intensity > 60) return 'text-yellow-600';
    return 'text-green-600';
  }
</script>

{#if loading}
  <div class="loading">Loading Monday updates...</div>
{:else if intensityData}
  <div class="monday-updates">
    <h3>📊 This Week's Intensity Analysis</h3>
    
    <div class="intensity-score">
      <span class="score-label">Overall Intensity:</span>
      <span class="score-value {getIntensityColor(intensityData.intensityScore.totalIntensity)}">
        {Math.round(intensityData.intensityScore.totalIntensity)}%
      </span>
    </div>
    
    <div class="components">
      <div class="component">
        <span>Base:</span> 
        <span>{intensityData.intensityScore.baseScore}%</span>
      </div>
      <div class="component">
        <span>Heart Rate:</span> 
        <span>{Math.round(intensityData.intensityScore.heartRateComponent)}%</span>
      </div>
      <div class="component">
        <span>SpO2:</span> 
        <span>{Math.round(intensityData.intensityScore.spO2Component)}%</span>
      </div>
      <div class="component">
        <span>Sleep:</span> 
        <span>{Math.round(intensityData.intensityScore.sleepComponent)}%</span>
      </div>
      <div class="component">
        <span>Your Feedback:</span> 
        <span>{Math.round(intensityData.intensityScore.feedbackComponent)}%</span>
      </div>
    </div>
    
    {#if intensityData.volumeAdjustments?.length > 0}
      <div class="adjustments">
        <h4>🎯 Next Week's Adjustments</h4>
        {#each intensityData.volumeAdjustments as adjustment}
          <div class="adjustment">
            <span class="exercise">Exercise #{adjustment.exerciseId}:</span>
            <span class="change">
              {adjustment.currentWeight} → {adjustment.newWeight} lbs
              ({adjustment.adjustmentPercentage > 0 ? '+' : ''}{adjustment.adjustmentPercentage}%)
            </span>
            <span class="reason">{adjustment.reason}</span>
          </div>
        {/each}
      </div>
    {/if}
  </div>
{:else}
  <div class="no-data">
    <p>Complete workouts this week to see your Monday intensity analysis! 💪</p>
  </div>
{/if}

<style>
  .monday-updates {
    @apply p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg;
  }
  
  .intensity-score {
    @apply flex justify-between items-center text-lg font-semibold mb-4;
  }
  
  .components {
    @apply grid grid-cols-2 gap-2 text-sm mb-4;
  }
  
  .component {
    @apply flex justify-between;
  }
  
  .adjustments {
    @apply border-t pt-4;
  }
  
  .adjustment {
    @apply mb-2 p-2 bg-white rounded;
  }
  
  .exercise {
    @apply font-medium;
  }
  
  .change {
    @apply text-blue-600 font-semibold;
  }
  
  .reason {
    @apply text-sm text-gray-600 block;
  }
</style>
```

## Testing Your Integration

### 1. Test Workout Data Collection
1. Complete a workout using existing WorkoutExecutionService
2. Verify workout data is hashed and stored
3. Check that health metrics are collected (if available)

### 2. Test User Feedback
1. Submit feedback using the WorkoutFeedback component
2. Try different difficulty ratings
3. Verify feedback is stored with correct impact values

### 3. Test Monday Processing (Admin)
```bash
# Trigger Monday processing manually for testing
curl -X POST http://localhost:3000/api/monday-processing/trigger \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer admin_token" \
  -d '{"weekStartDate": "2025-09-22"}'
```

### 4. Test Intensity Display
1. Wait for Monday processing to complete
2. View intensity scores in MondayUpdates component  
3. Verify volume adjustments appear correctly

## Expected Results

After successful integration:

✅ **Workout Collection**: Workouts are hashed and stored securely  
✅ **Health Integration**: Wearable data flows into intensity calculation  
✅ **User Feedback**: Feedback affects intensity scoring correctly  
✅ **Monday Processing**: Weekly analysis runs automatically  
✅ **Volume Adjustments**: Next week's weights adjust based on intensity  
✅ **User Experience**: Clear feedback and recommendations displayed  

## Troubleshooting

### Common Issues

**Health Data Not Available**:
- Ensure device permissions are granted
- Check HealthKit/Health Connect configuration
- Verify wearable device is connected and syncing

**Monday Processing Not Running**:
- Check Convex scheduled action is configured
- Verify admin permissions for manual triggers
- Check processing logs for errors

**Volume Adjustments Not Appearing**:
- Confirm intensity scores are being calculated
- Check that workout data meets minimum thresholds
- Verify adjustment rules are triggering correctly

### Debugging Commands

```bash
# Check workout data hashing
console.log(await generateWorkoutHash(testData));

# Verify health metrics collection
console.log(await collectHealthMetrics(new Date()));

# Test intensity calculation
console.log(await calculateIntensity(weekData));
```

## Next Steps

1. **Monitor Usage**: Track intensity scores and user feedback
2. **Adjust Rules**: Fine-tune volume adjustment thresholds
3. **Expand Integration**: Add more wearable data sources
4. **Performance**: Optimize Monday processing for scale

**Success!** 🎉 Monday workout intensity analysis is now integrated with your existing workout system.