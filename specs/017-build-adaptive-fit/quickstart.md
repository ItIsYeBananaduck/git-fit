# Quickstart: Build Adaptive Fit

**Date**: October 3, 2025  
**Feature**: 017-build-adaptive-fit

## Prerequisites

- Existing git-fit repository with SvelteKit + Convex setup
- Alice demo currently working at `/alice-demo` route
- User authentication system in place
- Basic workout tracking functionality

## Quick Validation Steps

### 1. Alice Interface Enhancement (5 min)

```bash
# Verify Alice demo is working
npm run dev
# Navigate to http://localhost:3000/alice-demo
# Expected: Black Alice with moving eye and strain controls

# Test Alice mode blooming
# 1. Tap Alice orb
# Expected: See four mode icons (dumbbell, apple, waveform, music)
# 2. Select workout mode
# Expected: Alice changes to workout state
```

### 2. Subscription Tier System (10 min)

```bash
# Test subscription restrictions
# 1. As free user: Alice should be gray, no customization options
# 2. As trial user: Full black Alice with all patterns available
# 3. As paid user: Black Alice with 10 pattern choices
# 4. As trainer: Black Alice + colored ring options

# Verify data retention
# Free users: 14 days → delete
# Paid users: 4 weeks → monthly → yearly summaries
```

### 3. Adaptive Fitness Engine (15 min)

```bash
# Test calibration triggers
# 1. Create workout session with >10% performance drop
# Expected: Alice prompts for calibration
# 2. Use exercise not touched for >2 weeks
# Expected: Alice prompts for calibration
# 3. Normal exercise usage
# Expected: Single test set only

# Test intensity monitoring
# 1. Simulate heart rate >100% intensity
# Expected: Alice pauses workout, prompts "rest or continue"
# 2. Don't respond for 30 seconds
# Expected: Auto-defaults to "rest"
```

### 4. Community Features (10 min)

```bash
# Test exercise approval workflow
# 1. Create new exercise as regular user
# Expected: Exercise saved locally, not public
# 2. Get 8 team likes on exercise
# Expected: Triggers trainer voting (Approve/Decline/Clarify)
# 3. Trainer approves
# Expected: Exercise becomes public

# Test team posts
# 1. Complete workout session
# Expected: Auto-post with workout icon + intensity + pulsing heart
# 2. Other users like entire workout
# Expected: Workout queued for meta-cycle inclusion
```

### 5. Background Monitoring (10 min)

```bash
# Test heart rate monitoring
# 1. Simulate sustained elevated heart rate for 3+ minutes
# Expected: After 5 minutes, prompt "Workout/Play/Ignore"
# 2. Don't respond for 30 seconds
# Expected: Auto-dismiss, default to "Ignore"

# Test play mode streaks
# 1. Use play mode for 7 consecutive days
# Expected: Award 7-day active streak badge
```

### 6. Marketplace Integration (10 min)

```bash
# Test video marketplace
# 1. List available videos
# Expected: See videos with performance badges
# 2. Purchase video
# Expected: Download to AdaptiveFitDownloads, 30% platform fee
# 3. Seller removes original video
# Expected: Downloaded copy remains accessible indefinitely

# Test performance flagging
# 1. Video with >90% high intensity users
# Expected: Badge displayed "90% of users hit high intensity"
```

## Expected User Flows

### New Free User Journey

1. Opens app → sees gray Alice breathing
2. Taps Alice → four mode icons appear
3. Selects workout → basic intensity tracking only
4. Completes workout → auto-post to team (no likes available)
5. After 14 days → raw data deleted automatically

### Paid User Journey

1. Opens app → sees customizable black Alice
2. Customizes Alice appearance (pattern + color)
3. Alice adapts workout recommendations based on performance
4. Completes workout → team post with like functionality
5. Workout gets likes → queued for meta-cycles
6. Data retained: 4 weeks raw → monthly → yearly summaries

### Trainer Journey

1. Opens app → sees black Alice with colored ring
2. Reviews pending exercises from community votes
3. Approves/declines user-submitted exercises instantly
4. Creates exercises → instantly approved, no voting needed
5. Manages monthly polls for stale exercises

## Acceptance Criteria Validation

### Alice Interface ✅

- [ ] Alice appears as breathing SVG blob with matte black body and electric-blue eye
- [ ] Tap Alice shows four mode icons (dumbbell, apple, waveform, music)
- [ ] Alice persists across all app screens
- [ ] Subscription tiers show correct Alice appearance

### Adaptive Engine ✅

- [ ] Calibration only triggers for stale data (>2 weeks) OR performance drop (>10%)
- [ ] Default single test sets otherwise
- [ ] Intensity >100% pauses workout and prompts rest/continue
- [ ] 30-second timeout defaults to "rest"

### Community Features ✅

- [ ] Auto-post workout summaries with intensity and heart icons
- [ ] Exercise voting with 8-like threshold for trainer review
- [ ] Monthly polls for stale exercises with 60% keep/remove threshold
- [ ] Trainer instant approval for their own exercises

### Background Monitoring ✅

- [ ] Heart rate monitoring every 5 minutes when backgrounded
- [ ] Prompt after 3+ minutes sustained elevation
- [ ] 30-second prompt timeout defaults to "Ignore"
- [ ] 7-day play streak awards badge

### Marketplace ✅

- [ ] Videos downloadable to AdaptiveFitDownloads folder
- [ ] 30% platform commission on sales
- [ ] Performance badges for high-performing content
- [ ] Indefinite access even if seller removes original

## Performance Benchmarks

### Alice Animations

- Target: 60fps for all Alice movements and morphing
- Memory: <100MB for animation state management
- Responsiveness: <50ms tap-to-bloom response time

### API Response Times

- Alice state updates: <100ms
- Workout data recording: <200ms
- Community voting: <150ms
- Marketplace listings: <300ms

### Concurrent User Support

- Target: 10,000 concurrent users during peak
- Database: Convex real-time subscriptions optimized
- Alice state: Efficient SVG rendering with animation pooling

## Troubleshooting Common Issues

### Alice Not Responding

- Check SVG animation performance in dev tools
- Verify Convex real-time subscription connections
- Confirm user subscription tier data

### Calibration Not Triggering

- Verify exercise last-used timestamps in database
- Check performance baseline calculations
- Confirm 2-week and 10% drop thresholds

### Community Features Not Working

- Verify user authentication and team membership
- Check voting threshold calculations (8 likes, 60% polls)
- Confirm trainer role permissions

### Background Monitoring Issues

- Check Capacitor background plugin permissions
- Verify heart rate data source connections
- Confirm notification system setup

### Marketplace Problems

- Verify external video URL accessibility
- Check download path permissions (AdaptiveFitDownloads)
- Confirm payment processing and commission calculations

## Next Steps After Validation

1. **Performance Optimization**: Monitor Alice animation performance under load
2. **User Testing**: Gather feedback on Alice interactions and adaptive recommendations
3. **Content Moderation**: Set up trainer review workflows for community content
4. **Analytics**: Track user engagement with different Alice modes and features
5. **Marketplace Growth**: Onboard video sellers and monitor content quality metrics
