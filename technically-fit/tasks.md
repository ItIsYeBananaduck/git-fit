## Nutrition AI – Auto Macro Adjustment on Plateau

- [x] Detect plateau from `monthlySummary`: - No change in average/max volume or load for 3+ weeks - Weight has not changed in 3+ weeks (if goal is weight-based)
- [x] Confirm user is **compliant** (logs/workouts consistent)
- [x] Adjust macros carefully: - Bulk: +5–10% carbs or protein - Cut: -5–10% carbs or fats - Recomp: micro-adjust around training window
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

# Implementation Tasks for Technically Fit

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

# Training Split Customization

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

}
 [x] Show countdown timer (based on AI-configured avgRestSec)
 [x] Show current strain
 [x] Optionally trigger Siri voice nudge when strain drops (if user has nudges enabled)

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

```

"trackRepsSetsLoad": "avg_max",
[x] Add fallback notification system for unsupported iPhones (non-Pro or older than iPhone 14)
[x] Show volume trend or fatigue warning if set strain is too low
[x] Add settings toggle to disable Live Activity
"strainNudges": true
}

````

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
    { "week": 1, "day": "Push", "exercises": [ { "name": "Bench Press", "sets": 4, "reps": "8–12", "load": "70%" } ] }
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
  - [x] Subscriptions → Stripe Subscription API (Convex mutation and webhook implemented)
  - [x] Webhook handling (Convex endpoint)
    - [x] On payment success → create Purchase record and record revenue transaction
    - [x] On subscription cancel/expire → update status → revoke access (scaffolded, logic to be expanded as needed)
- [x] Trainer payout system (Convex schema and mutation for revenue/payouts scaffolded)
  - [x] Track commission % in Convex (logic for 10%/20% implemented; commission tiers TODO)
  - [ ] Stripe Connect account per trainer (not yet automated)
  - [ ] Commission tiers:
    - [ ] Start: 30% app / 70% trainer
    - [ ] Drop to 10% app when trainer’s Pro clients ≥ fair number
````
