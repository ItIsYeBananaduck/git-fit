# Data Model: Advanced Wearable Integration

**Branch**: `010-advanced-wearable-integration` | **Generated**: 2025-09-29 | **Based on**: [plan.md](./plan.md)

**ENHANCEMENT APPROACH**: Building on existing wearable data infrastructure with comprehensive multi-device support and advanced health metrics.

## Core Data Architecture

### Device Management Schema

```typescript
// Enhanced from existing device management
interface WearableDevice {
  id: string;                          // Unique device identifier
  userId: string;                      // User association
  deviceType: WearableDeviceType;      // Device manufacturer and model
  name: string;                        // User-assigned device name
  status: DeviceConnectionStatus;      // Current connection state
  capabilities: DeviceCapabilities;    // Supported features and metrics
  qualityScore: number;                // Device reliability score (0-100)
  priority: number;                    // Data selection priority (1-10)
  
  // Authentication and connectivity
  authToken?: string;                  // OAuth token (encrypted)
  refreshToken?: string;               // OAuth refresh token (encrypted)
  lastConnected: number;               // Unix timestamp
  connectionHealth: ConnectionHealth;  // Connection quality metrics
  
  // Device-specific configuration
  settings: DeviceSettings;            // Device-specific preferences
  calibration: CalibrationProfile;     // Device accuracy calibration
  
  // Metadata
  firmwareVersion?: string;            // Device firmware version
  batteryLevel?: number;               // Current battery percentage
  createdAt: number;                   // Registration timestamp
  updatedAt: number;                   // Last modification timestamp
}

enum WearableDeviceType {
  APPLE_WATCH = "apple_watch",
  FITBIT = "fitbit",                   // Existing integration
  WHOOP = "whoop",                     // Existing integration  
  GARMIN = "garmin",
  SAMSUNG_GALAXY_WATCH = "samsung_galaxy_watch",
  POLAR = "polar",
  OURA_RING = "oura_ring",
  SAMSUNG_HEALTH = "samsung_health",
  GOOGLE_FIT = "google_fit"
}

enum DeviceConnectionStatus {
  CONNECTED = "connected",
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  ERROR = "error",
  PAIRING = "pairing",
  SYNCING = "syncing"
}

interface DeviceCapabilities {
  heartRate: boolean;                  // Real-time HR monitoring
  steps: boolean;                      // Step counting
  sleep: boolean;                      // Sleep tracking
  workouts: boolean;                   // Exercise detection
  hrv: boolean;                        // Heart rate variability
  spo2: boolean;                       // Blood oxygen monitoring
  stress: boolean;                     // Stress detection
  bodyComposition: boolean;            // Weight, body fat, muscle mass
  respiratory: boolean;                // Breathing rate
  temperature: boolean;                // Body temperature
  altitude: boolean;                   // Elevation tracking
  gps: boolean;                        // Location tracking
  menstrualCycle: boolean;             // Cycle tracking
  realTimeUpdates: boolean;            // <5s data latency
  offlineSync: boolean;                // Offline data storage
}

interface ConnectionHealth {
  latency: number;                     // Average data latency (ms)
  reliability: number;                 // Connection success rate (0-100)
  dataQuality: number;                 // Data accuracy score (0-100)
  syncFrequency: number;               // Successful syncs per hour
  lastSyncDuration: number;            // Last sync time (ms)
  errorCount: number;                  // Recent error count
  batteryImpact: number;               // Battery drain score (0-100)
}
```

### Advanced Health Metrics Schema

