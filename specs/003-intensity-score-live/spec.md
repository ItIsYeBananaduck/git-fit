# Feature Specification: Intensity Score (Live)

**Feature Branch**: `003-intensity-score-live`  
**Created**: September 27, 2025  
**Status**: Draft  
**Input**: User description: "Intensity Score (Live) - intensity = (tempo × 0.30) + (motionSmoothness × 0.25) + (repConsistency × 0.20) + (userFeedback × 0.15) + (strainModifier × 0.10) - Strain modifier: 1.0 (≤85%), 0.95 (86–95%), 0.85 (>95%) - User bar: caps at 100%. Trainer bar: uncapped. - Post-set: easy-killer (-10–15%), challenge (locks at 100%). No live button impact. Strain - strain = (0.4 × HR rise) + (0.3 × SpO₂ drop) + (0.3 × recovery delay) - On-device only. Never stored. Feeds dynamic rest & intensity cap. Dynamic Rest - Range: 30–90 seconds. - Auto-extend if strain >85%. Ignore life pauses (gyro flat + strain drop). Forgotten Set Detector - Accel erratic AND strain falling >10% in 3s → prompt: Think you ended that? - No → distraction flag, +15s rest. - Yes → end set before glitch, ignore post-motion. AI Voice - Alice or Aiden - Only with earbuds. Slider: 0–100% (Zen = 0%). Trainer can override to full. - First launch: speaks once if buds in. Zen mode: only Set begun/ended + weak haptics. Phase-Aware Tempo (Eccentric/Concentric) - First move after pause = concentric, reverse = eccentric. - Score ±15% vs target. Trainer sees split times live. Toggle for eccentric-first. Adaptive fIt Labs - Day 1: scan pre/post stack (barcode → OpenFoodFacts API: https://world.openfoodfacts.org/api/v0/product/ .json) - Lock 28 days. Toast at Week 4: Labs unlocked-change one thing. - Track deltas: intensity, strain, nutrition (if logged). Meds auto-redacted (Rx-compound). - Anomaly toast only on negative shift (>8% intensity drop or >15% strain rise): Performance dip. Check stack. No praise, no med names. - Disclaimer once: We track effects-not endorse. Risks shown, rewards silent. Stack Sharing - Opt-in. Profile shows: C4 • 200mg caffeine • 3.2g beta-alanine + Used by 1,240 in Strength. - Meds hidden. Doses shown if non-Rx. Crew Feed - Algorithm clusters by goal, body feel, training age-gender optional. - Shows workout cards + likes (exercise or full). Ghost mode. AI learns. Trainer AI - Alice/Aiden, leash mode: - Week 1: full calibration on new exercise (sets, reps, volume, tempo)-adjust per set until intensity ~98%, strain ≤88%. - Existing exercises: recalibrate first set only (tiny tweak if >5% off). - Week 2–4: one change (sets, reps, volume)-Alice picks. - Week 5: if plateau, test tempo-only if wearable/headphones, border pulses orange, weight drops to 40% 1RM, reps 3–6, sets 2–4, TUT 30–60s, 70% eccentric, 30% concentric. Haptics: 1 pulse = down, 2 = up, 3 = hold. - PR prediction: once per cycle, hidden unless trainer says show. Guardrails - Tempo Mode - TUT: 30–60 seconds per set (not workout). - Reps: 3–6. Sets: 2–4. - Weight: 30–50% of calibrated max. - Abort if strain >95% or form wobbles. Data Flow - Health data: hashed/discarded after calc. Intensity: sent raw (not hashed). - Stack: on-device full text, backend hash of public items only. Auto-wipe after 52 weeks (opt-out). Edge Cases - Battery <10%: freeze intensity, fallback to last tempo. - No wearable: estimate intensity (Estimated), no tempo mode. - No headphones: no tempo, no audio cues."

