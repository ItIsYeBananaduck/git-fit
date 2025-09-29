# Feature Specification: Medical Screening & User Onboarding

**Feature Branch**: `007-medical-screening-onboarding`
**Created**: September 29, 2025
**Status**: Active
**Priority**: High - Essential for production safety and liability protection

## Overview

Comprehensive medical screening and user onboarding system that ensures safe training recommendations while collecting necessary health information for liability protection. The system guides users through health questionnaires, identifies medical conditions and injuries, establishes fitness goals, and recommends appropriate training splits based on their profile.

## User Scenarios & Testing

### Primary User Story

A new user signs up for Adaptive fIt and is guided through a comprehensive onboarding flow that includes medical screening (injury history, chronic conditions, medications), fitness goal identification (strength, endurance, body composition), experience assessment, and equipment availability. Based on their responses, the system recommends an appropriate training split and establishes safety parameters for AI-driven workout adjustments.

### Acceptance Scenarios

1. **Given** a new user with diabetes, **When** they complete medical screening, **Then** the system flags their condition and applies appropriate exercise modifications (no fasting workouts, blood sugar monitoring reminders).

2. **Given** a user with a previous knee injury, **When** they select their injury history, **Then** the system excludes high-impact knee exercises and suggests alternatives (leg press instead of squats).

3. **Given** a beginner user with weight loss goals, **When** they complete onboarding, **Then** the system recommends a 3-day full body split with cardio integration.

4. **Given** an experienced powerlifter, **When** they complete onboarding, **Then** the system recommends a 5-day specialized split (squat/bench/deadlift focus) with advanced periodization.

5. **Given** a user who skips medical screening, **When** they try to access workouts, **Then** the system requires completion before proceeding with liability protection.

### Edge Cases

- User reports multiple conflicting conditions (diabetes + heart disease + previous injury)
- User lies about experience level or medical conditions
- User updates medical information mid-program
- Minor users (under 18) requiring parental consent
- Users with language barriers or accessibility needs

## Requirements

### Functional Requirements

**Medical Screening**
- **MS-001**: System MUST collect comprehensive medical history including chronic conditions (diabetes, heart disease, hypertension), current medications, and injury history with affected body parts and severity.
- **MS-002**: System MUST flag high-risk conditions and require medical clearance before allowing high-intensity workouts (heart conditions, uncontrolled diabetes, recent surgeries).
- **MS-003**: System MUST store medical information with HIPAA-compliant encryption and access controls.
- **MS-004**: System MUST allow users to update medical information and trigger safety parameter recalculation.
- **MS-005**: System MUST integrate medical flags with AI workout generation to exclude contraindicated exercises.

**Goal Identification**
- **GI-001**: System MUST assess primary fitness goals (strength, endurance, weight loss, muscle gain, sport-specific) with priority weighting.
- **GI-002**: System MUST evaluate current fitness level through self-assessment and optional performance tests.
- **GI-003**: System MUST determine available training time (days per week, session duration) and equipment access.
- **GI-004**: System MUST identify specific preferences (exercise types, training style, recovery needs).

**Training Split Recommendation**
- **TR-001**: System MUST recommend training splits based on goals, experience, time availability, and medical restrictions.
- **TR-002**: System MUST provide 3-5 split options with clear explanations of benefits and requirements.
- **TR-003**: System MUST allow users to preview split details (exercise types, weekly schedule, intensity) before selection.
- **TR-004**: System MUST enable split modification based on user feedback and constraints.
- **TR-005**: System MUST track split effectiveness and suggest adjustments after 4-week periods.

**Educational Content**
- **ED-001**: System MUST provide educational content explaining exercise safety, proper form, and injury prevention.
- **ED-002**: System MUST offer split comparison interface showing pros/cons of different training approaches.
- **ED-003**: System MUST include exercise demonstration videos/images for all recommended movements.
- **ED-004**: System MUST provide nutrition basics education integrated with training recommendations.

**Onboarding Flow**
- **OF-001**: System MUST guide users through logical progression: medical → goals → experience → equipment → split selection.
- **OF-002**: System MUST save progress at each step and allow users to resume incomplete onboarding.
- **OF-003**: System MUST provide estimated completion time (10-15 minutes) and progress indicators.
- **OF-004**: System MUST validate all required fields before allowing progression to next step.
- **OF-005**: System MUST generate user profile summary for review before finalizing onboarding.

### Non-Functional Requirements

**Performance**
- **NF-001**: Onboarding flow MUST complete within 2 seconds per step with smooth transitions.
- **NF-002**: Medical screening validation MUST execute within 500ms to provide real-time feedback.
- **NF-003**: Training split recommendations MUST generate within 3 seconds with explanation.

**Security & Privacy**
- **NF-004**: Medical data MUST be encrypted at rest using AES-256 and in transit using TLS 1.3.
- **NF-005**: Medical information access MUST be logged with audit trail for compliance.
- **NF-006**: User MUST explicitly consent to medical data collection with clear privacy notice.

