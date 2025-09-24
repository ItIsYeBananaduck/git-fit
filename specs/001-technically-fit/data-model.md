# Data Model: Technically Fit

**Date**: September 24, 2025
**Version**: 1.0
**Storage**: Convex (real-time database)

## Overview

Technically Fit requires a flexible, real-time data model supporting user management, workout tracking, AI-driven personalization, marketplace functionality, and administrative oversight. The model prioritizes performance, type safety, and scalability while maintaining GDPR compliance.

## Core Entities

### User Entity

**Purpose**: Represents all user types (free, pro, trainer) with role-based access control

**Attributes**:

```typescript
interface User {
  id: string; // Convex ID
  email: string;
  username: string;
  role: "free" | "pro" | "trainer" | "admin";
  subscriptionStatus: "active" | "inactive" | "cancelled";
  subscriptionId?: string; // Stripe/Apple subscription ID
  preferences: UserPreferences;
  profile: UserProfile;
  wearableDevices: WearableDevice[];
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}
```

**Relationships**:

- One-to-many: User → Workouts
- One-to-many: User → NutritionLogs
- One-to-many: User → Programs (if trainer)
- Many-to-one: User → Trainer (if client)

**Indexes**:

- email (unique)
- role + subscriptionStatus
- createdAt (for analytics)

### UserPreferences Entity

**Purpose**: Stores AI learning data and user customization settings

```typescript
interface UserPreferences {
  id: string;
  userId: string;
  exercisePreferences: Record<string, string>; // e.g., {"deadlift": "rack-pull"}
  intensitySettings: {
    minRepPercentage: number; // default: 80
    restMultiplier: number; // default: 1.0
  };
  notificationSettings: {
    workoutReminders: boolean;
    progressUpdates: boolean;
    marketplaceOffers: boolean;
  };
  privacySettings: {
    dataSharing: boolean;
    analyticsOptIn: boolean;
    wearableSync: boolean;
  };
}
```

### Workout Entity

**Purpose**: Core workout tracking with real-time wearable data integration

```typescript
interface Workout {
  id: string;
  userId: string;
  name: string;
  exercises: Exercise[];
  startTime: Date;
  endTime?: Date;
  status: "active" | "completed" | "paused";
  wearableData: WearableDataPoint[];
  aiTweaks: AITweak[];
  totalVolume: number; // calculated
  notes?: string;
}
```

**Relationships**:

- Many-to-one: Workout → User
- One-to-many: Workout → Exercises
- One-to-many: Workout → AITweaks

### Exercise Entity

**Purpose**: Individual exercise tracking within workouts

```typescript
interface Exercise {
  id: string;
  workoutId: string;
  name: string;
  equipmentId?: string;
  sets: ExerciseSet[];
  targetReps: number;
  targetWeight?: number;
  restTime: number; // seconds
  notes?: string;
}
```

### ExerciseSet Entity

**Purpose**: Individual set tracking with performance metrics

```typescript
interface ExerciseSet {
  id: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  restTime: number; // actual rest taken
  hrData?: number[]; // heart rate during set
  spO2Data?: number[]; // blood oxygen during set
  completedAt: Date;
}
```

### WearableDataPoint Entity

**Purpose**: Time-series wearable data synchronized from devices

```typescript
interface WearableDataPoint {
  id: string;
  userId: string;
  workoutId?: string;
  deviceType: "apple_watch" | "fitbit" | "whoop" | "samsung" | "other";
  timestamp: Date;
  heartRate?: number;
  spO2?: number;
  activityType?: string;
  confidence: number; // 0-100
}
```

**Indexes**:

- userId + timestamp (time-series queries)
- workoutId + timestamp (workout-specific data)

### AITweak Entity

**Purpose**: Records of AI-driven workout adjustments with explanations

```typescript
interface AITweak {
  id: string;
  workoutId: string;
  exerciseId: string;
  tweakType:
    | "rest_extension"
    | "intensity_adjustment"
    | "exercise_substitution"
    | "set_modification";
  reason: string; // e.g., "HR > 150, extending rest by 30s"
  oldValue: any;
  newValue: any;
  confidence: number; // AI confidence 0-100
  userFeedback?: "accepted" | "rejected" | "modified";
  appliedAt: Date;
}
```

### NutritionLog Entity

**Purpose**: Food and nutrition tracking for holistic health monitoring

```typescript
interface NutritionLog {
  id: string;
  userId: string;
  date: Date;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number; // grams
  totalCarbs: number; // grams
  totalFat: number; // grams
  waterIntake: number; // ml
  notes?: string;
}
```

