# Data Model: Medical Screening & User Onboarding

**Feature**: Medical Screening & User Onboarding
**Created**: 2025-09-29
**Source**: Extracted from feature specification and existing infrastructure analysis

## Core Entities

### MedicalProfile
Comprehensive medical history and health information for safe training recommendations and liability protection.

**Fields**:
- `id`: string - unique identifier for the medical profile
- `userId`: string - user the medical profile belongs to
- `conditions`: ChronicCondition[] - array of chronic medical conditions
- `medications`: Medication[] - array of current medications
- `injuries`: InjuryHistory[] - array of past and current injuries
- `clearances`: MedicalClearance[] - array of medical clearances for high-risk conditions
- `riskLevel`: 'low' | 'moderate' | 'high' | 'requires-clearance' - calculated risk assessment
- `restrictions`: ExerciseRestriction[] - automatically generated exercise restrictions
- `emergencyContact`: EmergencyContact - emergency contact information
- `privacyConsent`: boolean - explicit consent for medical data collection
- `lastUpdated`: Date - when medical information was last updated
- `createdAt`: Date - when profile was first created

**Relationships**:
- Belongs to User (userId)
- Has many ChronicConditions
- Has many Medications  
- Has many InjuryHistories
- Has many MedicalClearances
- Generates ExerciseRestrictions for AI engine

**Validation Rules**:
- userId must reference valid user
- privacyConsent must be true before storing any medical data
- riskLevel must be recalculated whenever conditions/medications/injuries change
- emergencyContact required for high-risk users
- lastUpdated must be current timestamp on any profile changes

### ChronicCondition
Medical conditions that affect exercise safety and programming.

**Fields**:
- `id`: string - unique identifier
- `medicalProfileId`: string - reference to medical profile
- `type`: 'diabetes' | 'heart-disease' | 'hypertension' | 'arthritis' | 'asthma' | 'other' - condition type
- `severity`: 'mild' | 'moderate' | 'severe' - severity level
- `controlled`: boolean - whether condition is well-controlled
- `diagnosedDate`: Date | null - when condition was diagnosed
- `notes`: string - additional details about the condition
- `exerciseRestrictions`: string[] - specific exercise limitations
- `intensityLimit`: number | null - maximum intensity percentage (0-100)

**Relationships**:
- Belongs to MedicalProfile (medicalProfileId)
- Influences ExerciseRestrictions generation

**Validation Rules**:
- type must be from defined enum values
- severity affects automatic restriction generation
- controlled status influences risk level calculation
- exerciseRestrictions must be valid exercise type identifiers
- intensityLimit must be 0-100 if specified

### Medication
Current medications that may affect exercise safety or performance.

**Fields**:
- `id`: string - unique identifier
- `medicalProfileId`: string - reference to medical profile
- `name`: string - medication name
- `type`: 'blood-pressure' | 'diabetes' | 'heart' | 'pain' | 'other' - medication category
- `dosage`: string - dosage information
- `frequency`: string - how often medication is taken
- `sideEffects`: string[] - relevant side effects for exercise
- `exerciseInteractions`: string[] - exercise-related warnings
- `intensityWarnings`: boolean - whether medication affects exercise intensity

**Relationships**:
- Belongs to MedicalProfile (medicalProfileId)
- Affects exercise intensity recommendations

**Validation Rules**:
- name must not be empty
- type affects automatic restriction generation
- sideEffects must be from validated list
- exerciseInteractions used for workout safety warnings

### InjuryHistory
Past and current injuries affecting movement and exercise selection.

