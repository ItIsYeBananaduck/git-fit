# Data Model: Monday Workout Intensity Analysis

**Feature**: Monday Workout Intensity Analysis
**Created**: 2025-09-26
**Source**: Extracted from feature specification and research findings

## Core Entities

### WorkoutSession
Represents a single workout session with performance metrics and completion status.

**Fields**:
- `id`: string - unique identifier for the workout session
- `userId`: string - user who performed the workout  
- `exerciseId`: string - reference to the exercise being performed
- `date`: Date - when the workout was performed
- `reps`: number - repetitions completed
- `sets`: number - number of sets performed
- `weight`: number - weight used in pounds or kilograms
- `completionTime`: number - duration of workout in milliseconds
- `estimatedCalories`: number - calculated calorie expenditure
- `completed`: boolean - whether the workout was fully completed
- `rawDataHash`: string - SHA-256 hash of the workout data

**Relationships**:
- Belongs to User (userId)
- References Exercise (exerciseId)
- Has one HealthMetrics (same date)
- Has one UserFeedback (same session)

**Validation Rules**:
- reps must be >= 0
- sets must be >= 1  
- weight must be >= 0
- completionTime must be > 0 if completed = true
- rawDataHash must be valid SHA-256 format

### HealthMetrics
Contains health data from wearables integrated via HealthKit/Health Connect.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user the metrics belong to
- `date`: Date - date of the health data collection
- `heartRateAvg`: number | null - average heart rate during workout (BPM)
- `heartRateMax`: number | null - maximum heart rate during workout (BPM)  
- `heartRateVariance`: number | null - variance from resting HR (calculated)
- `spO2Avg`: number | null - average blood oxygen saturation (%)
- `spO2Drift`: number | null - drift from baseline SpO2 (calculated)
- `sleepScore`: number | null - previous night's sleep quality score (0-100)
- `strainScore`: number | null - overall strain score from wearable (0-100)
- `dataSource`: string - source of the health data (HealthKit, Health Connect, manual)

**Relationships**:
- Belongs to User (userId)
- Links to WorkoutSession (same date)

**Validation Rules**:
- heartRate values must be 40-220 BPM if present
- spO2 values must be 70-100% if present
- sleepScore must be 0-100 if present
- strainScore must be 0-100 if present
- at least one metric must be non-null

### UserFeedback
Captures subjective workout difficulty rating from the user.

**Fields**:
- `id`: string - unique identifier
- `workoutSessionId`: string - reference to the workout session
- `userId`: string - user providing feedback
- `difficultyRating`: string - standardized difficulty rating
- `timestamp`: Date - when feedback was provided
- `notes`: string | null - optional user notes

**Relationships**:
- Belongs to User (userId)
- Belongs to WorkoutSession (workoutSessionId)

**Validation Rules**:
- difficultyRating must be one of: "keep going", "neutral", "challenge", "easy killer", "flag"
- timestamp must be within 24 hours of workout completion
- notes max length 500 characters

**Difficulty Rating Values**:
- "keep going": +20 intensity impact
- "neutral": 0 intensity impact  
- "challenge": +10 intensity impact
- "easy killer": -15 intensity impact
- "flag": -5 intensity impact

### IntensityScore
Weekly calculated score combining objective health metrics with subjective feedback.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user the score belongs to
- `weekStartDate`: Date - Monday of the week being analyzed
- `baseScore`: number - base intensity score (default 50%)
- `heartRateComponent`: number - HR variance contribution to intensity
- `spO2Component`: number - SpO2 drift contribution to intensity  
- `sleepComponent`: number - sleep quality contribution to intensity
- `feedbackComponent`: number - user feedback contribution to intensity
- `totalIntensity`: number - final calculated intensity score (0-100+%)
- `calculationDate`: Date - when the intensity was calculated
- `dataQuality`: string - quality assessment of input data

