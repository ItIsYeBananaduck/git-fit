// Test Implementation for AI Integration Rules
// Tests the example scenario: 4-week cycle, 40% squats completion, HR 145, 70% success
// Expected result: "replace squats with lunges"

import { AIWorkoutIntegrationService } from '../aiWorkoutIntegration.js';
import { MesocycleTrackerService } from '../mesocycleTracker.js';
import { DailyStrainAssessmentService } from '../dailyStrainAssessmentService.js';

export class AIIntegrationTest {
  private aiService: AIWorkoutIntegrationService;
  private mesocycleService: MesocycleTrackerService;
  
  constructor() {
    const strainService = new DailyStrainAssessmentService();
    this.aiService = new AIWorkoutIntegrationService(strainService);
    this.mesocycleService = new MesocycleTrackerService();
  }

  /**
   * Test the example scenario from the requirements
   */
  async testExampleScenario() {
    console.log('🧪 Testing AI Integration with Example Scenario');
    console.log('Scenario: 4-week cycle, 40% squats completion, HR 145, 70% success');
    console.log('Expected: "replace squats with lunges"');
    console.log('---');

    // Setup test data
    const testUserId = 'test_user_001';
    const testContext = this.createTestContext(testUserId);
    
    // Create completed 4-week mesocycle with low squat completion
    this.setupCompletedMesocycle(testUserId);
    
    // Test AI implementation
    const result = await this.aiService.getAIImplementation(testContext);
    
    // Validate results
    this.validateTestResults(result);
    
    return result;
  }

  /**
   * Create test workout context matching the example scenario
   */
  private createTestContext(userId: string) {
    return {
      userId,
      currentExercise: 'squat',
      currentWeight: 105, // lbs from example
      currentReps: 6,     // reps from example
      heartRate: 145,     // HR from example (below 85% max of ~161 for 30yr old)
      spo2: 97,          // Normal SpO2
      lastWorkouts: [
        {
          date: '2025-09-17',
          exercises: ['squat', 'bench_press', 'deadlift'],
          avgHeartRate: 140,
          feedback: 'moderate' as const
        },
        {
          date: '2025-09-14', 
          exercises: ['squat', 'bench_press', 'rows'],
          avgHeartRate: 148,
          feedback: 'hard' as const
        },
        {
          date: '2025-09-10',
          exercises: ['squat', 'overhead_press', 'deadlift'],
          avgHeartRate: 142,
          feedback: 'moderate' as const
        }
      ],
      userPrefs: {
        blacklistedExercises: [],
        preferredExercises: ['lunges', 'leg_press'], // User prefers these alternatives
        successRates: {
          'squat': 0.70,      // 70% success rate from example
          'bench_press': 0.85,
          'deadlift': 0.75
        },
        maxHeartRate: 161,    // 85% of 190 (220-30 for 30yr old)
        calibrated: true,
        age: 30,
        exerciseSwapCounts: {
          'squat': 2          // Swapped twice, not yet at blacklist threshold
        }
      }
    };
  }

  /**
   * Setup a completed 4-week mesocycle with low squat completion rate
   */
  private setupCompletedMesocycle(userId: string) {
    // Reset mesocycle for clean test
    this.mesocycleService.resetMesocycle(userId);
    
    // Simulate 4 completed weeks with low squat completion
    const weeks = [
      {
        week: 1,
        progressionType: 'add_set' as const,
        exerciseCompletionRates: {
          'squat': 0.45,        // Week 1: 45% completion
          'bench_press': 0.90,
          'deadlift': 0.85
        },
        successRates: {
          'squat': 0.60,
          'bench_press': 0.95,
          'deadlift': 0.80
        },
        implemented: true,
        date: '2025-09-03'
      },
      {
        week: 2,
        progressionType: 'add_volume' as const, // +5 lbs
        exerciseCompletionRates: {
          'squat': 0.35,        // Week 2: 35% completion (getting worse)
          'bench_press': 0.88,
          'deadlift': 0.90
        },
        successRates: {
          'squat': 0.65,
          'bench_press': 0.90,
          'deadlift': 0.85
        },
        implemented: true,
        date: '2025-09-10'
      },
      {
        week: 3,
        progressionType: 'add_rep' as const,
        exerciseCompletionRates: {
          'squat': 0.40,        // Week 3: 40% completion (example scenario)
          'bench_press': 0.95,
          'deadlift': 0.80
        },
        successRates: {
          'squat': 0.70,        // 70% success from example
          'bench_press': 0.85,
          'deadlift': 0.90
        },
        implemented: true,
        date: '2025-09-17'
      },
      {
        week: 4,
        progressionType: 'add_set' as const,
        exerciseCompletionRates: {
          'squat': 0.38,        // Week 4: 38% completion (still under 50%)
          'bench_press': 0.92,
          'deadlift': 0.88
        },
        successRates: {
          'squat': 0.75,
          'bench_press': 0.90,
          'deadlift': 0.85
        },
        implemented: true,
        date: '2025-09-24'
      }
    ];

    // Manually create completed mesocycle data
    const mesocycleData = {
      currentWeek: 5, // Past 4 weeks, ready for new mesocycle
      startDate: '2025-09-03',
      weeks,
      completedCycles: 1,
      nextProgression: 'add_rep' as const
    };

    // Save to localStorage for test
    localStorage.setItem(`mesocycle_data_${userId}`, JSON.stringify(mesocycleData));
    
    console.log('📊 Test Mesocycle Setup:');
    console.log(`- 4 weeks completed`);
    console.log(`- Squat avg completion: ${weeks.reduce((sum, w) => sum + w.exerciseCompletionRates.squat, 0) / 4 * 100}%`);
    console.log(`- Squat avg success: ${weeks.reduce((sum, w) => sum + w.successRates.squat, 0) / 4 * 100}%`);
  }