**Fields**:
- `id`: string - unique identifier
- `medicalProfileId`: string - reference to medical profile
- `bodyPart`: 'knee' | 'back' | 'shoulder' | 'ankle' | 'wrist' | 'hip' | 'elbow' | 'other' - affected body part
- `injuryType`: 'acute' | 'chronic' | 'surgical' | 'overuse' - type of injury
- `severity`: 'minor' | 'moderate' | 'major' - severity assessment
- `dateOccurred`: Date - when injury occurred
- `currentStatus`: 'recovered' | 'managing' | 'ongoing-pain' | 'rehabbing' - current status
- `painLevel`: number - current pain level (0-10 scale)
- `affectedMovements`: string[] - specific movements that cause pain/limitation
- `restrictions`: string[] - exercise restrictions due to injury
- `notes`: string - additional details about injury and limitations

**Relationships**:
- Belongs to MedicalProfile (medicalProfileId)
- Directly affects exercise selection in AI engine

**Validation Rules**:
- dateOccurred must be in the past
- painLevel must be 0-10
- currentStatus affects automatic restriction generation
- affectedMovements must be valid movement pattern identifiers
- restrictions automatically exclude contraindicated exercises

### MedicalClearance
Medical clearance documentation for high-risk users.

**Fields**:
- `id`: string - unique identifier
- `medicalProfileId`: string - reference to medical profile
- `conditionType`: string - condition requiring clearance
- `clearanceType`: 'general-exercise' | 'high-intensity' | 'resistance-training' | 'cardio' - type of clearance
- `providerName`: string - name of healthcare provider
- `providerCredentials`: string - provider credentials/license
- `issueDate`: Date - when clearance was issued
- `expirationDate`: Date - when clearance expires
- `restrictions`: string[] - any restrictions noted in clearance
- `documentUrl`: string | null - uploaded clearance document
- `status`: 'pending' | 'approved' | 'expired' | 'revoked' - clearance status
- `notes`: string - additional notes from provider

**Relationships**:
- Belongs to MedicalProfile (medicalProfileId)
- Required for high-risk condition access to certain activities

**Validation Rules**:
- issueDate must be in the past
- expirationDate must be after issueDate
- status affects exercise access permissions
- documentUrl should be provided for verification
- expired clearances automatically revoke exercise access

### FitnessGoals
Comprehensive fitness goal assessment with priority weighting and specific targets.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user the goals belong to
- `primaryGoal`: 'strength' | 'endurance' | 'weight-loss' | 'muscle-gain' | 'sport-specific' | 'general-fitness' - main objective
- `secondaryGoals`: string[] - additional goals in priority order
- `targetTimeframe`: 'short-term' | 'medium-term' | 'long-term' - 3, 6, or 12+ months
- `specificTargets`: PerformanceTarget[] - measurable goal targets
- `motivations`: string[] - reasons for pursuing fitness goals
- `barriers`: string[] - identified obstacles to success
- `priorityWeights`: Record<string, number> - goal priority percentages (sum to 100)
- `previousExperience`: string - prior experience with similar goals
- `successMetrics`: string[] - how user defines success

**Relationships**:
- Belongs to User (userId)
- Has many PerformanceTargets
- Influences TrainingSplit recommendations

**Validation Rules**:
- primaryGoal must be defined
- priorityWeights must sum to 100
- specificTargets must have measurable criteria
- targetTimeframe affects training split selection

### PerformanceTarget
Specific, measurable targets within fitness goals.

**Fields**:
- `id`: string - unique identifier
- `fitnessGoalsId`: string - reference to fitness goals
- `type`: 'weight-loss' | 'strength-gain' | 'endurance' | 'body-composition' | 'performance' - target category
- `current`: number - current measurement/performance
- `target`: number - desired measurement/performance
- `unit`: string - measurement unit (lbs, kg, minutes, etc.)
- `deadline`: Date | null - target achievement date
- `priority`: 'high' | 'medium' | 'low' - target priority
- `trackingMethod`: string - how progress will be measured
- `milestones`: Milestone[] - intermediate targets

**Relationships**:
- Belongs to FitnessGoals (fitnessGoalsId)
- Has many Milestones

**Validation Rules**:
- target must be different from current
- deadline must be in the future if specified
- trackingMethod must be realistic and measurable
- milestones should progress logically toward target

