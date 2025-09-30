# Quickstart Guide: Mobile UI Feature

## Development Setup

### Prerequisites
- Node.js 18+ installed
- Android Studio or Xcode for mobile testing
- Git repository access

### Installation
```bash
cd git-fit
npm install
npm run dev
```

### Mobile Development Setup
```bash
# Install Capacitor dependencies
npm install @capacitor/haptics @capacitor/biometric-auth @capacitor/camera

# Initialize mobile platforms
npx cap add ios
npx cap add android

# Sync web assets to mobile
npx cap sync
```

## Feature Validation Scenarios

### Scenario 1: Dark Theme and Liquid Glass Effects
**Goal**: Verify consistent dark theme with liquid glass visual effects

**Steps**:
1. Open app in development mode
2. Navigate to home screen
3. Verify color palette: black (#0A0A0A), navy (#001F3F), electric blue (#00BFFF), gray (#333333), white text
4. Check liquid glass effects on navigation dots and orb elements
5. Confirm no borders or shadows except where specifically required

**Expected Results**:
- Consistent dark theme across all screens
- Smooth CSS blur and gradient effects
- 60fps performance on animations

### Scenario 2: Haptic Feedback Integration
**Goal**: Test haptic feedback on interactive elements

**Steps**:
1. Deploy to physical iOS/Android device
2. Tap various interactive elements (buttons, orb, navigation)
3. Perform swipe gestures on central orb
4. Test workout feedback buttons (skip, easy, killer)

**Expected Results**:
- Distinct haptic feedback on each interaction type
- No haptic feedback in web browser (graceful fallback)
- Appropriate haptic intensity for different action types

### Scenario 3: Biometric Authentication Flow
**Goal**: Validate secure biometric login and trainer access approval

**Steps**:
1. Enable biometric auth in device settings
2. Launch app and initiate biometric setup
3. Test fingerprint/face ID authentication
4. Simulate trainer access request flow
5. Test biometric re-verification for sensitive operations

**Expected Results**:
- Successful biometric enrollment and authentication
- Graceful fallback to PIN/password if biometric fails
- Secure trainer access approval workflow

### Scenario 4: Unit System Switching
**Goal**: Verify real-time unit conversion between Imperial and Metric

**Steps**:
1. Set initial profile with Imperial units (weight in lbs)
2. Navigate to settings and switch to Metric
3. Verify weight converts to kg instantly
4. Check workout weights, macro calculations, and progress data
5. Switch back to Imperial and verify consistency

**Expected Results**:
- Instant conversion of all displayed values
- Consistent precision (2 decimal places)
- No data loss during unit switching

### Scenario 5: Responsive Design and iPad Layout
**Goal**: Test responsive behavior across device sizes

**Steps**:
1. Test on iPhone in portrait mode
2. Test on iPad in landscape mode (trainer view)
3. Verify split-screen layout with client list + workout details
4. Test phone landscape mode behavior
5. Verify all touch targets are accessible

**Expected Results**:
- Smooth responsive transitions
- iPad trainer mode shows split-screen layout
- All interactive elements remain accessible
- No content clipping or overflow issues

### Scenario 6: Offline Sync and Conflict Resolution
**Goal**: Validate offline capability and sync conflict handling

**Steps**:
1. Start workout session while online
2. Disable network connection
3. Log workout data, nutrition entries, user feedback
4. Re-enable network connection
5. Trigger sync and test conflict resolution flow

**Expected Results**:
- Full offline functionality maintained
- Sync detects conflicts correctly
- User prompted for conflict resolution choices
- Non-conflicting data merges automatically

### Scenario 7: Workout Session with Real-time Feedback
**Goal**: Test complete workout flow with AI integration

**Steps**:
1. Start new workout session
2. Perform exercises with set/rep logging
3. Submit feedback for skipped sets (tired, pain, etc.)
4. Test intensity orb updates based on vitals
5. Verify AI adjustment recommendations

**Expected Results**:
- Intensity orb reflects 0-100% accurately
- User feedback captured with proper categorization
- AI suggestions appear based on feedback patterns
- Performance meets <500ms UI response target

### Scenario 8: Nutrition Tracking with Barcode Scanning
**Goal**: Validate complete nutrition logging workflow

**Steps**:
1. Navigate to nutrition tracking screen
2. Test barcode scanning with camera
3. Search for foods manually when barcode fails
4. Create custom food entry with manual macros
5. Verify timeline positioning and running totals

**Expected Results**:
- Barcode scanning completes within 10 seconds
- Fallback to manual search works smoothly
- Custom food creation with macro validation
- Timeline reflects meal timing accurately

## Performance Validation

### Response Time Targets
- UI interactions: <500ms
- Data loading: <2 seconds  
- Barcode scanning: <10 seconds

### Animation Performance
- Orb rotations: 60fps
- Intensity fills: 60fps
- Liquid glass effects: 60fps
- Page transitions: 60fps

### Memory Usage
- iOS: <150MB baseline
- Android: <200MB baseline
- Web: <100MB baseline

## Testing Commands

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Mobile Testing
```bash
# iOS Simulator
npx cap run ios

# Android Emulator
npx cap run android

# Live Reload on Device
npx cap run ios --livereload
npx cap run android --livereload
```

### Performance Testing
```bash
# Web performance
npm run test:perf

# Mobile performance profiling
npx cap open ios  # Use Instruments
npx cap open android  # Use Android Profiler
```

## Troubleshooting

### Common Issues
1. **Haptics not working**: Ensure testing on physical device, not simulator
2. **Biometric auth fails**: Check device biometric settings and permissions
3. **Barcode scanning slow**: Verify camera permissions and lighting conditions
4. **Sync conflicts**: Clear local storage and re-sync for testing
5. **Animation stuttering**: Check GPU acceleration and reduce animation complexity

### Debug Tools
- Chrome DevTools for web debugging
- Safari Developer Tools for iOS debugging
- Chrome DevTools for Android debugging
- Capacitor Live Reload for rapid iteration