  /**
   * Validate that the AI returns the expected result
   */
  private validateTestResults(result) {
    console.log('🔍 Test Results:');
    console.log(`- Type: ${result.type}`);
    console.log(`- Reason: ${result.reason}`);
    console.log(`- Applied: ${result.applied}`);
    
    if (result.replacementExercise) {
      console.log(`- Replacement: ${result.exercise} → ${result.replacementExercise}`);
    }
    
    console.log('---');
    
    // Check if result matches expected behavior
    const isExpectedResult = (
      result.type === 'swap_exercise' &&
      result.exercise === 'squat' &&
      result.replacementExercise === 'lunges' &&
      result.applied === true
    );
    
    if (isExpectedResult) {
      console.log('✅ TEST PASSED: AI correctly identified squats need replacement');
      console.log('✅ Expected muscle group replacement (squat → lunges)');
      console.log('✅ Change applied automatically as expected');
    } else {
      console.log('❌ TEST RESULT UNEXPECTED');
      console.log('Expected: swap_exercise, squat → lunges, applied: true');
      console.log('Actual:', JSON.stringify(result, null, 2));
    }
    
    return isExpectedResult;
  }

  /**
   * Test strain limits enforcement
   */
  async testStrainLimits() {
    console.log('\n🫀 Testing Strain Limits Enforcement');
    
    const testContext = this.createTestContext('test_strain_user');
    // Simulate high heart rate exceeding 85% max
    testContext.heartRate = 170; // Exceeds 161 BPM max
    
    const result = await this.aiService.getAIImplementation(testContext);
    
    console.log(`Heart Rate: ${testContext.heartRate} BPM (max: ${testContext.userPrefs.maxHeartRate})`);
    console.log(`Result: ${result.type} - ${result.reason}`);
    
    const isStrainProtected = result.type === 'increase_rest' && result.applied === true;
    console.log(isStrainProtected ? '✅ Strain protection working' : '❌ Strain protection failed');
    
    return isStrainProtected;
  }

  /**
   * Test blacklist prompt after 3+ exercise swaps
   */
  async testBlacklistPrompt() {
    console.log('\n🚫 Testing Blacklist Prompt (3+ swaps)');
    
    const userId = 'test_blacklist_user';
    
    // Simulate 3 swaps to trigger blacklist prompt
    await this.aiService.trackExerciseSwap(userId, 'deadlift'); // 1st swap
    await this.aiService.trackExerciseSwap(userId, 'deadlift'); // 2nd swap
    const result = await this.aiService.trackExerciseSwap(userId, 'deadlift'); // 3rd swap - should trigger
    
    const isBlacklistTriggered = (
      result?.type === 'blacklist_exercise' &&
      result.exercise === 'deadlift' &&
      result.applied === false // Requires user confirmation
    );
    
    console.log(`Result: ${result?.reason || 'No blacklist prompt'}`);
    console.log(isBlacklistTriggered ? '✅ Blacklist prompt working' : '❌ Blacklist prompt failed');
    
    return isBlacklistTriggered;
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    console.log('🚀 Running AI Integration Rule Tests');
    console.log('=====================================\n');
    
    const results = {
      exampleScenario: await this.testExampleScenario(),
      strainLimits: await this.testStrainLimits(),
      blacklistPrompt: await this.testBlacklistPrompt()
    };
    
    console.log('\n📊 Test Summary:');
    console.log(`Example Scenario (squat → lunges): ${results.exampleScenario ? '✅' : '❌'}`);
    console.log(`Strain Limits Protection: ${results.strainLimits ? '✅' : '❌'}`);
    console.log(`Blacklist Prompt (3+ swaps): ${results.blacklistPrompt ? '✅' : '❌'}`);
    
    const allPassed = Object.values(results).every(Boolean);
    console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED'}`);
    
    return { results, allPassed };
  }
}

// Vitest test integration
import { describe, it, expect } from 'vitest';

describe('AI Integration Tests', () => {
  it('should pass all AI integration scenarios', async () => {
    const testRunner = new AIIntegrationTest();
    const { results, allPassed } = await testRunner.runAllTests();
    
    expect(allPassed).toBe(true);
    expect(results.exampleScenario).toBe(true);
    expect(results.strainLimits).toBe(true);  
    expect(results.blacklistPrompt).toBe(true);
  });
});