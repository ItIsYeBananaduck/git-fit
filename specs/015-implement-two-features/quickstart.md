# Quickstart Guide: Customizable Alice Orb Color & Watch Interface

## Overview

This guide helps you test the customizable orb color and watch interface features. Follow these steps to verify both features work as designed.

## Prerequisites

- AdaptiveFit app installed and user authenticated
- Smartwatch connected (Apple Watch, Wear OS, or compatible device)
- Audio device available (Bluetooth earbuds, wired headphones, or built-in speakers)
- Active workout session or ability to start one

## Feature 1: Customizable Orb Color

### Test Scenario 1: Color Customization

1. **Open Settings Drawer**
   - Swipe up from bottom of screen to open settings drawer
   - Look for "Alice Appearance" or "Orb Settings" section

2. **Adjust Color**
   - Find the color slider (hue 0-360°)
   - Drag slider to select a new color (try hue 120 for green)
   - **Expected**: Orb color changes immediately
   - **Validation**: Color persists after closing and reopening app

3. **Verify Default**
   - Reset to default color
   - **Expected**: Orb returns to electric blue (#00BFFF)

### Test Scenario 2: Strain-Based Color Adjustment

1. **Start Workout**
   - Begin any workout in the app
   - Ensure strain data is being tracked

2. **Test Low Strain (<90%)**
   - Perform light exercise to keep strain below 90%
   - **Expected**: Orb appears 20% lighter than base color
   - **Timing**: Color change within 250ms of strain update

3. **Test Optimal Strain (90-100%)**
   - Increase intensity to 90-100% strain
   - **Expected**: Orb shows exact base color selected

4. **Test High Strain (>100%)**
   - Push intensity above 100% if possible
   - **Expected**: Orb appears 20% darker than base color

### Test Scenario 3: Performance Validation

1. **Rapid Strain Changes**
   - Quickly change exercise intensity
   - **Expected**: Orb color updates within 250ms
   - **Validation**: No lag or flickering during transitions

## Feature 2: Watch Interface

### Test Scenario 4: Watch App Launch

1. **Open Watch App**
   - Launch AdaptiveFit on your smartwatch
   - **Expected**: Alice orb appears on watch screen
   - **Validation**: Orb color matches current strain level

2. **Verify Display Elements**
   - During active set: See intensity percentage (0-120%)
   - During rest: See countdown timer and "Start" button
   - **Expected**: UI adapts based on workout state

### Test Scenario 5: Exercise Controls

1. **Adjust Reps**
   - Tap +/- buttons next to reps counter
   - **Expected**: Reps increment/decrement by 1
   - **Validation**: Changes sync to main app immediately

2. **Adjust Weight**
   - Tap +/- buttons next to weight display
   - **Expected**: Weight changes by 5lb increments
   - **Validation**: Changes reflect in main app

3. **Complete Set**
   - Tap "Start" button during rest period
   - **Expected**: Watch transitions to active set display
   - **Validation**: Set counter increments

### Test Scenario 6: Audio Device Integration

1. **Connect Audio Device**
   - Connect Bluetooth earbuds or plug in wired headphones
   - **Expected**: System detects audio device connection

2. **Test Wave Animations**
   - Have Alice provide audio feedback during workout
   - **Expected**: Three blue wave animations appear on orb (120° intervals)
   - **Timing**: Animations trigger within 400ms of audio start

3. **Test Without Audio Device**
   - Disconnect audio device
   - **Expected**: Wave animations stop appearing
   - **Validation**: Orb still functions normally

### Test Scenario 7: Offline Synchronization

1. **Disconnect Watch**
   - Turn off Bluetooth or move watch out of range
   - **Expected**: Watch shows "offline" indicator

2. **Make Offline Changes**
   - Adjust reps and weight on watch while disconnected
   - **Expected**: Changes stored locally, UI remains responsive

3. **Reconnect and Sync**
   - Restore connection to main app
   - **Expected**: All offline changes sync within 5 seconds
   - **Validation**: No data loss, main app reflects all changes

## Validation Checklist

### Orb Customization ✓

- [ ] Color slider changes orb immediately
- [ ] Color preference persists across app sessions
- [ ] Strain-based lightening works (<90% strain)
- [ ] Exact color displays at optimal strain (90-100%)
- [ ] Strain-based darkening works (>100% strain)
- [ ] Updates complete within 250ms performance target

### Watch Interface ✓

- [ ] Watch app displays orb and workout data
- [ ] Exercise controls respond within 100ms
- [ ] Reps adjust by ±1, weight by ±5lb
- [ ] Changes sync to main app in real-time
- [ ] Rest timer counts down accurately
- [ ] Set transitions work correctly

### Audio Integration ✓

- [ ] System detects Bluetooth audio devices
- [ ] System detects wired audio devices
- [ ] Wave animations trigger with Alice's voice
- [ ] Animations don't appear without audio device
- [ ] Performance impact is minimal

### Offline Capability ✓

- [ ] Watch operates normally when disconnected
- [ ] Offline changes queue properly
- [ ] Sync recovery completes without data loss
- [ ] Conflict resolution handles concurrent changes
- [ ] User experience remains smooth throughout

## Troubleshooting

### Common Issues

- **Orb not changing color**: Check strain data is active and updating
- **Watch not connecting**: Verify Bluetooth permissions and pairing
- **Audio device not detected**: Check browser/app audio permissions
- **Slow color updates**: Monitor network connectivity and device performance
- **Sync conflicts**: Force app refresh and retry synchronization

### Performance Issues

- **Lag > 250ms**: Check device memory usage and background apps
- **Battery drain**: Verify watch app optimizations and connection frequency
- **Storage full**: Clear old workout data or expand device storage

## Success Criteria

- All test scenarios pass without errors
- Performance targets met (<250ms orb updates, <100ms watch responses)
- No data loss during offline/online transitions
- Smooth user experience across all device types
- Audio integration works with major headphone brands
