## Nutrition AI – Auto Macro Adjustment on Plateau

- [x] Detect plateau from `monthlySummary`:
  - [x] No change in average/max volume or load for 3+ weeks
  - [x] Weight has not changed in 3+ weeks (if goal is weight-based)
- [x] Confirm user is **compliant** (logs/workouts consistent)
- [x] Adjust macros carefully:
  - [x] Bulk: +5–10% carbs or protein
  - [x] Cut: -5–10% carbs or fats
  - [x] Recomp: micro-adjust around training window
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

- [x] Prioritize safe calorie levels — never drop below clinical minimums.
- [x] Include config toggle: "autoAdjustMacros": true
- [x] Send notification: "We adjusted your macros to help you break through your plateau. You can view or revert this change in your settings."
- [x] Disable auto-adjust if wearable or weight log is unavailable for over 14 days.

---

## User Experience Enhancement

- [x] Redesign unified navigation and design language across modules
- [x] Build customizable dashboards for key metrics
- [x] Ensure accessibility for users with disabilities:
  - [x] Add ARIA labels to all interactive elements
  - [x] Implement keyboard navigation for all major flows
  - [x] Add screen reader support (roles, labels, alt text)
  - [x] Ensure color contrast compliance (WCAG AA)
  - [x] Audit AccessibilityUtils.svelte and +layout.svelte
  - [x] Audit all dashboard widgets for accessibility

---

## AI Adaptive Engine

- [x] Build dynamic adjustment algorithms for sets/reps/load based on feedback and HR data
- [x] Implement auto-calibration for RIR (machine learning model, training, real-time adjustment)
- [x] Add fatigue-aware modeling (HRV/strain integration, fatigue warnings)
- [x] Create user notifications for fatigue-related adjustments
- [x] Integrate daily strain assessment using SpO₂ and resting heart rate (traffic light zones, training adjustments, health alerts)

---

## Monthly AI Adjustments to Exercise Pool

- [x] Pull monthlySummary JSON at each mesocycle transition
- [x] Track avg + max for sets, reps, load, avgRest, and totalVolume
- [x] Identify and flag exercises that are stalled (no load or volume increase over 2 cycles)
- [x] Identify exercises with low user rating
- [x] Identify exercises with poor strain-to-rep correlation (optional)
- [x] Replace 20–30% of exercise pool with new exercises at each mesocycle transition
- [x] Update program JSON for new mesocycle with updated exercises

---

## Restored Tasks

### Wearable & Device Support

- [x] Implement pre-set screen with rep/volume adjustment controls
- [x] Create in-set screen showing live HR, SpO₂, and strain indicator
- [x] Add 3 feedback buttons (Set Completed, Too Easy, Too Hard)
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

### Data Collection & Storage

- [x] Add retention policies (raw vs. summarized data)
- [x] Implement automated data summarization
- [x] Build manual data export/deletion tools
- [x] Add data encryption and privacy compliance
- [x] Create user data management tools

### Training Split Customization

- [x] Allow user to set and save a custom training split
  - Implement UI and backend logic to let users define, save, and retrieve a fully custom training split (e.g., PPL + arm/core + cardio) as part of their config.

### AI Summary System + Smart Set Nudging

- [x] Create Convex table `user_configs` with a `configJson` field (stringified JSON)
- [x] Implement backend logic to read/write user config (latest version only)
- [x] Build UI for users to view and update config options (deload, rest time, etc.)
- [x] Create Convex table `user_monthly_summaries` with fields: `monthlySummaryJson` and `monthKey`
- [x] Implement backend logic to generate and store monthly summaries per user
- [x] Build UI to display monthly exercise summaries and stats
- [x] Create Convex table `user_yearly_summaries` with fields: `yearlySummaryJson` and `subscriptionStartDate`
- [x] Implement backend logic to aggregate monthly data into yearly summaries (max 3 years, auto-purge oldest)
- [x] Build UI to display yearly summaries and breakdowns
- [x] Implement logic to start rest timer using `avgRestSec` after each set
- [x] Compare strain at rest start and end; if criteria met, trigger nudge (voice prompt)
- [x] Integrate with wearable device APIs for real-time strain data
- [x] Add user toggle for smart set nudges in config/UI

### Live Activity & Dynamic Island (iOS)