```typescript
// Comprehensive health data collection
interface HealthMetric {
  id: string;                          // Unique metric identifier
  userId: string;                      // User association
  deviceId: string;                    // Source device
  metricType: HealthMetricType;        // Type of health measurement
  value: number | HealthMetricValue;   // Metric value or complex data
  unit: string;                        // Measurement unit
  timestamp: number;                   // Unix timestamp (UTC)
  
  // Data quality and validation
  quality: DataQuality;                // Quality assessment
  confidence: number;                  // Confidence score (0-100)
  validated: boolean;                  // Passed validation checks
  outlier: boolean;                    // Flagged as outlier
  
  // Context and correlation
  context: MetricContext;              // Collection context
  correlationId?: string;              // Related metric group
  workoutId?: string;                  // Associated workout session
  sleepSessionId?: string;             // Associated sleep session
  
  // Metadata
  rawData?: any;                       // Original device data
  processed: boolean;                  // Processed by algorithms
  syncedAt: number;                    // Sync timestamp
}

enum HealthMetricType {
  // Cardiovascular
  HEART_RATE = "heart_rate",
  HRV_RMSSD = "hrv_rmssd",
  HRV_SDNN = "hrv_sdnn",
  BLOOD_PRESSURE = "blood_pressure",
  SPO2 = "spo2",
  
  // Activity and movement
  STEPS = "steps",
  DISTANCE = "distance",
  CALORIES_BURNED = "calories_burned",
  ACTIVE_MINUTES = "active_minutes",
  STAIRS_CLIMBED = "stairs_climbed",
  
  // Sleep and recovery
  SLEEP_DURATION = "sleep_duration",
  SLEEP_EFFICIENCY = "sleep_efficiency",
  SLEEP_STAGE = "sleep_stage",
  RECOVERY_SCORE = "recovery_score",
  READINESS_SCORE = "readiness_score",
  
  // Stress and mental health
  STRESS_LEVEL = "stress_level",
  ANS_BALANCE = "ans_balance",
  MEDITATION_MINUTES = "meditation_minutes",
  
  // Body composition
  WEIGHT = "weight",
  BODY_FAT_PERCENTAGE = "body_fat_percentage",
  MUSCLE_MASS = "muscle_mass",
  BONE_DENSITY = "bone_density",
  BMI = "bmi",
  
  // Respiratory
  RESPIRATORY_RATE = "respiratory_rate",
  BREATHING_PATTERN = "breathing_pattern",
  
  // Environmental and context
  BODY_TEMPERATURE = "body_temperature",
  SKIN_TEMPERATURE = "skin_temperature",
  ALTITUDE = "altitude",
  AMBIENT_TEMPERATURE = "ambient_temperature",
  HUMIDITY = "humidity",
  
  // Women's health
  MENSTRUAL_CYCLE_PHASE = "menstrual_cycle_phase",
  CYCLE_DAY = "cycle_day",
  SYMPTOMS = "symptoms",
  
  // Workout specific
  WORKOUT_INTENSITY = "workout_intensity",
  TRAINING_LOAD = "training_load",
  POWER_OUTPUT = "power_output",
  PACE = "pace",
  CADENCE = "cadence"
}

interface HealthMetricValue {
  primary: number;                     // Primary value
  secondary?: number;                  // Secondary value (e.g., diastolic BP)
  category?: string;                   // Categorical data (e.g., sleep stage)
  range?: [number, number];            // Value range
  trend?: TrendDirection;              // Trend indicator
}

interface DataQuality {
  accuracy: number;                    // Accuracy score (0-100)
  completeness: number;                // Data completeness (0-100)
  consistency: number;                 // Cross-device consistency (0-100)
  timeliness: number;                  // Data freshness score (0-100)
  deviceReliability: number;           // Source device reliability (0-100)
  validationsPassed: string[];         // Passed validation checks
  validationsFailed: string[];         // Failed validation checks
}

interface MetricContext {
  activityType?: ActivityType;         // Current activity
  location?: LocationContext;          // Location information
  weather?: WeatherContext;            // Weather conditions
  userState?: UserState;               // User's current state
  deviceState?: DeviceState;           // Device condition during measurement
}
```

### Workout Integration Schema

