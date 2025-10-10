# Data Model: Build Adaptive Fit

**Date**: October 3, 2025  
**Feature**: 017-build-adaptive-fit

## Core Entities

### Alice Interface State

```typescript
interface AliceState {
  userId: string;
  subscriptionTier: "free" | "trial" | "paid" | "trainer";
  appearance: {
    bodyPattern:
      | "solid"
      | "stripes"
      | "spots"
      | "leopard"
      | "chrome"
      | "glitch";
    bodyColor: string; // hex color for pattern
    ringColor?: string; // for trainers only
    eyeState: "normal" | "wink" | "droop" | "excited";
  };
  currentMode: "workout" | "nutrition" | "analytics" | "radio" | "zen" | "play";
  isVisible: boolean;
  lastInteraction: Date;
}
```

### User Profile (extends existing)

```typescript
interface UserProfile {
  // ... existing fields
  subscriptionTier: "free" | "trial" | "paid" | "trainer";
  subscriptionStart?: Date;
  subscriptionEnd?: Date;
  aliceCustomization: {
    bodyPattern: string;
    bodyColor: string;
    ringColor?: string;
  };
  preferences: {
    voiceFrequency: number; // 0-100 for radio mode
    zenModeEnabled: boolean;
    backgroundMonitoring: boolean;
  };
  performanceBaseline: {
    calibrationDate: Date;
    exerciseMetrics: Record<string, number>;
  };
}
```

### Exercise Library

```typescript
interface Exercise {
  id: string;
  name: string;
  muscleGroups: string[];
  equipment: string[];
  description: string;
  createdBy: string; // userId
  createdByType: "user" | "trainer";
  status: "local" | "pending" | "approved" | "rejected";
  approvalVotes: {
    likes: number;
    dislikes: number;
    voterIds: string[];
  };
  lastUsed?: Date;
  isStale: boolean; // >2 weeks unused
  monthlyPollResult?: "keep" | "remove";
  createdAt: Date;
  updatedAt: Date;
}
```

### Workout Session

```typescript
interface WorkoutSession {
  id: string;
  userId: string;
  mode: "workout" | "play";
  startTime: Date;
  endTime?: Date;
  exercises: {
    exerciseId: string;
    sets: {
      reps?: number;
      weight?: number;
      duration?: number;
      heartRate?: number;
      strain?: number;
    }[];
  }[];
  intensityScore: number; // 0-100+
  heartRateData: {
    timestamp: Date;
    bpm: number;
  }[];
  adaptations: {
    timestamp: Date;
    reason: string;
    change: string;
  }[];
  teamPost?: {
    posted: boolean;
    likes: number;
    likedBy: string[];
  };
}
```

### Team Community

```typescript
interface TeamPost {
  id: string;
  userId: string;
  type: "workout" | "exercise" | "streak";
  content: {
    workoutIcon: string;
    intensity: number;
    heartIcon: "pulsing" | "static";
  };
  likes: number;
  likedBy: string[];
  createdAt: Date;
  queuedForMetaCycle?: boolean;
}

interface ActiveStreak {
  userId: string;
  type: "play" | "workout";
  count: number;
  lastActivity: Date;
  badgeAwarded?: boolean;
}
```

### Performance Data (retention managed)

```typescript
interface PerformanceData {
  userId: string;
  sessionId: string;
  dataType: "raw" | "monthly" | "yearly";
  period: Date; // session date, month start, year start
  metrics: {
    heartRate: number[];
    strain: number[];
    intensity: number;
    duration: number;
  };
  retentionPolicy: {
    tier: "free" | "paid";
    expiresAt: Date;
  };
  createdAt: Date;
}
```

### Marketplace Content

```typescript
interface MarketplaceVideo {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  price: number; // in cents
  externalVideoUrl: string; // seller's server
  previewUrl?: string;
  tags: string[];
  performanceMetrics: {
    totalPurchases: number;
    highIntensityUsers: number; // users who hit high intensity
    averageIntensityScore: number;
  };
  badges: string[]; // e.g., "90% hit high intensity"
  isActive: boolean;
  createdAt: Date;
}

interface VideoPurchase {
  id: string;
  buyerId: string;
  videoId: string;
  amount: number; // price paid
  platformFee: number; // 30% commission
  downloadPath: string; // local AdaptiveFitDownloads path
  purchaseDate: Date;
  accessibleIndefinitely: boolean; // always true per clarification
}
```

### Background Monitoring

```typescript
interface HeartRateMonitoring {
  userId: string;
  timestamp: Date;
  heartRate: number;
  elevatedDuration?: number; // minutes sustained > threshold
  promptShown?: boolean;
  userResponse?: "workout" | "play" | "ignore";
  responseTime?: number; // seconds to respond
  autoAction?: "timeout_ignore" | "timeout_rest";
}
```

## State Transitions

### Alice Appearance by Subscription Tier

- **Free**: Gray Alice, no customization
- **Trial**: Full black Alice, all customization options
- **Paid**: Black Alice, 10 pattern options with color choices
- **Trainer**: Black Alice + colored ring, both customizable

### Exercise Approval Workflow

1. User creates exercise → `local` status
2. 8 team likes → `pending` status, trainer voting enabled
3. Trainer votes Approve → `approved` status
4. Trainer votes Decline → `rejected` status
5. Trainer votes Clarify → back to user for revision

### Data Retention by Tier

- **Free**: Raw data 14 days → delete
- **Paid**: Raw data 4 weeks → monthly summary → yearly summary (3 year max)

### Workout Intensity Monitoring

- Intensity ≤100%: Continue normally
- Intensity >100%: Pause, prompt "rest or continue", 30s timeout to "rest"

## Validation Rules

### Alice Customization

- Free users: No customization allowed
- Pattern selection: Must be from approved list of 10 patterns
- Colors: Valid hex codes only
- Trainer rings: Additional color validation for contrast

### Exercise Submissions

- Name: Required, 3-100 characters
- Muscle groups: At least 1, from predefined list
- Equipment: Optional, from predefined list
- Description: Required, 10-500 characters

### Voting Thresholds

- Exercise approval: Exactly 8 team likes required
- Monthly polls: 60% threshold (≥60% keeps, <60% removes)
- Whole workout likes: Queues for meta-cycle inclusion

### Performance Data

- Heart rate: 40-220 BPM valid range
- Strain: 0-100+ scale
- Intensity: 0-100+ percentage
- Session duration: 1 minute minimum

## Database Relationships

### One-to-One

- User ↔ AliceState
- User ↔ ActiveStreak

### One-to-Many

- User → WorkoutSessions
- User → ExerciseCreations
- User → TeamPosts
- User → VideoPurchases
- User → HeartRateMonitoring

### Many-to-Many

- Users ↔ ExerciseVoting (via likes/dislikes)
- Users ↔ TeamPostLikes
- Users ↔ WorkoutMetaCycles

## Computed Fields (Convex)

### User Level

- `isTrialExpired`: Check trial end date vs current
- `dataRetentionStatus`: Calculate what data to retain/delete
- `currentPerformanceBaseline`: Latest calibration metrics

### Exercise Level

- `isStaleExercise`: Last used >2 weeks ago
- `approvalProgress`: Vote count vs 8-like threshold
- `monthlyPollEligible`: Stale + time for monthly poll

### Community Level

- `weeklyTopWorkouts`: Most-liked complete workouts
- `pendingTrainerVotes`: Exercises awaiting trainer decision
- `activeStreakLeaderboard`: Top streak holders
