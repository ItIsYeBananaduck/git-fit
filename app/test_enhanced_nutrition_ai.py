#!/usr/bin/env python3
"""
Test script for Enhanced Nutrition AI Backend
Tests the core functionality of the enhanced nutrition AI system.
"""

import sys
import os
import json
from datetime import datetime, date

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', '..'))

try:
    from enhanced_nutrition_ai import (
        EnhancedNutritionAI, 
        UserHealthProfile, 
        RecoveryMetrics,
        NutritionSafetyMonitor
    )
    print("✅ Enhanced Nutrition AI modules imported successfully")
except ImportError as e:
    print(f"❌ Failed to import Enhanced Nutrition AI: {e}")
    sys.exit(1)

def test_enhanced_nutrition_ai():
    """Test the Enhanced Nutrition AI system"""
    print("🧪 Testing Enhanced Nutrition AI Backend System...\n")
    
    # Test data
    health_profile = UserHealthProfile(
        user_id="test-user-123",
        medical_conditions=["diabetes"],
        allergies=["peanuts"],
        medications=[{"name": "metformin", "nutritionInteractions": []}],
        safety_flags={
            "diabetesFlag": True,
            "heartConditionFlag": False,
            "kidneyIssueFlag": False,
            "digestiveIssueFlag": False,
            "eatingDisorderHistory": False,
        },
        metabolic_data={
            "bmr": 1800,
            "tdee": 2400,
        }
    )
    
    recovery_data = RecoveryMetrics(
        user_id="test-user-123",
        date=date.today().isoformat(),
        hrv_score=40.0,
        resting_heart_rate=65.0,
        recovery_score=60,
        sleep_quality=6.0,
        sleep_duration=7.0,
        stress_level=5.0,
        hydration_status=70.0,
        source="test"
    )
    
    current_intake = {
        "calories": 1800,
        "protein": 85,
        "carbs": 200,
        "fat": 70,
        "hydration": 2.0,
    }
    
    goals = {
        "calories": 2200,
        "protein": 110,
        "carbs": 250,
        "fat": 80,
        "hydration": 3.5,
    }
    
    # Test 1: Initialize AI system
    print("1. Testing AI System Initialization...")
    try:
        nutrition_ai = EnhancedNutritionAI()
        print("✅ Enhanced Nutrition AI initialized successfully")
    except Exception as e:
        print(f"❌ Failed to initialize AI: {e}")
        return
    
    # Test 3: Generate Recommendations
    print("\n3. Testing Recommendation Generation...")
    try:
        recommendations = nutrition_ai.generate_nutrition_recommendations(
            user_id="test-user-123",
            health_profile=health_profile,
            recovery_metrics=recovery_data,
            current_intake=current_intake,
            goals=goals
        )
        print(f"✅ Generated {len(recommendations)} recommendations")
        
        # Print a sample recommendation
        if recommendations:
            sample_rec = recommendations[0]
            print(f"   - Sample: {sample_rec.title} (Priority: {sample_rec.priority})")
    except Exception as e:
        print(f"❌ Failed to generate recommendations: {e}")
    
    # Test 4: Hydration Recommendations
    print("\n4. Testing Hydration Recommendations...")
    try:
        hydration_recs = nutrition_ai.generate_hydration_recommendations(
            user_id="test-user-123",
            recovery_metrics=recovery_data,
            current_intake=2.0,  # liters
            target_intake=3.5    # liters
        )
        print(f"✅ Generated {len(hydration_recs)} hydration recommendations")
        if hydration_recs:
            print(f"   - First recommendation: {hydration_recs[0]['amount']}L at {hydration_recs[0]['time']}")
    except Exception as e:
        print(f"❌ Failed to generate hydration recommendations: {e}")
    
    # Test 5: Goal Adjustment
    print("\n5. Testing Recovery-Based Goal Adjustment...")
    try:
        result = nutrition_ai.get_recovery_adjusted_goals(
            user_id="test-user-123",
            base_goals=goals, 
            recovery_metrics=recovery_data
        )
        adjusted_goals = result['adjusted_goals']
        adjustments_made = result['adjustments_made']
        print("✅ Goals adjusted for recovery state")
        print(f"   - Adjusted calories: {adjusted_goals['calories']} (vs {goals['calories']})")
        print(f"   - Adjustments made: {len(adjustments_made)}")
    except Exception as e:
        print(f"❌ Failed to adjust goals: {e}")
    
    # Test 6: Nutrition Insights
    print("\n6. Testing Nutrition Insights...")
    try:
        insights = nutrition_ai.get_nutrition_insights("test-user-123", days=30)
        print("✅ Nutrition insights generated successfully")
        print(f"   - Insights available for analysis")
    except Exception as e:
        print(f"❌ Failed to generate insights: {e}")
    
    # Test 7: Process Feedback
    print("\n7. Testing Feedback Processing...")
    try:
        feedback_result = nutrition_ai.process_nutrition_feedback(
            user_id="test-user-123",
            recommendation_id="test-rec-123",
            feedback={
                "accepted": True,
                "implemented": True,
                "user_notes": "Test feedback"
            }
        )
        print("✅ Feedback processed successfully")
    except Exception as e:
        print(f"❌ Failed to process feedback: {e}")
    
    print("\n🎉 Enhanced Nutrition AI backend testing completed!")

if __name__ == "__main__":
    test_enhanced_nutrition_ai()