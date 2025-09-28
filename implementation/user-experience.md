# User Experience Enhancement Implementation

## Overview

This document outlines the implementation details for enhancing the user experience, focusing on creating an all-in-one platform for beginners and advanced lifters.

## Features

### 1. Unified Experience

- **Features**:
  - Seamless navigation between training, nutrition, and insights.
  - Consistent design language across all modules.
- **Implementation Steps**:
  1. Conduct user research to identify pain points.
  2. Redesign navigation and layout for simplicity.
  3. Implement a unified theme and style guide.

### 2. Motivational Features

- **Features**:
  - Goal-setting interface with progress tracking.
  - Achievement badges and milestone celebrations.
- **Implementation Steps**:
  1. Build a goal-setting wizard for users.
  2. Create a system for tracking and displaying progress.
  3. Design and implement achievement badges.

### 3. Personalization

- **Features**:
  - Adaptive recommendations based on user behavior.
  - Customizable dashboards for quick access to key metrics.
- **Implementation Steps**:
  1. Develop algorithms for adaptive recommendations.
  2. Build customizable dashboard components.
  3. Test personalization features with diverse user profiles.

---

## Timeline

- **Phase 1**: Unified Experience (2 weeks)
- **Phase 2**: Motivational Features (2 weeks)
- **Phase 3**: Personalization (2 weeks)

---

## Notes

- Ensure accessibility for users with disabilities.
- Regularly gather user feedback to refine features.
- Test all enhancements for performance and usability.

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
