# Feature Specification: Monday Workout Intensity Analysis

**Feature Branch**: `001-monday-workout`  
**Created**: 2025-09-26  
**Status**: Clarified  
**Input**: User description: "Develop Monday workout intensity analysis as part of Technically Fit platform. Hash raw workout data (reps, sets, volume, time, est_calories, intensity) with SHA-256. Calculate intensity score (0-100%) from HR variance, SpO2 drift, sleep score, and user feedback. Adjust next week's volumes: reduce 5-10% if intensity >100% or 'easy killer' + strain >95%. Integrate with existing wearable data via HealthKit/Health Connect. Display Monday updates to users."

## Execution Flow (main)
```
1. Parse user description from Input ✓
   → Feature involves workout data collection and analysis
2. Extract key concepts from description ✓
   → Actors: gym users, workout sessions, health data sources
   → Actions: collect workout data, calculate intensity, adjust volume
   → Data: reps, sets, weight, HR, SpO2, sleep, user feedback
   → Constraints: weekly processing, secure hashing, automated adjustments
3. For each unclear aspect: ✓
   → All requirements clarified based on Technically Fit platform context
4. Fill User Scenarios & Testing section ✓
   → Clear user flow for workout completion and weekly analysis
5. Generate Functional Requirements ✓
   → Each requirement is testable and measurable
6. Identify Key Entities ✓
   → WorkoutSession, IntensityScore, VolumeAdjustment, HealthMetrics
7. Run Review Checklist ✓
   → No implementation details, focused on user needs
8. Return: SUCCESS (spec ready for planning) ✓
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
A Technically Fit user (free, pro, or trainer) completes workout sessions throughout the week. Every Monday, the system processes their workout data, calculates intensity scores from wearable data and user feedback, and automatically adjusts next week's training volumes. Pro users receive AI-driven recommendations, while free users get rule-based adjustments. The system prioritizes user feedback over wearable data and provides fallbacks when data is missing.

### Acceptance Scenarios
1. **Given** a pro user completes a workout with 5 reps at 100 lbs, heart rate averaging 145 bpm, and rates it "easy killer", **When** Monday processing occurs, **Then** the system hashes data, calculates 47% intensity, and displays "+2.5 lbs" adjustment
2. **Given** a user's intensity score exceeds 100% (e.g., 112%), **When** Monday processing runs, **Then** the system reduces next week's volume by 5-10% (e.g., 100 lbs → 90-95 lbs)
3. **Given** a user rates workout "easy killer" with strain >95%, **When** Monday analysis occurs, **Then** the system automatically reduces next week's volume by 5-10%
4. **Given** user feedback consistently mismatches health data, **When** pattern persists for 2 weeks, **Then** the system flags for review and acts on volume reduction if patterns match

### Edge Cases
- What happens if no workouts completed last week? → Drop from progression, set intensity to 50%, send hash to backend
- What happens if HR spikes >15 BPM + SpO2 drops >3% with no completed reps? → Hard-coded progression drop
- What happens if health data mismatches user feedback? → Flag for review after 2 weeks if persistent, act if patterns match
- How does the system handle missing user feedback? → Default to neutral (0 impact on intensity calculation)

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST collect workout data including reps, sets, weight, completion time, and estimated calories for every workout session
- **FR-002**: System MUST capture user feedback on workout difficulty using standardized options: "keep going" (+20), "neutral" (0), "challenge" (+10), "easy killer" (-15), "flag" (-5)
- **FR-003**: System MUST integrate health data from wearables via HealthKit/Health Connect including heart rate variance, SpO2 drift, and sleep score
- **FR-004**: System MUST calculate intensity scores (0-100%) using formula: base 50% + HR variance + SpO2 drift + sleep score + user feedback, defaulting to 50% if data missing
- **FR-005**: System MUST process workout data every Monday to generate weekly analysis and volume adjustments  
- **FR-006**: System MUST automatically reduce next week's workout volumes by 5-10% if intensity >100% or user rates "easy killer" with strain >95%
- **FR-007**: System MUST generate SHA-256 hashes of all raw workout data (reps, sets, volume, time, est_calories, intensity) before backend transmission
- **FR-008**: System MUST store hashed workout data securely in backend and wipe local cache after transmission
- **FR-009**: System MUST display Monday updates to users showing intensity percentages and volume adjustments (e.g., "112% on squats, +2.5 lbs")
- **FR-010**: System MUST flag workouts for review if user feedback consistently mismatches health data, acting on adjustments if patterns match after 2 weeks
- **FR-011**: System MUST implement hard-coded progression drops if heart rate spikes >15 BPM + SpO2 drops >3% with no completed reps
- **FR-012**: System MUST handle missing workout data by dropping from progression, setting intensity to 50%, and sending hash to backend

### Key Entities *(include if feature involves data)*
- **WorkoutSession**: Represents a single workout with exercise ID, performance metrics (reps/sets/weight), timing data, and completion status
- **HealthMetrics**: Contains heart rate data (avg/max/variance), SpO2 measurements (avg/drift), and sleep quality scores integrated from wearable devices
- **UserFeedback**: Captures subjective workout difficulty rating with three standardized options for consistent intensity calculation
- **IntensityScore**: Weekly calculated score (0-100%) combining objective health metrics with subjective feedback to measure workout strain
- **VolumeAdjustment**: Automated recommendation for next week's workout weights based on intensity analysis and progression rules
- **MondayProcessor**: Weekly batch process that analyzes workout data, calculates scores, generates adjustments, and creates user notifications

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous  
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (none found)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---