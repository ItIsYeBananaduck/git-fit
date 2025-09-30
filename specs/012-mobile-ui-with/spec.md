# Feature Specification: Mobile UI with Dark Mode, Liquid Glass Effects, and Complete#### Onboarding & Macro Calculation

- **FR-024**: System MUST conduct voice-guided onboarding collecting user weight, unit preference (Imperial/Metric), and fitness goals (Weight Loss, Muscle Gain, Maintenance, Powerlifting, Body Building)
- **FR-025**: System MUST calculate initial macro targets based on user weight and selected fitness goal from the five available options Flow

**Feature Branch**: `012-mobile-ui-with`  
**Created**: September 30, 2025  
**Status**: Draft  
**Input**: User description: "Mobile UI with Dark mode: black (#0A0A0A), navy (#001F3F), electric blue (#00BFFF), gray (#333333), white text. Liquid glass via CSS blur/gradients. Haptics on taps. Responsive: phone portrait, iPad split for trainers. Complete app flow with onboarding, workouts, nutrition tracking, and macro calculations."

## Clarifications

### Session 2025-09-30

- Q: What fitness goal options should be available during onboarding? → A: Weight Loss, Muscle Gain, Maintenance, Powerlifting, Body Building
- Q: How should the system handle data conflicts when syncing offline changes? → A: Merge non-conflicting fields, prompt for conflicts
- Q: What are the maximum acceptable response times for critical user interactions? → A: <500ms for UI, <2s for data, <10s for scans
- Q: How should user authentication and trainer access be handled? → A: Biometric login, trainers request access approval
- Q: What should happen when a food item cannot be found in the database? → A: Allow custom food entry with manual macro input
- Additional requirement: Add ability to switch between Imperial and Metric units of measure

## User Scenarios & Testing

### Primary User Story

As a fitness enthusiast, I want to use AdaptiveFit on my mobile device with an intuitive dark-themed interface that provides liquid glass visual effects, haptic feedback, and responsive design that adapts between phone and tablet layouts, so I can efficiently track workouts, nutrition, and receive AI-powered coaching recommendations.

### Acceptance Scenarios

1. **Given** user opens the app for the first time, **When** they complete voice-guided onboarding, **Then** their personal macro calculations are set based on weight and fitness goals
2. **Given** user is on the home screen, **When** they swipe left/right on the central orb, **Then** the orb rotates 90° with haptic feedback and switches between Activity and Nutrition modes
3. **Given** user is performing a workout, **When** they tap "skip set" or "easy killer", **Then** the system logs the reason and adjusts future recommendations accordingly
4. **Given** user scans a barcode during nutrition tracking, **When** the scan succeeds, **Then** food information auto-populates with macro data
5. **Given** trainer uses iPad in landscape mode, **When** they view client data, **Then** interface splits to show client list on left and detailed workout data on right
6. **Given** user taps any interactive element, **When** the action is triggered, **Then** appropriate haptic feedback is provided

### Edge Cases

- When barcode scan fails or food item not found, system provides custom food entry option with manual macro input
- How does system handle offline mode for workout logging?
- What occurs when user adjusts protein intake outside recommended guardrails?
- How does interface adapt when switching between portrait and landscape on tablets?
- What happens when user cancels onboarding mid-process?

## Requirements

### Functional Requirements

#### Core UI/UX Requirements

