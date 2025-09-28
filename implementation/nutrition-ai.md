# Nutrition AI Implementation

## Overview

This document outlines the implementation details for the Nutrition AI system, which works with or without wearables to provide personalized nutrition recommendations.

## Features

### 1. Inputs

- **Required**:
  - Height, weight, age, sex, goal (cut/recomp/gain), activity level.
- **Optional**:
  - Weekly scale weight (moving average), steps, sleep, resting HR/HRV, workout strain, food logs/barcode scans.

### 2. Core Calculations

- **TDEE Bootstrap**:

  - Use Mifflin-St Jeor equation scaled by activity level.
  - Auto-calibrate weekly based on weight trends.
  - Target weekly change:
    - Cut: –0.25% to –0.75%.
    - Gain: +0.25% to +0.5%.
  - Adjust calories ±100–200 kcal/week if target is missed.

- **Macros**:

  - Protein: 1.6–2.2 g/kg (use estimated lean mass if BMI ≥30).
  - Fat: 0.6–1.0 g/kg minimum.
  - Carbs: Remainder, with training-day carb bias (+10–20% carbs on heavy days).

- **Recovery-Aware Micro-Adjustments**:
  - Low HRV + high resting HR + poor sleep → hold/increase carbs slightly or auto-schedule a light day.
  - High session strain with poor next-day readiness → recommend earlier bedtime, hydration, and cap intensity.

### 3. Timing & Habits (Nudges)

- **Pre-Workout**:
  - 20–40 g protein + some carbs if long/heavy.
- **Post-Workout**:
  - ~0.3 g/kg protein.
- **Daily**:
  - Fiber: 25–35 g.
  - Water: Personalized by body mass/heat index.
- **Make-Up Logic**:
  - If user under-hits protein midweek, distribute catch-up across remaining days.

### 4. Food Logging Options

- **Barcode + Search**:
  - Integrate USDA FoodData Central / Open Food Facts as sources.
  - Allow trainers to upload house foods.
- **Quick Log Mode**:
  - Portion presets and macro heuristics for non-trackers.

### 5. Safety Rails

- **Health Flags**:
  - Diabetes/heart history → conservative carb cycling, sodium prompts, and medical disclaimers.
  - Allow trainers to require data sharing to tailor plans.

---

## Payments & Distribution

### 1. Apple Fee Strategy

- **App Store Subscriptions (IAP)**:
  - Apple takes 30% in year one, 15% after year one.
  - Small Business Program: 15% fee.
- **Linking Out to Pay on the Web**:
  - US: Include external purchase links/calls-to-action if permitted.
  - EU: Evaluate DMA options for external payments and alternative distribution.
- **PWA Fallback**:
  - Use web push for notifications and web checkout as an on-ramp.

### 2. Recommended Flow

- **Web-First Checkout**:
  - Sell Pro/Elite on your site (Stripe).
  - In-app: “Sign in / Restore purchase” for existing subscribers.
- **Inside the App**:
  - Offer monthly via IAP for convenience.
  - Promote annual plans on the web for better margins.
- **Android**:
  - Maintain Play Billing for parity; web checkout also supported.

---

## IP & Secrecy

### 1. Architecture

- Keep all core logic/weights server-side in Convex actions.
- Return policy IDs and next-action suggestions, not raw rules.

### 2. Hardening

- **Mobile**:
  - Strip logs, minify/obfuscate, disable debug symbols in release.
- **API**:
  - Use per-tenant keys, rate limits, anomaly detection, signed responses.
- **Device Attestation**:
  - Use Apple DeviceCheck/Attest and Play Integrity to reduce tampering.
- **Secrets**:
  - Use KMS/parameter store, rotate keys, segregate trainer vs end-user scopes.

### 3. Legal Protections

- **ToS**:
  - Forbid reverse-engineering/scraping.
- **Contracts**:
  - Include NDAs with trainers/partners and trade-secret language.
- **Patents**:
  - Consider provisional patents for novel mechanisms.

### 4. Model Governance

- Use versioned models/policies with canary rollout and rollback.
- Conduct red-team testing for APIs.

### 5. Telemetry

- Log decision outcomes and anonymized inputs, but never expose exact rules to clients.

---

## Timeline

- **Phase 1**: Core Calculations and Inputs (2 weeks).
- **Phase 2**: Food Logging and Safety Rails (2 weeks).
- **Phase 3**: Payments & Distribution (2 weeks).
- **Phase 4**: IP & Secrecy Protections (1 week).

---

## Notes

- Ensure compliance with data protection regulations.
- Regularly validate calculations and recommendations with user feedback.
- Provide clear documentation for trainers and end-users.

---

### Adaptive fIt — App Specs

#### 1. Deload Weeks (mandatory, per goal)

- Hypertrophy/Bodybuilding: every 5 weeks, volume −35%, keep intensity mid-range
- Strength: every 4–6 weeks, intensity −5–10% 1RM, volume −20–30%
- Powerlifting: every 4–5 weeks, volume −30–40%, keep singles @ 80%
- Weight Loss: every 4 weeks, volume −30–40%, optional +5–10% kcal that week
- Mobility: every 6 weeks, intensity −2 RPE, maintain volume

#### 2. Bodybuilding Nutrition (bulk & cut)

- Bulk: +10–20% kcal (+350–500/day), gain 0.3–0.45 kg/week
- Cut: −10–20% kcal, lose 0.25–0.75% BW/week
- Protein: 1.6–2.2 g/kg
- Fat: 0.6–1.0 g/kg
- Carbs: remainder, +10–20% on hard days
- Weekly auto-adjust: ±100–200 kcal based on weight trend
- Pre-workout: 20–40 g protein + carbs
- Post-workout: 0.3 g/kg protein

#### 3. Granular Feedback (optional, RP-style)

- Pump (0–3)
- Soreness (0–3)
- Joint pain (0–3)
- Session disruption/fatigue (0–3)
- Exercise performance note (easier/same/harder)

#### 4. Objective Overlays

- HR spike & recovery per set
- Reps vs. target
- Failure events
- Readiness (resting HR, HRV, sleep)

#### 5. Adjustment Logic (weekly)

- Hypertrophy: overshoot range → +load; low pump/strain → +set; high soreness/pain → −set
- Strength: if performance drops but strain high → reduce volume; else +load
- Powerlifting: wave intensity; taper for meets
- Weight Loss: adjust reps/sets before load
- Mobility: lower RPE during deload, maintain ROM work
- Nutrition: auto-adjust calories ±100–200 based on weight trends

#### 6. Plan Scheduling

- User picks start + finish date
- App auto-inserts deload weeks per goal
- End-of-block deload before switching phases

#### 7. Data Model (example tables)

WorkoutSet:

- userId, exerciseId, setIndex, reps, load
- targetRange, hrStart, hrEnd, restBefore
- felt(easy|mod|hard), pump, soreness, jointPain, disruption, ts

WeeklyAggregate:

- avgRIR_est, avgHRSpikeNorm, setsHit%, topRangeRate%
- sorenessRate, painRate

NutritionWeek:

- kcalTarget, P/F/C targets, weightMA, deltaVsGoal
- nudge(±kcal), notes

PlanPhase:

- goal, startDate, endDate
- deloadWeeks[], cadence, rulesetId
