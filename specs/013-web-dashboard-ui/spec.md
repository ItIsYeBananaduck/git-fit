# Feature Specification: Web Dashboard UI

**Feature Branch**: `013-web-dashboard-ui`  
**Created**: September 30, 2025  
**Status**: Draft  
**Input**: User description: "Web Dashboard UI Specification - Goal: Replicate mobile/tablet UI's visual style (colors, typography, cards) for the web dashboard, focusing on workout summaries, macro calculator, and trainer access, not live set tracking (mobile-only, per user's directive). Ensure seamless integration with macro logic, authentication, data sync, and food logging, with a one-time trainer-client connection and optional CSV exports."

## Execution Flow (main)
```
1. Parse user description from Input
   → ✅ Feature description provided
2. Extract key concepts from description
   → ✅ Identified: workout summaries, macro calculator, trainer access, data sync
3. For each unclear aspect:
   → ✅ All aspects sufficiently detailed
4. Fill User Scenarios & Testing section
   → ✅ Clear user flows identified for clients and trainers
5. Generate Functional Requirements
   → ✅ Requirements are testable and specific
6. Identify Key Entities
   → ✅ Data entities identified
7. Run Review Checklist
   → ✅ No implementation details, focused on user needs
8. Return: SUCCESS (spec ready for planning)
```

---

## Clarifications

### Session 2025-09-30
- Q: Data retention and user account lifecycle policies are not specified. How long should user workout data, macro history, and trainer relationships be retained? → A: User-controlled - let users set their own retention preferences
- Q: System scalability and concurrent user limits are not defined. What are the expected scale requirements for simultaneous users and data throughput? → A: Large scale - support up to 10,000 concurrent users, auto-scaling infrastructure
- Q: External service dependencies and their failure handling are not specified. How should the system behave when mobile sync services or AI recommendation engines are unavailable? → A: Hybrid approach - cache for viewing, queue for writes, warn users of limitations
- Q: The specification mentions "QR codes" for trainer linking but doesn't specify format, content, or security. What should the QR code contain and how should it be secured? → A: Encrypted token with expiration - secure temporary access
- Q: Data conflict resolution between mobile and web platforms lacks specific user experience details. When conflicts occur during sync, what should be the detailed user experience? → A: Side-by-side comparison interface highlighting differences with field-by-field selection capability

---

## User Scenarios & Testing

### Primary User Story
As a fitness enthusiast, I want a web dashboard that mirrors my mobile app's visual style and data, so I can review workout summaries, manage my nutrition macros, and share progress with my trainer from any computer, without needing to perform live workout tracking on the web.

### Acceptance Scenarios

#### Client User Scenarios
1. **Given** I have completed workouts on mobile, **When** I access the web dashboard, **Then** I see workout summaries showing completed sets, skipped exercises, and performance notes in cards matching mobile design
2. **Given** I want to plan future workouts, **When** I navigate to the Workouts tab, **Then** I can edit weights and reps for upcoming sessions and save changes to my profile
3. **Given** I need to adjust my nutrition goals, **When** I access the Macro Calculator, **Then** I can modify protein/carbs/fat ratios using sliders and receive AI-driven recommendations based on my mobile workout performance
4. **Given** I want to share progress with my trainer, **When** I generate a QR code from the Profile section, **Then** my trainer can scan it once to permanently link our accounts
5. **Given** I've added custom foods, **When** I use the macro calculator, **Then** the system flags nutritional outliers and allows me to correct or confirm unusual values

#### Trainer User Scenarios
1. **Given** a client has generated a QR code, **When** I scan it with my mobile app, **Then** I gain permanent access to their workout summaries and progress data
2. **Given** I have linked clients, **When** I access my trainer dashboard, **Then** I can view all clients' workout summaries, skip patterns, and performance notes
3. **Given** I need detailed client data, **When** I request a CSV export, **Then** I receive timestamped workout logs with exercise details, completion status, and skip reasons
4. **Given** a client has revoked my access, **When** I try to view their data, **Then** I no longer have access to their information

### Edge Cases
- What happens when mobile and web data conflicts during sync?
- How does the system handle trainer access if the client's account is deleted?
- What occurs if a user tries to log live workouts on web despite it being mobile-only?
- How does the system respond when the AI macro adjustment algorithm suggests impossible values?

## Requirements

### Functional Requirements

#### Visual Design & Layout
- **FR-001**: System MUST replicate mobile app's visual style including colors, typography, card designs, shadows, and border-radius on web interface
- **FR-002**: System MUST implement card-based layout with maximum width of 1200px, centered on screen
- **FR-003**: System MUST provide responsive design scaling from 320px to 4K resolution while maintaining content width cap
- **FR-004**: System MUST display navigation (Home, Workouts, Macros, Profile) in sticky top bar or sidebar that mirrors mobile's bottom navigation
- **FR-005**: System MUST implement hamburger menu for small screen windows

#### Workout Summary Display
- **FR-006**: System MUST display workout summaries showing exercise name, sets completed vs planned, weights used, and completion status
- **FR-007**: System MUST show skip reasons and performance feedback (e.g., "skipped 1: tired") synced from mobile app
- **FR-008**: System MUST display past 3 workouts in collapsible sidebar on wider screens
- **FR-009**: System MUST allow users to view completed workout logs with timestamps and detailed exercise data
- **FR-010**: System MUST provide read-only view of upcoming workout schedule
- **FR-011**: System MUST allow editing of future workout weights and reps with changes saved to user profile
- **FR-012**: System MUST NOT provide live set tracking capabilities (mobile-only feature)

