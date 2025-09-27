# Research: Intensity Score (Live)

## Overview
Research findings for implementing real-time workout intensity scoring system with strain monitoring, AI coaching, and social features.

## Key Research Areas

### 1. Strain vs Intensity Separation

**Decision**: Implement separate calculation systems
**Rationale**: 
- Strain (live/device-only): Real-time physiological monitoring using (0.4 × HR rise) + (0.3 × SpO₂ drop) + (0.3 × recovery delay)
- Intensity (backend/stored): Performance scoring using (tempo × 0.30) + (motionSmoothness × 0.25) + (repConsistency × 0.20) + (userFeedback × 0.15) + (strainModifier × 0.10)
**Alternatives considered**: Single unified system, but spec explicitly requires strain to never be stored while intensity needs backend persistence

### 2. Wearable Health Data Integration

**Decision**: Use existing @felix-health/capacitor-health-data plugin v1.0.9
**Rationale**: Already integrated in codebase, supports HealthKit (iOS) and Health Connect (Android), provides heart rate, SpO₂, and accelerometer data required for strain/intensity calculations
**Alternatives considered**: Native health integrations per platform, but existing solution already meets all major brand requirements specified

### 3. Real-Time Performance Requirements

**Decision**: Implement device-side strain calculation with <1 second update frequency
**Rationale**: 
- Spec requires <1 second real-time updates during workouts
- On-device calculation eliminates network latency
- Reduces backend load for 1,000-10,000 concurrent users
**Alternatives considered**: Backend real-time processing, but latency and privacy requirements favor device-side approach

### 4. AI Coaching Architecture

**Decision**: Extend existing Alice/Aiden coaching system with strain-aware context
**Rationale**: 
- Existing aiCoaching.ts provides personality framework
- Spec requires AI voice only with earbuds connected
- Calibration system for Week 1 new exercises matches existing adaptive training patterns
**Alternatives considered**: New AI system, but constitutional requirement for existing code integration

### 5. Supplement Tracking & Social Features

**Decision**: Implement barcode scanning with OpenFoodFacts API integration
**Rationale**: 
- Spec explicitly mentions OpenFoodFacts API: https://world.openfoodfacts.org/api/v0/product/.json
- 28-day lock period prevents rapid changes
- Medical data redaction for privacy compliance
**Alternatives considered**: Manual supplement entry, but barcode scanning provides better UX and data accuracy

### 6. Data Privacy & Storage Strategy

**Decision**: On-device strain processing with immediate hash/discard of health data
**Rationale**: 
- Constitutional privacy requirements
- Strain data never permanently stored per spec
- Only intensity scores transmitted to backend in raw format
- Supplement stacks store full text on-device, only hash public items for backend
**Alternatives considered**: Backend health data storage, but violates privacy principles and spec requirements

### 7. Mobile Platform Architecture

**Decision**: Capacitor 7.4+ with native plugin integration for health sensors
**Rationale**: 
- Existing infrastructure supports iOS/Android deployment
- @felix-health/capacitor-health-data provides unified health data access
- SvelteKit provides consistent UI across web/mobile
**Alternatives considered**: React Native or native development, but existing Capacitor setup meets all requirements

### 8. Real-Time Communication

**Decision**: Use Convex real-time subscriptions for intensity score updates
**Rationale**: 
- Existing Convex 1.27+ infrastructure supports real-time queries
- <200ms API response time requirement achievable
- Scales to 1,000-10,000 concurrent users within budget constraints
**Alternatives considered**: WebSockets or Server-Sent Events, but Convex provides integrated solution

## Implementation Approach

### Phase 1: Core Strain Calculation
- Device-side strain calculator following spec formula
- Integration with existing health data services
- Real-time strain status (green/yellow/red) based on thresholds

### Phase 2: Intensity Scoring System
- Backend intensity calculation with workout data integration
- Strain modifier application (1.0, 0.95, 0.85 based on strain levels)
- User feedback integration for score adjustments

### Phase 3: AI Coaching Enhancement
- Extend existing Alice/Aiden system with strain awareness
- Earbud detection for AI voice activation
- Calibration system for new exercises

### Phase 4: Supplement & Social Features
- Barcode scanning with OpenFoodFacts API
- 28-day supplement stack tracking
- Social sharing with privacy controls

## Performance Considerations

- **Real-time Updates**: <1 second strain calculation on-device
- **Concurrent Users**: 1,000-10,000 during peak hours
- **Memory Usage**: Strain calculation optimized for mobile devices
- **Battery Impact**: Efficient sensor polling to minimize battery drain

## Privacy & Compliance

- **Health Data**: Immediate hash/discard after strain calculation
- **Supplement Data**: On-device storage with selective backend hashing
- **Medical Information**: Automatic redaction of Rx compounds
- **User Control**: Opt-out capabilities for data retention and sharing

## Integration Points

- **Existing Systems**: Monday workout intensity system, health data services, AI coaching
- **New Components**: Live strain calculator, supplement tracker, enhanced social features
- **Data Flow**: Device strain → intensity modifier → backend scoring → AI coaching context