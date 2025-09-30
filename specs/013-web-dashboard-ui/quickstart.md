# Quickstart Guide: Web Dashboard UI

**Purpose**: Validate core user scenarios through integration testing  
**Prerequisites**: SvelteKit + Convex development environment  
**Test Framework**: Vitest + @testing-library/svelte

## User Story Validation

### Story 1: Client Views Workout Summaries
**Scenario**: User accesses web dashboard and sees mobile workout data

**Test Steps**:
1. **Setup**: Create test user with completed mobile workouts
2. **Authentication**: Login via WebAuthn or email fallback
3. **Navigation**: Access Workouts tab in main navigation
4. **Verification**: 
   - Workout cards display in mobile-matching visual style
   - Exercise completion status shown (e.g., "2/3 sets done")
   - Skip reasons visible (e.g., "skipped 1: tired")
   - Performance notes accessible
   - Past 3 workouts in sidebar (wide screens)

**Acceptance Criteria**:
```javascript
// Integration test structure
describe('Workout Summary Display', () => {
  test('displays workout summaries with mobile data', async () => {
    // Arrange: User with mobile workout history
    const user = await createTestUser();
    await createMobileWorkouts(user, 3);
    
    // Act: Navigate to dashboard
    await loginUser(user);
    await navigate('/workouts');
    
    // Assert: Workout summaries displayed correctly
    expect(screen.getByText('Leg Day: 2/3 sets done')).toBeInTheDocument();
    expect(screen.getByText('skipped 1: tired')).toBeInTheDocument();
    expect(screen.getAllByTestId('workout-card')).toHaveLength(3);
  });
});
```

### Story 2: Trainer QR Code Linking
**Scenario**: Client generates QR code and trainer scans for permanent access

**Test Steps**:
1. **Setup**: Create client and trainer accounts
2. **QR Generation**: Client navigates to Profile → Generate QR Code
3. **QR Scanning**: Trainer scans QR code via mobile app (simulated)
4. **Verification**:
   - Permanent relationship established
   - Trainer can access client workout summaries
   - Audit log entry created
   - Client can revoke access if needed

**Acceptance Criteria**:
```javascript
describe('Trainer Access Flow', () => {
  test('establishes permanent trainer-client relationship', async () => {
    // Arrange: Client and trainer accounts
    const client = await createTestUser('client');
    const trainer = await createTestUser('trainer');
    
    // Act: Generate and scan QR code
    await loginUser(client);
    const qrCode = await generateQRCode(['workout_summary', 'csv_export']);
    await scanQRCode(trainer, qrCode);
    
    // Assert: Relationship established
    const relationship = await getTrainerRelationship(trainer.id, client.id);
    expect(relationship.status).toBe('active');
    expect(relationship.permissions).toContain('workout_summary');
    
    // Verify trainer can access client data
    await loginUser(trainer);
    const clientData = await getClientWorkoutData(client.id);
    expect(clientData.workouts).toBeDefined();
  });
});
```

### Story 3: Macro Calculator with AI Adjustments
**Scenario**: User sets up macro goals and receives AI-driven adjustments

**Test Steps**:
1. **Setup**: User completes onboarding with weight and fitness goal
2. **Initial Calculation**: System calculates protein/carbs/fat based on goal
3. **AI Adjustment**: System suggests changes based on workout performance
4. **User Interaction**: User accepts, modifies, or rejects AI suggestions
5. **Verification**:
   - Protein minimum 0.4g/lb enforced
   - Carbs/fat sliders work correctly
   - AI reasoning displayed clearly
   - Weekly energy surveys trigger adjustments

