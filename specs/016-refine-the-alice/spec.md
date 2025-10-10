# Feature Specification: Refine Alice Orb AI Voice Coach

**Feature Branch**: `016-refine-the-alice`  
**Created**: October 2, 2025  
**Status**: Draft  
**Input**: User description: "Refine the Alice orb feature for the AdaptiveFit fitness app using Svelte/Capacitor with Convex backend, making her a ferrofluid-like AI voice coach (even 100px diameter orb) that morphs and interacts to feel alive"

## Execution Flow (main)

```
1. Parse user description from Input
   → Ferrofluid-like AI voice coach with morphing capabilities
2. Extract key concepts from description
   → Actors: users, Alice AI coach; Actions: morph, display text, respond to touch, sync with workouts; Data: strain levels, rest periods, user preferences; Constraints: 100px diameter, real-time responsiveness
3. For each unclear aspect:
   → [NEEDS CLARIFICATION: Voice interaction scope and triggers]
   → [NEEDS CLARIFICATION: Workout data synchronization frequency]
4. Fill User Scenarios & Testing section
   → Primary: Interactive fitness coaching during workouts
5. Generate Functional Requirements
   → Visual morphing, text display, touch interactions, workout sync
6. Identify Key Entities
   → Alice AI state, workout session data, user preferences
7. Run Review Checklist
   → Spec has some implementation details that need business focus
8. Return: SUCCESS (spec ready for planning)
```

---

## Clarifications

### Session 2025-10-02

- Q: What specific voice coaching interactions should Alice provide when earbuds are connected? → A: Spoken workout encouragement and form cues during exercises, audio feedback for set completion and rest period guidance, plus workout summary
- Q: What specific actions should Alice cycle through when users swipe left/right on the home screen? → A: Navigate between app sections (Workouts, Nutrition, Progress, Settings)
- Q: How frequently should Alice synchronize with workout data during active exercise sessions? → A: Real-time (every 1-2 seconds) for immediate responsiveness
- Q: What should happen when Alice experiences rapid strain changes that could cause excessive morphing animations? → A: Only morph on significant strain changes (>15% difference)
- Q: How should Alice behave when workout data is temporarily unavailable (offline mode)? → A: Turn her gray and switch to neutral blob shape

## User Scenarios & Testing _(mandatory)_

### Primary User Story

As a fitness app user, I want Alice to be a lifelike AI voice coach that visually responds to my workout intensity and provides real-time feedback through morphing shapes, eye expressions, and text displays, so that I feel motivated and guided throughout my fitness journey.

### Acceptance Scenarios

1. **Given** a user is starting a workout, **When** they view Alice, **Then** Alice displays as a smooth blob with neutral expression and shows "Ready" in her eye
2. **Given** a user is performing high-intensity exercise (strain >85%), **When** Alice detects the intensity, **Then** she morphs into a stretched pulse shape with excited eye expression and displays current strain percentage
3. **Given** a user is in rest period, **When** the rest timer is active, **Then** Alice displays rest countdown in her eye and maintains a calm, rhythmic ripple shape
4. **Given** a user taps Alice's eye, **When** the tap is registered, **Then** Alice blinks (eye scales briefly) providing tactile feedback
5. **Given** a user swipes left/right on Alice (home screen only), **When** the gesture is detected, **Then** Alice cycles through available actions and displays the current selection in her eye
6. **Given** a user changes Alice's color preference, **When** the setting is saved, **Then** Alice immediately reflects the new color scheme with gradient effects

### Edge Cases

- What happens when workout data is temporarily unavailable (offline mode)? → Alice turns gray and switches to neutral blob shape
- How does Alice behave during exercise transitions (switching between high/low intensity)?
- What happens if user attempts to interact with Alice during restricted modes (mid-workout)?
- How does the system handle rapid strain changes that could cause excessive morphing? → Only morph on significant changes (>15% difference)

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Alice MUST display as a ferrofluid-like orb that morphs between three distinct shapes: smooth blob (neutral), stretched pulse (intense), and wavy ripple (rhythmic), only triggering morphing on significant strain changes (>15% difference)
- **FR-002**: Alice MUST complete shape transitions within 3 seconds using smooth easing animations
- **FR-003**: Alice MUST display an interactive eye (white circle) in the center that shows contextual text information
- **FR-004**: The eye MUST display strain percentage (0-100%, capped) during active exercise or countdown timer during rest periods
- **FR-005**: Alice MUST respond to user touch interactions: tap to blink, swipe left/right to cycle through app sections (Workouts, Nutrition, Progress, Settings) on home screen only
- **FR-006**: Alice MUST express mood through eye positioning: squint for excitement (good performance), droop for disappointment (skipped sets)
- **FR-007**: Alice MUST synchronize with real-time workout data every 1-2 seconds during active sessions, including strain levels, rest status, and performance metrics
- **FR-008**: Users MUST be able to customize Alice's main color through a settings interface
- **FR-009**: Alice MUST apply secondary color overlays based on strain levels (lighter when <90%, darker when >100%)
- **FR-010**: Alice MUST maintain a minimum size of 100px diameter while preserving all interactive features
- **FR-011**: Alice MUST provide immediate visual feedback for all user interactions within 500ms
- **FR-012**: Alice MUST lock to strain/rest display mode during active workouts and unlock for navigation on home screen
- **FR-013**: Alice MUST detect earbuds connection status and provide voice coaching including spoken workout encouragement, form cues during exercises, audio feedback for set completion and rest periods, plus workout summaries
- **FR-014**: Alice MUST persist user color preferences across app sessions
- **FR-015**: Alice MUST display in gray color and switch to neutral blob shape when workout data is temporarily unavailable (offline mode)

### Key Entities _(include if feature involves data)_

- **Alice AI State**: Current mood (neutral/intense/rhythmic), eye expression (neutral/excited/sad), active display mode (strain/rest/navigation)
- **Workout Session Data**: Real-time strain levels, rest periods, set completion status, performance indicators
- **User Preferences**: Customized Alice color (hue 0-360°), interaction settings, coaching preferences
- **Interaction Context**: Current page/screen, available actions for swipe cycling, touch interaction permissions

---

## Review & Acceptance Checklist

_GATE: Automated checks run during main() execution_

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

_Updated by main() during processing_

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---