- [x] Show current exercise name
- [x] Show reps completed / rep target (e.g., 6 / 10)
- [x] Show real-time strain (from Apple Watch, WHOOP, etc.)
- [x] Show countdown timer (based on AI-configured avgRestSec)
- [x] Show current strain
- [x] Optionally trigger Siri voice nudge when strain drops (if user has nudges enabled)
- [x] Create Swift `WorkoutAttributes` struct with `ActivityAttributes` + `ContentState`
- [x] Add Live Activity support using ActivityKit (iOS 16.1+)
- [x] Design Dynamic Island compact/expanded UI using WidgetKit + SwiftUI
- [x] Add logic to update the Live Activity in real-time as workout progresses
- [x] Display reps + strain in Dynamic Island during active sets
- [x] Display rest timer + strain in Dynamic Island during rest
- [x] Integrate wearable strain values (Apple Watch via HealthKit or WHOOP if available)
- [x] Auto-disable Live Activity if no wearable connected or permissions are denied
- [x] Voice assistant nudge (optional): Use Siri Shortcuts or AVSpeechSynthesizer to say “Let’s go! Start your next set.” if nudging is enabled and recovery is detected

### Mesocycle-Based Programming

- [x] Add mesocycle duration config (`default: 4 weeks`, user adjustable)
- [x] Trigger deload week automatically at the end of the mesocycle (unless skipped)
- [x] Store mesocycle metadata (`startDate`, `cycleLength`, `deloadScheduled`, etc.)

---

### Trainer, Marketplace, and Payments Roadmap

#### Phase 1: Data Models (Convex)

- [x] Create Trainer table
  - [x] Fields:
    - [x] trainerId
    - [x] userId
    - [x] certificationVerified
    - [x] bio
    - [x] specialties[]
  - [x] Role: link trainer accounts to users with role-based permissions
- [x] Create Program table
  - [x] Fields:
    - [x] programId
    - [x] trainerId
    - [x] title
    - [x] goal
    - [x] description
    - [x] durationWeeks
    - [x] equipment[]
    - [x] priceType ("subscription" | "oneTime")
    - [x] price
    - [x] jsonData
    - [x] createdAt
- [x] Create Purchase table
  - [x] Fields:
    - [x] purchaseId
    - [x] userId
    - [x] programId
    - [x] type ("subscription" | "oneTime")
    - [x] status ("active" | "expired" | "canceled")
    - [x] startDate
    - [x] endDate
    - [x] stripeSubscriptionId?
- [x] Create ProgramOwnership view
  - [x] Joins purchases → programs a user has access to
  - [x] Supports revoking if subscription canceled/refunded

#### Phase 2: File Upload + Conversion

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

#### Phase 3: Trainer Account Management

- [x] Add trainer onboarding
  - [x] Upload certification (PDF/image) → stored securely
  - [x] Admin review flag: certificationVerified = true
  - [x] Allow only verified trainers to publish programs
- [x] Implement Trainer Dashboard
  - [x] Build trainer dashboard:
    - [x] CRUD for programs
    - [x] Track purchases/subscriptions
    - [x] Show revenue summary (linked to Stripe payouts)

#### Phase 4: Marketplace UI

- [x] Implement Marketplace Home UI
  - [x] Build Marketplace home page:
    - [x] Browse programs by goal, duration, trainer, equipment
    - [x] Add search bar and program cards
- [x] Implement Program Details Page
  - [x] Build program details page:
    - [x] Show full program info, trainer info, and purchase button
    - [x] Link from Marketplace home
  - [x] Purchase flow:
    - [x] One-time → checkout → unlock permanent access
    - [x] Subscription → checkout → recurring billing via Stripe
      - [x] UI and backend mutation scaffolded for subscription checkout (see createSubscriptionCheckoutSession)
      - [x] Webhook handler (webhook.js) and subscription record logic scaffolded; ready for Stripe secret integration
      - [x] Stripe SDK integration and secret key setup required in backend to complete subscription flow. No further automation possible until Stripe credentials and integration are provided.
- [x] User dashboard
  - [x] List of purchased programs
  - [x] Active subscriptions (Trainer Link)
  - [x] Download/view program JSON in workout planner

#### Phase 5: Payments (Stripe)

- [x] Integrate Stripe Checkout
  - [x] One-time products → Stripe Product + Price (backend logic and webhook support implemented; ensure Stripe metadata is set in session)
    - [x] Each one-time purchase now stores a planJson field (JSON of the purchased plan) in the purchase record for mobile app compatibility
    - [x] Commission logic updated: after Apple/Google tax markup, platform takes 20% of the remainder as the fee
  - [x] Subscriptions → Stripe Subscription API (Convex mutation and webhook implemented)
  - [x] Webhook handling (Convex endpoint):
    - [x] On payment success → create Purchase record and record revenue transaction
    - [x] On subscription cancel/expire → update status → revoke access (scaffolded, logic to be expanded as needed)
- [x] Trainer payout system (Convex schema and mutation for revenue/payouts scaffolded):
  - [x] Track commission % in Convex (logic for 10%/20% implemented; commission tiers completed)
  - [x] Stripe Connect account per trainer (automated via backend mutation and onboarding link)
  - [x] Commission tiers: For custom plan subscriptions, take 10% if user is a Pro client, 30% if not (per-user logic, already implemented)

