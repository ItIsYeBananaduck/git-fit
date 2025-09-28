# Data Model: Intensity Score (Live)

## Overview
Data model for real-time workout intensity scoring system with strain monitoring, AI coaching, and social features.

## Core Entities

### LiveStrain (Device-Only)
Real-time strain calculation that never gets permanently stored.

**Fields**:
- `currentHR`: number - current heart rate in BPM
- `baselineHR`: number - user's baseline resting heart rate
- `currentSpO2`: number - current blood oxygen saturation percentage
- `baselineSpO2`: number - user's baseline SpO₂ percentage  
- `recoveryDelayMs`: number - recovery delay in milliseconds
- `strainScore`: number - calculated strain (0-100)
- `status`: 'green' | 'yellow' | 'red' - strain status based on thresholds
- `timestamp`: number - calculation timestamp

**Relationships**:
- Calculated on-device only
- Used to derive strain modifier for IntensityScore
- Never stored in backend database

**Validation Rules**:
- strainScore clamped between 0-100
- status: green (≤85), yellow (86-95), red (>95)
- All heart rate and SpO₂ values must be positive

### IntensityScore (Backend-Stored)
Performance scoring stored with workout data.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user the score belongs to
- `workoutSessionId`: string - associated workout session
- `setId`: string - specific set within workout
- `tempoScore`: number - tempo component (0-100)
- `motionSmoothnessScore`: number - motion quality component (0-100)
- `repConsistencyScore`: number - consistency component (0-100)
- `userFeedbackScore`: number - user feedback component (-15 to +20)
- `strainModifier`: number - applied strain modifier (0.85, 0.95, or 1.0)
- `totalScore`: number - final calculated intensity score
- `isEstimated`: boolean - true if calculated without wearable data
- `createdAt`: Date - when the score was calculated

**Relationships**:
- Belongs to User (userId)
- Belongs to WorkoutSession (workoutSessionId) 
- Belongs to WorkoutSet (setId)

**Validation Rules**:
- totalScore capped at 100% for regular users, uncapped for trainers
- strainModifier must be 0.85, 0.95, or 1.0
- Component scores must be 0-100 except userFeedbackScore

### AICoachingContext
Enhanced coaching context with strain awareness.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user being coached
- `coachPersonality`: 'alice' | 'aiden' - selected AI coach
- `currentStrainStatus`: 'green' | 'yellow' | 'red' - live strain status
- `intensityHistory`: IntensityScore[] - recent intensity scores
- `calibrationPhase`: 'week1' | 'active' | 'complete' - calibration status
- `voiceEnabled`: boolean - whether AI voice is active
- `hasEarbuds`: boolean - earbud connection status
- `voiceIntensity`: number - voice intensity level (0-100)
- `isZenMode`: boolean - minimal audio mode active
- `lastCoachingMessage`: string - most recent coaching response
- `updatedAt`: Date - last context update

**Relationships**:
- Belongs to User (userId)
- References multiple IntensityScore records
- Integrates with existing WorkoutSession data

**Validation Rules**:
- voiceIntensity clamped 0-100 (0 = Zen mode)
- voiceEnabled requires hasEarbuds = true
- calibrationPhase progression follows spec rules

### SupplementStack
User's supplement regimen with performance tracking.

**Fields**:
- `id`: string - unique identifier  
- `userId`: string - user the stack belongs to
- `supplements`: SupplementItem[] - array of supplement entries
- `scanDate`: Date - when stack was initially scanned
- `lockUntilDate`: Date - locked for changes until this date (28 days)
- `isLocked`: boolean - whether modifications are currently locked
- `performanceBaseline`: object - performance metrics at stack start
- `lastModification`: Date - when stack was last changed
- `isShared`: boolean - whether stack is visible to others
- `autoWipeDate`: Date - auto-deletion date (52 weeks, opt-out possible)

**Relationships**:
- Belongs to User (userId)
- Referenced in social sharing features

**Validation Rules**:
- lockUntilDate = scanDate + 28 days
- autoWipeDate = scanDate + 52 weeks
- Medical compounds (Rx) automatically redacted from sharing

### SupplementItem
Individual supplement within a user's stack.

**Fields**:
- `barcode`: string - scanned barcode identifier
- `name`: string - supplement name from OpenFoodFacts
- `dosage`: string - user-specified dosage
- `timing`: string - when supplement is taken
- `isRxCompound`: boolean - whether this is a medical compound
- `publicHash`: string - hashed version for backend sharing
- `fullText`: string - complete information stored on-device only
- `categoryType`: string - supplement category

**Relationships**:
- Part of SupplementStack
- Links to OpenFoodFacts API data

