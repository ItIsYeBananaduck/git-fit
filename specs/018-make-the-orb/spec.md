# Feature Specification: Smooth Orb-to-Card Workout Interface

**Feature Branch**: `018-make-the-orb`  
**Created**: October 6, 2025  
**Status**: Draft  
**Input**: User description: "Make the orb expand-smooth, breathing expansion-until it's a full workout card, centered, no extra borders, no buttons unless she pops them up like speech bubbles. The card stays her, so give it a soft glow matching her iris color, add subtle three-D shading like it's floating. Top-left: exercise name in clean white, fades in, fades out when we swipe. Bottom-left: reps or duration, same font, same glow, pulses once like a heartbeat. Right side: vertical progress bar that only shows when she moves-calories, intensity, stress-whatever we need, but keep 'em small, thin, color-shifting with that underglow. And no treadmill mode unless it's actually on a treadmill-default to empty space with just her. Last: make sure everything animates in under a second, 'cause I don't want lag. Got it?"

## Execution Flow (main)

```text
1. Parse user description from Input
   → Extract: smooth orb expansion, card transformation, interactive elements
2. Extract key concepts from description
   → Actors: Alice AI orb, user
   → Actions: expand orb, display workout info, animate transitions
   → Data: exercise name, reps/duration, progress metrics
   → Constraints: <1s animation, conditional UI elements
3. All aspects sufficiently clear from description
4. Fill User Scenarios & Testing section
   → Clear workout interaction flow described
5. Generate Functional Requirements
   → Each requirement testable and specific
6. Identify Key Entities
   → Workout data, progress metrics, UI state
7. Run Review Checklist
   → No tech implementation details
   → Focus on user experience
8. Return: SUCCESS (spec ready for planning)
```

## Clarifications

### Session 2025-10-06

- Q: How should the system detect treadmill usage? → A: Treadmill workouts have their own dedicated workout card
- Q: What provides real-time progress metrics during workouts? → A: Combination of sensors and AI algorithms
- Q: What triggers Alice to display speech bubble buttons? → A: User gesture or tap on Alice
- Q: How should the system handle overlapping animation requests? → A: Blend/merge animations smoothly when possible
- Q: How should the card dimensions adapt to different devices? → A: Responsive card that uses percentage of screen width

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing

### Primary User Story

As a user working out with Alice, I want the AI orb to smoothly transform into a clean workout card that displays only essential information when needed, so I can focus on my exercise without visual clutter or delays.

### Acceptance Scenarios

1. **Given** Alice is in orb form, **When** workout begins, **Then** orb smoothly expands into centered card with soft glow matching iris color
2. **Given** workout card is displayed, **When** exercise changes, **Then** exercise name fades in at top-left with clean white text
3. **Given** exercise is active, **When** reps/duration updates, **Then** bottom-left text pulses once like heartbeat with matching glow
4. **Given** user is exercising, **When** progress metrics change, **Then** thin vertical progress bars appear on right side with color-shifting underglow
5. **Given** workout is not on treadmill, **When** card displays, **Then** shows only Alice with empty space (no treadmill mode)
6. **Given** user swipes between exercises, **When** transition occurs, **Then** exercise name fades out then new name fades in
7. **Given** any animation is triggered, **When** transition starts, **Then** completes in under one second

### Edge Cases

- What happens when user rapidly swipes between exercises? (Animation queuing/cancellation)
- How does system handle missing progress data? (Show only available metrics)
- What occurs when iris color is not set? (Default to standard glow color)
- How does card behave during workout pauses? (Maintain state without progress updates)

## Requirements

### Functional Requirements

- **FR-001**: System MUST transform orb into workout card with smooth breathing expansion animation
- **FR-002**: System MUST center the workout card without extra borders or visual clutter using responsive sizing based on screen width percentage
- **FR-003**: System MUST apply soft glow to card matching Alice's iris color
- **FR-004**: System MUST add subtle three-dimensional shading to create floating appearance
- **FR-005**: System MUST display exercise name in top-left corner with clean white text
- **FR-006**: System MUST fade exercise name in and out during exercise transitions
- **FR-007**: System MUST show reps or duration in bottom-left with same font and glow as exercise name
- **FR-008**: System MUST pulse reps/duration text once like heartbeat when values update
- **FR-009**: System MUST display vertical progress bars on right side only when progress metrics change
- **FR-010**: System MUST keep progress bars small and thin with color-shifting underglow
- **FR-011**: System MUST show calories, intensity, and stress metrics in progress bars using combination of sensors and AI algorithms
- **FR-012**: System MUST hide all buttons unless Alice actively presents them as speech bubble interactions when user taps or gestures on Alice
- **FR-013**: System MUST default to empty space with only Alice (no treadmill interface) since treadmill workouts use dedicated workout cards
- **FR-014**: System MUST complete all animations in under one second and blend/merge overlapping animations smoothly to prevent lag
- **FR-015**: System MUST maintain card appearance as Alice (not generic workout interface)

### Key Entities

- **Alice Orb State**: Current form (orb vs card), expansion progress, iris color settings
- **Workout Session**: Active exercise name, current reps/duration, progress metrics (calories, intensity, stress)
- **Animation State**: Transition timing, fade states, pulse triggers, expansion progress
- **Progress Metrics**: Real-time values for calories, intensity, stress with display triggers
- **UI Layout**: Card positioning, glow effects, three-dimensional shading parameters

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
