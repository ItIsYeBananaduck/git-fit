# Nutrition AI – Auto Macro Adjustment on Plateau

- [x] Create unified RestManager service to coordinate all rest-related functionality
- [x] Detect plateau from `monthlySummary`: - No change in average/max volume or load for 3+ weeks - Weight has not changed in 3+ weeks (if goal is weight-based)
- [x] Confirm user is **compliant** (logs/workouts consistent)
- [x] Adjust macros carefully: - Bulk: +5–10% carbs or protein - Cut: -5–10% carbs or fats - Recomp: micro-adjust arou- [x] Audit existing rest logic and create rest_engine/audit_report.mdd training window
- [x] Update `nutritionConfig.currentMacros` and push to `macroHistory[]`
- [x] Generate adjustment note (example):

```json
{
  "reason": "3-week strength plateau with full workout compliance",
  "adjustment": {
    "calories": "+150 kcal",
    "carbs": "+35g"
  }
}
```

Prioritize safe calorie levels — never drop below clinical minimums.

Include config toggle: "autoAdjustMacros": true

Send notification: "We adjusted your macros to help you break through your plateau. You can view or revert this change in your settings."

Disable auto-adjust if wearable or weight log is unavailable for over 14 days.

## Implementation Tasks for Technically Fit

This document outlines the actionable tasks needed to implement the missing specs and features identified in your project.

---

## User Experience Enhancement

- [x] Redesign unified navigation and design language across modules
- [x] Build customizable dashboards for key metrics
- [x] Ensure accessibility for users with disabilities
  - [x] Add ARIA labels to all interactive elements
  - [x] Implement keyboard navigation for all major flows
  - [x] Add screen reader support (roles, labels, alt text)
  - [x] Ensure color contrast compliance (WCAG AA)
  - [x] Audit AccessibilityUtils.svelte and +layout.svelte
  - [x] Audit all dashboard widgets for accessibility

---

## Nutrition AI

- [x] Implement recovery-aware micro-adjustments (HRV, resting HR, sleep integration)
- [x] Add hydration recommendations based on recovery metrics
- [x] Create make-up logic for missed protein targets
- [x] Add safety rails for health flags (diabetes/heart history logic)
- [x] Enforce trainer data sharing for tailored plans
- [x] Integrate payments & distribution logic (Apple fee strategy, web checkout, PWA fallback)
- [x] Implement IP & secrecy protections (API hardening, device attestation, secrets management)
- [x] Add model governance (versioned models, canary rollout)
- [x] Implement telemetry logging (decision outcomes, anonymized inputs)

## AI Adaptive Engine

- [x] Build dynamic adjustment algorithms for sets/reps/load based on feedback and HR data
- [x] Implement auto-calibration for RIR (machine learning model, training, real-time adjustment)
- [x] Add fatigue-aware modeling (HRV/strain integration, fatigue warnings)
- [x] Create user notifications for fatigue-related adjustments
- [x] Integrate daily strain assessment using SpO₂ and resting heart rate (traffic light zones, training adjustments, health alerts)

## Wearable & Device Support

### Wearable Workout UI

- [x] Implement pre-set screen with rep/volume adjustment controls
- [x] Create in-set screen showing live HR, SpO₂, and strain indicator
- [x] Add 3 feedback buttons (Set Completed, Too Easy, Too Hard) - **Note: These buttons already exist on mobile, need to port to wearable**
- [x] Design optional post-set transition summary
- [x] Add readiness score complication (0-100 or emoji)
- [x] Add baseline resting HR complication (30-day average)
- [x] Add baseline SpO₂ complication (color-coded)
- [x] Support Modular, Corner, and Graphic Circular layouts
- [x] Apple Watch: Use HKLiveWorkoutBuilder, SwiftUI, CLKComplicationTemplate
- [x] Support digital crown/scroll gestures for adjustments
- [x] Connect wearable feedback buttons to existing mobile adaptive AI algorithm
- [x] Update strain calculations based on real-time metrics
- [x] Implement haptic feedback for transitions

## Data Collection & Storage

- [x] Add retention policies (raw vs. summarized data)
- [x] Implement automated data summarization
- [x] Build manual data export/deletion tools
- [x] Add data encryption and privacy compliance
- [x] Create user data management tools

- [x] Add medical screening questionnaire (injury/condition tracking)
- [x] Build goal identification interface (primary/secondary objectives)
  - Build UI and backend logic for users to identify and set primary/secondary fitness goals. (COMPLETED: Feature is implemented in onboarding and backend, see GoalIdentificationStep and convex/functions/goals.ts)