**Validation Rules**:
- isRxCompound items never shared publicly
- publicHash only created for non-Rx items
- fullText never transmitted to backend

### WorkoutSet
Enhanced set data with tempo and strain integration.

**Fields**:
- `id`: string - unique identifier
- `workoutSessionId`: string - parent workout session
- `exerciseId`: string - exercise being performed
- `setNumber`: number - order within the workout
- `targetReps`: number - intended repetitions
- `actualReps`: number - completed repetitions
- `weight`: number - weight used
- `tempoData`: TempoData - timing information for the set
- `strainAtStart`: number - strain level when set began
- `strainAtEnd`: number - strain level when set completed
- `restPeriodMs`: number - actual rest time taken
- `wasAutoExtended`: boolean - whether rest was automatically extended
- `userFeedback`: 'easy-killer' | 'challenge' | 'neutral' | null
- `completedAt`: Date - when the set was finished

**Relationships**:
- Belongs to WorkoutSession (workoutSessionId)
- Has one IntensityScore
- References Exercise (exerciseId)

**Validation Rules**:
- actualReps must be ≥ 0
- strainAtStart and strainAtEnd must be 0-100
- wasAutoExtended = true when strainAtEnd > 85

### TempoData
Movement timing and quality data for tempo-controlled exercises.

**Fields**:
- `concentricTimeMs`: number - time for concentric phase
- `eccentricTimeMs`: number - time for eccentric phase  
- `pauseTimeMs`: number - time spent in paused position
- `totalTUT`: number - total time under tension
- `targetTempoPattern`: string - intended tempo (e.g., "3-1-2-1")
- `actualTempoPattern`: string - measured tempo pattern
- `tempoVariance`: number - deviation from target tempo
- `motionSmoothness`: number - smoothness score (0-100)
- `repConsistency`: number - consistency across reps (0-100)
- `isEccentricFirst`: boolean - whether movement started eccentric

**Relationships**:
- Belongs to WorkoutSet
- Used in IntensityScore calculation

**Validation Rules**:
- totalTUT = concentricTimeMs + eccentricTimeMs + pauseTimeMs
- tempoVariance within ±15% considered acceptable
- All time values must be positive

### SocialShare
Sharing settings and social features for workouts and supplements.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user sharing the content
- `contentType`: 'workout' | 'supplement_stack' | 'exercise_demo'
- `contentId`: string - ID of shared content
- `isPublic`: boolean - whether visible to all users
- `likesCount`: number - number of likes received
- `clusteredBy`: string[] - clustering criteria (goals, body feel, training age)
- `ghostMode`: boolean - anonymous sharing mode
- `sharedAt`: Date - when content was shared
- `lastInteraction`: Date - most recent like or comment

**Relationships**:
- Belongs to User (userId)
- References various content types by contentId

**Validation Rules**:
- Medical supplement information never included in shares
- ghostMode anonymizes user identification
- clusteredBy helps algorithm match similar users

## Data Flow Patterns

### Strain Calculation Flow
```
Device Sensors → LiveStrain Calculation → Strain Status → Intensity Modifier
```

### Intensity Scoring Flow
```  
Workout Set → Tempo Data → Component Scores → Strain Modifier → Final Intensity Score → Backend Storage
```

### AI Coaching Flow
```
LiveStrain + IntensityScore + User Context → AICoachingContext → Personalized Response
```

### Supplement Tracking Flow
```
Barcode Scan → OpenFoodFacts API → SupplementItem → SupplementStack → Performance Correlation
```

## State Transitions

### AICoachingContext Calibration
- `week1`: Full calibration for new exercises
- `active`: Normal coaching with minor adjustments  
- `complete`: Maintenance mode with minimal changes

### SupplementStack Lock Status
- `unlocked`: Initial state, can be modified
- `locked`: 28-day lock period after scanning
- `modification_allowed`: Brief unlock at week 4 for one change

### LiveStrain Status
- `green`: Strain ≤ 85% - normal workout intensity
- `yellow`: Strain 86-95% - moderate caution  
- `red`: Strain > 95% - auto-extend rest, reduce intensity

## Privacy & Security

### On-Device Data
- LiveStrain: Never stored permanently
- SupplementItem.fullText: Complete data on-device only
- Health sensor readings: Hashed/discarded after calculation

### Backend Data  
- IntensityScore: Raw scores for analysis
- SupplementStack: Public hashes only for non-Rx items
- SocialShare: Medical information filtered out

### User Control
- Data retention: 1-year with opt-out deletion
- Sharing preferences: Granular control over visibility
- Ghost mode: Anonymous participation option