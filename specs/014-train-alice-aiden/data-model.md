# Data Model: AI Training System with Voice Integration

**Date**: September 30, 2025  
**Feature**: AI Training System with Voice Integration  
**Status**: Complete

## Entity Overview

The AI Training System extends existing entities and introduces new entities for training data management, voice synthesis, and user preferences.

## Extended Entities

### User (Extended)

Extends existing User entity

**New Fields**:

- `voicePreferences: VoicePreferences` - Voice synthesis settings for premium users
- `dataCollectionConsent: boolean` - Consent for anonymous data collection in AI training
- `isPremium: boolean` - Premium subscription status for voice features
- `voiceId?: string` - ElevenLabs voice ID for personalized voice synthesis

**Validation Rules**:

- `voicePreferences` required only for premium users
- `dataCollectionConsent` defaults to `false` for privacy-first approach
- `voiceId` generated on first voice setup for premium users

### WorkoutEntry (Extended)

Extends existing WorkoutEntry entity

**New Fields**:

- `aiTrainingData: AITrainingData` - Anonymized data for model training
- `voiceInteractions: VoiceInteraction[]` - Record of AI voice responses during workout
- `exportedForTraining: boolean` - Flag indicating if data was included in training batch

**Validation Rules**:

- `aiTrainingData` populated only if user has `dataCollectionConsent: true`
- `voiceInteractions` recorded only for premium users with voice enabled
- `exportedForTraining` prevents duplicate inclusion in training datasets

## New Entities

### AITrainingData

Anonymized workout data for model training

**Fields**:

- `id: string` - Unique identifier
- `hashedUserId: string` - SHA-256 hash of original user ID
- `exerciseType: string` - Type of exercise performed
- `setNumber: number` - Set number within workout
- `strainPercentage: number` - Calculated strain level (0-100)
- `skipReason?: string` - Reason for skipping set if applicable
- `sleepHours?: number` - Previous night sleep duration
- `aiResponse: string` - AI coaching response provided
- `contextTags: string[]` - Workout context (e.g., 'high_strain', 'pr_attempt')
- `timestamp: string` - ISO datetime of workout event
- `exportBatch?: string` - Training batch identifier when exported

**Relationships**:

- Derived from `WorkoutEntry` but anonymized
- No direct relationship to `User` (privacy protection)

**Validation Rules**:

- `hashedUserId` must be irreversible SHA-256 hash
- `strainPercentage` must be between 0 and 100
- `aiResponse` must not contain personal information
- `contextTags` limited to predefined vocabulary

**State Transitions**:

```mermaid
Created → Pending Export → Exported → Archived (after 6 months)
```

### VoiceCache

Local storage for generated voice clips

**Fields**:

- `id: string` - Unique identifier
- `userId: string` - Owner user ID
- `textHash: string` - Hash of spoken text for deduplication
- `audioBlob: Blob` - Binary audio data
- `tone: VoiceTone` - Voice tone used ('whisper' | 'neutral' | 'hype')
- `context: string` - Workout context when generated
- `generatedAt: string` - ISO datetime of generation
- `lastUsedAt: string` - ISO datetime of last playback
- `usageCount: number` - Number of times played
- `expiresAt?: string` - Optional expiration for seasonal content

**Relationships**:

- Belongs to `User`
- No server-side storage (IndexedDB only)

**Validation Rules**:

- Maximum 10 clips per user (random rotation eviction)
- `audioBlob` must be valid audio format
- `textHash` prevents duplicate caching
- `usageCount` tracks popularity for analytics

**Cache Management**:

```mermaid
Empty → Storing → Cached → Used → [Rotation] → Evicted
```

### VoicePreferences

User settings for voice synthesis

**Fields**:

- `id: string` - Unique identifier
- `userId: string` - Owner user ID
- `personality: VoicePersonality` - 'Alice' | 'Aiden'
- `voiceEnabled: boolean` - Global voice on/off toggle
- `toneAdaptation: boolean` - Enable context-aware tone changes
- `accessibilityMode: boolean` - Enhanced visual/haptic feedback
- `elevenLabsVoiceId?: string` - ElevenLabs voice clone ID
- `voiceCloneStatus: VoiceCloneStatus` - Clone setup progress
- `lastVoiceSetup?: string` - ISO datetime of last voice configuration

**Relationships**:

- Belongs to `User` (1:1)
- References `VoiceCache` entries for user

**Validation Rules**:

- Required for premium users with voice features
- `personality` must be valid option
- `elevenLabsVoiceId` required when `voiceEnabled: true`
- `accessibilityMode` enables alternative feedback methods

**Setup States**:

```mermaid
Not Configured → Cloning Voice → Clone Ready → Active → Needs Update
```

### AIModel

AI model version and metadata

**Fields**:

- `id: string` - Unique identifier
- `version: string` - Semantic version (e.g., 'v1.2.3')
- `huggingFaceModelId: string` - HF Hub model identifier
- `baseModel: string` - Base model used for fine-tuning
- `trainingDataBatch: string` - Training batch identifier
- `trainingStartedAt: string` - ISO datetime training began
- `trainingCompletedAt?: string` - ISO datetime training finished
- `deployedAt?: string` - ISO datetime deployed to production
- `status: ModelStatus` - 'training' | 'validating' | 'deployed' | 'archived'
- `performanceMetrics: ModelMetrics` - Validation scores and metrics
- `rollbackData?: RollbackData` - Previous model info for rollback

**Relationships**:

- References `TrainingSession` that created it
- May have rollback relationship to previous `AIModel`

