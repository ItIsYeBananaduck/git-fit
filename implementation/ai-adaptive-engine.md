# AI & Adaptive Engine Implementation

## Overview

This document outlines the implementation details for the AI and adaptive engine, which dynamically adjusts training parameters based on user feedback and physiological data.

## Features

### 1. Dynamic Adjustments

- **Inputs**:
  - User feedback on perceived exertion.
  - Heart rate (HR) response during and after sets.
- **Adjustments**:
  - Sets, reps, and load based on feedback and HR data.
  - Auto-calibration for RIR (Reps In Reserve).
  - Fatigue-aware modeling to prevent overtraining.
- **Implementation Steps**:
  1. Build algorithms for dynamic adjustment calculations.
  2. Integrate HR data processing from wearable devices.
  3. Store adjustment history in Convex for analysis.

### 2. Auto-Calibration for RIR

- **Features**:
  - Predict RIR based on user performance data.
  - Adjust predictions based on real-time feedback.
  - Refine RIR model over time for accuracy.
- **Implementation Steps**:
  1. Develop machine learning model for RIR prediction.
  2. Train the model using first-week calibration data.
  3. Implement real-time RIR adjustments during workouts.

### 3. Fatigue-Aware Modeling

- **Features**:
  - Monitor fatigue levels using HRV and strain metrics.
  - Adjust training intensity to match recovery capacity.
  - Provide warnings for potential overtraining.
- **Implementation Steps**:
  1. Build fatigue monitoring algorithms.
  2. Integrate HRV and strain data from wearables.
  3. Create user notifications for fatigue-related adjustments.

---

## Timeline

- **Phase 1**: Dynamic Adjustments (2 weeks)
- **Phase 2**: Auto-Calibration for RIR (2 weeks)
- **Phase 3**: Fatigue-Aware Modeling (2 weeks)

---

## Notes

- Ensure all algorithms are optimized for real-time processing.
- Regularly validate the accuracy of the RIR model with user data.
- Test fatigue-aware adjustments with diverse user profiles to ensure reliability.

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