**Usability**
- **NF-007**: Onboarding MUST be accessible to users with disabilities (WCAG 2.1 AA compliance).
- **NF-008**: Interface MUST support multiple languages (English, Spanish initially).
- **NF-009**: Mobile interface MUST be optimized for one-handed use with large touch targets.

**Reliability**
- **NF-010**: System MUST handle onboarding completion failure gracefully with automatic resume.
- **NF-011**: Medical screening MUST validate data integrity and flag incomplete/inconsistent responses.

## Key Entities

### MedicalProfile
```typescript
interface MedicalProfile {
  userId: string;
  conditions: ChronicCondition[];
  medications: Medication[];
  injuries: InjuryHistory[];
  clearances: MedicalClearance[];
  riskLevel: 'low' | 'moderate' | 'high' | 'requires-clearance';
  lastUpdated: Date;
  privacyConsent: boolean;
}

interface ChronicCondition {
  type: 'diabetes' | 'heart-disease' | 'hypertension' | 'arthritis' | 'other';
  severity: 'mild' | 'moderate' | 'severe';
  controlled: boolean;
  notes: string;
  diagnosedDate?: Date;
}

interface InjuryHistory {
  bodyPart: 'knee' | 'back' | 'shoulder' | 'ankle' | 'wrist' | 'other';
  type: 'acute' | 'chronic' | 'surgical';
  severity: 'minor' | 'moderate' | 'major';
  dateOccurred: Date;
  currentStatus: 'recovered' | 'managing' | 'ongoing-pain';
  restrictions: string[];
  notes: string;
}
```

### FitnessGoals
```typescript
interface FitnessGoals {
  userId: string;
  primaryGoal: 'strength' | 'endurance' | 'weight-loss' | 'muscle-gain' | 'sport-specific';
  secondaryGoals: string[];
  targetTimeframe: 'short-term' | 'medium-term' | 'long-term'; // 3, 6, 12 months
  specificTargets: PerformanceTarget[];
  motivations: string[];
  barriers: string[];
}

interface PerformanceTarget {
  type: 'weight-loss' | 'strength-gain' | 'endurance' | 'body-composition';
  current: number;
  target: number;
  unit: string;
  deadline?: Date;
}
```

### UserExperience
```typescript
interface UserExperience {
  userId: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
  yearsTraining: number;
  familiarExercises: ExerciseType[];
  preferredIntensity: 'low' | 'moderate' | 'high' | 'variable';
  recoveryNeeds: 'standard' | 'extended' | 'minimal';
  timeAvailability: {
    daysPerWeek: number;
    minutesPerSession: number;
    preferredTimes: string[];
  };
  equipmentAccess: EquipmentProfile;
}

interface EquipmentProfile {
  location: 'home' | 'gym' | 'both';
  available: EquipmentType[];
  limitations: string[];
  budget: number;
}
```

### TrainingSplit
```typescript
interface TrainingSplit {
  id: string;
  name: string;
  description: string;
  daysPerWeek: number;
  sessionDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  primaryGoals: string[];
  requiredEquipment: EquipmentType[];
  contraindications: string[];
  weeklyStructure: WorkoutDay[];
  progressionPlan: ProgressionPhase[];
}

interface WorkoutDay {
  dayNumber: number;
  name: string;
  muscleGroups: string[];
  exerciseTypes: string[];
  estimatedDuration: number;
  intensity: 'low' | 'moderate' | 'high';
}
```

### OnboardingProgress
```typescript
interface OnboardingProgress {
  userId: string;
  currentStep: 'medical' | 'goals' | 'experience' | 'equipment' | 'split-selection' | 'review' | 'complete';
  completedSteps: string[];
  medicalCompleted: boolean;
  goalsCompleted: boolean;
  experienceCompleted: boolean;
  equipmentCompleted: boolean;
  splitSelected: boolean;
  startedAt: Date;
  lastActiveAt: Date;
  estimatedTimeRemaining: number;
}
```

## API Contracts

### Medical Screening Endpoints

```typescript
// POST /api/onboarding/medical
interface MedicalScreeningRequest {
  conditions: ChronicCondition[];
  medications: Medication[];
  injuries: InjuryHistory[];
  emergencyContact: EmergencyContact;
  privacyConsent: boolean;
}

interface MedicalScreeningResponse {
  riskLevel: 'low' | 'moderate' | 'high' | 'requires-clearance';
  recommendedActions: string[];
  restrictions: ExerciseRestriction[];
  nextStep: 'continue' | 'medical-clearance-required';
}

// PUT /api/onboarding/medical/{userId}
// GET /api/onboarding/medical/{userId}
```

### Goal Setting Endpoints