- [x] Implement recommendation engine for training splits
- [x] Create split comparison interface and educational content
  - UI for comparing different training splits implemented in SplitComparisonPanel.svelte and SplitSelectionFlow.svelte.
  - Educational content and pros/cons for each split included in the UI.
  - Integrated into onboarding and dashboard flows.
  - Users can view, compare, and select splits with contextual guidance.

## Training Split Customization

- [x] Allow user to set and save a custom training split
  - Implement UI and backend logic to let users define, save, and retrieve a fully custom training split (e.g., PPL + arm/core + cardio) as part of their config.

## AI Summary System + Smart Set Nudging

### User Config Table

- [x] Create Convex table `user_configs` with a `configJson` field (stringified JSON)
- [x] Implement backend logic to read/write user config (latest version only)
- [x] Build UI for users to view and update config options (deload, rest time, etc.)

### Monthly Exercise Summary

- [x] Create Convex table `user_monthly_summaries` with fields: `monthlySummaryJson` and `monthKey`
- [x] Implement backend logic to generate and store monthly summaries per user
- [x] Build UI to display monthly exercise summaries and stats

### Yearly Summary

- [x] Create Convex table `user_yearly_summaries` with fields: `yearlySummaryJson` and `subscriptionStartDate`
- [x] Implement backend logic to aggregate monthly data into yearly summaries (max 3 years, auto-purge oldest)
- [x] Build UI to display yearly summaries and breakdowns

### Smart Set Nudging

- [x] Implement logic to start rest timer using `avgRestSec` after each set
- [x] Compare strain at rest start and end; if criteria met, trigger nudge (voice prompt)
- [x] Integrate with wearable device APIs for real-time strain data
- [x] Add user toggle for smart set nudges in config/UI

### Device & Nudge Support

- [x] Add fields to user/device model: `smartSetNudges`, `smartSetNudgesActive`, `connectedWearable`
- [x] Implement logic to auto-enable/disable nudges based on device support
- [x] Build UI to show nudge/device support status and matrix

### AI Summary Data Parsing

- [x] Implement AI logic to parse and interpret the summary JSON data for monthly and yearly exercise summaries
- [x] Integrate parsed summary data into recommendations, nudging, and user feedback systems

## Live Activity & Dynamic Island (iOS)

### Active Set View

[x] Show current exercise name
[x] Show reps completed / rep target (e.g. 6 / 10)
[x] Show real-time strain (from Apple Watch, WHOOP, etc.)

### Rest View

- [x] Show countdown timer (based on AI-configured avgRestSec)
- [x] Show current strain
- [x] Optionally trigger Siri voice nudge when strain drops (if user has nudges enabled)

#### 🧱 Requirements

- [x] Create Swift `WorkoutAttributes` struct with `ActivityAttributes` + `ContentState`
- [x] Add Live Activity support using ActivityKit (iOS 16.1+)
- [x] Design Dynamic Island compact/expanded UI using WidgetKit + SwiftUI
- [x] Add logic to update the Live Activity in real-time as workout progresses
- [x] Display reps + strain in Dynamic Island during active sets
- [x] Display rest timer + strain in Dynamic Island during rest
- [x] Integrate wearable strain values (Apple Watch via HealthKit or WHOOP if available)
- [x] Auto-disable Live Activity if no wearable connected or permissions are denied
- [x] Voice assistant nudge (optional): Use Siri Shortcuts or AVSpeechSynthesizer to say “Let’s go! Start your next set.” if nudging is enabled and recovery is detected

#### 🧩 Optional Enhancements

- [x] Add fallback notification system for unsupported iPhones (non-Pro or older than iPhone 14)
- [x] Show volume trend or fatigue warning if set strain is too low
- [x] Add settings toggle to disable Live Activity

### 🧩 TASK: Mesocycle-Aware Personalized Training System + Native Music Controls

---

#### 📆 MESOCYCLE-BASED PROGRAMMING

**Overview:**
Implement a training logic system where all workout programming, AI summaries, and adjustments operate on a 4–6 week mesocycle basis, not week-to-week.

**Steps:**

- [x] Add mesocycle duration config (`default: 4 weeks`, user adjustable)
- [x] Trigger deload week automatically at the end of the mesocycle (unless skipped)
- [x] Store mesocycle metadata (`startDate`, `cycleLength`, `deloadScheduled`, etc.)

---

#### 🧰 EQUIPMENT & PREFERENCE-BASED EXERCISE FILTERING

**After split selection:**