```typescript
// Enhanced workout data with multi-device support
interface WorkoutSession {
  id: string;                          // Existing workout session ID
  userId: string;                      // User association
  
  // Enhanced device data collection
  primaryDevice: string;               // Primary data source device
  connectedDevices: string[];          // All connected devices during workout
  deviceMetrics: DeviceWorkoutMetrics[]; // Device-specific data
  
  // Real-time workout optimization
  realTimeAdjustments: WorkoutAdjustment[]; // AI-driven adjustments
  intensityRecommendations: IntensityRecommendation[]; // Real-time intensity guidance
  
  // Advanced health monitoring
  healthAlerts: HealthAlert[];         // Health-based alerts during workout
  safetyChecks: SafetyCheck[];         // Safety monitoring results
  
  // Enhanced metrics
  averageHRV: number;                  // Average HRV during workout
  stressLevels: number[];              // Stress progression during workout
  spo2Readings: number[];              // Blood oxygen levels
  respiratoryRate: number[];           // Breathing patterns
  
  // Data quality and validation
  dataQuality: WorkoutDataQuality;     // Overall data quality assessment
  conflictResolutions: ConflictResolution[]; // Multi-device conflict handling
}

interface DeviceWorkoutMetrics {
  deviceId: string;                    // Source device
  deviceType: WearableDeviceType;      // Device type
  priority: number;                    // Data priority level
  
  // Device-specific metrics
  heartRateData: TimestampedValue[];   // Real-time HR data
  hrvData: TimestampedValue[];         // HRV measurements
  spo2Data: TimestampedValue[];        // Blood oxygen data
  stressData: TimestampedValue[];      // Stress indicators
  temperatureData: TimestampedValue[]; // Body temperature
  
  // Data quality per device
  dataQuality: DeviceDataQuality;      // Device-specific quality
  connectionHealth: ConnectionHealth;  // Connection status during workout
  batteryUsage: number;                // Battery drain during session
}

interface WorkoutAdjustment {
  timestamp: number;                   // When adjustment was made
  trigger: AdjustmentTrigger;          // What triggered the adjustment
  adjustmentType: AdjustmentType;      // Type of adjustment
  previousValue: number;               // Original value
  newValue: number;                    // Adjusted value
  reason: string;                      // Explanation for adjustment
  deviceSource: string;                // Which device triggered adjustment
  aiConfidence: number;                // AI confidence in adjustment (0-100)
}

enum AdjustmentTrigger {
  HIGH_HEART_RATE = "high_heart_rate",
  LOW_SPO2 = "low_spo2",
  HIGH_STRESS = "high_stress",
  POOR_HRV = "poor_hrv",
  FATIGUE_DETECTED = "fatigue_detected",
  OVERHEATING = "overheating",
  POOR_FORM = "poor_form",
  PLATEAU_DETECTED = "plateau_detected"
}

enum AdjustmentType {
  INTENSITY_DECREASE = "intensity_decrease",
  INTENSITY_INCREASE = "intensity_increase",
  REST_BREAK = "rest_break",
  EXERCISE_MODIFICATION = "exercise_modification",
  HYDRATION_REMINDER = "hydration_reminder",
  COOLING_BREAK = "cooling_break",
  FORM_CORRECTION = "form_correction",
  WORKOUT_TERMINATION = "workout_termination"
}
```

### Data Synchronization Schema

