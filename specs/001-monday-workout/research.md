# Research: Monday Workout Intensity Analysis

**Date**: 2025-09-26
**Context**: Technical research for Monday workout intensity analysis feature

## Key Research Areas

### 1. Existing WorkoutExecutionService Integration

**Decision**: Extend existing WorkoutExecutionService rather than create separate system
**Rationale**: 
- Current service handles workout session management and completion tracking
- Avoids duplicate workout state management and potential conflicts
- Leverages existing WorkoutState interface and patterns
- Maintains consistency with existing architecture

**Alternatives considered**:
- Standalone Monday service: Rejected due to potential state conflicts and duplication
- Complete service replacement: Rejected due to scope and risk

**Implementation approach**: Add Monday-specific methods to WorkoutExecutionService for data collection, hashing, and volume adjustment calculations

### 2. Wearable Data Integration Patterns

**Decision**: Use Capacitor plugins for HealthKit/Health Connect integration
**Rationale**:
- Capacitor already integrated for iOS/Android deployment
- Standard pattern for accessing native health APIs
- Consistent with existing mobile architecture
- Provides fallback patterns for missing data

**Alternatives considered**:
- Direct native implementation: Rejected due to complexity and maintenance
- Third-party fitness APIs: Rejected due to cost and dependency concerns
- Mock data only: Insufficient for production feature

**Implementation approach**: Create health data service that abstracts HealthKit/Health Connect APIs with consistent interface

### 3. Weekly Processing Architecture

**Decision**: Implement Monday batch processing as scheduled Convex action
**Rationale**:
- Convex supports scheduled actions for automated processing
- Aligns with existing backend architecture
- Cost-efficient weekly processing vs real-time
- Natural integration with existing data storage

**Alternatives considered**:
- Client-side processing: Rejected due to battery usage and reliability
- External cron service: Rejected due to cost and complexity
- Real-time processing: Rejected due to cost constraints

**Implementation approach**: Create Convex scheduled action that processes users' weekly workout data every Monday

### 4. Data Security and Hashing

**Decision**: Implement SHA-256 hashing in client before transmission to Convex
**Rationale**:
- JavaScript crypto API provides native SHA-256 support
- Client-side hashing reduces sensitive data transmission
- Meets security requirements from specification
- Integrates with existing data flow patterns

**Alternatives considered**:
- Server-side hashing: Rejected due to security preference for client-side
- Alternative hash algorithms: SHA-256 specified in requirements
- No hashing: Rejected due to security requirements

**Implementation approach**: Create crypto utility service for consistent hashing across workout data

### 5. Intensity Calculation Algorithm

**Decision**: Implement base 50% + component scoring system as specified
**Rationale**:
- Clear formula provided in feature specification
- Components: HR variance, SpO2 drift, sleep score, user feedback
- Default fallback to 50% for missing data
- Standardized user feedback scoring system

**Components**:
- Base: 50%
- HR variance: Variable based on workout vs resting HR
- SpO2 drift: Negative impact from oxygen saturation drops
- Sleep score: Previous night's sleep quality impact
- User feedback: Standardized values (-15 to +20)

**Implementation approach**: Create intensity calculation service with component-based scoring

### 6. Volume Adjustment Rules

**Decision**: Implement rule-based volume adjustments as specified
**Rationale**:
- Clear rules provided: intensity >100% or "easy killer" + strain >95% triggers 5-10% reduction
- Aligns with constitutional safety principles
- Prevents overtraining automatically
- Simple rule implementation over complex AI

**Rules**:
- Intensity >100%: Reduce next week volume by 5-10%
- User feedback "easy killer" + strain >95%: Reduce volume by 5-10%
- Hard-coded progression drops for extreme health metric deviations
- Missing workout data: Drop progression, default 50% intensity

**Implementation approach**: Create volume adjustment service with rule-based logic

## Technical Findings

### Capacitor Health Integration
- @capacitor-community/health package available for HealthKit/Health Connect
- Provides unified API for iOS/Android health data access
- Supports heart rate, SpO2, sleep data retrieval
- Handles permission management automatically

### Convex Scheduled Actions
- Built-in cron-style scheduling in Convex
- Can run weekly on specific days (Mondays)
- Access to full database context for user processing
- Automatic retry and error handling

### TypeScript Crypto Support
- Web Crypto API available in modern browsers
- Native SHA-256 implementation
- Async/await pattern for hash generation
- Consistent across platforms

### Data Flow Architecture
```
User Workout → WorkoutExecutionService → Weekly Data Collection → 
Hash Generation → Convex Storage → Monday Processing → 
Intensity Calculation → Volume Adjustment → User Notification
```

## Unknowns Resolved

All technical unknowns from the specification have been resolved:
- ✅ Integration with existing services: Extend WorkoutExecutionService
- ✅ Wearable data source: Capacitor health plugins
- ✅ Weekly processing: Convex scheduled actions  
- ✅ Data security: Client-side SHA-256 hashing
- ✅ Calculation algorithms: Specified formulas and rules
- ✅ Platform compatibility: SvelteKit + Capacitor architecture

## Next Steps

Phase 1 will create:
- Data model for workout sessions, health metrics, intensity scores
- API contracts for workout data collection and Monday processing
- Contract tests for data validation
- Quickstart guide for feature integration