**Acceptance Criteria**:
```javascript
describe('Macro Calculator Integration', () => {
  test('calculates and adjusts macros based on goals and performance', async () => {
    // Arrange: User with fitness goal and workout history
    const user = await createTestUser({
      weight: 150,
      fitnessGoal: 'Muscle Gain'
    });
    await createWorkoutPerformanceHistory(user);
    
    // Act: Generate macro profile
    await loginUser(user);
    await navigate('/macros');
    
    // Assert: Initial calculation correct
    const macros = await getMacroProfile();
    expect(macros.protein).toBeGreaterThanOrEqual(150 * 0.4); // Min protein
    expect(macros.calories).toBe(2500); // Expected for muscle gain
    
    // Act: Trigger AI adjustment
    await submitWeeklySurvey({ energy: 3, sleep: 6 });
    const aiSuggestion = await getAISuggestion();
    
    // Assert: AI provides reasonable adjustment
    expect(aiSuggestion.adjustments.calories).toBeGreaterThan(macros.calories);
    expect(aiSuggestion.reasoning).toContain('low energy');
  });
});
```

### Story 4: Data Conflict Resolution
**Scenario**: Mobile and web data conflicts require user resolution

**Test Steps**:
1. **Setup**: Create conflicting data between mobile and web
2. **Sync Trigger**: User accesses dashboard triggering sync
3. **Conflict Detection**: System identifies conflicting fields
4. **Resolution UI**: Side-by-side comparison interface shown
5. **User Selection**: User chooses mobile vs web per field
6. **Verification**:
   - Conflicts highlighted visually
   - Field-by-field selection works
   - Non-conflicting data auto-merged
   - Final result consistent

**Acceptance Criteria**:
```javascript
describe('Data Conflict Resolution', () => {
  test('resolves mobile-web conflicts with user input', async () => {
    // Arrange: Conflicting workout data
    const user = await createTestUser();
    await createConflictingWorkoutData(user, {
      mobile: { weight: [135, 140, 145] },
      web: { weight: [140, 145, 150] }
    });
    
    // Act: Trigger sync and resolve conflict
    await loginUser(user);
    await navigate('/workouts');
    
    // Assert: Conflict resolution UI displayed
    expect(screen.getByText('Data Conflict Detected')).toBeInTheDocument();
    expect(screen.getByText('Mobile: 135, 140, 145')).toBeInTheDocument();
    expect(screen.getByText('Web: 140, 145, 150')).toBeInTheDocument();
    
    // Act: Select mobile version for weights
    await clickButton('Choose Mobile Version');
    await submitConflictResolution();
    
    // Assert: Resolution applied correctly
    const resolvedWorkout = await getWorkoutData();
    expect(resolvedWorkout.exercises[0].weights).toEqual([135, 140, 145]);
  });
});
```

### Story 5: Custom Food Creation with AI Validation
**Scenario**: User adds custom food and receives AI validation feedback

**Test Steps**:
1. **Setup**: User in Macros tab wants to add custom food
2. **Form Input**: User enters food name and nutritional values
3. **AI Validation**: System flags unusual values for confirmation
4. **User Confirmation**: User can confirm or modify flagged values
5. **Verification**:
   - Custom food saved to personal database
   - AI validation warnings displayed appropriately
   - Food available for future macro logging

**Acceptance Criteria**:
```javascript
describe('Custom Food Management', () => {
  test('creates custom foods with AI validation', async () => {
    // Arrange: User in macros section
    const user = await createTestUser();
    await loginUser(user);
    await navigate('/macros');
    
    // Act: Add custom food with unusual values
    await clickButton('Add Custom Food');
    await fillForm({
      name: 'Super Protein Bar',
      calories: 100,
      protein: 50, // Unusual: 50g protein in 100 calories
      carbs: 5,
      fat: 2
    });
    await submitForm();
    
    // Assert: AI validation triggered
    expect(screen.getByText('Unusual protein content detected')).toBeInTheDocument();
    expect(screen.getByText('50g protein? Double-check?')).toBeInTheDocument();
    
    // Act: Confirm unusual values
    await clickButton('Confirm Values');
    
    // Assert: Food saved successfully
    const customFoods = await getCustomFoods();
    expect(customFoods).toContainEqual(
      expect.objectContaining({
        name: 'Super Protein Bar',
        flaggedAsOutlier: true,
        isVerified: true
      })
    );
  });
});
```

## Performance Validation

