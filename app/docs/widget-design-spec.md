# Widget Design Specification

## Overview

Quick access widgets for iOS and Android that display key strain assessment and training information at a glance.

## Widget Data Sources

- **Strain Assessment Service**: Current status, composite score, zones
- **Adaptive Training Engine**: Next workout recommendation, intensity level
- **Wearable Data**: Latest HR, SpO₂, HRV readings

## Widget Variants

### 1. Compact Widget (Small)

```text
┌─────────────────┐
│ 🟢 Ready        │
│ Next: Push Day  │
└─────────────────┘
```

### 2. Standard Widget (Medium)

```text
┌─────────────────┐
│ 🟢 Ready to Train │
├─────────────────┤
│ Next: Push Day   │
│ Intensity: High  │
│ Strain: 68/100   │
└─────────────────┘
```

### 3. Expanded Widget (Large)

```text
┌─────────────────┐
│ 🟢 Ready to Train │
├─────────────────┤
│ Next Workout     │
│ Push Day (Legs)  │
│ Intensity: High  │
├─────────────────┤
│ Key Metrics      │
│ HR: 62 bpm       │
│ SpO₂: 97%        │
│ Strain: 68/100   │
└─────────────────┘
```

## Color Coding System

### Status Colors

- 🟢 **Green**: Ready to train (normal intensity)
- 🟡 **Yellow**: Moderate caution (reduced intensity)
- 🟠 **Orange**: High caution (light activity only)
- 🔴 **Red**: Stop training (rest required)

### Metric Colors

- **Normal Range**: Default text color
- **Warning Range**: Yellow/Orange text
- **Critical Range**: Red text

## Interactive Elements

### Tap Actions

- **Widget Tap**: Open main app to training screen
- **Status Tap**: Show detailed strain assessment
- **Workout Tap**: Open workout details/preview

### Refresh Triggers

- **Manual**: Pull-to-refresh on supported platforms
- **Auto**: Background updates every 15-30 minutes
- **Push**: Real-time updates when new wearable data arrives

## Platform-Specific Considerations

### iOS WidgetKit

- **Sizes**: Small, Medium, Large, Extra Large
- **Timeline**: Support for multiple timeline entries
- **Deep Linking**: URL schemes for app navigation
- **Smart Stack**: Intelligent widget suggestions

### Android App Widgets

- **Sizes**: 1x1, 2x1, 2x2, 4x1, 4x2
- **Update Frequency**: Respect system battery optimization
- **Configuration**: Allow widget customization
- **Shortcuts**: Quick actions via long-press menu

## Data Synchronization

### Update Strategy

- **Real-time**: Critical alerts (high risk status)
- **Frequent**: Training recommendations (every 15 min)
- **Periodic**: General metrics (every 30 min)
- **On-demand**: Manual refresh

### Offline Handling

- **Cache**: Show last known good data
- **Indicators**: Show offline status
- **Retry**: Auto-retry failed syncs

## Accessibility

### VoiceOver/TalkBack Support

- **Labels**: Descriptive text for all elements
- **Hints**: Action descriptions for interactive elements
- **Grouping**: Logical grouping of related information

### Dynamic Type

- **Scalable**: Support for larger text sizes
- **Layout**: Adaptive layouts for different text sizes

## Implementation Notes

### Shared Logic

- **Data Models**: Common TypeScript interfaces
- **Business Logic**: Shared strain assessment calculations
- **Styling**: Consistent design tokens across platforms

### Platform-Specific

- **iOS**: SwiftUI for modern widget implementation
- **Android**: Compose for modern widget implementation
- **Fallback**: Traditional APIs for older OS versions
