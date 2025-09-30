# Tasks: Mobile UI with Dark Mode, Liquid Glass Effects, and Complete App Flow

**Input**: Design documents from `/specs/012-mobile-ui-with/`
**Prerequisites**: plan.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

## Execution Flow Summary
- **Tech Stack**: TypeScript 5.0+ + SvelteKit 2.22+ + Convex 1.27+ + Capacitor 7.4+
- **Dependencies**: @capacitor/haptics, @capacitor/biometric-auth, @capacitor/camera, Tailwind CSS 4.1+
- **Structure**: Mobile hybrid app with API backend
- **Testing**: Vitest + Playwright + Capacitor test suite
- **Performance**: 60fps animations, <500ms UI, <2s data, <10s scans

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 3.1: Setup & Dependencies

- [ ] T001 Install Capacitor mobile dependencies: @capacitor/haptics @capacitor/biometric-auth @capacitor/camera
- [ ] T002 [P] Configure Tailwind CSS 4.1+ with dark theme custom properties in tailwind.config.js
- [ ] T003 [P] Initialize iOS platform with npx cap add ios
- [ ] T004 [P] Initialize Android platform with npx cap add android
- [ ] T005 [P] Configure TypeScript strict mode and mobile-specific types in tsconfig.json
- [ ] T006 Update package.json scripts for mobile development (cap:sync, cap:run, etc.)

## Phase 3.2: Contract Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Authentication Contract Tests
- [ ] T007 [P] Contract test POST /auth/biometric/init in app/tests/contract/test_auth_biometric_init.test.ts
- [ ] T008 [P] Contract test POST /auth/biometric/verify in app/tests/contract/test_auth_biometric_verify.test.ts

### User Profile Contract Tests
- [ ] T009 [P] Contract test GET /user/profile in app/tests/contract/test_user_profile_get.test.ts
- [ ] T010 [P] Contract test PATCH /user/profile/units in app/tests/contract/test_user_profile_units.test.ts

### Workout Session Contract Tests
- [ ] T011 [P] Contract test POST /workout/session/start in app/tests/contract/test_workout_session_start.test.ts
- [ ] T012 [P] Contract test POST /workout/session/feedback in app/tests/contract/test_workout_session_feedback.test.ts
- [ ] T013 [P] Contract test POST /workout/session/vitals in app/tests/contract/test_workout_session_vitals.test.ts

### Nutrition Contract Tests
- [ ] T014 [P] Contract test POST /nutrition/barcode/scan in app/tests/contract/test_nutrition_barcode_scan.test.ts
- [ ] T015 [P] Contract test POST /nutrition/food/custom in app/tests/contract/test_nutrition_food_custom.test.ts
- [ ] T016 [P] Contract test GET /nutrition/timeline/{date} in app/tests/contract/test_nutrition_timeline_get.test.ts

### Trainer Mode Contract Tests
- [ ] T017 [P] Contract test POST /trainer/access/request in app/tests/contract/test_trainer_access_request.test.ts
- [ ] T018 [P] Contract test GET /trainer/clients in app/tests/contract/test_trainer_clients_get.test.ts
- [ ] T019 [P] Contract test POST /trainer/session/share in app/tests/contract/test_trainer_session_share.test.ts

### Sync Contract Tests
- [ ] T020 [P] Contract test POST /sync/offline/upload in app/tests/contract/test_sync_offline_upload.test.ts
- [ ] T021 [P] Contract test POST /sync/conflict/resolve in app/tests/contract/test_sync_conflict_resolve.test.ts

### Integration Tests (Quickstart Scenarios)
- [ ] T022 [P] Integration test dark theme and liquid glass effects in app/tests/integration/test_theme_effects.test.ts
- [ ] T023 [P] Integration test haptic feedback flow in app/tests/integration/test_haptic_feedback.test.ts
- [ ] T024 [P] Integration test biometric authentication flow in app/tests/integration/test_biometric_auth.test.ts
- [ ] T025 [P] Integration test unit system switching in app/tests/integration/test_unit_switching.test.ts
- [ ] T026 [P] Integration test responsive design iPad layout in app/tests/integration/test_responsive_design.test.ts
- [ ] T027 [P] Integration test offline sync conflict resolution in app/tests/integration/test_offline_sync.test.ts
- [ ] T028 [P] Integration test workout session with feedback in app/tests/integration/test_workout_session.test.ts
- [ ] T029 [P] Integration test nutrition barcode scanning in app/tests/integration/test_nutrition_scanning.test.ts