- [x] Ask user for equipment available (dumbbell, barbell, cable, machine, etc.)
- [x] Ask for exercise preferences (include list / avoid list)
- [x] Store this JSON in the user config file:

```json
{
  "equipment": ["dumbbell", "barbell"],
  "preferences": {
    "include": ["squats", "bench press"],
    "avoid": ["kettlebell swings"]
  }
}
```

- [x] Show countdown timer (based on AI-configured avgRestSec)
- [x] Show current strain
- [x] Optionally trigger Siri voice nudge when strain drops (if user has nudges enabled)

Preference list
[x] Create Swift `WorkoutAttributes` struct with `ActivityAttributes` + `ContentState`
[x] Add Live Activity support using ActivityKit (iOS 16.1+)
[x] Design Dynamic Island compact/expanded UI using WidgetKit + SwiftUI
[x] Add logic to update the Live Activity in real-time as workout progresses
[x] Display reps + strain in Dynamic Island during active sets
[x] Display rest timer + strain in Dynamic Island during rest
[x] Integrate wearable strain values (Apple Watch via HealthKit or WHOOP if available)
[x] Auto-disable Live Activity if no wearable connected or permissions are denied
[x] Voice assistant nudge (optional): Use Siri Shortcuts or AVSpeechSynthesizer to say “Let’s go! Start your next set.” if nudging is enabled and recovery is detected

AI suitability based on prior summary (replace stale or disliked exercises)

avgRest
totalVolume

### Monthly AI Adjustments to Exercise Pool

- [x] Pull monthlySummary JSON at each mesocycle transition
- [x] Track avg + max for sets, reps, load, avgRest, and totalVolume
- [x] Identify and flag exercises that are stalled (no load or volume increase over 2 cycles)
- [x] Identify exercises with low user rating
- [x] Identify exercises with poor strain-to-rep correlation (optional)
- [x] Replace 20–30% of exercise pool with new exercises at each mesocycle transition
- [x] Update program JSON for new mesocycle with updated exercises

🧠 AI CONFIG SUPPORT
Config stored as JSON string in Convex:

```json
{
  "trackRepsSetsLoad": "avg_max",
  "strainNudges": true
}
```

🎧 NATIVE MUSIC PLAYER CONTROLS (IN-WORKOUT)

## Native Music Player Controls (In-Workout)

- [x] Add music controls UI to workout session screen
  - [x] Play / Pause button
  - [x] Skip track button
  - [x] Volume up/down controls
  - [x] Show current track name and artist
- [x] Implement Capacitor plugin for media control (cordova-plugin-music-controls2 or modern alternative)
- [x] Auto-detect platform (Apple Music for iOS, Spotify, or system player)
- [x] Design music state data model
  - Add fields for music state (track, artist, position, isPlaying, etc.) to workout session or a new table in Convex backend.
- [x] Implement backend logic for music state
  - Create Convex functions to save and retrieve music state per session/user.
- [x] Update music controls UI to sync state
  - Update Svelte music controls component to save music state on change and restore on session load.

**Note:** Check off each task as you complete it. Update this list as new features/specs are added or completed.

---

## Trainer, Marketplace, and Payments Roadmap

### Phase 1: Data Models (Convex)

- [x] Create Trainer table
  - [x] Fields: trainerId, userId, certificationVerified, bio, specialties[]
  - [x] Role: link trainer accounts to users with role-based permissions
- [x] Create Program table
  - [x] Fields: programId, trainerId, title, goal, description, durationWeeks, equipment[], priceType ("subscription" | "oneTime"), price, jsonData, createdAt
- [x] Create Purchase table
  - [x] Fields: purchaseId, userId, programId, type ("subscription" | "oneTime"), status ("active" | "expired" | "canceled"), startDate, endDate, stripeSubscriptionId?
- [x] Create ProgramOwnership view
  - [x] Joins purchases → programs a user has access to
  - [x] Supports revoking if subscription canceled/refunded

### Phase 2: File Upload + Conversion

- [x] Build file upload endpoint

  - [x] Accepts CSV/Excel/Google Sheets import
  - [x] Uses parser (e.g., papaparse for CSV, xlsx for Excel)
  - [x] Convert → structured JSON with:

    ```json
    {
      "week": 1,
      "day": "Push",
      "exercises": [
        { "name": "Bench Press", "sets": 4, "reps": "8–12", "load": "70%" }
      ]
    }
    ```

  - [x] Validate JSON (required fields: exercise, sets, reps, load)
  - [x] Auto-reject malformed files
  - [x] Attach JSON to Program table
  - [x] Store raw JSON in Convex
  - [x] Link back to original trainer upload