- **FR-001**: System MUST display consistent dark theme using specified color palette (black #0A0A0A, navy #001F3F, electric blue #00BFFF, gray #333333, white text)
- **FR-002**: System MUST implement liquid glass visual effects using CSS blur and gradient techniques without borders or shadows unless specifically required
- **FR-003**: System MUST provide haptic feedback on all interactive elements including taps and swipes
- **FR-004**: System MUST adapt responsively between phone portrait mode and iPad split-screen layout for trainer functionality
- **FR-005**: System MUST maintain 60fps performance for all animations including orb rotations, ripple effects, and intensity fills
- **FR-005a**: System MUST respond to UI interactions within 500ms, load data within 2 seconds, and complete barcode scans within 10 seconds

#### Authentication & Access Control

- **FR-006**: System MUST provide biometric authentication (fingerprint, face ID) as primary login method
- **FR-007**: System MUST allow trainers to request access to client data with client approval required
- **FR-008**: System MUST maintain active authentication session with biometric re-verification for sensitive operations
- **FR-008a**: System MUST provide unit system toggle between Imperial (lbs, ft/in) and Metric (kg, cm) with instant conversion of all displayed values

#### Home Screen & Navigation

- **FR-009**: System MUST display central 200px black orb that switches between Activity and Nutrition modes
- **FR-010**: System MUST enable left/right swipe gestures on orb with 90° rotation animation and haptic feedback
- **FR-011**: System MUST show live strain percentage in orbiting cyan ring (50px) positioned top-right
- **FR-012**: System MUST provide bottom navigation with 4 glass-effect dots for Home, Track, Teams, and Me sections

#### Workout Functionality

- **FR-013**: System MUST display workout selection screen with vertical list of saved routines and Quick Start options
- **FR-014**: System MUST provide search functionality filtering by muscle group or keyword
- **FR-015**: System MUST show workout screen with 100px intensity orb (black rim, blue fill 0-100%)
- **FR-016**: System MUST enable set/rep/weight editing via drag and snap interactions on glass slab interface
- **FR-017**: System MUST provide swipe gestures for exercise navigation and set management (add/skip)
- **FR-018**: System MUST integrate music player with BPM synchronization at bottom-center position

#### Nutrition Tracking

- **FR-019**: System MUST provide horizontal timeline bar for meal time selection via drag interaction
- **FR-020**: System MUST enable barcode scanning functionality using device camera
- **FR-021**: System MUST connect to food database API for nutrition data retrieval with manual search fallback
- **FR-022**: System MUST display food cards with macro sliders and running totals
- **FR-023**: System MUST allow custom food entry with manual macro input when items are not found in database

#### Onboarding & Macro Calculation

- **FR-020**: System MUST conduct voice-guided onboarding collecting user weight and fitness goals (Weight Loss, Muscle Gain, Maintenance, Powerlifting, Body Building)
- **FR-021**: System MUST calculate initial macro targets based on user weight and selected fitness goal from the five available options
- **FR-022**: System MUST enforce protein guardrails (minimum 0.4g/lb for Weight Loss/Maintenance, maximum 1.0-1.5g/lb based on goal with higher ranges for Powerlifting/Body Building)
- **FR-023**: System MUST provide macro adjustment sliders with automatic balancing of carbs and fat
- **FR-024**: System MUST warn users when protein intake falls outside recommended ranges

#### Trainer Mode

- **FR-025**: System MUST display trainer interface with client avatar grid (3 columns on phone)
- **FR-026**: System MUST show live intensity rings around client avatars during active sessions
- **FR-027**: System MUST provide iPad split-screen layout with client list and detailed workout view
- **FR-028**: System MUST enable session sharing to native calendar applications

#### Feedback & AI Integration

- **FR-029**: System MUST capture user feedback for skipped sets and workout difficulty
- **FR-030**: System MUST prompt for reason when sets are skipped (Tired, Not Feeling It, Form Shaky, Pain, Hurt Earlier)
- **FR-031**: System MUST log pain reports with 0-10 rating and location for trainer review
- **FR-032**: System MUST adjust future workout recommendations based on user feedback patterns
- **FR-033**: System MUST perform weekly check-ins via energy/sleep surveys to optimize macro targets

#### Data Management & Privacy

- **FR-034**: System MUST provide offline capability with data synchronization when connection restored using merge strategy (non-conflicting fields auto-merge, conflicting changes prompt user for resolution)
- **FR-035**: System MUST implement 30-day data deletion option for privacy compliance
- **FR-036**: System MUST allow users to toggle data collection on/off
- **FR-037**: System MUST export trainer notes in timestamped format

### Key Entities

- **User Profile**: Contains weight, unit preference (Imperial/Metric), fitness goals, macro targets, workout preferences, trainer assignments, and privacy settings
- **Workout Session**: Includes exercise list, sets/reps/weights, completion status, user feedback, AI adjustments, and performance metrics
- **Nutrition Entry**: Food items with macro breakdown, meal timing, barcode data, and manual overrides
- **Trainer Client**: Relationship between trainer and client with session history, notes, calendar integration, and progress tracking
- **Feedback Log**: User responses to workout difficulty, set skipping reasons, pain reports, and energy surveys
- **AI Recommendations**: Generated suggestions for workout adjustments, macro changes, and recovery recommendations based on user patterns

---

## Review & Acceptance Checklist

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

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed
