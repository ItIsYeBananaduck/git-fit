# Enhancement Tasks: Monday Workout Intensity Analysis

**Feature**: Monday Workout Intensity Analysis Enhancement  
**Approach**: Extend existing system rather than build from scratch  
**Based on**: Implementation plan audit showing 90% functionality already exists  
**Effort**: 12-15 tasks (vs 28-32 for greenfield) - 50% reduction through existing code analysis

---

## 🎯 **Enhancement Strategy**

**Constitutional Compliance**: Following Constitution v1.2.0 "Existing Code Analysis" principle  
**Existing System**: `app/src/lib/stores/mondayWorkoutData.ts` - comprehensive Monday workout service  
**Gap Analysis**: Only 3 areas need enhancement (Backend, Health Plugins, UI refinements)  
**Data Safety**: All enhancements must preserve existing user data and workflows

---

## Phase 1: Backend Integration (Priority 1)

### Task 1: Create Convex Monday Data Mutation [P]
**Type**: Backend Integration  
**Priority**: High  
**Parallel**: Yes (independent of other tasks)

**Objective**: Replace mock backend calls in existing `mondayWorkoutData.ts` with real Convex storage

**Steps**:
1. Create `app/convex/functions/mondayWorkouts.ts`
2. Implement `storeMondayHashes` mutation to accept hashed workout data
3. Define schema for Monday workout data storage in `convex/schema.ts`
4. Add proper user authentication and data validation
5. Return success confirmation to client

**Acceptance Criteria**:
- ✅ Accepts array of hashed workout data from existing service
- ✅ Stores data securely with user ID association  
- ✅ Validates hash format (SHA-256)
- ✅ Returns success/error status
- ✅ Preserves all existing data fields from `MondayWorkoutData` interface

**Files Modified**:
- `app/convex/functions/mondayWorkouts.ts` (new)
- `app/convex/schema.ts` (extend)

### Task 2: Create Convex Monday Processing Scheduled Action [P]
**Type**: Backend Integration  
**Priority**: High  
**Parallel**: Yes (independent of Task 1)

**Objective**: Replace client-side Monday processing with server-side scheduled action

**Steps**:
1. Create `app/convex/functions/mondayProcessor.ts` 
2. Implement scheduled action to run every Monday at 6 AM
3. Port intensity calculation logic from existing client service
4. Process all users' weekly data and generate adjustments
5. Store intensity scores and volume adjustments in database

**Acceptance Criteria**:
- ✅ Runs automatically every Monday morning
- ✅ Processes all users with workout data from previous week
- ✅ Uses identical calculation logic to existing `calculateIntensity()` method
- ✅ Stores results for user retrieval via API
- ✅ Handles errors gracefully with retry logic

**Files Modified**:
- `app/convex/functions/mondayProcessor.ts` (new)
- `app/convex/crons.ts` (new or extend)

### Task 3: Create Convex Intensity Retrieval Query [P]
**Type**: Backend Integration  
**Priority**: High  
**Parallel**: Yes (can work alongside Tasks 1-2)

**Objective**: Enable users to retrieve their Monday intensity analysis results

**Steps**:
1. Create query function `getWeeklyIntensity` in `mondayWorkouts.ts`
2. Accept userId and optional weekStart date parameters
3. Return intensity scores and volume adjustments for the specified week
4. Handle cases where no data exists for requested period
5. Format response to match existing UI expectations

**Acceptance Criteria**:
- ✅ Returns intensity score breakdown (base, HR, SpO2, sleep, feedback)
- ✅ Returns volume adjustments array with exercise-specific recommendations
- ✅ Defaults to current week if no weekStart provided
- ✅ Returns appropriate errors for invalid requests
- ✅ Response format matches existing `IntensityScore` interface

**Files Modified**:
- `app/convex/functions/mondayWorkouts.ts` (extend)

### Task 4: Migrate Existing Service to Use Convex Backend
**Type**: Backend Integration  
**Priority**: Medium  
**Dependencies**: Tasks 1, 2, 3 must be complete

**Objective**: Update existing `mondayWorkoutData.ts` to use Convex instead of localStorage/mock backend

**Steps**:
1. Update `sendHashesToBackend()` method to call Task 1's mutation
2. Update `generateDisplayUpdates()` to retrieve data from Task 3's query  
3. Remove localStorage dependency for processed Monday data
4. Add proper error handling for Convex calls
5. Maintain backward compatibility during migration period

**Acceptance Criteria**:
- ✅ All existing functionality preserved
- ✅ Hashed data goes to Convex instead of console.log
- ✅ Display updates pull from Convex instead of local calculation
- ✅ Graceful fallback if Convex calls fail
- ✅ Existing user data properly migrated

**Files Modified**:
- `app/src/lib/stores/mondayWorkoutData.ts` (major update)

---

## Phase 2: Health Plugin Integration (Priority 2)

### Task 5: Install and Configure Health Plugin [P]
**Type**: Mobile Integration  
**Priority**: Medium  
**Parallel**: Yes (independent of backend tasks)

**Objective**: Add native health data access to replace mock health data collection

**Steps**:
1. Install `@capacitor-community/health` plugin via npm
2. Configure iOS permissions in `Info.plist` for HealthKit access
3. Configure Android permissions in `AndroidManifest.xml` for Health Connect
4. Update Capacitor configuration to include health plugin
5. Test plugin installation on iOS and Android

**Acceptance Criteria**:
- ✅ Plugin installed and configured correctly
- ✅ Health permissions properly declared for both platforms
- ✅ No build errors or warnings
- ✅ Plugin accessible from TypeScript code
- ✅ Permission prompts appear when health data requested

**Files Modified**:
- `app/package.json` (dependency)
- `app/ios/App/App/Info.plist` (permissions)
- `app/android/app/src/main/AndroidManifest.xml` (permissions)
- `app/capacitor.config.ts` (configuration)

### Task 6: Create Native Health Data Service [P]
**Type**: Mobile Integration  
**Priority**: Medium  
**Parallel**: Yes (can work alongside Task 5)

**Objective**: Create service to collect real health data from HealthKit/Health Connect

**Steps**:
1. Create `app/src/lib/services/healthData.ts`
2. Implement methods to query heart rate, SpO2, and sleep data
3. Add permission request handling
4. Format data to match existing `MondayWorkoutData` health fields
5. Add proper error handling for denied permissions or missing data

**Acceptance Criteria**:
- ✅ Collects heart rate data (avg, max, variance) from last workout
- ✅ Collects SpO2 data (avg, drift) if available  
- ✅ Collects sleep score from previous night
- ✅ Handles permission requests gracefully
- ✅ Returns data in format expected by existing Monday service
- ✅ Fallback behavior when health data unavailable

**Files Modified**:
- `app/src/lib/services/healthData.ts` (new)

### Task 7: Integrate Native Health Service with Monday Workflow
**Type**: Mobile Integration  
**Priority**: Medium  
**Dependencies**: Tasks 5, 6 must be complete

**Objective**: Replace mock health data collection in existing workflow with real native data

**Steps**:
1. Update `logWorkoutForMonday()` function in `mondayWorkoutData.ts`
2. Call native health service during workout completion
3. Update existing health data collection in `WearableWorkoutController.svelte`
4. Add proper error handling when health data unavailable
5. Maintain existing fallback behavior for missing data

**Acceptance Criteria**:
- ✅ Real health data collected during workout completion
- ✅ Existing intensity calculations work with native data
- ✅ Graceful degradation when health data unavailable  
- ✅ No breaking changes to existing workout flow
- ✅ Health data permissions requested at appropriate time

**Files Modified**:
- `app/src/lib/stores/mondayWorkoutData.ts` (update health data collection)
- `app/src/lib/components/WearableWorkoutController.svelte` (update health integration)

---

## Phase 3: UI Enhancement (Priority 3)

### Task 8: Create MondayUpdates Display Component [P]
**Type**: UI Enhancement  
**Priority**: Low  
**Parallel**: Yes (independent of other phases)

**Objective**: Create dedicated component for displaying Monday analysis results to users

**Steps**:
1. Create `app/src/lib/components/MondayUpdates.svelte`
2. Display intensity score breakdown (base, HR, SpO2, sleep, feedback)
3. Show volume adjustments with clear before/after values
4. Add color coding for intensity levels (green/yellow/red)
5. Include clear explanations for each adjustment

**Acceptance Criteria**:
- ✅ Shows total intensity percentage with component breakdown
- ✅ Lists volume adjustments with clear weight changes
- ✅ Uses intuitive color coding and icons
- ✅ Responsive design for mobile and web
- ✅ Loading states while fetching data from Convex
- ✅ Empty states when no Monday data available

**Files Modified**:
- `app/src/lib/components/MondayUpdates.svelte` (new)

### Task 9: Integrate MondayUpdates with Existing Workout Pages
**Type**: UI Enhancement  
**Priority**: Low  
**Dependencies**: Task 8 must be complete

**Objective**: Add Monday updates display to existing workout interface

**Steps**:
1. Import MondayUpdates component in `routes/workouts/+page.svelte`
2. Add Monday updates section to workout page layout
3. Connect component to existing Monday data state
4. Add toggle to show/hide Monday updates
5. Test integration with existing workout functionality

**Acceptance Criteria**:  
- ✅ MondayUpdates appears on workout page when data available
- ✅ Updates automatically when new Monday processing completes
- ✅ Doesn't interfere with existing workout tracking
- ✅ Responsive layout on mobile and desktop
- ✅ Proper state management integration

**Files Modified**:
- `app/src/routes/workouts/+page.svelte` (integrate component)

---

## Phase 4: Testing and Validation

### Task 10: Validate Existing Intensity Calculation Against Specification [P]
**Type**: Testing  
**Priority**: Medium  
**Parallel**: Yes (can run alongside development)

**Objective**: Ensure existing calculation logic meets specification requirements

**Steps**:
1. Create test cases based on specification examples (47% intensity, +2.5 lbs)
2. Test existing `calculateIntensity()` method against spec requirements
3. Validate edge cases: missing data, extreme values, mental stress detection
4. Compare client-side and server-side calculation results
5. Document any discrepancies and create fixes

**Acceptance Criteria**:
- ✅ Base 50% + component calculations match specification
- ✅ User feedback scoring uses correct values (keep going: +20, easy killer: -15, etc.)
- ✅ Volume adjustment triggers work correctly (intensity >100%, easy killer + strain >95%)
- ✅ Edge cases handled properly (missing data defaults to 50%)
- ✅ Mental stress detection works (HR spike + SpO2 drop + no reps)

**Files Modified**:
- `app/src/lib/stores/mondayWorkoutData.test.ts` (new test file)

### Task 11: Test Convex Backend Integration End-to-End [P]
**Type**: Testing  
**Priority**: High  
**Dependencies**: Backend tasks (1-4) must be complete

**Objective**: Validate complete data flow from workout completion to Monday display

**Steps**:
1. Create integration test for complete Monday workflow
2. Test workout data → hashing → Convex storage → Monday processing → retrieval
3. Validate data consistency between client and server
4. Test error handling and recovery scenarios
5. Performance test with multiple users and large datasets

**Acceptance Criteria**:
- ✅ Complete workout data flows correctly through system
- ✅ Hashed data stored and retrieved accurately
- ✅ Monday processing generates correct intensity scores
- ✅ Volume adjustments appear correctly in UI
- ✅ Error scenarios handled gracefully
- ✅ Performance meets requirements (<200ms API response)

**Files Modified**:
- `app/src/lib/integration.test.ts` (new)
- `app/convex/functions/tests/` (new test files)

### Task 12: Test Health Plugin Integration on Real Devices
**Type**: Testing  
**Priority**: Medium  
**Dependencies**: Health plugin tasks (5-7) must be complete

**Objective**: Validate health data collection works on actual iOS and Android devices

**Steps**:
1. Test HealthKit integration on iPhone with real workout data
2. Test Health Connect integration on Android device
3. Validate permission flows work correctly
4. Test fallback behavior when health data denied
5. Test data accuracy and consistency

**Acceptance Criteria**:
- ✅ Real heart rate data collected during workouts
- ✅ SpO2 data retrieved when available
- ✅ Sleep data collected from previous night  
- ✅ Permissions requested and handled properly
- ✅ Fallback behavior works when data unavailable
- ✅ Data format matches existing system expectations

**Files Modified**:
- Test documentation and validation reports

---

## Phase 5: Data Migration and Compatibility

### Task 13: Create Data Migration Script for Existing Users
**Type**: Data Migration  
**Priority**: High  
**Dependencies**: Backend integration (Tasks 1-4) must be complete

**Objective**: Safely migrate existing localStorage Monday data to Convex backend

**Steps**:
1. Create migration script to read existing localStorage data
2. Transform data to match Convex schema format
3. Batch upload existing data to Convex
4. Validate migration success
5. Provide rollback capability if migration fails

**Acceptance Criteria**:
- ✅ All existing user data preserved during migration
- ✅ Data format correctly transformed for Convex
- ✅ Migration can be run safely multiple times  
- ✅ Clear success/failure reporting
- ✅ Rollback mechanism in case of issues

**Files Modified**:
- `app/src/lib/migration/mondayDataMigration.ts` (new)

### Task 14: Add Backward Compatibility Support
**Type**: Compatibility  
**Priority**: Medium  
**Dependencies**: All enhancement tasks should be complete

**Objective**: Ensure system works during transition period with mixed data sources

**Steps**:
1. Add feature flags for gradual rollout of enhancements
2. Support both localStorage and Convex data during transition
3. Add fallback mechanisms for each enhancement
4. Create admin interface to monitor migration progress
5. Plan gradual deprecation of localStorage dependency

**Acceptance Criteria**:
- ✅ System works with localStorage-only users
- ✅ System works with Convex-only users  
- ✅ System works with mixed data sources during migration
- ✅ Feature flags allow safe rollout control
- ✅ Clear monitoring and observability

**Files Modified**:
- `app/src/lib/stores/mondayWorkoutData.ts` (add compatibility layer)
- `app/src/lib/config/featureFlags.ts` (new)

---

## Summary

**Total Tasks**: 14 (vs 28-32 for greenfield approach)  
**Effort Reduction**: ~50% through existing code analysis  
**Risk Level**: Low (extending proven system vs building new)  
**Constitutional Compliance**: Perfect adherence to "Existing Code Analysis" principle

**Key Success Factors**:
1. **Preserve existing functionality** throughout all enhancements
2. **Maintain data integrity** during backend migration  
3. **Gradual rollout** with fallback mechanisms
4. **Thorough testing** of integration points
5. **User experience continuity** - no disruption to current workflows

**This enhancement approach leverages the substantial existing investment in Monday workout functionality while addressing the specific gaps identified in our constitutional audit.**