### Phase 3: Trainer Account Management

- [x] Add trainer onboarding
  - [x] Upload certification (PDF/image) → stored securely
  - [x] Admin review flag: certificationVerified = true
  - [x] Allow only verified trainers to publish programs
- [x] Implement Trainer Dashboard
  - [x] Build trainer dashboard: CRUD for programs, track purchases/subscriptions, show revenue summary (linked to Stripe payouts)

### Phase 4: Marketplace UI

- [x] Implement Marketplace Home UI
  - [x] Build Marketplace home page: browse programs by goal, duration, trainer, equipment. Add search bar and program cards.
- [x] Implement Program Details Page
  - [x] Build program details page: show full program info, trainer info, and purchase button. Link from Marketplace home.
  - [x] Purchase flow
    - [x] One-time → checkout → unlock permanent access
    - [x] Subscription → checkout → recurring billing via Stripe
      - UI and backend mutation scaffolded for subscription checkout (see createSubscriptionCheckoutSession)
      - Webhook handler (webhook.js) and subscription record logic scaffolded; ready for Stripe secret integration
      - Stripe SDK integration and secret key setup required in backend to complete subscription flow. No further automation possible until Stripe credentials and integration are provided.
- [x] User dashboard
  - [x] List of purchased programs
  - [x] Active subscriptions (Trainer Link)
  - [x] Download/view program JSON in workout planner

### Phase 5: Payments (Stripe)

- [x] Integrate Stripe Checkout
  - [x] One-time products → Stripe Product + Price (backend logic and webhook support implemented; ensure Stripe metadata is set in session)
    - [x] Each one-time purchase now stores a planJson field (JSON of the purchased plan) in the purchase record for mobile app compatibility
    - [x] Commission logic updated: after Apple/Google tax markup, platform takes 20% of the remainder as the fee
  - [x] Subscriptions → Stripe Subscription API (Convex mutation and webhook implemented)
  - [x] Webhook handling (Convex endpoint)
    - [x] On payment success → create Purchase record and record revenue transaction
    - [x] On subscription cancel/expire → update status → revoke access (scaffolded, logic to be expanded as needed)
- [x] Trainer payout system (Convex schema and mutation for revenue/payouts scaffolded)
  - [x] Track commission % in Convex (logic for 10%/20% implemented; commission tiers completed)
  - [x] Stripe Connect account per trainer (automated via backend mutation and onboarding link)
  - [x] Commission tiers: For custom plan subscriptions, take 10% if user is a Pro client, 30% if not (per-user logic, already implemented)

---

## AI-Powered Adaptive Workout Coaching System (Alice & Aiden)

### Phase 0 - Coach Selection & Onboarding

- [ ] Implement Coach Selection UI

  - Create coach selection UI allowing users to choose between Alice (encouraging/firmer) and Aiden (steady/pushy) personas
  - Persist choice in user profile
  - Trigger only once at Pro subscription signup

- [ ] Create Onboarding Flow

  - Build onboarding flow with demographics (height, weight, age, weekly activity level)
  - Goals selection (strength, hypertrophy, recomposition, mobility, fat loss)
  - Equipment assessment (full gym/home gym/limited equipment)
  - Rest logic explanation (adaptive rest system with HR checks)
  - Voice rules explanation (no mid-set talking, only pre/post and rest)
  - Tone toggle (light vs firm for Alice, steady vs pushy for Aiden)
  - Sensor linking offer (watch/Wearable connection)

- [ ] Develop Persona Narration Scripts
  - Create onboarding/scripts.json with full narration scripts for both personas and tones
  - Welcome → intro & role script
  - Demographics collection narration
  - Goals explanation and selection
  - Equipment assessment dialogue
  - Rest system explanation
  - Voice rules and tone selection
  - Sensor connection guidance
  - Closing message: "Setup done. See you at Set 1."

### Phase 1 - Personas & Phrase Libraries

- [ ] Build Phrase Libraries

  - Expand personas/alice.json with 20-30 randomized lines per category
  - Expand personas/aiden.json with 20-30 randomized lines per category
  - Categories: set_start, set_end_no_pr, set_end_pr, rest_start_standard, rest_ready_30, rest_ready_60, rest_force_90, exercise_transition
  - No-repeat logic to avoid repeating last used line
  - Focus strictly on effort, energy, recovery, strain, PRs, and milestones
  - Never mention form or technique

- [ ] Implement Pronunciation Guide
  - Create personas/pronunciation.json for exercise names and terms
  - Examples: hypertrophy ("high-PURR-troh-fee"), RDL ("ar-dee-ell")
  - Include common fitness terminology and exercise names