**Relationships**:
- Belongs to User (userId)
- Aggregates multiple WorkoutSessions (same week)
- Aggregates multiple HealthMetrics (same week)
- Aggregates multiple UserFeedback (same week)

**Validation Rules**:
- totalIntensity must be >= 0  
- baseScore must equal 50
- weekStartDate must be a Monday
- dataQuality must be one of: "complete", "partial", "minimal", "insufficient"

**Calculation Formula**:
```
totalIntensity = baseScore + heartRateComponent + spO2Component + sleepComponent + feedbackComponent
```

### VolumeAdjustment
Automated recommendation for next week's workout weights based on intensity analysis.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user the adjustment applies to  
- `weekStartDate`: Date - Monday of the week being adjusted
- `exerciseId`: string - exercise being adjusted
- `currentWeight`: number - current workout weight
- `adjustmentPercentage`: number - percentage change (-10% to +10%)
- `newWeight`: number - calculated new weight recommendation
- `reason`: string - explanation for the adjustment
- `triggerRule`: string - which rule triggered the adjustment
- `applied`: boolean - whether user has applied the adjustment

**Relationships**:
- Belongs to User (userId)
- References Exercise (exerciseId)
- Based on IntensityScore (same week)

**Validation Rules**:
- adjustmentPercentage must be between -50% and +50%
- newWeight must be >= 0
- reason must not be empty
- triggerRule must be one of the defined adjustment rules

**Trigger Rules**:
- "intensity_over_100": Intensity score exceeds 100%
- "easy_killer_high_strain": User rated "easy killer" AND strain > 95%
- "extreme_hr_spike": HR spike >15 BPM + SpO2 drop >3% with no reps
- "missing_data_drop": No workout data for the week
- "feedback_mismatch": Persistent feedback/health data mismatch

### MondayProcessor
Weekly batch process that analyzes workout data and generates adjustments.

**Fields**:
- `id`: string - unique identifier for the processing run
- `processDate`: Date - when the processing occurred
- `weekStartDate`: Date - Monday of the week being processed
- `usersProcessed`: number - count of users processed
- `intensityScoresGenerated`: number - count of intensity scores created
- `adjustmentsGenerated`: number - count of volume adjustments created
- `processingTimeMs`: number - time taken for processing
- `status`: string - processing status
- `errors`: string[] - array of any processing errors

**Validation Rules**:
- processDate must be a Monday
- weekStartDate must be the previous Monday  
- counts must be >= 0
- status must be one of: "running", "completed", "failed", "partial"

## State Transitions

### WorkoutSession States
1. Created → In Progress → Completed/Abandoned
2. Completed sessions generate rawDataHash
3. Hash triggers Monday processing eligibility

### IntensityScore Calculation Flow
1. Monday processor starts → Collects week's WorkoutSessions
2. Aggregates HealthMetrics for same period
3. Aggregates UserFeedback for same workouts
4. Calculates component scores
5. Generates final intensity score
6. Triggers volume adjustment rules

### VolumeAdjustment Lifecycle
1. Generated by Monday processor → Pending user review
2. User applies → Adjustment marked as applied
3. User ignores → Adjustment remains pending
4. Next week → New adjustments may override pending ones

## Data Integrity Rules

### Cross-Entity Validation
- WorkoutSession.date must match HealthMetrics.date for linked records
- UserFeedback.workoutSessionId must reference valid WorkoutSession
- IntensityScore.weekStartDate must be previous Monday for calculations
- VolumeAdjustment must reference valid IntensityScore from same week

### Data Retention
- WorkoutSession raw data: Hash after transmission, retain hash
- HealthMetrics: Retain for intensity calculations (90 days)
- IntensityScore: Retain indefinitely for trend analysis
- VolumeAdjustment: Retain for 4 weeks, then archive

### Privacy Protection
- Raw workout data hashed with SHA-256 before backend storage
- Health metrics processed locally, aggregated values only stored
- User feedback anonymized in aggregate reports
- Personal identifiers limited to necessary fields only