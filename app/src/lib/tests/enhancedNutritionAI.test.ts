import { nutritionService } from '$lib/services/nutritionAI.js';

// Test data for Enhanced Nutrition AI system
const testUserId = 'test-user-123';

const testHealthProfile = {
  medical_conditions: ['diabetes'],
  allergies: ['peanuts'],
  medications: ['metformin'],
  safety_flags: {
    diabetesFlag: true,
    heartConditionFlag: false,
    kidneyIssueFlag: false,
    digestiveIssueFlag: false,
    eatingDisorderHistory: false,
  },
  metabolic_data: {
    bmr: 1800,
    tdee: 2400,
  },
  body_weight_kg: 75,
};

const testRecoveryData = {
  date: new Date().toISOString().split('T')[0],
  recovery_score: 60,
  sleep_quality: 6,
  sleep_duration: 7,
  hrv_rmssd: 40,
  stress_level: 5,
  source: 'test',
};

const testCurrentIntake = {
  calories: 1800,
  protein: 85,
  carbs: 200,
  fat: 70,
  hydration: 2.0,
};

const testGoals = {
  calories: 2200,
  protein: 110,
  carbs: 250,
  fat: 80,
  hydration: 3.5,
};

async function testEnhancedNutritionAI() {
  console.log('🧪 Testing Enhanced Nutrition AI System...\n');

  // Test 1: Nutrition Recommendations
  console.log('1. Testing Nutrition Recommendations...');
  try {
    const recommendations = await nutritionService.getNutritionRecommendations(
      testUserId,
      testHealthProfile,
      testRecoveryData,
      testCurrentIntake,
      testGoals
    );
    
    if (recommendations.success) {
      console.log('✅ Nutrition recommendations generated successfully');
      console.log(`   - Generated ${recommendations.recommendations.length} recommendations`);
      console.log(`   - Safety alerts: ${recommendations.safety_alerts.length}`);
      console.log(`   - Adjustments made: ${recommendations.adjustments_made.length}`);
    } else {
      console.log('❌ Failed to generate recommendations:', recommendations.error);
    }
  } catch (error) {
    console.log('❌ Error testing recommendations:', error.message);
  }

  // Test 2: Hydration Recommendations
  console.log('\n2. Testing Hydration Recommendations...');
  try {
    const hydration = await nutritionService.getHydrationRecommendations(
      testUserId,
      testCurrentIntake.hydration * 1000, // Convert to ml
      testRecoveryData,
      testHealthProfile
    );
    
    if (hydration.success) {
      console.log('✅ Hydration recommendations generated successfully');
      console.log(`   - Generated ${hydration.recommendations.length} hydration recommendations`);
    } else {
      console.log('❌ Failed to generate hydration recommendations:', hydration.error);
    }
  } catch (error) {
    console.log('❌ Error testing hydration:', error.message);
  }

  // Test 3: Safety Check
  console.log('\n3. Testing Safety Check...');
  try {
    const safetyCheck = await nutritionService.performSafetyCheck(
      testUserId,
      {
        ...testCurrentIntake,
        water_ml: testCurrentIntake.hydration * 1000,
      },
      testHealthProfile
    );
    
    if (safetyCheck.success) {
      console.log('✅ Safety check completed successfully');
      console.log(`   - Overall safe: ${safetyCheck.safety_status.overall_safe}`);
      console.log(`   - Safety alerts: ${safetyCheck.safety_status.alerts?.length || 0}`);
    } else {
      console.log('❌ Failed to perform safety check:', safetyCheck.error);
    }
  } catch (error) {
    console.log('❌ Error testing safety check:', error.message);
  }

  // Test 4: Nutrition Insights
  console.log('\n4. Testing Nutrition Insights...');
  try {
    const insights = await nutritionService.getNutritionInsights(testUserId, 30);
    
    if (insights.success) {
      console.log('✅ Nutrition insights generated successfully');
      console.log('   - Insights contain trend analysis and performance metrics');
    } else {
      console.log('❌ Failed to generate insights:', insights.error);
    }
  } catch (error) {
    console.log('❌ Error testing insights:', error.message);
  }

  // Test 5: Feedback
  console.log('\n5. Testing Feedback System...');
  try {
    const feedback = await nutritionService.provideFeedback(
      testUserId,
      'test-recommendation-123',
      {
        accepted: true,
        implemented: true,
        feedback: 'Test feedback for nutrition AI',
      }
    );
    
    if (feedback.success) {
      console.log('✅ Feedback submitted successfully');
    } else {
      console.log('❌ Failed to submit feedback:', feedback.error);
    }
  } catch (error) {
    console.log('❌ Error testing feedback:', error.message);
  }

  console.log('\n🎉 Enhanced Nutrition AI testing completed!');
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  testEnhancedNutritionAI();
} else {
  console.log('Enhanced Nutrition AI Test Suite');
  console.log('Run this in a browser environment to test the frontend service');
}

export { testEnhancedNutritionAI };