## Phase 3.3: Data Models (ONLY after tests are failing)

### Core Entity Models
- [ ] T030 [P] UserProfile interface with biometric and unit preferences in app/src/lib/types/UserProfile.ts
- [ ] T031 [P] UIState interface for theme and navigation state in app/src/lib/types/UIState.ts
- [ ] T032 [P] WorkoutSession interface with mobile vitals tracking in app/src/lib/types/WorkoutSession.ts
- [ ] T033 [P] NutritionEntry interface with barcode and custom food support in app/src/lib/types/NutritionEntry.ts
- [ ] T034 [P] TrainerAssignment interface with biometric approval in app/src/lib/types/TrainerAssignment.ts
- [ ] T035 [P] SyncState interface for offline conflict resolution in app/src/lib/types/SyncState.ts

### Validation and Utility Types
- [ ] T036 [P] MacroTargets validation with protein guardrails in app/src/lib/types/MacroTargets.ts
- [ ] T037 [P] VitalStats interface for wearable data sources in app/src/lib/types/VitalStats.ts
- [ ] T038 [P] ConflictResolution types for sync handling in app/src/lib/types/ConflictResolution.ts

## Phase 3.4: Services and Business Logic

### Authentication Services
- [ ] T039 BiometricAuthService for fingerprint/face ID in app/src/lib/services/BiometricAuthService.ts
- [ ] T040 SessionManagementService with biometric re-verification in app/src/lib/services/SessionManagementService.ts

### Unit Conversion Services
- [ ] T041 [P] UnitConversionService for Imperial/Metric switching in app/src/lib/services/UnitConversionService.ts
- [ ] T042 [P] MacroCalculationService with fitness goal variants in app/src/lib/services/MacroCalculationService.ts

### Mobile UI Services
- [ ] T043 [P] HapticFeedbackService with gesture mapping in app/src/lib/services/HapticFeedbackService.ts
- [ ] T044 [P] ThemeService for dark mode and liquid glass effects in app/src/lib/services/ThemeService.ts
- [ ] T045 [P] ResponsiveLayoutService for phone/tablet detection in app/src/lib/services/ResponsiveLayoutService.ts

### Workout Services
- [ ] T046 WorkoutSessionService with real-time vitals integration in app/src/lib/services/WorkoutSessionService.ts
- [ ] T047 WorkoutFeedbackService for pain/skip logging in app/src/lib/services/WorkoutFeedbackService.ts
- [ ] T048 IntensityCalculationService for orb visualization in app/src/lib/services/IntensityCalculationService.ts

### Nutrition Services
- [ ] T049 BarcodeScanningService with ML Kit integration in app/src/lib/services/BarcodeScanningService.ts
- [ ] T050 FoodDatabaseService with custom food fallback in app/src/lib/services/FoodDatabaseService.ts
- [ ] T051 NutritionTimelineService for meal time management in app/src/lib/services/NutritionTimelineService.ts

### Trainer Services
- [ ] T052 TrainerClientService with access approval workflow in app/src/lib/services/TrainerClientService.ts
- [ ] T053 [P] CalendarIntegrationService for session sharing in app/src/lib/services/CalendarIntegrationService.ts

### Sync Services
- [ ] T054 OfflineSyncService with optimistic updates in app/src/lib/services/OfflineSyncService.ts
- [ ] T055 ConflictResolutionService for merge strategies in app/src/lib/services/ConflictResolutionService.ts

## Phase 3.5: UI Components and Styling

### Core UI Components
- [ ] T056 [P] DarkTheme CSS custom properties with color palette in app/src/lib/styles/theme.css
- [ ] T057 [P] LiquidGlass component with backdrop-filter effects in app/src/lib/components/LiquidGlass.svelte
- [ ] T058 [P] CentralOrb component with 90° rotation animation in app/src/lib/components/CentralOrb.svelte
- [ ] T059 [P] IntensityOrb component with 0-100% fill visualization in app/src/lib/components/IntensityOrb.svelte
- [ ] T060 [P] StrainRing component for live vitals display in app/src/lib/components/StrainRing.svelte