```typescript
// Enhanced offline sync with conflict resolution
interface SyncSession {
  id: string;                          // Unique sync session ID
  userId: string;                      // User association
  deviceIds: string[];                 // Devices involved in sync
  
  // Sync management
  status: SyncStatus;                  // Current sync status
  startTime: number;                   // Sync start timestamp
  endTime?: number;                    // Sync completion timestamp
  priority: SyncPriority;              // Sync priority level
  
  // Data management
  recordsToSync: number;               // Total records to synchronize
  recordsSynced: number;               // Successfully synced records
  conflicts: DataConflict[];           // Detected data conflicts
  resolutions: ConflictResolution[];   // Applied conflict resolutions
  
  // Quality and validation
  dataValidation: SyncValidation;      // Validation results
  qualityCheck: SyncQualityCheck;      // Data quality assessment
  errorLog: SyncError[];               // Sync errors and warnings
  
  // Performance metrics
  networkCondition: NetworkCondition;  // Network status during sync
  syncDuration: number;                // Total sync time (ms)
  dataTransferred: number;             // Bytes transferred
  compressionRatio: number;            // Data compression efficiency
}

interface DataConflict {
  id: string;                          // Conflict identifier
  metricType: HealthMetricType;        // Type of conflicting data
  timestamp: number;                   // When conflict occurred
  
  // Conflicting values
  sourceDevices: string[];             // Devices reporting different values
  values: ConflictingValue[];          // Different reported values
  
  // Resolution
  resolutionStrategy: ConflictResolutionStrategy; // How to resolve
  resolvedValue?: number | HealthMetricValue; // Final resolved value
  confidence: number;                  // Resolution confidence (0-100)
  manualOverride: boolean;             // User manually resolved
}

interface ConflictingValue {
  deviceId: string;                    // Source device
  value: number | HealthMetricValue;   // Reported value
  quality: number;                     // Data quality score
  timestamp: number;                   // Measurement timestamp
  confidence: number;                  // Device confidence in value
}

enum ConflictResolutionStrategy {
  HIGHEST_QUALITY = "highest_quality", // Use highest quality source
  DEVICE_PRIORITY = "device_priority", // Use highest priority device
  AVERAGE = "average",                 // Average conflicting values
  MOST_RECENT = "most_recent",         // Use most recent measurement
  USER_PREFERENCE = "user_preference", // Use user-preferred device
  MANUAL_SELECTION = "manual_selection", // User manually selected
  AI_RECOMMENDATION = "ai_recommendation" // AI-determined best value
}
```

### Privacy and Security Schema

```typescript
// Enhanced privacy controls for health data
interface HealthDataPrivacy {
  userId: string;                      // User association
  
  // Granular permissions
  dataTypePermissions: DataTypePermission[]; // Per-metric permissions
  devicePermissions: DevicePermission[]; // Per-device permissions
  sharingPermissions: SharingPermission[]; // Data sharing controls
  
  // Encryption and security
  encryptionLevel: EncryptionLevel;    // Data encryption requirements
  dataRetention: DataRetentionPolicy;  // How long to keep data
  deleteRequests: DataDeletionRequest[]; // User data deletion requests
  
  // Compliance and audit
  consentTimestamp: number;            // When user gave consent
  consentVersion: string;              // Privacy policy version
  auditLog: PrivacyAuditEntry[];       // Privacy-related actions
  
  // Export and portability
  exportRequests: DataExportRequest[]; // User data export requests
  portabilityOptions: DataPortabilityOption[]; // Data transfer options
}

interface DataTypePermission {
  metricType: HealthMetricType;        // Health metric type
  permission: PermissionLevel;         // Permission level
  purpose: DataUsagePurpose[];         // Allowed usage purposes
  restrictions: DataRestriction[];     // Usage restrictions
  expiresAt?: number;                  // Permission expiration
}

enum PermissionLevel {
  DENIED = "denied",                   // No access
  COLLECT_ONLY = "collect_only",       // Collect but don't process
  BASIC_ANALYSIS = "basic_analysis",   // Basic analytics only
  FULL_ANALYSIS = "full_analysis",     // Complete analysis and AI
  RESEARCH_SHARING = "research_sharing" // Anonymous research sharing
}

enum DataUsagePurpose {
  WORKOUT_OPTIMIZATION = "workout_optimization",
  HEALTH_INSIGHTS = "health_insights",
  PROGRESS_TRACKING = "progress_tracking",
  SAFETY_MONITORING = "safety_monitoring",
  RESEARCH_ANONYMOUS = "research_anonymous",
  MEDICAL_INTEGRATION = "medical_integration",
  NUTRITION_RECOMMENDATIONS = "nutrition_recommendations"
}
```

