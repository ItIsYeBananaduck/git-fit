# Data Model: Web Dashboard UI

**Feature**: Web Dashboard UI  
**Date**: September 30, 2025  
**Source**: Extracted from functional requirements in spec.md

## Core Entities

### User Entity
**Purpose**: Represents fitness enthusiasts using the web dashboard

**Fields**:
- `id`: string (primary key)
- `email`: string (unique, authentication)
- `name`: string (display name)
- `weight`: number (pounds, for macro calculations)
- `fitnessGoal`: enum ('Fat Loss', 'Muscle Gain', 'Hypertrophy', 'Powerlifting', 'Bodybuilding')
- `avatar`: string? (optional profile image URL)
- `createdAt`: timestamp
- `updatedAt`: timestamp

**Validation Rules**:
- Email must be valid format and unique
- Weight must be positive number
- Fitness goal must be one of the specified enum values
- Name must be non-empty string

**Relationships**:
- One-to-many with WorkoutSession
- One-to-many with MacroProfile
- Many-to-many with Trainer (through TrainingRelationship)
- One-to-many with CustomFood

### WorkoutSession Entity
**Purpose**: Represents completed or planned workout sessions

**Fields**:
- `id`: string (primary key)
- `userId`: string (foreign key to User)
- `name`: string (workout name)
- `date`: date (when workout occurred/planned)
- `status`: enum ('completed', 'planned', 'skipped')
- `exercises`: Exercise[] (array of exercise data)
- `notes`: string? (optional performance notes)
- `createdAt`: timestamp
- `updatedAt`: timestamp

**Validation Rules**:
- UserId must reference valid User
- Date cannot be in future for completed workouts
- Status must be one of enum values
- Exercises array cannot be empty

**State Transitions**:
- planned → completed (when workout finished)
- planned → skipped (when workout not performed)
- completed → planned (rare, for corrections)

### Exercise Entity (Embedded in WorkoutSession)
**Purpose**: Individual movements within a workout session

**Fields**:
- `name`: string (exercise name)
- `targetSets`: number (planned sets)
- `completedSets`: number (actual sets performed)
- `targetReps`: number[] (planned reps per set)
- `completedReps`: number[] (actual reps per set)
- `weights`: number[] (weight used per set)
- `skipReason`: string? (reason if skipped, e.g., "tired")
- `rpe`: number? (rate of perceived exertion, 1-10)

**Validation Rules**:
- Name must be non-empty string
- Sets and reps must be positive numbers
- Weights must be non-negative numbers
- RPE must be between 1-10 if provided
- CompletedReps array length must match completedSets

### MacroProfile Entity
**Purpose**: User's nutritional targets and calculation settings

**Fields**:
- `id`: string (primary key)
- `userId`: string (foreign key to User)
- `calories`: number (daily calorie target)
- `protein`: number (grams per day)
- `carbs`: number (grams per day)
- `fat`: number (grams per day)
- `proteinRatio`: number (g/lb body weight)
- `carbsPercentage`: number (percentage of remaining calories)
- `fatPercentage`: number (percentage of remaining calories)
- `calculationMethod`: enum ('AI_adjusted', 'manual', 'goal_based')
- `lastAIAdjustment`: timestamp? (when AI last modified)
- `createdAt`: timestamp
- `updatedAt`: timestamp

**Validation Rules**:
- UserId must reference valid User
- All macro values must be positive numbers
- Carbs + fat percentages should total ~70% (allowing for flexibility)
- Protein ratio must be >= 0.4 (safety threshold)
- Calculation method must be one of enum values

**Business Rules**:
- Protein warning if < 0.4g/lb body weight
- Bodybuilding users: 1.0-1.5g/lb protein based on progress
- Default distribution: remaining calories as 40% carbs, 30% fat

### Trainer Entity
**Purpose**: Fitness professionals with client access

