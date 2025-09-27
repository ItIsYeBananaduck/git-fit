# Quick Start: Intensity Score (Live)

## Overview
Get real-time workout intensity scoring with strain monitoring and AI coaching up and running in your existing git-fit SvelteKit + Convex application.

## Prerequisites
- Existing git-fit app with SvelteKit 2.22+ and Convex 1.27+
- Health data capability (iOS/Android with wearables or mock data)
- AI coaching service (Alice/Aiden) integration

## Installation Steps

### 1. Extend Convex Schema
Add the new tables to your existing schema:

```bash
# Navigate to the app directory
cd app

# Edit convex/schema.ts to add intensity scoring tables
# (See contracts/convex-functions.md for full schema)
```

### 2. Install Health Data Plugin
```bash
npm install @felix-health/capacitor-health-data@1.0.9
npx cap sync
```

### 3. Add Convex Functions
Create the new function files:

```bash
# Create intensity scoring functions
touch convex/functions/intensity.ts
touch convex/functions/coaching.ts  
touch convex/functions/supplements.ts
touch convex/functions/social.ts

# Create external API actions
touch convex/actions/supplements.ts
touch convex/actions/coaching.ts
```

### 4. Update Convex Schema
Run schema migration:
```bash
npx convex dev
# Schema will auto-migrate with your new tables
```

### 5. Add Frontend Components
Create the intensity scoring UI components:

```bash
# Create in src/lib/components/intensity/
mkdir -p src/lib/components/intensity
touch src/lib/components/intensity/LiveIntensityMeter.svelte
touch src/lib/components/intensity/StrainIndicator.svelte
touch src/lib/components/intensity/AICoachingPanel.svelte
```

## Quick Demo

### Real-Time Intensity Scoring
```typescript
// In your workout component
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

// Watch live intensity scores
const intensityScores = useQuery(api.intensity.watchWorkoutIntensity, {
  workoutSessionId: currentWorkoutId
});

// Calculate new intensity score
const calculateScore = useMutation(api.intensity.calculateScore);

// During a set completion
await calculateScore({
  workoutSessionId: workout.id,
  setId: set.id,
  tempoScore: 85,
  motionSmoothnessScore: 92,
  repConsistencyScore: 88,
  userFeedbackScore: 5,
  strainModifier: 0.95, // Yellow strain status
  isEstimated: false
});
```

### Strain Monitoring (Device-Only)
```typescript
// src/lib/services/strainCalculator.ts
export class LiveStrainCalculator {
  private baselineHR = 70;
  private baselineSpO2 = 98;
  
  calculateStrain(currentHR: number, currentSpO2: number, recoveryDelayMs: number): LiveStrain {
    const hrRise = (currentHR - this.baselineHR) / this.baselineHR;
    const spo2Drop = (this.baselineSpO2 - currentSpO2) / this.baselineSpO2;
    const recoveryDelay = recoveryDelayMs / 60000; // Convert to minutes
    
    const strainScore = Math.min(100, Math.max(0,
      (0.4 * hrRise * 100) + 
      (0.3 * spo2Drop * 100) + 
      (0.3 * recoveryDelay * 10)
    ));
    
    return {
      currentHR,
      baselineHR: this.baselineHR,
      currentSpO2,
      baselineSpO2: this.baselineSpO2,
      recoveryDelayMs,
      strainScore,
      status: strainScore <= 85 ? 'green' : strainScore <= 95 ? 'yellow' : 'red',
      timestamp: Date.now()
    };
  }
}
```

### AI Coaching Integration
```typescript
// Watch coaching context updates
const coachingContext = useQuery(api.coaching.watchContext);
const updateCoachingContext = useMutation(api.coaching.updateContext);

// During workout with live strain data
await updateCoachingContext({
  currentStrainStatus: liveStrain.status,
  intensityScoreId: latestScore?.id,
  voiceEnabled: true,
  hasEarbuds: true,
  voiceIntensity: 75,
  isZenMode: false,
  workoutPhase: 'working_sets'
});
```

## Key Features Ready to Use

### ✅ Real-Time Intensity Scoring
- Formula: `(tempo × 0.30) + (smoothness × 0.25) + (consistency × 0.20) + (feedback × 0.15) × strainModifier`
- Live updates through Convex subscriptions
- Capped at 100% for users, uncapped for trainers

### ✅ Strain Monitoring (Device-Only)
- Formula: `(0.4 × HR rise) + (0.3 × SpO₂ drop) + (0.3 × recovery delay)`
- Green (≤85%), Yellow (86-95%), Red (>95%) status indicators
- Never stored, only used for real-time calculations