### UserExperience
Assessment of user's fitness experience, capabilities, and preferences.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user the experience profile belongs to
- `fitnessLevel`: 'beginner' | 'intermediate' | 'advanced' | 'elite' - overall fitness classification
- `yearsTraining`: number - years of consistent training experience
- `familiarExercises`: ExerciseType[] - exercises user is comfortable performing
- `preferredIntensity`: 'low' | 'moderate' | 'high' | 'variable' - preferred workout intensity
- `recoveryNeeds`: 'minimal' | 'standard' | 'extended' - recovery requirements
- `trainingPreferences`: TrainingPreference[] - preferred training styles and methods
- `injuryHistory`: boolean - whether user has significant injury history
- `competitionExperience`: string | null - competitive athletics background
- `coachingExperience`: string | null - previous coaching or instruction

**Relationships**:
- Belongs to User (userId)
- Influences TrainingSplit recommendations
- Connected to TimeAvailability

**Validation Rules**:
- yearsTraining must be >= 0
- fitnessLevel should align with yearsTraining and familiarExercises
- preferredIntensity affects workout programming
- recoveryNeeds influences training frequency

### TimeAvailability
User's available time and schedule preferences for training.

**Fields**:
- `id`: string - unique identifier
- `userExperienceId`: string - reference to user experience
- `daysPerWeek`: number - days available for training (1-7)
- `minutesPerSession`: number - typical workout duration
- `preferredTimes`: string[] - preferred workout times
- `scheduleFlexibility`: 'rigid' | 'moderate' | 'flexible' - schedule adaptability
- `timeConstraints`: string[] - specific time limitations
- `consistencyRating`: number - ability to maintain regular schedule (1-10)

**Relationships**:
- Belongs to UserExperience (userExperienceId)
- Critical for TrainingSplit selection

**Validation Rules**:
- daysPerWeek must be 1-7
- minutesPerSession must be > 0
- preferredTimes must be valid time formats
- consistencyRating must be 1-10

### EquipmentProfile
Available equipment and training environment assessment.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user the equipment profile belongs to
- `primaryLocation`: 'home' | 'gym' | 'outdoor' | 'multiple' - main training location
- `availableEquipment`: EquipmentType[] - accessible equipment
- `spaceConstraints`: SpaceConstraint[] - physical space limitations
- `budget`: number | null - available budget for equipment
- `equipmentCondition`: Record<string, string> - condition of owned equipment
- `accessLimitations`: string[] - restrictions on equipment use
- `preferredEquipment`: string[] - equipment user enjoys using

**Relationships**:
- Belongs to User (userId)
- Has many EquipmentTypes
- Influences exercise selection in workouts

**Validation Rules**:
- primaryLocation affects exercise recommendations
- availableEquipment determines possible exercises
- budget influences equipment upgrade suggestions
- accessLimitations affect workout scheduling

### TrainingSplit
Recommended training program structure based on user profile.

**Fields**:
- `id`: string - unique identifier
- `name`: string - training split name
- `description`: string - detailed split description
- `daysPerWeek`: number - training frequency
- `sessionDuration`: number - typical session length in minutes
- `difficulty`: 'beginner' | 'intermediate' | 'advanced' - complexity level
- `primaryGoals`: string[] - goals this split targets
- `requiredEquipment`: EquipmentType[] - necessary equipment
- `contraindications`: string[] - medical conditions that exclude this split
- `weeklyStructure`: WorkoutDay[] - week structure and focus
- `progressionPlan`: ProgressionPhase[] - how split evolves over time
- `estimatedResults`: ResultTimeline[] - expected outcomes and timeframes

**Relationships**:
- Selected by Users (many-to-many)
- Has many WorkoutDays
- Has many ProgressionPhases

**Validation Rules**:
- daysPerWeek must match weeklyStructure length
- sessionDuration should align with user time availability
- contraindications automatically filter for medical conditions
- progressionPlan must show logical advancement

### WorkoutDay
Individual day structure within a training split.