## Database Implementation (Convex)

### Table Schemas

```typescript
// Convex schema definitions building on existing structure
export default defineSchema({
  // Existing tables enhanced
  users: defineTable({
    // Existing user fields...
    wearablePreferences: v.optional(v.object({
      primaryDevice: v.optional(v.string()),
      dataQualityThreshold: v.number(),
      conflictResolution: v.string(),
      privacyLevel: v.string()
    }))
  }),

  // Enhanced wearable device management
  wearableDevices: defineTable({
    userId: v.id("users"),
    deviceType: v.string(),
    name: v.string(),
    status: v.string(),
    capabilities: v.object({
      heartRate: v.boolean(),
      steps: v.boolean(),
      sleep: v.boolean(),
      workouts: v.boolean(),
      hrv: v.boolean(),
      spo2: v.boolean(),
      stress: v.boolean(),
      bodyComposition: v.boolean(),
      respiratory: v.boolean(),
      temperature: v.boolean(),
      altitude: v.boolean(),
      gps: v.boolean(),
      menstrualCycle: v.boolean(),
      realTimeUpdates: v.boolean(),
      offlineSync: v.boolean()
    }),
    qualityScore: v.number(),
    priority: v.number(),
    authToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    lastConnected: v.number(),
    connectionHealth: v.object({
      latency: v.number(),
      reliability: v.number(),
      dataQuality: v.number(),
      syncFrequency: v.number(),
      lastSyncDuration: v.number(),
      errorCount: v.number(),
      batteryImpact: v.number()
    }),
    settings: v.any(),
    calibration: v.any(),
    firmwareVersion: v.optional(v.string()),
    batteryLevel: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_user", ["userId"])
   .index("by_status", ["status"])
   .index("by_type", ["deviceType"]),

  // Comprehensive health metrics
  healthMetrics: defineTable({
    userId: v.id("users"),
    deviceId: v.id("wearableDevices"),
    metricType: v.string(),
    value: v.union(v.number(), v.any()),
    unit: v.string(),
    timestamp: v.number(),
    quality: v.object({
      accuracy: v.number(),
      completeness: v.number(),
      consistency: v.number(),
      timeliness: v.number(),
      deviceReliability: v.number(),
      validationsPassed: v.array(v.string()),
      validationsFailed: v.array(v.string())
    }),
    confidence: v.number(),
    validated: v.boolean(),
    outlier: v.boolean(),
    context: v.optional(v.any()),
    correlationId: v.optional(v.string()),
    workoutId: v.optional(v.id("workouts")),
    sleepSessionId: v.optional(v.string()),
    rawData: v.optional(v.any()),
    processed: v.boolean(),
    syncedAt: v.number()
  }).index("by_user_timestamp", ["userId", "timestamp"])
   .index("by_metric_type", ["metricType"])
   .index("by_device", ["deviceId"])
   .index("by_workout", ["workoutId"])
   .index("by_quality", ["quality.accuracy"]),

  // Enhanced workout sessions
  workoutSessions: defineTable({
    // Existing workout fields...
    primaryDevice: v.id("wearableDevices"),
    connectedDevices: v.array(v.id("wearableDevices")),
    deviceMetrics: v.array(v.any()),
    realTimeAdjustments: v.array(v.any()),
    intensityRecommendations: v.array(v.any()),
    healthAlerts: v.array(v.any()),
    safetyChecks: v.array(v.any()),
    averageHRV: v.optional(v.number()),
    stressLevels: v.array(v.number()),
    spo2Readings: v.array(v.number()),
    respiratoryRate: v.array(v.number()),
    dataQuality: v.any(),
    conflictResolutions: v.array(v.any())
  }),

  // Data synchronization management
  syncSessions: defineTable({
    userId: v.id("users"),
    deviceIds: v.array(v.id("wearableDevices")),
    status: v.string(),
    startTime: v.number(),
    endTime: v.optional(v.number()),
    priority: v.string(),
    recordsToSync: v.number(),
    recordsSynced: v.number(),
    conflicts: v.array(v.any()),
    resolutions: v.array(v.any()),
    dataValidation: v.any(),
    qualityCheck: v.any(),
    errorLog: v.array(v.any()),
    networkCondition: v.any(),
    syncDuration: v.number(),
    dataTransferred: v.number(),
    compressionRatio: v.number()
  }).index("by_user", ["userId"])
   .index("by_status", ["status"])
   .index("by_start_time", ["startTime"]),

  // Privacy and data management
  healthDataPrivacy: defineTable({
    userId: v.id("users"),
    dataTypePermissions: v.array(v.any()),
    devicePermissions: v.array(v.any()),
    sharingPermissions: v.array(v.any()),
    encryptionLevel: v.string(),
    dataRetention: v.any(),
    deleteRequests: v.array(v.any()),
    consentTimestamp: v.number(),
    consentVersion: v.string(),
    auditLog: v.array(v.any()),
    exportRequests: v.array(v.any()),
    portabilityOptions: v.array(v.any())
  }).index("by_user", ["userId"])
});
```