#### Macro Calculator Integration
- **FR-013**: System MUST provide onboarding flow collecting weight (pounds) and fitness goal (Fat Loss, Muscle Gain, Hypertrophy, Powerlifting, Bodybuilding)
- **FR-014**: System MUST calculate protein requirements: 0.4g/lb (Fat Loss/Muscle Gain), 0.8g/lb (Hypertrophy/Powerlifting), 1.0-1.5g/lb (Bodybuilding based on progress)
- **FR-015**: System MUST distribute remaining calories as 40% carbs and 30% fat by default
- **FR-016**: System MUST provide sliders for adjusting carbs/fat ratios and protein override capability
- **FR-017**: System MUST warn users when protein falls below 0.4g/lb with message about muscle retention risks
- **FR-018**: System MUST implement AI macro adjustments based on mobile workout performance data
- **FR-019**: System MUST conduct weekly energy/sleep surveys (1-10 scale) and adjust macros accordingly
- **FR-020**: System MUST cap Bodybuilding protein at 1.0g/lb if lifts stall, allow 1.5g/lb if progressing for 3+ weeks

#### Authentication System
- **FR-021**: System MUST support biometric authentication via WebAuthn as primary method
- **FR-022**: System MUST provide email/password authentication as fallback option
- **FR-023**: System MUST provide seamless login experience without social media options
- **FR-024**: System MUST maintain authentication state across browser sessions

#### Trainer Access & Sharing
- **FR-025**: System MUST generate one-time QR codes containing encrypted tokens with 24-hour expiration for secure trainer account linking
- **FR-026**: System MUST require in-person QR code scanning via trainer's mobile app to establish permanent trainer-client relationship
- **FR-027**: System MUST maintain trainer-client relationship permanently until explicitly revoked by either party
- **FR-028**: System MUST provide client settings option to remove trainer access with immediate effect (e.g., "Remove Trainer: John")
- **FR-029**: System MUST allow trainers to end client relationships from their "Clients" management tab
- **FR-030**: System MUST display client workout summaries in trainer's "Clients" tab showing completion patterns (e.g., "Leg Day: 2/3 sets done, skipped 1: tired")
- **FR-031**: System MUST provide CSV export functionality per client with timestamped workout data including skip reasons and coaching suggestions
- **FR-032**: System MUST generate one-time PIN codes as fallback when QR scanning fails, with single-use expiration
- **FR-033**: System MUST log all trainer access activities for audit purposes with timestamps and action details

#### Data Synchronization
- **FR-034**: System MUST sync mobile workout logs (sets, skips, notes) to web interface via offline-capable storage
- **FR-035**: System MUST present side-by-side comparison interface when data conflicts occur between mobile and web platforms
- **FR-036**: System MUST highlight specific data differences in conflict resolution interface with clear visual indicators
- **FR-037**: System MUST allow field-by-field selection during conflict resolution, enabling users to choose mobile or web values per data field
- **FR-038**: System MUST merge non-conflicting data fields automatically without user intervention
- **FR-039**: System MUST maintain data consistency across mobile and web platforms after conflict resolution
- **FR-040**: System MUST allow users to set their own data retention preferences for workout history, macro data, and trainer relationships

#### Food Database & Custom Foods
- **FR-041**: System MUST provide "Add Custom Food" form allowing input of food name and macro values
- **FR-042**: System MUST flag nutritional outliers with AI validation (e.g., "500g carbs? Double-check?")
- **FR-043**: System MUST allow food logging context post-workout (e.g., protein shakes)
- **FR-044**: System MUST store custom foods in user's personal database

#### Performance Requirements
- **FR-045**: System MUST respond to user interactions within 500ms for clicks and navigation
- **FR-046**: System MUST load workout logs and macro updates within 2 seconds
- **FR-047**: System MUST NOT implement live barcode scanning or webcam features (mobile-only)
- **FR-048**: System MUST support up to 10,000 concurrent users with auto-scaling infrastructure
- **FR-049**: System MUST maintain response times under load with horizontal scaling capabilities

#### External Service Dependencies
- **FR-050**: System MUST cache external service data for offline viewing capabilities when mobile sync or AI services are unavailable  
- **FR-051**: System MUST queue data writes when external services are down and process them when connectivity is restored
- **FR-052**: System MUST display prominent warnings to users when external service limitations affect functionality
- **FR-053**: System MUST provide clear indicators showing which features are affected during external service outages
- **FR-054**: System MUST maintain core viewing functionality even when external dependencies are unavailable
- **FR-055**: System MUST implement notification system to alert users when queued writes have been successfully processed

#### Optional Feature Voting System
- **FR-056**: System MAY provide "What Next?" tab with feature voting capability
- **FR-057**: System MAY allow users to submit feature ideas via text or 30-second voice notes
- **FR-058**: System MAY highlight top-voted feature weekly
- **FR-059**: System MAY implement Focus Mode that grays out other browser tabs
- **FR-060**: System MAY include mini-games (30-90 second match-three) in Macros tab if voted for

### Key Entities

- **User**: Fitness enthusiast with weight, fitness goals, macro requirements, workout history, and trainer relationships
- **Workout**: Exercise session with planned vs completed sets, weights used, skip reasons, performance notes, and timestamps
- **Exercise**: Individual movement with name, target sets/reps, weight progression, and completion status
- **Macro Profile**: Nutritional targets including protein, carbs, fat goals, calculation method, and AI adjustment history
- **Trainer**: Professional with client access permissions, export capabilities, and audit trail
- **Custom Food**: User-created food item with name and macro nutritional values
- **Training Relationship**: Link between trainer and client with creation timestamp, access permissions, and revocation status

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