### Navigation Components
- [ ] T061 [P] BottomNavigation with glass-effect dots in app/src/lib/components/BottomNavigation.svelte
- [ ] T062 [P] TabletSplitView for trainer iPad layout in app/src/lib/components/TabletSplitView.svelte
- [ ] T063 [P] ResponsiveContainer with breakpoint handling in app/src/lib/components/ResponsiveContainer.svelte

### Form Components
- [ ] T064 [P] BiometricPrompt component with fallback UI in app/src/lib/components/BiometricPrompt.svelte
- [ ] T065 [P] UnitToggle component with instant conversion in app/src/lib/components/UnitToggle.svelte
- [ ] T066 [P] MacroSlider component with automatic balancing in app/src/lib/components/MacroSlider.svelte

### Workout Components
- [ ] T067 [P] WorkoutFeedbackButtons with haptic integration in app/src/lib/components/WorkoutFeedbackButtons.svelte
- [ ] T068 [P] SetRepEditor with drag and snap interactions in app/src/lib/components/SetRepEditor.svelte
- [ ] T069 [P] ExerciseNavigator with swipe gestures in app/src/lib/components/ExerciseNavigator.svelte

### Nutrition Components
- [ ] T070 [P] BarcodeScanner component with camera integration in app/src/lib/components/BarcodeScanner.svelte
- [ ] T071 [P] FoodCard component with macro visualization in app/src/lib/components/FoodCard.svelte
- [ ] T072 [P] NutritionTimeline with meal time drag interactions in app/src/lib/components/NutritionTimeline.svelte
- [ ] T073 [P] CustomFoodEntry with manual macro input in app/src/lib/components/CustomFoodEntry.svelte

### Trainer Components
- [ ] T074 [P] ClientAvatarGrid with 3-column phone layout in app/src/lib/components/ClientAvatarGrid.svelte
- [ ] T075 [P] LiveIntensityRing around client avatars in app/src/lib/components/LiveIntensityRing.svelte
- [ ] T076 [P] SessionShareDialog for calendar integration in app/src/lib/components/SessionShareDialog.svelte

## Phase 3.6: Page Implementation

### Core Pages
- [ ] T077 Update HomePage with central orb and dark theme in app/src/routes/+page.svelte
- [ ] T078 OnboardingPage with voice-guided setup and unit selection in app/src/routes/onboarding/+page.svelte
- [ ] T079 SettingsPage with biometric toggle and unit switching in app/src/routes/settings/+page.svelte

### Workout Pages
- [ ] T080 WorkoutSelectionPage with search and Quick Start in app/src/routes/workout/+page.svelte
- [ ] T081 ActiveWorkoutPage with intensity orb and feedback in app/src/routes/workout/[id]/+page.svelte
- [ ] T082 WorkoutHistoryPage with AI adjustment tracking in app/src/routes/workout/history/+page.svelte

### Nutrition Pages
- [ ] T083 NutritionTrackingPage with timeline and scanning in app/src/routes/nutrition/+page.svelte
- [ ] T084 FoodSearchPage with barcode fallback to manual in app/src/routes/nutrition/search/+page.svelte
- [ ] T085 MacroAdjustmentPage with goal-based calculations in app/src/routes/nutrition/macros/+page.svelte

### Trainer Pages
- [ ] T086 TrainerDashboard with client grid and live sessions in app/src/routes/trainer/+page.svelte
- [ ] T087 ClientDetailPage with workout history and notes in app/src/routes/trainer/client/[id]/+page.svelte
- [ ] T088 SessionPlanningPage with calendar integration in app/src/routes/trainer/session/+page.svelte

## Phase 3.7: API Endpoint Implementation

### Authentication Endpoints
- [ ] T089 POST /auth/biometric/init endpoint in app/api/auth/biometric/init.ts
- [ ] T090 POST /auth/biometric/verify endpoint in app/api/auth/biometric/verify.ts