### Phase 2 - HR-Aware Adaptive Rest

- [ ] Audit Existing Rest Logic

  - Audit existing rest logic and create rest_engine/audit_report.md
  - Compare current implementation vs new HR-aware spec
  - Document conflicts and required changes

- [ ] Implement HR-Aware Rest Engine
  - Build rest_engine/adaptive_rest.py with HR-aware logic
  - At 30s: trigger if HR drop ≥30 bpm
  - At 60s: trigger if HR drop ≥25 bpm
  - At 90s: always trigger (force rest)
  - Add lighten-load suggestion if HR still elevated
  - Cap rest at 90s with no exceptions
  - System logs for HR deltas and completion outcomes
  - AI learns rest preferences over time

### Phase 3 - Narration Composer

- [ ] Build Narration Composer
  - Create narration/composer.py to generate utterance timelines
  - Input: persona, tone, set number, PR status, exercise, HR readings, strain, next exercise
  - Output: timeline of utterances with timing
  - Flow: Pre-set motivation → Post-set response → Rest cues → HR-driven checks → Exercise transitions
  - No mid-set chatter, respect HR rest decisions
  - Unit tests with sample contexts

### Phase 4 - Evidence-Based Knowledge Base

- [ ] Create Knowledge Base Schema

  - Set up schema for guidelines, rules, and food items
  - guideline_chunk: {id, source, url, topic, population, evidence_level, text, retrieved_at}
  - rule_pack: JSON mapping conditions → recommendations with citations
  - food_item: {id, name, macros, micros, serving_size, source, last_updated}

- [ ] Integrate Trusted Data Sources
  - Implement APIs for CDC, WHO, ACSM guidelines
  - PubMed abstracts/reviews integration
  - USDA FoodData Central + OpenFoodFacts APIs
  - Refresh schedule: guidelines yearly, nutrition monthly, PubMed weekly
  - Learning loop for PRs, recovery speed, adherence adjustments

### Phase 5 - CSV Ingestion & Exercise Mapping

- [x] Create CSV Ingestion System

  - Build csv_ingestor.py with auto-detection (delimiter, encoding)
  - Normalize units (kg → lb, km → miles)
  - Fuzzy match exercise names using RapidFuzz
  - Fallback to embeddings API for unmapped names
  - Log unknowns for trainer review

- [x] Build Exercise Mapping

  - Implement exercise_mapper.py with RapidFuzz matching
  - Embeddings API fallback for unmapped exercises
  - Output unified TechnicallyFit_Workout schema

- [x] Define Workout Schema
  - Create schemas/workout_schema.json for unified workout data format
  - Support external fitness app imports
  - Standardized field mappings

### Phase 6 - Trainer Assistant

- [x] Implement Trainer Calendar

  - Build trainer calendar CRUD operations
  - Client workout summaries integration
  - Calendar management interface

- [x] Build AI Training Suggestions
  - Create AI suggestions for progression, deloads, volume adjustments
  - APIs: getClientSummary, getTrainerCalendar, suggestAdjustments
  - Integration with knowledge base recommendations

### Phase 7 - TTS Integration

- [x] Create TTS Integration
  - Implement TTS with persona-voice mapping
  - Apply pronunciation replacements before synthesis
  - Cache common lines for performance
  - Provide fallback (text or haptic) if TTS fails
  - Create tts/voice_map.json and tts/speak.py
- [x] Build TTS Control Component
  - Create TTSControls.svelte with voice selection, volume/rate controls
  - Implement queue management and status display
  - Add event dispatching for parent component integration
  - Include accessibility features and browser compatibility checks

### Phase 8 - Deployment

- [ ] Build FastAPI Backend

  - Set up FastAPI with all required endpoints
  - Endpoints: /onboarding/_, /narration/compose, /rest/decision, /kb/_, /csv/_, /trainer/_
  - Create main.py and requirements.txt

- [ ] Setup Deployment Configuration
  - Configure Render deployment with render.yaml and Procfile
  - Environment setup and scaling configuration

### Global Requirements

- [ ] Add Feature Flags

  - Implement feature flags for all new modules
  - Toggleable functionality for AI coaching system
  - Configuration management

- [ ] Generate Audit Reports
  - Create comprehensive audit reports for existing logic conflicts
  - reports/conflicts_rest.md, reports/conflicts_kb.md, etc.
  - Document all changes and backward compatibility

---

**Note:** Check off each task as you complete it. This AI coaching system will transform Technically Fit into an intelligent, personalized training platform with adaptive narration and evidence-based recommendations.
