# Feature Specification: Build Adaptive Fit

**Feature Branch**: `017-build-adaptive-fit`  
**Created**: October 3, 2025  
**Status**: Draft  
**Input**: User description: "Build Adaptive Fit: Alice is a breathing, 2D SVG blob-matte black body, electric-blue eye, subtle 3D illusion via shadow, parallax, glow. Always visible. Tap: she blooms-dumbbell (workouts), apple (nutrition), waveform (analytics), music (radio). UI: all matte black, blue edges, no buttons. She is the interface. Strength: trainer grid-mini Alices, expand on tap, show intensity/tempo in bubbles. Learns from data, no voice. Calibration: only if exercise stale >2 weeks or perf drops >10%. Otherwise, one test set. Radio: dances silently. Voice every 3–4 songs if slider up. Zen mode: mute, eye reacts-one blink for PR, one droop for quit. Teams: auto-posts-workout icon + intensity + pulsing heart (likes = votes). Whole workout like → queue for meta-cycle. Exercise like → approved list. Dislike → no-go. Starts with user picks, learns fast. Users add exercises: name, muscle, gear, desc → locked local vault. Alice tracks, tweaks-never shares. Hit Share only after 8 team likes → trainer vote (Approve/Decline/Clarify). Loop until clean → public if yes. Trainer adds: instant, no vote. Stale moves: monthly poll in teams-60% kill or keep. Data: free users-14 days raw, then discard. Paid-4 weeks raw → monthly → yearly (3-year cap). Alice uses raw for live tweaks. Trial: 1-week full Alice + calibration + Week 1. Week 2: one set only. Then gate. Free: gray Alice, intensity + rest only, no voice, team posts auto but no likes. Paid: black Alice, customizable body + pattern (10 presets: stripes, spots, leopard, chrome, glitch-black + color only). Trainers: black + colored ring, both customizable. Play Mode: tap Alice → track HR/time privately, no post. Background: every 5 min, if HR sustained 3 min elevated → prompt: Workout / Play / Ignore. 7 Play days → Active streak: 7 badge on teams, no details. Adaptive Cardio: video or file → HR + strain → final intensity score at end → teams post. Pauses over 100%, asks rest or continue. Calories only with wearable. Overlay: Alice in corner, shows time (calories if wearable). Picker defaults to AdaptiveFitDownloads folder (marketplace videos auto-saved). Marketplace: sellers link video (stored on them), buyer downloads, we take 30% cut (pre-Apple). No storage. Alice flags top performers: '90% of users hit high intensity' badge. Users get adaptive-strength, cardio, dance, whatever. Alice doesn't care. She adapts."

## Execution Flow (main)