### User Profile Endpoints
- [ ] T091 GET /user/profile endpoint with mobile preferences in app/api/user/profile.ts
- [ ] T092 PATCH /user/profile/units endpoint with real-time conversion in app/api/user/profile/units.ts

### Workout Endpoints
- [ ] T093 POST /workout/session/start endpoint with device capabilities in app/api/workout/session/start.ts
- [ ] T094 POST /workout/session/feedback endpoint with AI integration in app/api/workout/session/feedback.ts
- [ ] T095 POST /workout/session/vitals endpoint with intensity updates in app/api/workout/session/vitals.ts

### Nutrition Endpoints
- [ ] T096 POST /nutrition/barcode/scan endpoint with ML Kit integration in app/api/nutrition/barcode/scan.ts
- [ ] T097 POST /nutrition/food/custom endpoint with macro validation in app/api/nutrition/food/custom.ts
- [ ] T098 GET /nutrition/timeline/{date} endpoint with meal positioning in app/api/nutrition/timeline/[date].ts

### Trainer Endpoints
- [ ] T099 POST /trainer/access/request endpoint with approval workflow in app/api/trainer/access/request.ts
- [ ] T100 GET /trainer/clients endpoint with live session data in app/api/trainer/clients.ts
- [ ] T101 POST /trainer/session/share endpoint with calendar export in app/api/trainer/session/share.ts

### Sync Endpoints
- [ ] T102 POST /sync/offline/upload endpoint with conflict detection in app/api/sync/offline/upload.ts
- [ ] T103 POST /sync/conflict/resolve endpoint with merge strategies in app/api/sync/conflict/resolve.ts

## Phase 3.8: Mobile Platform Integration

### Capacitor Configuration
- [ ] T104 Configure iOS app with biometric permissions in ios/App/App/Info.plist
- [ ] T105 Configure Android app with camera/biometric permissions in android/app/src/main/AndroidManifest.xml
- [ ] T106 [P] Setup iOS build configuration for App Store in ios/App/App.xcodeproj
- [ ] T107 [P] Setup Android build configuration for Play Store in android/app/build.gradle

### Platform-Specific Features
- [ ] T108 [P] iOS haptic feedback calibration in app/src/lib/platform/ios/haptics.ts
- [ ] T109 [P] Android haptic feedback calibration in app/src/lib/platform/android/haptics.ts
- [ ] T110 [P] iOS biometric authentication integration in app/src/lib/platform/ios/biometrics.ts
- [ ] T111 [P] Android biometric authentication integration in app/src/lib/platform/android/biometrics.ts

## Phase 3.9: Performance Optimization

### Animation Performance
- [ ] T112 [P] Optimize CSS transforms for 60fps orb rotations in app/src/lib/styles/animations.css
- [ ] T113 [P] Implement will-change hints for liquid glass effects in app/src/lib/components/LiquidGlass.svelte
- [ ] T114 [P] GPU acceleration for intensity fill animations in app/src/lib/components/IntensityOrb.svelte

### Bundle Optimization
- [ ] T115 [P] Code splitting for trainer mode components in app/src/routes/trainer/+layout.ts
- [ ] T116 [P] Lazy loading for nutrition scanning components in app/src/routes/nutrition/+layout.ts
- [ ] T117 [P] Image optimization for dark theme assets in app/static/
- [ ] T118 Asset preloading for critical path components in app/app.html

## Phase 3.10: Testing and Polish

### Unit Tests
- [ ] T119 [P] Unit tests for UnitConversionService in app/tests/unit/UnitConversionService.test.ts
- [ ] T120 [P] Unit tests for MacroCalculationService in app/tests/unit/MacroCalculationService.test.ts
- [ ] T121 [P] Unit tests for BiometricAuthService in app/tests/unit/BiometricAuthService.test.ts
- [ ] T122 [P] Unit tests for HapticFeedbackService in app/tests/unit/HapticFeedbackService.test.ts
- [ ] T123 [P] Unit tests for OfflineSyncService in app/tests/unit/OfflineSyncService.test.ts