### Meal Entity

**Purpose**: Individual meal tracking within nutrition logs

```typescript
interface Meal {
  id: string;
  nutritionLogId: string;
  type: "breakfast" | "lunch" | "dinner" | "snack";
  foods: FoodItem[];
  time: Date;
}
```

### Program Entity

**Purpose**: Trainer-created workout programs for marketplace

```typescript
interface Program {
  id: string;
  trainerId: string;
  title: string;
  description: string;
  price: number; // cents
  currency: "usd";
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: number; // weeks
  workouts: ProgramWorkout[];
  tags: string[];
  status: "draft" | "published" | "archived";
  createdAt: Date;
  updatedAt: Date;
}
```

**Relationships**:

- Many-to-one: Program → User (trainer)
- One-to-many: Program → ProgramWorkouts
- Many-to-many: Program ↔ User (purchases)

### ProgramWorkout Entity

**Purpose**: Template workouts within programs

```typescript
interface ProgramWorkout {
  id: string;
  programId: string;
  week: number;
  day: number;
  name: string;
  exercises: ProgramExercise[];
  estimatedDuration: number; // minutes
}
```

### Equipment Entity

**Purpose**: Gym equipment catalog for workout planning

```typescript
interface Equipment {
  id: string;
  name: string;
  category: "free_weights" | "machines" | "bodyweight" | "cardio";
  muscleGroups: string[];
  instructions?: string;
  availability: "home" | "gym" | "both";
}
```

## Administrative Entities

### AdminAuditLog Entity

**Purpose**: Audit trail for administrative actions and security events

```typescript
interface AdminAuditLog {
  id: string;
  adminId: string;
  action: string;
  targetType: "user" | "program" | "content";
  targetId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}
```

### YouTubeContent Entity

**Purpose**: Curated YouTube content for AI training

```typescript
interface YouTubeContent {
  id: string;
  url: string;
  title: string;
  channel: string;
  duration: number; // seconds
  tags: string[];
  processed: boolean;
  addedBy: string; // admin ID
  addedAt: Date;
}
```

## Data Relationships Diagram

```
User (1) ──── (M) Workout
  │              │
  │              └── (M) Exercise
  │                     │
  │                     └── (M) ExerciseSet
  │
  ├── (M) NutritionLog
  │       │
  │       └── (M) Meal
  │
  ├── (M) Program (trainer only)
  │       │
  │       └── (M) ProgramWorkout
  │
  └── (M) WearableDataPoint

AdminAuditLog → User (admin actions)
YouTubeContent → User (admin curation)
```

## Data Validation Rules

### User Validation

- Email format validation
- Username uniqueness
- Role-based field requirements (e.g., trainers must have payment setup)
- Subscription status consistency

### Workout Validation

- Start time before end time
- Exercise sets logically ordered
- Wearable data within physiological ranges (HR 40-220, SpO2 70-100)

### AI Tweak Validation

- Confidence scores between 0-100
- Tweak types limited to defined enum
- User feedback validation

### Program Validation

- Positive pricing
- Valid difficulty levels
- Trainer role verification

## Performance Optimizations

### Indexing Strategy

- User queries: email, role, subscription status
- Time-series: userId + timestamp for wearable data
- Workouts: userId + date range for history
- Marketplace: price, difficulty, tags for filtering

### Caching Strategy

- User preferences cached in memory
- Recent workouts cached for quick access
- Equipment catalog cached globally
- AI tweak patterns cached for performance

### Data Archival

- Workout data archived after 2 years
- Nutrition logs archived after 1 year
- Audit logs retained indefinitely
- Wearable data aggregated for long-term trends

## Privacy & Compliance

### GDPR Compliance

- Data minimization: only collect necessary fields
- Consent tracking: explicit opt-in for each data type
- Right to deletion: cascade delete across all entities
- Data portability: JSON export functionality

### Data Retention

- Active user data: indefinite retention
- Inactive accounts: 2 years before anonymization
- Deleted accounts: 30 days before permanent removal
- Audit logs: 7 years minimum retention

## Migration Strategy

### Beta to Production

1. Add indexes for performance
2. Implement data partitioning for scale
3. Add backup and recovery procedures
4. Implement data encryption at rest

### Future Enhancements

- Add workout templates for programs
- Implement user progress analytics
- Add social features (following, sharing)
- Integrate with additional wearable brands

## Conclusion

This data model provides a solid foundation for Technically Fit, supporting all required features while maintaining performance, scalability, and compliance. The real-time nature of Convex enables live workout adjustments, while the structured relationships support complex marketplace and AI personalization features.