**Fields**:
- `id`: string (primary key)
- `userId`: string (foreign key to User - trainer's user account)
- `name`: string (professional name)
- `certifications`: string[] (list of certifications)
- `bio`: string? (optional profile description)
- `isVerified`: boolean (verification status)
- `createdAt`: timestamp
- `updatedAt`: timestamp

**Validation Rules**:
- UserId must reference valid User
- Name must be non-empty string
- Certifications array can be empty but elements must be non-empty strings

**Relationships**:
- Many-to-many with User (through TrainingRelationship)
- One-to-many with TrainerAccessLog

### TrainingRelationship Entity
**Purpose**: Links trainers and clients with access permissions

**Fields**:
- `id`: string (primary key)
- `trainerId`: string (foreign key to Trainer)
- `clientId`: string (foreign key to User)
- `connectionToken`: string (encrypted QR code token)
- `tokenExpiration`: timestamp (24-hour expiration)
- `status`: enum ('pending', 'active', 'revoked')
- `permissions`: string[] (access permissions list)
- `createdAt`: timestamp (when connection established)
- `revokedAt`: timestamp? (when access revoked)
- `revokedBy`: enum? ('trainer', 'client') (who revoked access)

**Validation Rules**:
- TrainerId must reference valid Trainer
- ClientId must reference valid User
- Connection token must be encrypted and unique
- Token expiration must be <= 24 hours from creation
- Status must be one of enum values
- RevokedAt must be set when status = 'revoked'

**Business Rules**:
- One-time QR code usage (token invalidated after successful scan)
- Permanent relationship until manually revoked
- Audit trail maintained for all access activities

### CustomFood Entity
**Purpose**: User-created food items for macro tracking

**Fields**:
- `id`: string (primary key)
- `userId`: string (foreign key to User)
- `name`: string (food name)
- `caloriesPerUnit`: number (calories per serving)
- `proteinPerUnit`: number (grams protein per serving)
- `carbsPerUnit`: number (grams carbs per serving)
- `fatPerUnit`: number (grams fat per serving)
- `unit`: string (serving size description)
- `isVerified`: boolean (AI validation passed)
- `flaggedAsOutlier`: boolean (unusual nutritional values)
- `createdAt`: timestamp
- `updatedAt`: timestamp

**Validation Rules**:
- UserId must reference valid User
- Name must be non-empty string and unique per user
- All nutritional values must be non-negative numbers
- Unit must be non-empty string

**Business Rules**:
- AI validation flags outliers (e.g., "500g carbs? Double-check?")
- Users can confirm unusual values to override flags
- Stored in user's personal database (not shared)

### DataConflict Entity
**Purpose**: Manages sync conflicts between mobile and web data

**Fields**:
- `id`: string (primary key)
- `userId`: string (foreign key to User)
- `entityType`: enum ('workout', 'macro', 'food', 'profile')
- `entityId`: string (ID of conflicted entity)
- `mobileVersion`: object (mobile data version)
- `webVersion`: object (web data version)
- `conflictFields`: string[] (specific fields in conflict)
- `resolution`: enum ('pending', 'mobile_chosen', 'web_chosen', 'field_by_field')
- `resolvedBy`: string? (user ID who resolved)
- `autoMerged`: boolean (whether non-conflicting fields were auto-merged)
- `createdAt`: timestamp
- `resolvedAt`: timestamp?

**Validation Rules**:
- UserId must reference valid User
- Entity type must be one of enum values
- Entity ID must reference valid entity of specified type
- Resolution must be one of enum values
- ResolvedAt must be set when resolution != 'pending'

**Business Rules**:
- Side-by-side comparison interface for user resolution
- Automatic merging of non-conflicting fields
- Field-by-field selection capability
- Visual difference highlighting

## Database Schema Extensions

### Existing Convex Tables Used
The web dashboard integrates with existing Convex schema:

- `users`: Extended with weight and fitnessGoal fields
- `fitnessData`: Used for workout session storage
- `nutritionGoals`: Used for macro profile storage
- `trainers`: Used for trainer entity storage
- `healthDataSharing`: Extended for trainer relationship management

### New Tables Required
- `webDashboardSessions`: User session management for web interface
- `trainerAccessLogs`: Audit trail for trainer data access
- `qrCodeTokens`: Secure token management for trainer linking
- `dataConflictResolutions`: Conflict resolution history

## API Contract Requirements

### Authentication Endpoints
- `POST /auth/biometric-challenge`: Initialize WebAuthn challenge
- `POST /auth/biometric-verify`: Verify biometric authentication
- `POST /auth/email-login`: Email/password fallback authentication
- `GET /auth/session`: Validate current session

### Workout Data Endpoints
- `GET /workouts/summaries`: Retrieve workout summaries with pagination
- `GET /workouts/{id}`: Get detailed workout data
- `PUT /workouts/{id}/weights`: Update future workout weights
- `POST /workouts/sync-conflict`: Handle mobile-web data conflicts

### Macro Calculator Endpoints
- `GET /macros/profile`: Get current macro profile
- `PUT /macros/profile`: Update macro targets
- `POST /macros/ai-adjust`: Trigger AI-based adjustments
- `GET /macros/recommendations`: Get weekly survey-based recommendations

### Trainer Access Endpoints
- `POST /trainer/generate-qr`: Generate encrypted QR code token
- `POST /trainer/link-client`: Establish trainer-client relationship
- `DELETE /trainer/revoke-access`: Revoke trainer access
- `GET /trainer/clients`: Get trainer's client list
- `GET /trainer/client/{id}/data`: Get client workout data (with audit)
- `POST /trainer/export-csv`: Generate CSV export for client

### Food Database Endpoints
- `POST /foods/custom`: Create custom food item
- `GET /foods/custom`: List user's custom foods
- `PUT /foods/{id}/verify`: Confirm AI-flagged food data
- `POST /foods/validate`: AI validation of nutritional data

---

**Data Model Status**: ✅ Complete  
**Next Step**: Generate API contracts and test scenarios