# API Contracts: Watch Interface

## Convex Mutations

### `updateWatchExerciseData`

Update exercise parameters from watch interface.

**Function Signature**:

```typescript
export const updateWatchExerciseData = mutation({
  args: {
    deviceId: v.string(),
    repsChange: v.number(),
    weightChange: v.number(),
    setCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => Promise<void>,
});
```

**Request Validation**:

- `deviceId`: Must be valid watch device identifier
- `repsChange`: Integer increment/decrement (-5 to +5)
- `weightChange`: Weight change in pounds (-25 to +25, multiples of 5)
- `setCompleted`: Optional boolean for set completion

**Behavior**:

- Updates current exercise data for user's workout
- Stores change in offline queue if watch disconnected
- Triggers real-time sync to main app
- Validates changes don't result in invalid values (reps < 1, weight < 0)

### `syncWatchState`

Synchronize watch interface state with main app.

**Function Signature**:

```typescript
export const syncWatchState = mutation({
  args: {
    deviceId: v.string(),
    connectionStatus: v.string(),
    pendingUpdates: v.object({}),
  },
  handler: async (ctx, args) => Promise<SyncResult>,
});
```

**Response**:

```typescript
interface SyncResult {
  success: boolean;
  conflictsResolved: number;
  pendingCount: number;
  lastSyncTimestamp: number;
}
```

---

## Convex Queries

### `getWatchWorkoutData`

Get current workout data optimized for watch display.

**Function Signature**:

```typescript
export const getWatchWorkoutData = query({
  args: {
    deviceId: v.string(),
  },
  handler: async (ctx, args) => Promise<WatchWorkoutData | null>,
});
```

**Response**:

```typescript
interface WatchWorkoutData {
  currentExercise: {
    name: string;
    currentReps: number;
    targetReps: number;
    currentWeight: number;
    currentSet: number;
    totalSets: number;
  };
  strain: {
    current: number; // 0-120
    timestamp: number;
  };
  isResting: boolean;
  restTimeRemaining?: number; // seconds, if isResting
  orbColor: string; // hex color based on strain
}
```

### `getAudioDeviceStatus`

Check connected audio devices for wave animation triggers.

**Function Signature**:

```typescript
export const getAudioDeviceStatus = query({
  args: {},
  handler: async (ctx) => Promise<AudioDeviceStatus>,
});
```

**Response**:

```typescript
interface AudioDeviceStatus {
  hasConnectedDevice: boolean;
  deviceType: "bluetooth" | "wired" | "builtin" | null;
  deviceName: string | null;
  supportsAudioFeedback: boolean;
  lastDetected: number;
}
```

---

## Real-time Subscriptions

### Watch Workout Data Updates

```typescript
// Subscribe to workout data changes for watch
const unsubscribe = convex.subscribe(
  "getWatchWorkoutData",
  { deviceId: watchDeviceId },
  (workoutData) => {
    updateWatchDisplay(workoutData);
    if (workoutData?.strain.current) {
      updateOrbAppearance(workoutData.strain.current);
    }
  }
);
```

### Audio Device Changes

```typescript
// Subscribe to audio device connectivity
const unsubscribe = convex.subscribe(
  "getAudioDeviceStatus",
  {},
  (audioStatus) => {
    enableWaveAnimations(audioStatus.hasConnectedDevice);
  }
);
```

---

## Offline Behavior

### Data Queuing

- Exercise adjustments stored locally when offline
- Queue holds up to 50 pending changes
- Changes timestamped for conflict resolution
- Auto-retry sync every 30 seconds

### Conflict Resolution

```typescript
interface ConflictResolution {
  strategy: "latest_wins" | "merge_changes" | "user_prompt";
  local_timestamp: number;
  remote_timestamp: number;
  resolved_value: any;
}
```

### Sync Recovery

- On reconnection, batch sync all pending changes
- Apply conflict resolution for concurrent modifications
- Notify user of any unresolvable conflicts
- Maintain workout continuity during sync process

---

## Performance Requirements

- **Exercise Updates**: Propagate within 250ms when online
- **Strain Data**: Update orb color within 250ms
- **Offline Storage**: Support 2+ hours of disconnected operation
- **Sync Recovery**: Complete within 5 seconds of reconnection
- **Watch UI**: Respond to taps within 100ms
