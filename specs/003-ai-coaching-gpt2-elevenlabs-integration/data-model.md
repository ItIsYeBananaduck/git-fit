# Data Model: AI-Driven Coaching with GPT-2 and ElevenLabs TTS Integration

## Core Entities

### AICoachingPersona

Represents the Alice or Aiden coaching character with voice and personality configuration.

**Fields**:

- `id: string` - Unique identifier (alice, aiden)
- `name: string` - Display name for the persona
- `voiceId: string` - ElevenLabs voice ID for TTS
- `personalityTraits: object` - Personality configuration
  - `enthusiasm: number` - Energy level (0.0-1.0)
  - `supportiveness: number` - Encouragement level (0.0-1.0)
  - `directness: number` - Communication style (0.0-1.0)
- `voiceSettings: object` - ElevenLabs voice configuration
  - `stability: number` - Voice stability (0.0-1.0)
  - `similarityBoost: number` - Voice similarity boost (0.0-1.0)
- `responsePatterns: string[]` - Common response templates
- `createdAt: number` - Timestamp of creation
- `updatedAt: number` - Timestamp of last update

**Relationships**:

- One-to-many with UserPreferences (users can select preferred persona)
- One-to-many with VoiceResponse (persona generates responses)

**Validation Rules**:

- ID must be 'alice' or 'aiden'
- Voice ID must be valid ElevenLabs voice identifier
- All numeric fields must be between 0.0 and 1.0
- Response patterns array must contain at least 5 templates

### WorkoutTrigger

Represents specific moments during exercise that activate AI coaching responses.

**Fields**:

- `id: string` - Unique identifier
- `type: string` - Trigger type (onboarding, pre-start, set-start, set-end, strainsync, workout-end)
- `name: string` - Human-readable trigger name
- `description: string` - Detailed description of when trigger activates
- `promptTemplate: string` - GPT-2 prompt template with variables
- `maxResponseLength: number` - Maximum words allowed in response
- `priority: number` - Processing priority (1-10)
- `conditions: object` - Trigger activation conditions
  - `userType: string[]` - Required user types (pro, free, all)
  - `deviceState: string[]` - Required device states (earbuds, speaker, any)
  - `workoutPhase: string[]` - Required workout phases
- `isActive: boolean` - Whether trigger is currently enabled

**Relationships**:

- One-to-many with VoiceResponse (trigger generates responses)
- One-to-many with TriggerEvent (trigger activation logs)

**Validation Rules**:

- Type must be one of the six defined trigger types
- Max response length must be 15 for all except onboarding (200)
- Priority must be integer between 1 and 10
- Conditions must specify at least one valid user type

### VoiceResponse

Generated text and audio response from the AI coaching system.

**Fields**:

- `id: string` - Unique identifier
- `userId: string` - User who received the response
- `personaId: string` - Persona that generated response
- `triggerId: string` - Trigger that activated response
- `generatedText: string` - GPT-2 generated text
- `audioFileUrl: string?` - URL to cached audio file (if generated)
- `toastMessage: string` - Shortened text for toast notification
- `metadata: object` - Response generation metadata
  - `gpt2ModelVersion: string` - Model version used
  - `generationLatency: number` - Time to generate text (ms)
  - `ttsLatency: number` - Time to generate audio (ms)
  - `cacheHit: boolean` - Whether audio was served from cache
- `userFeedback: object?` - Optional user feedback
  - `rating: number` - User rating (1-5)
  - `helpful: boolean` - Whether user found it helpful
  - `timestamp: number` - When feedback was provided
- `createdAt: number` - Timestamp of response generation
- `expiresAt: number` - When response should be purged

**Relationships**:

- Many-to-one with AICoachingPersona
- Many-to-one with WorkoutTrigger
- Many-to-one with UserSubscription (via userId)

**Validation Rules**:

- Generated text must not exceed trigger's max response length
- Toast message must be under 50 characters
- Audio file URL must be HTTPS if present
- User feedback rating must be 1-5 if provided

### UserSubscription

Pro vs non-pro status determining voice access and AI training participation.

**Fields**:

- `userId: string` - Unique user identifier
- `subscriptionType: string` - Subscription level (free, pro, trainer)
- `voiceAccess: boolean` - Whether user has voice coaching access
- `trainingFrequency: string` - AI training schedule (weekly, monthly, none)
- `preferredPersona: string` - Selected AI persona (alice, aiden)
- `devicePreferences: object` - Audio and device preferences
  - `autoDetectEarbuds: boolean` - Whether to auto-detect earbuds
  - `fallbackToSpeaker: boolean` - Whether to use speaker as fallback
  - `toastDuration: number` - Toast display duration (ms)