**Fields**:
- `id`: string - unique identifier
- `trainingSplitId`: string - reference to training split
- `dayNumber`: number - day in weekly structure (1-7)
- `name`: string - workout day name (e.g., "Push Day", "Legs")
- `muscleGroups`: string[] - primary muscle groups targeted
- `exerciseTypes`: string[] - types of exercises included
- `estimatedDuration`: number - expected workout duration
- `intensity`: 'low' | 'moderate' | 'high' - workout intensity level
- `requiredEquipment`: EquipmentType[] - equipment needed for this day
- `warmupDuration`: number - recommended warmup time
- `cooldownDuration`: number - recommended cooldown time

**Relationships**:
- Belongs to TrainingSplit (trainingSplitId)
- Defines structure for daily workout generation

**Validation Rules**:
- dayNumber must be 1-7
- estimatedDuration includes warmup and cooldown
- muscleGroups must be valid anatomical targets
- intensity affects exercise selection and volume

### OnboardingProgress
Tracking user progress through the onboarding flow.

**Fields**:
- `id`: string - unique identifier
- `userId`: string - user completing onboarding
- `currentStep`: 'medical' | 'goals' | 'experience' | 'equipment' | 'split-selection' | 'review' | 'complete' - current step
- `completedSteps`: string[] - steps successfully completed
- `stepProgress`: Record<string, number> - completion percentage for each step
- `medicalCompleted`: boolean - medical screening completed
- `goalsCompleted`: boolean - fitness goals defined
- `experienceCompleted`: boolean - experience assessment done
- `equipmentCompleted`: boolean - equipment profile created
- `splitSelected`: boolean - training split chosen
- `startedAt`: Date - when onboarding began
- `lastActiveAt`: Date - last interaction timestamp
- `estimatedTimeRemaining`: number - minutes to completion
- `dropoffRisk`: 'low' | 'medium' | 'high' - calculated dropout risk

**Relationships**:
- Belongs to User (userId)
- Tracks completion of all onboarding entities

**Validation Rules**:
- currentStep must progress logically through flow
- completedSteps array must match boolean completion flags
- stepProgress percentages must be 0-100
- estimatedTimeRemaining based on remaining steps

## State Transitions

### Medical Profile States
1. Created (privacy consent) → In Progress → Risk Assessment → Clearance Required/Approved
2. Low/Moderate Risk → Direct approval for exercise
3. High Risk → Medical clearance required before high-intensity access
4. Updates trigger risk recalculation and possible clearance re-requirement

### Onboarding Flow States
1. Started → Medical Screening → Goals → Experience → Equipment → Split Selection → Review → Complete
2. Each step validates and saves progress before advancing
3. Users can return to previous steps to modify information
4. Split selection triggers integration with AI training engine

### Training Split Lifecycle
1. Recommended based on profile → Selected by user → Active program → Progress evaluation
2. 4-week evaluation periods trigger effectiveness assessment
3. Poor progress may recommend split modification or change
4. User profile changes trigger split re-evaluation

## Data Integrity Rules

### Cross-Entity Validation
- MedicalProfile risk level must align with assigned restrictions
- TrainingSplit selection must respect medical contraindications
- EquipmentProfile must support selected TrainingSplit requirements
- FitnessGoals must be achievable within UserExperience capabilities

### Security and Privacy
- All medical data encrypted with AES-256 before database storage
- Medical data access logged with audit trail for HIPAA compliance
- Privacy consent required before any medical data collection
- Medical clearance documents encrypted and access-controlled

### Data Retention
- Medical profiles retained per HIPAA requirements (minimum 6 years)
- Onboarding progress deleted after successful completion (privacy)
- Training split effectiveness data retained for improvement analytics
- Medical clearances archived after expiration but not deleted

### Business Rules Integration
- High-risk medical conditions automatically require clearance
- Equipment limitations automatically filter exercise recommendations
- Time availability constrains training split recommendations
- Experience level determines exercise complexity and progression rate