## Data Flow Architecture

### Real-Time Data Collection Flow

```
1. Multi-Device Connection
   ├── Device Manager orchestrates connections
   ├── Priority-based data selection
   └── Connection health monitoring

2. Health Metric Collection
   ├── Real-time data streaming (<5s latency)
   ├── Data validation and quality scoring
   └── Outlier detection and flagging

3. Conflict Resolution
   ├── Cross-device validation
   ├── Quality-based resolution
   └── User preference integration

4. AI Integration
   ├── Real-time workout adjustments
   ├── Health insights generation
   └── Safety monitoring and alerts

5. Data Storage
   ├── Convex real-time database
   ├── Encrypted sensitive data
   └── Privacy-compliant retention
```

### Offline Synchronization Flow

```
1. Offline Data Collection
   ├── Local device caching
   ├── Timestamp preservation
   └── Quality metadata retention

2. Sync Trigger Events
   ├── Network connectivity restored
   ├── Manual sync request
   └── Scheduled sync intervals

3. Conflict Detection
   ├── Timestamp overlap analysis
   ├── Value deviation detection
   └── Cross-device inconsistency

4. Resolution Processing
   ├── Quality-based priority
   ├── User preference application
   └── AI-assisted resolution

5. Data Validation
   ├── Post-sync quality check
   ├── Integrity validation
   └── Error correction
```

## Performance Optimization

### Data Indexing Strategy

- **Time-based queries**: Optimize for timestamp range queries
- **Device-specific queries**: Index by device ID and type
- **Metric-type queries**: Fast filtering by health metric type
- **Quality-based queries**: Enable quality threshold filtering
- **User-specific queries**: Optimize for user data isolation

### Caching Strategy

- **Real-time cache**: In-memory cache for active workout data
- **Device cache**: Cache device capabilities and status
- **Quality cache**: Cache data quality scores for fast access
- **Conflict cache**: Cache resolution preferences
- **Privacy cache**: Cache permission settings

### Data Compression

- **Health metrics**: Compress time-series data for storage efficiency
- **Raw device data**: Compress original device payloads
- **Sync payloads**: Compress bulk synchronization data
- **Archive data**: Long-term storage compression
- **Export data**: Compressed user data exports

---

**Integration Points**: Building on existing Fitbit/WHOOP infrastructure  
**Performance Goals**: <5s real-time latency, 95% data quality, <2min sync  
**Privacy Compliance**: HIPAA-ready health data encryption and controls  
**Scalability**: Designed for 10M+ health metrics per user per month