---

### AI-Powered Adaptive Workout Coaching System

#### Phase 0 - Coach Selection & Onboarding

- [ ] Implement Coach Selection UI

  - [ ] Create coach selection UI allowing users to choose between Alice (encouraging/firmer) and Aiden (steady/pushy) personas
  - [ ] Persist choice in user profile
  - [ ] Trigger only once at Pro subscription signup

- [ ] Create Onboarding Flow

  - Build onboarding flow with:
    - [ ] Demographics (height, weight, age, weekly activity level)
    - [ ] Goals selection (strength, hypertrophy, recomposition, mobility, fat loss)
    - [ ] Equipment assessment (full gym/home gym/limited equipment)
    - [ ] Rest logic explanation (adaptive rest system with HR checks)
    - [ ] Voice rules explanation (no mid-set talking, only pre/post and rest)
    - [ ] Tone toggle (light vs firm for Alice, steady vs pushy for Aiden)
    - [ ] Sensor linking offer (watch/Wearable connection)

- [ ] Develop Persona Narration Scripts
  - Create onboarding/scripts.json with full narration scripts for both personas and tones:
    - [ ] Welcome → intro & role script
    - [ ] Demographics collection narration
    - [ ] Goals explanation and selection
    - [ ] Equipment assessment dialogue
    - [ ] Rest system explanation
    - [ ] Voice rules and tone selection
    - [ ] Sensor connection guidance
    - [ ] Closing message: "Setup done. See you at Set 1."

#### Phase 1 - Personas & Phrase Libraries

- [ ] Build Phrase Libraries

  - Expand personas/alice.json with 20-30 randomized lines per category
  - Expand personas/aiden.json with 20-30 randomized lines per category
  - Categories:
    - [ ] set_start
    - [ ] set_end_no_pr
    - [ ] set_end_pr
    - [ ] rest_start_standard
    - [ ] rest_ready_30
    - [ ] rest_ready_60
    - [ ] rest_force_90
    - [ ] exercise_transition
  - [ ] No-repeat logic to avoid repeating last used line
  - [ ] Focus strictly on effort, energy, recovery, strain, PRs, and milestones
  - [ ] Never mention form or technique

- [ ] Implement Pronunciation Guide
  - Create personas/pronunciation.json for exercise names and terms:
    - Examples:
      - [ ] hypertrophy ("high-PURR-troh-fee")
      - [ ] RDL ("ar-dee-ell")
    - [ ] Include common fitness terminology and exercise names

#### Phase 2 - HR-Aware Adaptive Rest

- [ ] Audit Existing Rest Logic

  - [ ] Audit existing rest logic and create rest_engine/audit_report.md
  - [ ] Compare current implementation vs new HR-aware spec
  - [ ] Document conflicts and required changes

- [ ] Implement HR-Aware Rest Engine
  - Build rest_engine/adaptive_rest.py with HR-aware logic:
    - [ ] At 30s: trigger if HR drop ≥30 bpm
    - [ ] At 60s: trigger if HR drop ≥25 bpm
    - [ ] At 90s: always trigger (force rest)
    - [ ] Add lighten-load suggestion if HR still elevated
    - [ ] Cap rest at 90s with no exceptions
    - [ ] System logs for HR deltas and completion outcomes
    - [ ] AI learns rest preferences over time

#### Phase 3 - Narration Composer

- [ ] Build Narration Composer
  - Create narration/composer.py to generate utterance timelines:
    - Input: persona, tone, set number, PR status, exercise, HR readings, strain, next exercise
    - Output: timeline of utterances with timing
    - Flow:
      - [ ] Pre-set motivation
      - [ ] Post-set response
      - [ ] Rest cues
      - [ ] HR-driven checks
      - [ ] Exercise transitions
    - [ ] No mid-set chatter, respect HR rest decisions
    - [ ] Unit tests with sample contexts

---

### Native Music Player Controls (In-Workout)

- [x] Add music controls UI to workout session screen:
  - [x] Play / Pause button
  - [x] Skip track button
  - [x] Volume up/down controls
  - [x] Show current track name and artist
- [x] Implement Capacitor plugin for media control (cordova-plugin-music-controls2 or modern alternative)
- [x] Auto-detect platform (Apple Music for iOS, Spotify, or system player)
- [x] Design music state data model:
  - [x] Add fields for music state (track, artist, position, isPlaying, etc.) to workout session or a new table in Convex backend.
- [x] Implement backend logic for music state:
  - [x] Create Convex functions to save and retrieve music state per session/user.
- [x] Update music controls UI to sync state:
  - [x] Update Svelte music controls component to save music state on change and restore on session load.