### Performance Tests
- [ ] T124 [P] Animation performance tests (60fps validation) in app/tests/performance/test_animations.test.ts
- [ ] T125 [P] UI response time tests (<500ms) in app/tests/performance/test_ui_response.test.ts
- [ ] T126 [P] Data loading tests (<2s) in app/tests/performance/test_data_loading.test.ts
- [ ] T127 [P] Barcode scan performance tests (<10s) in app/tests/performance/test_barcode_scan.test.ts

### Mobile Device Testing
- [ ] T128 [P] iOS device testing with physical hardware in app/tests/device/ios_device.test.ts
- [ ] T129 [P] Android device testing with physical hardware in app/tests/device/android_device.test.ts
- [ ] T130 [P] iPad landscape mode testing for trainer features in app/tests/device/ipad_trainer.test.ts

### Documentation and Validation
- [ ] T131 [P] Update README.md with mobile development setup
- [ ] T132 [P] Create mobile deployment guide in docs/mobile-deployment.md
- [ ] T133 [P] Document dark theme design system in docs/design-system.md
- [ ] T134 [P] Update API documentation with mobile endpoints in docs/api.md
- [ ] T135 Run complete quickstart validation scenarios
- [ ] T136 Verify constitution compliance and performance targets

## Dependencies

### Critical Path Dependencies
- Setup (T001-T006) → Contract Tests (T007-T029) → Models (T030-T038) → Services (T039-T055)
- Services → UI Components (T056-T076) → Pages (T077-T088) → API Endpoints (T089-T103)
- Core functionality → Mobile Integration (T104-T111) → Performance (T112-T118) → Testing (T119-T136)

### Blocking Dependencies
- T001 blocks T003, T004 (Capacitor dependencies required for platform init)
- T030-T038 (Models) block T039-T055 (Services)
- T039 (BiometricAuthService) blocks T064 (BiometricPrompt), T089-T090 (Auth endpoints)
- T041 (UnitConversionService) blocks T065 (UnitToggle), T092 (Units endpoint)
- T043 (HapticFeedbackService) blocks T067 (WorkoutFeedbackButtons)
- T049 (BarcodeScanningService) blocks T070 (BarcodeScanner), T096 (Barcode endpoint)

### Performance Dependencies
- T112-T114 (Animation optimization) before T124 (Animation performance tests)
- T115-T118 (Bundle optimization) before T125-T127 (Performance tests)
- All core functionality before T128-T130 (Device testing)

## Parallel Execution Examples

### Contract Tests (Can run simultaneously)
```bash
# Launch T007-T021 together (all contract tests):
Task: "Contract test POST /auth/biometric/init in app/tests/contract/test_auth_biometric_init.test.ts"
Task: "Contract test POST /auth/biometric/verify in app/tests/contract/test_auth_biometric_verify.test.ts"
Task: "Contract test GET /user/profile in app/tests/contract/test_user_profile_get.test.ts"
# ... (continue with all contract tests)
```

### Models (Independent file creation)
```bash
# Launch T030-T038 together (all data models):
Task: "UserProfile interface with biometric and unit preferences in app/src/lib/types/UserProfile.ts"
Task: "UIState interface for theme and navigation state in app/src/lib/types/UIState.ts"
Task: "WorkoutSession interface with mobile vitals tracking in app/src/lib/types/WorkoutSession.ts"
# ... (continue with all models)
```

### UI Components (Different files, no dependencies)
```bash
# Launch T056-T076 together (all UI components):
Task: "DarkTheme CSS custom properties with color palette in app/src/lib/styles/theme.css"
Task: "LiquidGlass component with backdrop-filter effects in app/src/lib/components/LiquidGlass.svelte"
Task: "CentralOrb component with 90° rotation animation in app/src/lib/components/CentralOrb.svelte"
# ... (continue with all components)
```

## Validation Checklist
- [x] All contracts have corresponding tests (T007-T021)
- [x] All entities have model tasks (T030-T038)
- [x] All tests come before implementation (TDD order maintained)
- [x] Parallel tasks are truly independent (different files)
- [x] Each task specifies exact file path
- [x] No [P] task modifies same file as another [P] task
- [x] Performance targets embedded in relevant tasks
- [x] Mobile-specific validation included (device testing)
- [x] Constitution compliance verified in final tasks