### Response Time Requirements
```javascript
describe('Performance Requirements', () => {
  test('interactions respond within 500ms', async () => {
    const user = await createTestUser();
    await loginUser(user);
    
    // Test navigation speed
    const start = performance.now();
    await navigate('/workouts');
    const navigationTime = performance.now() - start;
    expect(navigationTime).toBeLessThan(500);
    
    // Test UI interactions
    const clickStart = performance.now();
    await clickButton('View Details');
    const clickTime = performance.now() - clickStart;
    expect(clickTime).toBeLessThan(500);
  });
  
  test('data loads within 2 seconds', async () => {
    const user = await createTestUserWithLargeDataset();
    await loginUser(user);
    
    const loadStart = performance.now();
    await navigate('/workouts');
    await waitForElement('[data-testid="workout-list"]');
    const loadTime = performance.now() - loadStart;
    
    expect(loadTime).toBeLessThan(2000);
  });
});
```

### Scalability Testing
```javascript
describe('Scalability Validation', () => {
  test('handles concurrent user simulation', async () => {
    // Simulate multiple users accessing dashboard simultaneously
    const users = await createTestUsers(100);
    
    const loadPromises = users.map(async (user) => {
      await loginUser(user);
      return navigate('/workouts');
    });
    
    const results = await Promise.allSettled(loadPromises);
    const failures = results.filter(r => r.status === 'rejected');
    
    // Expect <5% failure rate under load
    expect(failures.length / users.length).toBeLessThan(0.05);
  });
});
```

## Security Validation

### Authentication Security
```javascript
describe('Security Validation', () => {
  test('enforces proper authentication', async () => {
    // Test unauthenticated access blocked
    const response = await fetch('/api/workouts/summaries');
    expect(response.status).toBe(401);
    
    // Test session validation
    const user = await createTestUser();
    const session = await loginUser(user);
    
    // Valid session works
    const authedResponse = await fetch('/api/workouts/summaries', {
      headers: { 'Authorization': `Bearer ${session.token}` }
    });
    expect(authedResponse.status).toBe(200);
  });
  
  test('QR codes expire after 24 hours', async () => {
    const user = await createTestUser();
    await loginUser(user);
    
    const qrCode = await generateQRCode();
    expect(qrCode.expiresAt).toBeLessThanOrEqual(Date.now() + 24 * 60 * 60 * 1000);
    
    // Test expired token rejection
    await timeTravel(25 * 60 * 60 * 1000); // 25 hours
    const scanResult = await scanQRCode(qrCode);
    expect(scanResult.success).toBe(false);
    expect(scanResult.error).toBe('EXPIRED_TOKEN');
  });
});
```

## Visual Style Validation

### Mobile UI Replication
```javascript
describe('Visual Style Validation', () => {
  test('replicates mobile visual style', async () => {
    await setupMobileStyleReference();
    const user = await createTestUser();
    await loginUser(user);
    
    // Take screenshot for visual regression testing
    const dashboard = await navigate('/workouts');
    const screenshot = await page.screenshot();
    
    // Compare with mobile style reference
    expect(screenshot).toMatchImageSnapshot({
      threshold: 0.1, // 10% difference tolerance
      comparisonMethod: 'ssim'
    });
  });
  
  test('responsive design across breakpoints', async () => {
    const breakpoints = [320, 768, 1024, 1440, 2560];
    
    for (const width of breakpoints) {
      await page.setViewportSize({ width, height: 800 });
      await navigate('/workouts');
      
      // Verify layout adapts correctly
      const layout = await page.locator('[data-testid="main-layout"]');
      expect(await layout.isVisible()).toBe(true);
      
      // Verify max-width constraint
      if (width > 1200) {
        const contentWidth = await layout.evaluate(el => el.offsetWidth);
        expect(contentWidth).toBeLessThanOrEqual(1200);
      }
    }
  });
});
```

---

**Quickstart Status**: ✅ Complete  
**Ready for**: Phase 2 task generation via `/tasks` command

## Next Steps

1. **Run Tests**: Execute quickstart scenarios to validate current implementation
2. **Generate Tasks**: Use `/tasks` command to create detailed implementation roadmap
3. **Implement Features**: Follow TDD approach with failing tests first
4. **Validate Performance**: Ensure response time and scalability requirements met
5. **Security Review**: Verify authentication and data protection measures