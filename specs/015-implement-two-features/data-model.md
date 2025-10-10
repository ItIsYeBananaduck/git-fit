# Data Model: Customizable Alice Orb Color & Watch Interface

## Core Entities

### AliceOrbPreferences

**Purpose**: Store user's visual customization settings for Alice's orb

**Fields**:

- `userId`: string (FK to users table) - Owner of the preferences
- `baseColorHue`: number (0-360) - User-selected hue value, default 195 (#00BFFF)
- `customColorEnabled`: boolean - Whether custom color is active
- `lastModified`: number - Timestamp for sync resolution
- `syncVersion`: number - Version counter for offline conflict resolution

**Validation Rules**:

- `baseColorHue` must be 0 ≤ value ≤ 360
- `userId` must exist and be unique (one preference set per user)
- `lastModified` must be valid timestamp
- `syncVersion` must increment on each change

**State Transitions**:

1. Created → Active (when user sets custom color)
2. Active → Modified (when user changes color)
3. Modified → Synced (when changes propagate to all devices)

### WorkoutStrainData

**Purpose**: Real-time workout intensity data for orb color adjustments

**Fields** (extends existing workout data):

- `userId`: string (FK to users table) - Workout owner
- `sessionId`: string - Current workout session identifier
- `currentStrain`: number (0-120) - Current intensity percentage
- `timestamp`: number - When strain measurement was recorded
- `isActive`: boolean - Whether workout is currently in progress

**Validation Rules**:

- `currentStrain` must be 0 ≤ value ≤ 120
- `timestamp` must not be in future
- Only one active session per user at a time
- Strain updates must be within reasonable time intervals (<5 minutes gap)

### WatchSyncState

**Purpose**: Track synchronization state between main app and watch interface

**Fields**:

- `userId`: string (FK to users table) - Device owner
- `deviceId`: string - Unique watch/device identifier
- `lastSyncTimestamp`: number - Last successful sync time
- `pendingUpdates`: object - Offline changes awaiting sync
- `connectionStatus`: string - 'connected' | 'offline' | 'syncing'
- `exerciseData`: object - Current exercise state (reps, weight, set)

**Validation Rules**:

- `deviceId` must be unique per user
- `lastSyncTimestamp` cannot be in future
- `connectionStatus` must be valid enum value
- `pendingUpdates` must be valid JSON object

**State Transitions**:

1. Offline → Connecting (when watch comes online)
2. Connecting → Connected (successful sync)
3. Connected → Syncing (during data transfer)
4. Syncing → Connected (sync complete)
5. Connected → Offline (connection lost)

### AudioDeviceContext

**Purpose**: Track audio device connectivity for wave animation triggers

**Fields**:

- `userId`: string (FK to users table) - Device owner
- `deviceType`: string - 'bluetooth' | 'wired' | 'builtin'
- `deviceName`: string - Human-readable device name
- `isConnected`: boolean - Current connection status
- `lastDetected`: number - Timestamp of last detection
- `supportsAudioFeedback`: boolean - Whether device can receive Alice's voice

**Validation Rules**:

- `deviceType` must be valid enum value
- `deviceName` must not be empty when connected
- `lastDetected` must be valid timestamp
- Only one primary audio device per user

## Computed Properties

### AdjustedOrbColor

**Calculation**: Dynamic color based on base preferences and current strain

```typescript
function calculateAdjustedColor(baseHue: number, strain: number): string {
  const [h, s, l] = [baseHue, 100, 50]; // Base HSL values

  if (strain < 90) {
    return hslToHex([h, s, Math.min(l + 20, 100)]); // Lighten 20%
  } else if (strain >= 90 && strain <= 100) {
    return hslToHex([h, s, l]); // Exact base color
  } else {
    return hslToHex([h, s, Math.max(l - 20, 0)]); // Darken 20%
  }
}
```

### SyncPriority

**Calculation**: Determine which device has authoritative data during conflicts

```typescript
function resolveSyncConflict(local: SyncState, remote: SyncState): SyncState {
  // Most recent change wins, with preference for active workout data
  if (local.lastModified > remote.lastModified) {
    return local;
  }
  return remote;
}
```

## Relationships

### User ↔ AliceOrbPreferences

- **Type**: One-to-One
- **Constraint**: Each user has exactly one orb preference set
- **Cascade**: Delete preferences when user deleted

### User ↔ WorkoutStrainData

- **Type**: One-to-Many
- **Constraint**: Multiple strain measurements per user over time
- **Cascade**: Archive strain data when user deleted (for analytics)

### User ↔ WatchSyncState

- **Type**: One-to-Many
- **Constraint**: Multiple devices per user (phone, watch, tablet)
- **Cascade**: Delete sync state when user deleted

### User ↔ AudioDeviceContext

- **Type**: One-to-Many
- **Constraint**: Multiple audio devices per user
- **Cascade**: Delete device context when user deleted

## Performance Considerations

### Indexing Strategy

- `AliceOrbPreferences.userId` - Primary lookup for user's color settings
- `WorkoutStrainData.userId + isActive` - Fast lookup for active workout strain
- `WatchSyncState.userId + deviceId` - Efficient device-specific sync queries
- `AudioDeviceContext.userId + isConnected` - Quick connected device lookup

### Caching Strategy

- Orb preferences: Cache in localStorage for immediate UI updates
- Strain data: Real-time subscription with 250ms max latency
- Sync state: Background sync every 30 seconds when offline
- Audio context: Poll every 5 seconds for device changes

### Data Retention

- Orb preferences: Persist indefinitely (user setting)
- Strain data: Keep last 7 days for real-time, archive older data
- Sync state: Keep last 24 hours of sync history
- Audio context: Keep current state only, no historical data needed