- `privacySettings: object` - Privacy and data usage preferences
  - `allowDataCollection: boolean` - Consent for data collection
  - `allowAITraining: boolean` - Consent for AI training
  - `dataRetentionDays: number` - How long to keep user data
- `billingInfo: object?` - Subscription billing information
  - `planId: string` - Billing plan identifier
  - `nextBillingDate: number` - Next billing timestamp
  - `amount: number` - Monthly fee in cents
- `createdAt: number` - Subscription creation timestamp
- `updatedAt: number` - Last subscription update

**Relationships**:

- One-to-one with User entity
- One-to-many with VoiceResponse
- One-to-many with TrainingDataContribution

**State Transitions**:

- Free → Pro: Enable voice access, set weekly training
- Pro → Free: Disable voice access, set monthly training
- Any → Cancelled: Preserve data per retention policy

**Validation Rules**:

- Subscription type must be valid enum value
- Training frequency must match subscription type rules
- Data retention days must be between 1 and 180
- Billing amount must be positive for paid plans

### TrainingData

Anonymized workout logs and user interactions for GPT-2 model improvement.

**Fields**:

- `id: string` - Unique identifier
- `userId: string` - Hashed user identifier (anonymized)
- `dataType: string` - Type of training data (workout_log, interaction, feedback)
- `content: object` - Anonymized training content
  - `exerciseType: string` - Exercise performed (anonymized)
  - `userResponse: string` - User reaction/feedback (anonymized)
  - `contextData: object` - Workout context without sensitive info
- `excludedFields: string[]` - List of fields removed for privacy
- `generatedAt: number` - When original data was created
- `anonymizedAt: number` - When data was anonymized
- `trainedAt: number?` - When data was used for training
- `qualityScore: number` - Data quality score for training (0.0-1.0)
- `trainingCycle: string` - Training cycle identifier

**Relationships**:

- Many-to-one with UserSubscription (via anonymized userId)
- One-to-many with ModelTrainingRun

**Privacy Constraints**:

- Must exclude personal identifiers (names, emails, phone numbers, addresses)
- Must exclude biometric data (heart rate, sleep patterns)
- Content must be anonymized before storage
- Must support complete deletion within 30 days

**Validation Rules**:

- User ID must be hashed, not plain text
- Quality score must be between 0.0 and 1.0
- Excluded fields list must contain at least privacy-sensitive fields
- Training cycle must be valid identifier

### AudioCache

Cached MP3 files for common coaching responses to optimize performance.

**Fields**:

- `id: string` - Unique cache identifier
- `cacheKey: string` - Hash of persona + trigger + text content
- `personaId: string` - Persona that generated the audio
- `triggerId: string` - Trigger type for the cached response
- `audioFileUrl: string` - URL to cached audio file
- `fileSize: number` - Audio file size in bytes
- `duration: number` - Audio duration in milliseconds
- `accessCount: number` - Number of times cache was accessed
- `lastAccessed: number` - Timestamp of last access
- `createdAt: number` - Cache creation timestamp
- `expiresAt: number` - Cache expiration timestamp

**Relationships**:

- Many-to-one with AICoachingPersona
- Many-to-one with WorkoutTrigger

**Cache Management**:

- LRU eviction policy when storage limit reached
- Automatic expiration after 30 days
- Prefer caching onboarding sequences (highest reuse)
- Monitor cache hit ratio for optimization

**Validation Rules**:

- Cache key must be unique hash
- File size must be under 1MB per audio file
- Duration must match actual audio file length
- Access count must be non-negative integer

## Entity Relationships

### Primary Relationships

```
AICoachingPersona (1) ←→ (many) VoiceResponse
WorkoutTrigger (1) ←→ (many) VoiceResponse
UserSubscription (1) ←→ (many) VoiceResponse
UserSubscription (1) ←→ (many) TrainingData
AICoachingPersona (1) ←→ (many) AudioCache
WorkoutTrigger (1) ←→ (many) AudioCache
```

### Data Flow

1. **Trigger Event** → WorkoutTrigger validates conditions
2. **GPT-2 Generation** → Uses TrainingData for personalization
3. **Response Creation** → VoiceResponse entity with metadata
4. **TTS Processing** → AudioCache check, then ElevenLabs if needed
5. **User Delivery** → Based on UserSubscription voice access
6. **Feedback Loop** → User interaction becomes TrainingData

## Privacy and Compliance

### Data Minimization

- Store only essential fields for functionality
- Automatically anonymize data before AI training
- Implement field-level encryption for sensitive data
- Regular purging of expired data

### GDPR/CCPA Compliance

- User consent tracking for all data collection
- Right to deletion within 30 days
- Data portability through structured exports
- Audit logging for all data access and modifications

### Security Measures

- Encrypt sensitive fields at rest
- Use HTTPS for all data transmission
- Implement access controls based on user roles
- Regular security audits and penetration testing
