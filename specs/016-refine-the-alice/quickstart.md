# Alice Orb Quickstart Guide

## Overview

This guide walks through implementing and testing the refined Alice orb AI voice coach feature. Alice morphs between three ferrofluid-like shapes based on workout intensity and provides voice coaching when earbuds are connected.

## Prerequisites

- Existing SvelteKit + Convex + Capacitor project
- @capacitor/haptics 7.0.2 installed
- anime.js for morphing animations
- ElevenLabs API access for voice synthesis

## Quick Implementation Steps

### 1. Enhanced AliceOrb Component (5 min)

Update the existing `app/src/lib/components/AliceOrb.svelte`:

```bash
# Verify anime.js is available
npm list animejs || npm install animejs
```

Key changes:

- Add three SVG path shapes (neutral blob, intense pulse, rhythmic ripple)
- Implement morphing between shapes using anime.js
- Add strain change throttling (>15% difference only)
- Integrate eye expression changes for mood feedback

### 2. Global State Enhancement (3 min)

Extend existing `app/src/lib/stores/aliceStore.ts`:

```typescript
// Add new state fields
interface AliceState {
  mood: "neutral" | "intense" | "rhythmic";
  eyeExpression: "neutral" | "excited" | "sad";
  displayMode: "strain" | "rest" | "navigation" | "offline";
  lastMorphTrigger: number; // for throttling
  userColor: string; // HSL hue 0-360°
}
```

### 3. Convex Real-time Sync (3 min)

Create `convex/functions/alice.ts`:

```typescript
// Subscription for workout data every 1-2 seconds
export const workoutMetrics = query({
  handler: async (ctx) => {
    // Return current workout session data
    // Include strain, rest status, performance metrics
  },
});
```

### 4. Voice Coaching Integration (5 min)

Add voice synthesis when earbuds detected:

```bash
# Add ElevenLabs environment variables
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=alice_voice_id
```

Implement coaching triggers:

- Set completion feedback
- Form cues during exercise
- Workout encouragement
- Session summaries

### 5. Touch Interaction Enhancement (2 min)

Update existing touch handlers:

```typescript
// Extend existing GlobalAlice.svelte
// Add tap-to-blink with haptic feedback
// Implement swipe navigation (Workouts, Nutrition, Progress, Settings)
// Lock interactions during active workouts
```

## Testing Workflow

### 1. Visual Testing (2 min)

```bash
npm run dev
```

Test scenarios:

- Alice morphs from neutral → intense when strain > 85%
- Eye squints on good set completion
- Color changes when user adjusts preferences
- Gray appearance when offline

### 2. Real-time Sync Testing (2 min)

Start a mock workout session:

- Verify strain updates every 1-2 seconds
- Confirm morphing only on >15% strain changes
- Test rest period countdown display
- Validate offline mode graceful degradation

### 3. Voice Coaching Testing (3 min)

With earbuds connected:

- Trigger encouragement messages during high intensity
- Test set completion audio feedback
- Verify workout summary at session end
- Confirm voice disabled when earbuds disconnected

### 4. Touch Interaction Testing (2 min)

On different pages:

- Home page: swipe left/right cycles through app sections
- Workout pages: interactions locked to strain/rest display
- Settings: color customization active
- All pages: tap for blink with haptic feedback

## Performance Validation

### Animation Performance (1 min)

Monitor in browser DevTools:

- Morphing animations maintain 60fps
- Visual feedback responds within 500ms
- No animation conflicts during rapid changes

### Data Sync Performance (1 min)

Check Convex dashboard:

- Subscription updates every 1-2 seconds
- Network usage reasonable during long sessions
- Offline caching works when disconnected

### Memory Usage (1 min)

Profile during extended workout:

- Memory usage remains stable
- No memory leaks from animations
- Voice audio properly cleaned up

## Integration Points

### Existing Components

- `AliceOrb.svelte`: Enhanced with morphing capabilities
- `GlobalAlice.svelte`: Extended with voice coaching state
- `aliceStore.ts`: Added mood and interaction management

### New Dependencies

- anime.js: SVG path morphing animations
- ElevenLabs API: Voice synthesis and coaching
- Enhanced Capacitor haptics: Touch feedback

### Configuration Changes

- Color customization in user settings
- Voice coaching toggle preferences
- Haptic feedback enable/disable option

## Deployment Checklist

### Environment Setup

- [ ] ElevenLabs API credentials configured
- [ ] anime.js dependency installed and bundled
- [ ] Capacitor haptics permissions enabled

### Feature Flags

- [ ] Voice coaching enabled for users with earbuds
- [ ] Color customization available in settings
- [ ] Real-time sync active for workout sessions

### Performance Monitoring

- [ ] Animation frame rate tracking
- [ ] Voice synthesis latency monitoring
- [ ] Data sync frequency validation

### User Experience

- [ ] Alice appears on all pages as persistent companion
- [ ] Smooth morphing between workout intensities
- [ ] Clear visual feedback for all interactions
- [ ] Voice coaching enhances workout experience

## Troubleshooting

### Common Issues

1. **Morphing too frequent**: Verify 15% strain change threshold
2. **Voice not working**: Check earbuds connection detection
3. **Poor animation performance**: Monitor FPS and GPU usage
4. **Data sync delays**: Validate Convex subscription setup
5. **Touch interactions unresponsive**: Check page-specific interaction modes

### Debug Tools

- Browser DevTools for animation performance
- Convex dashboard for real-time data flow
- Device logs for Capacitor haptics issues
- Network tab for voice API latency

## Success Criteria

- ✅ Alice morphs smoothly between 3 distinct shapes
- ✅ Voice coaching provides contextual workout feedback
- ✅ Touch interactions work across all app pages
- ✅ Real-time data sync maintains <2 second latency
- ✅ User customization preferences persist
- ✅ Offline mode gracefully degrades functionality
- ✅ Performance maintains 60fps during animations
- ✅ Voice synthesis responds within 2 seconds

Total implementation time: ~20 minutes
Total testing time: ~10 minutes