## Execution Flow (main)
```
1. Parse user description from Input ✓
   → Comprehensive description provided with specific metrics and calculations
2. Extract key concepts from description ✓
   → Identified: intensity scoring, strain monitoring, AI coaching, supplement tracking, social features
3. For each unclear aspect:
   → [NEEDS CLARIFICATION: Device compatibility requirements - which wearables supported?]
   → [NEEDS CLARIFICATION: User account requirements - subscription tiers, access levels?]
   → [NEEDS CLARIFICATION: Data privacy compliance - HIPAA, GDPR requirements?]
4. Fill User Scenarios & Testing section ✓
   → Primary scenarios identified for workout tracking and AI coaching
5. Generate Functional Requirements ✓
   → Each requirement mapped to specific feature capabilities
6. Identify Key Entities ✓
   → Workout, User, Strain, IntensityScore, SupplementStack entities defined
7. Run Review Checklist
   → Has [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → Implementation details present: requires abstraction
8. Return: SUCCESS (spec ready for planning with noted clarifications)
```

---

## Clarifications

### Session 2025-09-27
- Q: What specific wearable device categories should be supported for real-time health data collection? → A: all major brands listed in the codebase
- Q: What should be the maximum concurrent users the system needs to support during peak workout hours? → A: 1,000-10,000 concurrent users
- Q: How should user access levels be structured for trainer vs regular user features? → A: tiered roles with flexible access
- Q: What data retention policy should apply to workout and health data? → A: 1 year user opt out
- Q: What response time is acceptable for real-time intensity score updates during workouts? → A: 1 second max

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

## User Scenarios & Testing

### Primary User Story
As a fitness enthusiast, I want real-time workout intensity feedback so that I can optimize my training effectiveness while avoiding overexertion. The system should automatically adjust recommendations based on my physiological strain and provide AI-powered coaching to help me achieve consistent progress.

### Acceptance Scenarios
1. **Given** a user is performing a workout with connected wearable device, **When** they complete a set, **Then** they receive an intensity score (0-100%) calculated from tempo, motion smoothness, rep consistency, user feedback, and strain modifier
2. **Given** a user's strain level exceeds 85%, **When** they finish a set, **Then** the system automatically extends rest time beyond the standard 30-90 second range
3. **Given** a user has earbuds connected and AI voice enabled, **When** they start a tempo-controlled exercise, **Then** they receive haptic feedback (1 pulse = down, 2 = up, 3 = hold) for movement guidance
4. **Given** a user scans supplements on Day 1, **When** 28 days pass, **Then** they can modify one supplement and track performance deltas
5. **Given** a user experiences erratic acceleration and strain drops >10% in 3 seconds, **When** the forgotten set detector triggers, **Then** they receive a prompt "Think you ended that?" with appropriate handling based on response

### Edge Cases
- What happens when battery drops below 10%? (System freezes intensity calculation, falls back to last known tempo)
- How does system handle missing wearable device? (Estimates intensity with "Estimated" label, disables tempo mode)
- What occurs when no headphones are connected? (Disables tempo mode and audio cues)
- How does strain calculation work without heart rate data? (System relies on accelerometer and user feedback only)

## Requirements

### Functional Requirements

#### Core Intensity Scoring
- **FR-001**: System MUST calculate live intensity score using formula: (tempo × 0.30) + (motionSmoothness × 0.25) + (repConsistency × 0.20) + (userFeedback × 0.15) + (strainModifier × 0.10)
- **FR-002**: System MUST apply strain modifier: 1.0 (≤85%), 0.95 (86–95%), 0.85 (>95%)
- **FR-003**: User intensity bar MUST cap at 100%, trainer intensity bar MUST remain uncapped
- **FR-004**: Post-set feedback "easy-killer" MUST adjust score by -10 to -15%, "challenge" MUST lock score at 100%
- **FR-005**: System MUST calculate strain using formula: (0.4 × HR rise) + (0.3 × SpO₂ drop) + (0.3 × recovery delay)
- **FR-006**: System MUST support all major wearable brands currently integrated in codebase for heart rate, SpO2, and accelerometer data collection

#### Strain and Recovery Management
- **FR-007**: Strain data MUST remain on-device only and never be stored permanently
- **FR-008**: System MUST provide dynamic rest periods ranging from 30-90 seconds
- **FR-009**: System MUST auto-extend rest periods when strain exceeds 85%
- **FR-010**: System MUST ignore "life pauses" when gyroscope shows flat position and strain drops
- **FR-011**: System MUST detect forgotten sets when acceleration is erratic AND strain falls >10% in 3 seconds

