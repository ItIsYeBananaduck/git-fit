# Data Model: Mobile UI Feature

## Core Entities

### User Profile
```typescript
interface UserProfile {
  id: string
  weight: number // stored in user's preferred unit
  unitPreference: 'imperial' | 'metric'
  fitnessGoal: 'weightLoss' | 'muscleGain' | 'maintenance' | 'powerlifting' | 'bodyBuilding'
  macroTargets: MacroTargets
  workoutPreferences: WorkoutPreferences
  trainerAssignments: TrainerAssignment[]
  privacySettings: PrivacySettings
  biometricEnabled: boolean
  createdAt: Date
  updatedAt: Date
}

interface MacroTargets {
  protein: number // grams
  carbs: number // grams  
  fat: number // grams
  calories: number
  proteinPerLb: number // for validation
}

interface WorkoutPreferences {
  preferredExercises: string[]
  dislikedExercises: string[]
  injuryHistory: InjuryRecord[]
  intensityPreference: 'low' | 'moderate' | 'high'
}

interface PrivacySettings {
  dataCollection: boolean
  trainerDataSharing: boolean
  analyticsOptIn: boolean
  dataRetentionDays: number // max 30 for deletion option
}
```

### UI State Management
```typescript
interface UIState {
  currentTheme: 'dark' // only dark theme supported
  currentScreen: ScreenType
  orbMode: 'activity' | 'nutrition'
  activeWorkout?: WorkoutSession
  selectedMealTime?: Date
  hapticEnabled: boolean
  animationsEnabled: boolean
}

interface ScreenType {
  name: 'home' | 'workout' | 'nutrition' | 'trainer' | 'settings' | 'onboarding'
  params?: Record<string, any>
}
```

### Workout Session (Extended)
```typescript
interface WorkoutSession {
  id: string
  userId: string
  exerciseList: Exercise[]
  currentExerciseIndex: number
  startTime: Date
  endTime?: Date
  status: 'planned' | 'active' | 'paused' | 'completed' | 'skipped'
  
  // Mobile UI specific
  intensityPercentage: number // 0-100 for intensity orb
  realTimeVitals: VitalStats
  userFeedback: WorkoutFeedback[]
  aiAdjustments: AIAdjustment[]
  
  // Performance tracking
  performanceMetrics: PerformanceMetrics
  completionRate: number
  difficultyRating?: number // 1-10 scale
}

interface WorkoutFeedback {
  timestamp: Date
  exerciseId: string
  setIndex: number
  reason: 'tired' | 'notFeelingIt' | 'formShaky' | 'pain' | 'hurtEarlier'
  painLevel?: number // 0-10 if reason is 'pain'
  painLocation?: string
}

interface VitalStats {
  heartRate?: number
  spO2?: number
  strain?: number // for strain ring display
  source: 'whoop' | 'appleWatch' | 'mock' | 'manual'
  timestamp: Date
}
```

### Nutrition Tracking (Extended)
```typescript
interface NutritionEntry {
  id: string
  userId: string
  foodItem: FoodItem
  quantity: number
  unit: string
  mealTime: Date
  
  // Mobile UI specific
  source: 'barcode' | 'search' | 'custom'
  barcodeData?: string
  customMacros?: MacroBreakdown
  
  // Timeline integration
  timelinePosition: number // 0-1 for horizontal timeline
  verified: boolean
}

interface FoodItem {
  id?: string // null for custom entries
  name: string
  brand?: string
  macrosPer100g: MacroBreakdown
  alternativeUnits?: UnitConversion[]
  
  // Custom food support
  isCustom: boolean
  userDefined?: boolean
}

interface MacroBreakdown {
  protein: number
  carbs: number
  fat: number
  calories: number
  fiber?: number
  sugar?: number
}
```

### Trainer-Client Relationship
```typescript
interface TrainerAssignment {
  id: string
  trainerId: string
  clientId: string
  status: 'pending' | 'active' | 'paused' | 'terminated'
  accessLevel: 'view' | 'edit' | 'full'
  
  // Mobile UI specific
  approvalDate?: Date
  biometricApprovalRequired: boolean
  dataVisibilitySettings: ClientDataVisibility
  
  // Session management
  activeSessions: TrainerSession[]
  sessionHistory: TrainerSession[]
  notes: TrainerNote[]
}

interface TrainerSession {
  id: string
  date: Date
  duration: number
  sessionType: 'workout' | 'consultation' | 'check-in'
  clientMetrics: ClientMetrics
  trainerObservations: TrainerNote[]
  
  // Calendar integration
  calendarEventId?: string
  sharedToCalendar: boolean
}

interface ClientDataVisibility {
  workoutData: boolean
  nutritionData: boolean
  vitalsData: boolean
  feedbackData: boolean
  progressPhotos: boolean
}
```

### Synchronization and Offline Support
```typescript
interface SyncState {
  lastSyncTime: Date
  pendingChanges: PendingChange[]
  conflictResolution: ConflictResolution[]
  offlineMode: boolean
}

interface PendingChange {
  id: string
  entityType: 'workout' | 'nutrition' | 'profile' | 'feedback'
  entityId: string
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: Date
  retryCount: number
}

interface ConflictResolution {
  id: string
  entityType: string
  entityId: string
  localVersion: any
  remoteVersion: any
  conflictFields: string[]
  resolution?: 'local' | 'remote' | 'merged' | 'userChoice'
  resolvedAt?: Date
}
```

## Entity Relationships

### Primary Relations
- **User Profile** 1:N **Workout Sessions**
- **User Profile** 1:N **Nutrition Entries**  
- **User Profile** N:M **Trainer Assignments** (via TrainerAssignment)
- **Workout Session** 1:N **Workout Feedback**
- **Nutrition Entry** N:1 **Food Item**

### Mobile-Specific Relations
- **UI State** 1:1 **User Profile** (session-based)
- **Sync State** 1:N **Pending Changes**
- **Trainer Assignment** 1:N **Trainer Sessions**
- **Vital Stats** N:1 **Workout Session**

## Validation Rules

### Macro Calculations
- Protein: 0.4g/lb minimum, 1.0-1.5g/lb maximum based on fitness goal
- Total calories: Must balance with macro distribution
- Unit conversions: Maintain precision to 2 decimal places

### Performance Constraints
- Workout intensity: 0-100% range
- Pain levels: 0-10 scale with mandatory location for >3
- Heart rate: 40-220 BPM realistic range
- Sync conflicts: Maximum 48-hour resolution window

### Data Integrity
- Offline changes: Maximum 7-day retention before forced sync
- Custom foods: Required macro validation before save
- Biometric sessions: Maximum 8-hour timeout for security

## State Transitions

### Workout Session States
```
planned → active → [paused ↔ active] → completed
planned → skipped
active → abandoned (if >30min inactive)
```

### Sync Conflict Resolution
```
detected → userPrompted → [resolved | deferred] → synchronized
deferred → autoRetry (3 attempts) → userPrompted
```

### Trainer Access Approval
```
requested → pendingApproval → [approved | denied]
approved → active → [paused | terminated]
```