**Validation Rules**:

- `version` must follow semantic versioning
- `status` transitions must follow valid sequence
- `performanceMetrics` required before deployment
- Only one model can have `status: 'deployed'` at a time

**Lifecycle States**:

```mermaid
Training → Validating → Deploying → Deployed → [Rollback] → Archived
```

### TrainingSession

Weekly AI training pipeline execution

**Fields**:

- `id: string` - Unique identifier
- `batchId: string` - Unique batch identifier for this training cycle
- `scheduledAt: string` - ISO datetime training was scheduled
- `startedAt?: string` - ISO datetime training actually began
- `completedAt?: string` - ISO datetime training finished
- `status: TrainingStatus` - Pipeline execution status
- `dataSize: number` - Size of training dataset in bytes
- `recordCount: number` - Number of training records processed
- `retryCount: number` - Number of retry attempts
- `errorMessage?: string` - Error details if training failed
- `huggingFaceJobId?: string` - External training job identifier
- `modelOutputPath?: string` - Path to generated model files

**Relationships**:

- Produces `AIModel` upon successful completion
- References batch of `AITrainingData` records

**Validation Rules**:

- `batchId` must be unique across all sessions
- `retryCount` cannot exceed 5 (constitutional limit)
- `status` must progress through valid states
- `dataSize` and `recordCount` must match dataset

**Execution States**:

```mermaid
Scheduled → Data Collection → Training → Validation → Completed
           ↓
          Failed → Retrying → [Back to Training or Failed Final]
```

### VoiceInteraction

Record of AI voice responses during workouts

**Fields**:

- `id: string` - Unique identifier
- `workoutEntryId: string` - Associated workout entry
- `aiResponseText: string` - Text of AI response
- `voiceTone: VoiceTone` - Tone used for synthesis
- `wasVoicePlayed: boolean` - Whether audio was actually played
- `wasCached: boolean` - Whether audio was served from cache
- `generationLatency?: number` - Time to generate audio (ms)
- `playbackLatency?: number` - Time to start playback (ms)
- `timestamp: string` - ISO datetime of interaction

**Relationships**:

- Belongs to `WorkoutEntry`
- References `VoiceCache` if audio was cached

**Validation Rules**:

- `aiResponseText` must not exceed 280 characters
- `generationLatency` tracked only for new audio generation
- `playbackLatency` must be under 500ms target
- Recorded only for premium users with voice enabled

## Data Flow Diagrams

### Training Pipeline Data Flow

```mermaid
WorkoutEntry → AITrainingData → TrainingSession → AIModel → Deployment
     ↑                                ↓
User Consent ←------------- Retry Logic (5x) → Fallback Model
```

### Voice Synthesis Data Flow

```mermaid
AI Response → Voice Generation → VoiceCache → Audio Playback
     ↑               ↓               ↓           ↓
User Premium → ElevenLabs API → IndexedDB → VoiceInteraction
```

### Data Anonymization Flow

```mermaid
WorkoutEntry (PII) → Hash Function → AITrainingData (Anonymous) → Export
     ↑                     ↓                   ↓
User ID → SHA-256 → HashedUserId → Training Batch → HuggingFace
```

## Storage Strategy

### Convex Database

- `User`, `WorkoutEntry` (extended)
- `AITrainingData`, `AIModel`, `TrainingSession`
- `VoicePreferences`, `VoiceInteraction`

### IndexedDB (Browser)

- `VoiceCache` entries with audio blobs
- Offline-capable, per-user storage
- 10-entry limit with random rotation

### External Storage

- **Hugging Face Hub**: AI model weights and configurations
- **ElevenLabs**: Voice cloning and synthesis API
- **Git Repository**: Model version tracking and deployment

## Performance Considerations

### Training Data Volume

- **Current**: ~1MB per user per week
- **Scale**: 50GB total for 50K users annually
- **Retention**: 6 months maximum (constitutional requirement)

### Voice Cache Efficiency

- **Hit Rate**: ~80% after initial usage
- **Storage**: ~10MB per user (10 clips × 1MB average)
- **Eviction**: Random rotation prevents bias

### Query Optimization

- Index on `AITrainingData.exportBatch` for training pipeline
- Index on `VoiceCache.textHash` for deduplication
- Index on `AIModel.status` for active model lookup

## Security & Privacy

### Data Anonymization

- SHA-256 hashing of user IDs (irreversible)
- Removal of personally identifiable information
- No linkage between training data and original users

### Access Controls

- Premium verification for voice features
- User consent required for data collection
- Administrative access for training pipeline management

### Data Retention

- Training data: 6 months maximum
- Voice cache: User-controlled (settings)
- Model versions: 2 versions retained for rollback

## Validation & Testing Strategy

### Entity Validation

- Schema validation for all new fields
- Relationship integrity checks
- State transition validation

### Data Pipeline Testing

- Anonymization function verification
- Training batch completeness validation
- Model deployment verification

### Performance Testing

- Voice cache hit rate measurement
- Training pipeline scalability testing
- API response time validation

## Migration Strategy

### Database Schema Updates

1. Add new fields to existing `User` and `WorkoutEntry` entities
2. Create new entities with proper indexes
3. Initialize default values for existing users

### Data Backfill

1. Create `VoicePreferences` for existing premium users
2. Backfill `dataCollectionConsent` as `false` for privacy
3. Generate initial `AITrainingData` from recent workout entries

### Deployment Coordination

1. Deploy schema changes first
2. Deploy backend functions for training pipeline
3. Deploy frontend voice synthesis features
4. Initialize first training session