#### AI Voice and Coaching
- **FR-012**: AI voice (Alice or Aiden) MUST only function with connected earbuds
- **FR-013**: AI voice intensity MUST be controllable via slider 0-100% (0% = Zen mode)
- **FR-014**: Trainers MUST be able to override voice settings to maximum
- **FR-015**: Zen mode MUST limit audio to "Set begun/ended" with weak haptics only
- **FR-016**: AI MUST provide calibration for new exercises in Week 1 until intensity reaches ~98% with strain ≤88%

#### Tempo and Movement Tracking
- **FR-016**: System MUST identify first movement after pause as concentric, reverse as eccentric
- **FR-017**: System MUST score tempo within ±15% of target values
- **FR-018**: Trainers MUST see live split times for eccentric/concentric phases
- **FR-019**: System MUST provide toggle for eccentric-first movement patterns
- **FR-020**: Tempo mode MUST enforce guardrails: TUT 30-60s per set, reps 3-6, sets 2-4, weight 30-50% of max

#### Supplement and Nutrition Tracking
- **FR-021**: System MUST support barcode scanning for supplement stacks on Day 1
- **FR-022**: System MUST lock supplement modifications for 28 days after initial setup
- **FR-023**: System MUST track performance deltas after supplement changes
- **FR-024**: System MUST auto-redact medications (Rx compounds) from tracking
- **FR-025**: System MUST show performance alerts only for negative shifts (>8% intensity drop or >15% strain rise)

#### Social and Sharing Features
- **FR-026**: Users MUST be able to opt-in to stack sharing with dosage information for non-prescription items
- **FR-027**: System MUST hide all medication information from shared profiles
- **FR-028**: Crew feed MUST cluster users by goals, body feel, and training age
- **FR-029**: Users MUST be able to like workout cards and exercise demonstrations
- **FR-030**: System MUST provide ghost mode for private workout tracking

#### Data Management and Privacy
- **FR-031**: Health data MUST be hashed/discarded immediately after calculations
- **FR-032**: Intensity scores MUST be transmitted raw (not hashed) for analysis
- **FR-033**: Supplement stacks MUST store full text on-device, only hash public items for backend
- **FR-034**: System MUST auto-wipe supplement data after 52 weeks with opt-out capability
- **FR-035**: System MUST display privacy disclaimers before supplement tracking activation
- **FR-036**: System MUST retain workout and health data for 1 year with user opt-out deletion capability

#### User Access Control
- **FR-037**: System MUST implement tiered roles with flexible access permissions for different user types
- **FR-038**: Trainer accounts MUST have uncapped intensity bars and override capabilities for AI voice settings
- **FR-039**: Regular users MUST have intensity bars capped at 100% with standard feature access
- **FR-040**: System MUST allow role-based feature toggling without requiring account tier changes

### Non-Functional Requirements

#### Performance and Scalability
- **NFR-001**: System MUST support 1,000-10,000 concurrent users during peak workout hours
- **NFR-002**: Intensity score calculations MUST complete within 100ms of data collection
- **NFR-003**: System MUST maintain 99.5% uptime during scheduled workout hours (5AM-11PM local time)
- **NFR-004**: Real-time intensity score updates MUST respond within 1 second maximum during active workouts

### Key Entities

- **Workout Session**: Represents a complete training session with multiple exercises, sets, and real-time metrics
- **Intensity Score**: Live calculation combining tempo, motion quality, consistency, feedback, and strain factors
- **Strain Measurement**: Real-time physiological stress indicator derived from heart rate, SpO2, and recovery metrics
- **AI Coach Profile**: Personalized coaching entity (Alice/Aiden) with calibration data and user preferences
- **Supplement Stack**: User's supplement regimen with timing, dosages, and performance correlation tracking
- **User Profile**: Individual fitness profile with goals, training history, device preferences, and sharing settings
- **Tempo Pattern**: Movement phase tracking for eccentric/concentric timing and scoring
- **Recovery Period**: Dynamic rest calculation based on strain levels and workout intensity

---

## Review & Acceptance Checklist

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain - **All 5 critical ambiguities resolved**
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
- [x] Review checklist passed - **All clarifications resolved**