```typescript
// POST /api/onboarding/goals
interface GoalSettingRequest {
  primaryGoal: string;
  secondaryGoals: string[];
  targetTimeframe: string;
  specificTargets: PerformanceTarget[];
  motivations: string[];
  barriers: string[];
}

interface GoalSettingResponse {
  goalsProfile: FitnessGoals;
  recommendedApproaches: TrainingApproach[];
  estimatedTimeline: Timeline;
}
```

### Training Split Recommendation Endpoints

```typescript
// POST /api/onboarding/recommend-splits
interface SplitRecommendationRequest {
  medicalProfile: MedicalProfile;
  goals: FitnessGoals;
  experience: UserExperience;
  equipmentAccess: EquipmentProfile;
}

interface SplitRecommendationResponse {
  recommendedSplits: TrainingSplit[];
  reasoning: SplitReasoning[];
  alternatives: TrainingSplit[];
  customizationOptions: CustomizationOption[];
}

// POST /api/onboarding/select-split
interface SplitSelectionRequest {
  splitId: string;
  customizations: SplitCustomization[];
}

// GET /api/onboarding/progress/{userId}
```

## Business Rules

### Medical Screening Rules
1. **High-Risk Conditions**: Heart disease, uncontrolled diabetes, recent surgery require medical clearance
2. **Injury Restrictions**: Active injuries automatically exclude affected movement patterns
3. **Medication Interactions**: Blood pressure medications trigger automatic intensity caps
4. **Age Restrictions**: Users under 18 require parental consent; over 65 require additional screening

### Goal-Based Recommendations
1. **Weight Loss**: Prioritize higher volume, moderate intensity, cardio integration
2. **Strength**: Focus on compound movements, progressive overload, adequate recovery
3. **Endurance**: Emphasize cardio base building, metabolic conditioning, recovery management
4. **Muscle Gain**: Hypertrophy protocols, sufficient volume, nutrition integration

### Experience-Based Customization
1. **Beginners**: Start with bodyweight/machines, focus on form, gradual progression
2. **Intermediate**: Introduce free weights, periodization, specialty exercises
3. **Advanced**: Complex movements, advanced techniques, individualized programming

## Integration Points

### Existing Systems
- **User Authentication**: Integrate with existing auth system
- **Convex Database**: Store all onboarding data in existing schema
- **AI Training Engine**: Feed medical restrictions and goals into workout generation
- **Nutrition AI**: Coordinate dietary recommendations with fitness goals
- **Wearable Integration**: Use medical flags to set safety thresholds

### External Services
- **Medical Clearance**: Optional integration with telehealth providers
- **Educational Content**: YouTube API for exercise demonstrations
- **Translation Services**: Support for multiple languages
- **Analytics**: Track onboarding completion rates and drop-off points

## Success Metrics

### Completion Rates
- **Primary**: >90% of users complete medical screening
- **Secondary**: >85% complete full onboarding flow
- **Time**: Average completion time <15 minutes

### Safety Metrics
- **Zero Tolerance**: No exercise-related injuries from contraindicated movements
- **Compliance**: 100% medical flag adherence in workout generation
- **Updates**: >50% of users update medical info when prompted

### Recommendation Accuracy
- **Split Satisfaction**: >80% user satisfaction with recommended splits
- **Goal Alignment**: >90% correlation between goals and generated workouts
- **Retention**: Users who complete onboarding have 40% higher retention

## Implementation Phases

### Phase 1: Medical Screening Foundation (Week 1-2)
- Core medical screening questionnaire
- Risk assessment algorithm
- Basic data storage and validation
- Safety flag integration with AI engine

### Phase 2: Goal Identification & Experience Assessment (Week 3)
- Fitness goal questionnaire
- Experience level assessment
- Equipment availability survey
- Time and preference collection

### Phase 3: Training Split Recommendation Engine (Week 4-5)
- Split recommendation algorithm
- Comparison interface
- Selection and customization
- Integration with workout generation

### Phase 4: Educational Content & Polish (Week 6)
- Exercise demonstration integration
- Educational content delivery
- Onboarding flow optimization
- Analytics and monitoring

## Risk Mitigation

### Medical Liability
- Clear disclaimers about medical advice limitations
- Mandatory medical clearance for high-risk users
- Comprehensive documentation of all safety measures
- Regular review of safety protocols with medical advisors

### Data Privacy
- HIPAA-compliant data handling procedures
- Clear consent mechanisms with granular controls
- Data minimization and retention policies
- Regular security audits and penetration testing

### User Experience
- Progressive disclosure to avoid overwhelming users
- Multiple save points to prevent data loss
- Clear error messages and recovery paths
- Extensive usability testing with diverse user groups

---

**Dependencies**: User authentication system, Convex database, AI training engine, basic UI components
**Estimated Effort**: 6-8 weeks (2 developers)
**Success Criteria**: >90% onboarding completion, zero safety violations, >80% user satisfaction