### ✅ AI Voice Coaching
- Alice/Aiden personality selection
- Earbud-only voice output with 0-100% intensity slider
- Zen mode (0%) for minimal audio interruption
- Phase-aware coaching (warmup/working sets/cooldown)

### ✅ Dynamic Rest Periods
- Auto-extend rest when strain >85%
- Range: 30-90 seconds base
- Ignore "life pauses" (gyro flat + strain drop)
- Smart detection of forgotten sets

### ✅ Supplement Stack Tracking
- Barcode scanning with OpenFoodFacts API integration
- 28-day lock period with Week 4 modification window  
- Medical compound auto-redaction for privacy
- Performance correlation tracking (intensity/strain deltas)

### ✅ Social Sharing
- Algorithm-clustered feed by goals/body feel/training age
- Ghost mode for anonymous sharing
- Workout cards with like system
- Medical information automatically filtered

## Testing

### Unit Tests
```bash
# Test strain calculations
npm test src/lib/services/strainCalculator.test.ts

# Test intensity scoring
npm test src/lib/services/intensityScoring.test.ts
```

### Integration Tests
```bash
# Test Convex function integration
npm test tests/integration/intensity-scoring.test.ts

# Test real-time subscriptions
npm test tests/integration/realtime-updates.test.ts
```

### End-to-End Tests
```bash
# Test full workout flow with intensity scoring
npm run test:e2e tests/e2e/workout-with-intensity.spec.ts
```

## Configuration

### Environment Variables
```bash
# Add to app/.env.local
CONVEX_DEPLOYMENT=your-deployment-id
VITE_CONVEX_URL=https://your-deployment.convex.cloud

# OpenFoodFacts API (no key required)
VITE_OPENFOODFACTS_API_URL=https://world.openfoodfacts.org/api/v0

# AI Service for voice coaching
VITE_AI_SERVICE_URL=https://your-ai-service.fly.dev
```

### Capacitor Config
```typescript
// app/capacitor.config.ts
plugins: {
  CapacitorHealthData: {
    readPermissions: ['heart_rate', 'oxygen_saturation', 'workout_type']
  }
}
```

## Production Checklist

### Performance
- ✅ Strain calculations run on-device only
- ✅ Intensity scores use Convex real-time queries  
- ✅ AI coaching responses cached for 1 hour
- ✅ Social feed updates throttled to prevent spam

### Privacy & Security  
- ✅ Health data hashed/discarded after calculations
- ✅ Medical compounds auto-redacted from sharing
- ✅ User data retention: 1 year with opt-out deletion
- ✅ Ghost mode for anonymous social participation

### Cost Management
- ✅ On-device strain calculation eliminates backend storage costs
- ✅ Convex's serverless model scales with usage
- ✅ OpenFoodFacts API is free (no API key required)
- ✅ Estimated monthly cost: $0-$10 for 1K-10K users

## Troubleshooting

### Common Issues

**Strain calculations inconsistent?**
- Verify health data permissions are granted
- Check baseline HR/SpO₂ calibration in user profile
- Ensure device sensors are functioning properly

**Intensity scores not updating in real-time?**  
- Confirm Convex websocket connection is active
- Check network connectivity
- Verify `useQuery` is properly subscribed to changes

**AI coaching not responding?**
- Ensure earbud connection for voice-enabled coaching
- Check external AI service availability
- Verify coaching context updates are being sent

**Supplement scanning fails?**
- Confirm barcode format is valid (UPC/EAN)
- Check OpenFoodFacts API connectivity
- Verify product exists in OpenFoodFacts database

### Debug Mode
Enable debug logging in your Convex dashboard or add:
```typescript
console.log("Intensity calculation:", {
  components: args,
  totalScore: finalScore,
  isCapped: isCapped
});
```

## Next Steps

1. **Week 1 Calibration**: Let AI coaching calibrate intensity targets for new exercises
2. **Social Features**: Enable supplement stack sharing and workout feed participation  
3. **Advanced Analytics**: Use intensity history for long-term progress tracking
4. **Wearable Integration**: Connect additional device types beyond basic heart rate/SpO₂

## Support

- **Documentation**: See `specs/003-intensity-score-live/` for detailed technical specs
- **Schema Reference**: `contracts/convex-functions.md` for complete Convex function definitions
- **Data Model**: `data-model.md` for entity relationships and validation rules