```
1. Parse user description from Input
   → COMPLETED: Feature description provided with comprehensive details
2. Extract key concepts from description
   → COMPLETED: Alice AI interface, adaptive fitness, tiered subscriptions, community features
3. For each unclear aspect:
   → COMPLETED: Marked with [NEEDS CLARIFICATION] tags
4. Fill User Scenarios & Testing section
   → COMPLETED: Primary scenarios identified for all user types
5. Generate Functional Requirements
   → COMPLETED: Requirements defined with testability in mind
6. Identify Key Entities (if data involved)
   → COMPLETED: Core entities for adaptive fitness system
7. Run Review Checklist
   → IN PROGRESS: Automated validation pending
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines

- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-10-03

- Q: When the system detects sustained elevated heart rate for 3+ minutes and prompts "Workout/Play/Ignore", what should happen if the user doesn't respond to the prompt? → A: Auto-dismiss after 30 seconds, default to "Ignore"
- Q: What is the maximum number of concurrent users the system should support during peak usage? → A: 10,000 concurrent users
- Q: When a marketplace video seller removes their content after users have purchased access, what should happen to the downloaded videos? → A: Keep downloaded videos accessible indefinitely for purchasers
- Q: When Alice shows "intensity over 100%" and asks "rest or continue", what is the maximum response time before auto-action? → A: 30 seconds
- Q: What happens when exactly 60% of team members vote to "keep" a stale exercise during the monthly poll? → A: Exercise is kept (60% meets threshold)

## User Scenarios & Testing

### Primary User Stories

**Free User Journey:**
As a free user, I want to interact with Alice (gray version) to access basic workout intensity tracking and rest timing, so I can maintain a fitness routine without paying for premium features.

**Paid User Journey:**
As a paid subscriber, I want to customize Alice's appearance and access her full adaptive coaching capabilities, so I can receive personalized fitness guidance that evolves with my performance.

**Trainer Journey:**
As a certified trainer, I want to contribute exercises and manage community content through my enhanced Alice interface, so I can share expertise and help curate quality fitness content.

### Acceptance Scenarios

1. **Given** a new user opens the app, **When** they see Alice for the first time, **Then** Alice appears as a breathing SVG blob with matte black body and electric-blue eye
2. **Given** a user taps Alice, **When** the tap is registered, **Then** Alice blooms to show four mode icons (dumbbell, apple, waveform, music)
3. **Given** a paid user in workout mode, **When** they complete an exercise, **Then** Alice adapts future recommendations based on performance data
4. **Given** a user enables zen mode, **When** they achieve a personal record, **Then** Alice blinks once to acknowledge the achievement
5. **Given** a team member posts a workout, **When** other users like the entire workout, **Then** it gets queued for inclusion in meta-cycles
6. **Given** a free user completes their trial week, **When** week 2 begins, **Then** Alice restricts them to single sets only
7. **Given** background monitoring detects elevated heart rate for 3+ minutes, **When** 5 minutes have passed, **Then** system prompts user to classify activity as Workout/Play/Ignore

### Edge Cases

- What happens when a user's performance drops more than 10% from baseline?
- How does Alice behave when exercise data becomes stale (>2 weeks old)?
- What occurs when marketplace video sellers remove their content after users have purchased access?
- How does the system handle team voting when exactly 60% vote to keep/kill stale exercises?
- What happens to user data when downgrading from paid to free subscription?

## Requirements

### Functional Requirements

**Core Alice Interface:**

- **FR-001**: System MUST display Alice as a persistent 2D SVG blob with matte black body and electric-blue eye
- **FR-002**: Alice MUST exhibit breathing animation and subtle 3D visual effects through shadows, parallax, and glow
- **FR-003**: System MUST respond to Alice taps by displaying four mode icons: dumbbell (workouts), apple (nutrition), waveform (analytics), music (radio)
- **FR-004**: System MUST maintain Alice's visibility across all application screens and modes

**Adaptive Fitness Engine:**

- **FR-005**: System MUST trigger exercise calibration only when exercise data is stale (>2 weeks) OR performance drops >10%
- **FR-006**: System MUST default to single test sets for calibration unless conditions above are met
- **FR-007**: System MUST adapt workout recommendations based on user performance data without requiring voice input
- **FR-008**: System MUST track heart rate and strain during workouts to calculate final intensity scores
- **FR-008a**: System MUST pause workouts when intensity exceeds 100% and prompt "rest or continue" with 30-second auto-timeout to "rest"

**Subscription Tiers:**

- **FR-009**: Free users MUST receive gray Alice with access to intensity tracking and rest timing only
- **FR-010**: Free users MUST have automatic team posts enabled but without like functionality
- **FR-011**: Trial users MUST receive full Alice access plus calibration for 1 week, followed by single-set restriction in week 2
- **FR-012**: Paid users MUST receive black Alice with 10 customizable body patterns (stripes, spots, leopard, chrome, glitch with color variations)
- **FR-013**: Trainer accounts MUST have black Alice with customizable colored rings and instant exercise approval privileges

**Community Features:**

- **FR-014**: System MUST auto-post workout summaries showing workout icon, intensity level, and pulsing heart for likes
- **FR-015**: Whole workout likes MUST queue workouts for meta-cycle inclusion
- **FR-016**: Individual exercise likes MUST add exercises to approved lists
- **FR-017**: Exercise dislikes MUST add exercises to no-go lists
- **FR-018**: User-added exercises MUST require 8 team likes before trainer voting (Approve/Decline/Clarify)
- **FR-019**: System MUST conduct monthly polls for stale exercises requiring 60% threshold for keep/kill decisions (60% or higher keeps exercise, below 60% removes exercise)

**Data Management:**

- **FR-020**: Free users MUST have raw data stored for 14 days before automatic deletion
- **FR-021**: Paid users MUST have raw data stored for 4 weeks, then converted to monthly summaries, then yearly summaries (3-year maximum retention)
- **FR-022**: System MUST use raw data for live workout adjustments and recommendations

**Specialized Modes:**

- **FR-023**: Radio mode MUST show Alice dancing silently with optional voice coaching every 3-4 songs based on user slider setting
- **FR-024**: Zen mode MUST mute all audio while maintaining eye reactions (one blink for PR, one droop for quit signal)
- **FR-025**: Play mode MUST track heart rate and time privately without posting to teams
- **FR-026**: System MUST award 7-day active streak badges for users with 7 consecutive play days

**Background Monitoring:**

- **FR-027**: System MUST monitor heart rate every 5 minutes when app is backgrounded
- **FR-028**: System MUST prompt activity classification (Workout/Play/Ignore) when sustained elevated heart rate is detected for 3+ minutes
- **FR-028a**: System MUST auto-dismiss unanswered background prompts after 30 seconds and default to "Ignore" classification

**Marketplace Integration:**

- **FR-029**: System MUST allow sellers to link videos (stored on their servers) for user purchase and download
- **FR-030**: System MUST retain 30% commission on all marketplace transactions (pre-platform fees)
- **FR-031**: System MUST flag high-performing content with achievement badges (e.g., "90% of users hit high intensity")
- **FR-032**: Downloaded videos MUST save to AdaptiveFitDownloads folder by default
- **FR-033**: Downloaded videos MUST remain accessible to purchasers indefinitely, even if seller removes original content

### Key Entities

- **Alice Interface**: Core AI companion with visual states, interaction modes, and subscription-based feature access
- **User Profile**: Accounts with subscription tiers (free/trial/paid/trainer), performance history, and customization preferences
- **Exercise Library**: Community-contributed exercises with metadata (name, muscle groups, equipment, descriptions) and approval status
- **Workout Session**: Real-time tracking data including heart rate, strain measurements, intensity scores, and completion metrics
- **Team Community**: Social features including workout posts, voting mechanisms, streak tracking, and content curation
- **Performance Data**: Raw measurements, processed summaries, and retention policies based on subscription level
- **Marketplace Content**: External video links, seller information, performance metrics, and revenue sharing data

### Non-Functional Requirements

- **NFR-001**: System MUST support up to 10,000 concurrent users during peak usage periods

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

---
