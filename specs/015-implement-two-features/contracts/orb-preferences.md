# API Contracts: Orb Preferences

## Convex Mutations

### `updateOrbPreferences`

Update user's orb color customization settings.

**Function Signature**:

```typescript
export const updateOrbPreferences = mutation({
  args: {
    baseColorHue: v.number(),
    customColorEnabled: v.boolean(),
  },
  handler: async (ctx, args) => Promise<void>,
});
```

**Request Validation**:

- `baseColorHue`: 0 ≤ value ≤ 360
- `customColorEnabled`: boolean
- User must be authenticated

**Response**:

- Success: void (no return value)
- Error: ConvexError with message

**Behavior**:

- Upserts user's orb preferences
- Updates `lastModified` timestamp
- Increments `syncVersion` for conflict resolution
- Triggers real-time update to connected devices

---

## Convex Queries

### `getOrbPreferences`

Retrieve user's current orb color settings.

**Function Signature**:

```typescript
export const getOrbPreferences = query({
  args: {},
  handler: async (ctx) => Promise<OrbPreferences | null>,
});
```

**Response**:

```typescript
interface OrbPreferences {
  baseColorHue: number; // 0-360
  customColorEnabled: boolean;
  lastModified: number; // timestamp
  syncVersion: number;
}
```

**Behavior**:

- Returns current user's preferences
- Returns `null` if no preferences set (use defaults)
- Requires authentication

### `getCurrentStrain`

Get real-time workout strain data for orb color calculation.

**Function Signature**:

```typescript
export const getCurrentStrain = query({
  args: {},
  handler: async (ctx) => Promise<StrainData | null>,
});
```

**Response**:

```typescript
interface StrainData {
  currentStrain: number; // 0-120
  timestamp: number;
  isActive: boolean;
  sessionId: string;
}
```

**Behavior**:

- Returns active workout strain data
- Returns `null` if no active workout
- Real-time subscription capable

---

## Error Handling

### Error Codes

- `INVALID_HUE_VALUE`: baseColorHue outside 0-360 range
- `UNAUTHENTICATED`: User not logged in
- `STRAIN_DATA_STALE`: Strain data older than 5 minutes
- `SYNC_CONFLICT`: Concurrent preference updates detected

### Error Response Format

```typescript
interface ConvexError {
  message: string;
  code: string;
  details?: Record<string, any>;
}
```

---

## Real-time Subscriptions

### Orb Preferences Changes

```typescript
// Subscribe to user's preference changes
const unsubscribe = convex.subscribe("getOrbPreferences", {}, (preferences) => {
  // Update local state
  updateOrbDisplay(preferences);
});
```

### Strain Data Updates

```typescript
// Subscribe to real-time strain data
const unsubscribe = convex.subscribe("getCurrentStrain", {}, (strainData) => {
  // Update orb color within 250ms
  updateOrbColor(strainData?.currentStrain || 0);
});
```

## Performance Guarantees

- **Preference Updates**: Complete within 100ms
- **Strain Data Queries**: Return within 50ms
- **Real-time Updates**: Propagate within 250ms
- **Subscription Setup**: Initialize within 500ms
