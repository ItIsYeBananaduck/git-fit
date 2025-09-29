/**
 * Backend AI Engine Test Suite
 * Tests for FastAPI endpoints, AI engine functionality, and database integration
 */

import pytest
import asyncio
from httpx import AsyncClient
from unittest.mock import Mock, patch, MagicMock
import json
import numpy as np
from datetime import datetime

# Assuming we can import the modules (in actual deployment)
try:
    from app.enhanced_ai_engine import (
        EnhancedAIEngine, 
        UserPreferenceProfile, 
        WorkoutContext, 
        AIRecommendation
    )
    from app import app
    IMPORTS_AVAILABLE = True
except ImportError:
    IMPORTS_AVAILABLE = False

class TestEnhancedAIEngine:
    """Test suite for the Enhanced AI Engine core functionality"""
    
    @pytest.fixture
    def mock_ai_engine(self):
        """Create a mock AI engine for testing"""
        engine = Mock(spec=EnhancedAIEngine)
        engine.model = Mock()
        engine.tokenizer = Mock()
        return engine
    
    @pytest.fixture
    def sample_user_profile(self):
        """Sample user preference profile for testing"""
        return {
            'user_id': 'test_user_123',
            'preferred_intensity': 7.5,
            'volume_tolerance': 8.0,
            'rest_time_preference': 90,
            'exercise_variety': 6.5,
            'progression_rate': 7.0,
            'form_focus': 8.5,
            'acceptance_rate': 0.85,
            'modification_frequency': 0.12,
            'skip_rate': 0.03,
            'workout_confidence': 0.88,
            'exercise_confidence': 0.82,
            'intensity_confidence': 0.79,
            'total_interactions': 147,
            'last_updated': datetime.now().isoformat(),
            'learning_rate': 0.05
        }
    
    @pytest.fixture
    def sample_exercise_data(self):
        """Sample exercise data for testing"""
        return {
            'exercise_name': 'Bench Press',
            'planned_sets': 3,
            'planned_reps': 10,
            'planned_weight': 135,
            'current_set': 2
        }
    
    @pytest.fixture
    def sample_workout_context(self):
        """Sample workout context for testing"""
        return {
            'time_of_day': 'morning',
            'day_of_week': 2,  # Tuesday
            'user_energy': 8,
            'user_motivation': 7,
            'available_time': 60,
            'equipment_availability': ['barbell', 'bench', 'dumbbells'],
            'gym_crowding': 'medium'
        }

    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="AI engine imports not available")
    def test_user_preference_profile_creation(self, sample_user_profile):
        """Test UserPreferenceProfile creation and validation"""
        profile = UserPreferenceProfile(**sample_user_profile)
        
        assert profile.user_id == 'test_user_123'
        assert profile.preferred_intensity == 7.5
        assert profile.acceptance_rate == 0.85
        assert profile.total_interactions == 147
        
        # Test preference boundaries
        assert 0 <= profile.preferred_intensity <= 10
        assert 0 <= profile.acceptance_rate <= 1
        assert profile.learning_rate > 0
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="AI engine imports not available")
    def test_workout_context_creation(self, sample_workout_context):
        """Test WorkoutContext creation and validation"""
        context = WorkoutContext(**sample_workout_context)
        
        assert context.time_of_day in ['morning', 'afternoon', 'evening']
        assert 1 <= context.day_of_week <= 7
        assert 1 <= context.user_energy <= 10
        assert context.available_time > 0
        assert isinstance(context.equipment_availability, list)
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="AI engine imports not available")
    def test_safety_constraints_validation(self):
        """Test that safety constraints are properly enforced"""
        engine = EnhancedAIEngine()
        
        # Test weight increase constraint (max 10%)
        original_weight = 100
        safe_increase = engine._apply_safety_constraints('increase_weight', original_weight, 110)
        unsafe_increase = engine._apply_safety_constraints('increase_weight', original_weight, 120)
        
        assert safe_increase == 110  # Within 10% limit
        assert unsafe_increase == 110  # Capped at 10% limit
        
        # Test rep decrease constraint (min 80%)
        original_reps = 10
        safe_decrease = engine._apply_safety_constraints('decrease_reps', original_reps, 8)
        unsafe_decrease = engine._apply_safety_constraints('decrease_reps', original_reps, 6)
        
        assert safe_decrease == 8  # Within 80% limit
        assert unsafe_decrease == 8  # Capped at 80% limit
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="AI engine imports not available")
    @patch('pickle.load')
    @patch('pickle.dump')
    def test_preference_learning_algorithm(self, mock_pickle_dump, mock_pickle_load, sample_user_profile):
        """Test preference learning algorithm with exponential moving average"""
        # Mock existing profile
        existing_profile = UserPreferenceProfile(**sample_user_profile)
        mock_pickle_load.return_value = existing_profile
        
        engine = EnhancedAIEngine()
        
        # Simulate user feedback that indicates higher intensity preference
        feedback = {
            'accepted': True,
            'difficulty_rating': 6,  # User found it easy
            'effectiveness_rating': 9,
            'custom_adjustment': None
        }
        
        # Process feedback
        engine.process_user_feedback('test_user_123', 'tweak_123', feedback)
        
        # Verify profile was updated
        mock_pickle_dump.assert_called()
        
        # Check that learning algorithm was applied
        saved_profile = mock_pickle_dump.call_args[0][0]
        assert isinstance(saved_profile, UserPreferenceProfile)
    
    @pytest.mark.skipif(not IMPORTS_AVAILABLE, reason="AI engine imports not available")
    def test_ai_recommendation_generation(self, mock_ai_engine, sample_exercise_data, sample_workout_context):
        """Test AI recommendation generation process"""
        # Mock the model's text generation
        mock_ai_engine.model.generate.return_value = [torch.tensor([1, 2, 3, 4])]
        mock_ai_engine.tokenizer.decode.return_value = "increase weight slightly for progressive overload"
        
        engine = EnhancedAIEngine()
        engine.model = mock_ai_engine.model
        engine.tokenizer = mock_ai_engine.tokenizer
        
        # Generate recommendation
        with patch.object(engine, '_analyze_workout_context') as mock_analyze:
            mock_analyze.return_value = {
                'energy_alignment': 0.8,
                'time_pressure': 0.3,
                'equipment_constraints': 0.1,
                'fatigue_indicators': 0.2
            }
            
            recommendation = engine.generate_personalized_recommendation(
                'test_user_123',
                sample_exercise_data,
                WorkoutContext(**sample_workout_context),
                'exercise_start'
            )
            
            assert isinstance(recommendation, AIRecommendation)
            assert recommendation.confidence > 0
            assert recommendation.confidence <= 1
            assert recommendation.type in [
                'increase_weight', 'decrease_weight', 'adjust_reps', 
                'modify_rest', 'change_exercise', 'add_warmup', 'suggest_form_focus'
            ]
            assert recommendation.risk_assessment in ['low', 'medium', 'high']
    
    def test_fallback_mechanism(self):
        """Test fallback mechanism when AI model is unavailable"""
        engine = EnhancedAIEngine()
        engine.model = None  # Simulate model not loaded
        
        exercise_data = {
            'exercise_name': 'Squat',
            'planned_sets': 3,
            'planned_reps': 8,
            'planned_weight': 185,
            'current_set': 2
        }
        
        # Should use fallback logic
        recommendation = engine._generate_fallback_recommendation(
            'test_user', exercise_data, 'form_degradation'
        )
        
        assert recommendation.type in ['decrease_weight', 'reduce_reps', 'add_rest']
        assert recommendation.confidence < 0.7  # Fallback should have lower confidence
        assert 'fallback' in recommendation.reasoning.lower()
    
    def test_user_insights_generation(self, sample_user_profile):
        """Test user insights generation"""
        engine = EnhancedAIEngine()
        
        with patch.object(engine, 'get_user_profile') as mock_profile:
            mock_profile.return_value = UserPreferenceProfile(**sample_user_profile)
            
            insights = engine.get_user_insights('test_user_123')
            
            assert 'preference_summary' in insights
            assert 'performance_trends' in insights
            assert 'ai_effectiveness' in insights
            assert 'next_focus_areas' in insights
            
            # Validate data types
            assert isinstance(insights['preference_summary']['preferred_intensity'], (int, float))
            assert isinstance(insights['performance_trends']['acceptance_rate'], (int, float))
            assert isinstance(insights['next_focus_areas'], list)


class TestFastAPIEndpoints:
    """Test suite for FastAPI endpoints"""
    
    @pytest.fixture
    async def async_client(self):
        """Create async client for testing FastAPI endpoints"""
        async with AsyncClient(app=app, base_url="http://test") as client:
            yield client
    
    @pytest.mark.asyncio
    async def test_recommendation_endpoint(self, async_client):
        """Test /recommendation endpoint"""
        request_data = {
            "user_id": "test_user_123",
            "exercise_data": {
                "exercise_name": "Bench Press",
                "planned_sets": 3,
                "planned_reps": 10,
                "planned_weight": 135,
                "current_set": 1
            },
            "context": {
                "time_of_day": "morning",
                "day_of_week": 2,
                "user_energy": 8,
                "user_motivation": 7,
                "available_time": 60
            },
            "event_type": "exercise_start"
        }
        
        with patch('app.get_enhanced_engine') as mock_engine:
            # Mock successful recommendation
            mock_engine.return_value.generate_personalized_recommendation.return_value = AIRecommendation(
                type='increase_weight',
                original_value=135,
                suggested_value=140,
                confidence=0.85,
                reasoning='Based on recent progress',
                factors=['progression', 'energy_level'],
                expected_outcome='Continued strength gains',
                risk_assessment='low'
            )
            
            response = await async_client.post("/recommendation", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] == True
            assert 'recommendation' in data
            assert data['recommendation']['confidence'] > 0.8
    
    @pytest.mark.asyncio
    async def test_feedback_endpoint(self, async_client):
        """Test /feedback endpoint"""
        feedback_data = {
            "user_id": "test_user_123",
            "tweak_id": "tweak_456",
            "feedback": {
                "accepted": True,
                "difficulty_rating": 7,
                "effectiveness_rating": 8,
                "perceived_exertion": 6,
                "form_quality": 9,
                "notes": "Felt great!"
            }
        }
        
        with patch('app.get_enhanced_engine') as mock_engine:
            mock_engine.return_value.process_user_feedback.return_value = None
            
            response = await async_client.post("/feedback", json=feedback_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] == True
            assert data['user_id'] == 'test_user_123'
    
    @pytest.mark.asyncio
    async def test_user_insights_endpoint(self, async_client):
        """Test /user/{user_id}/insights endpoint"""
        mock_insights = {
            'preference_summary': {
                'preferred_intensity': 7.5,
                'volume_tolerance': 8.0,
                'progression_rate': 7.2,
                'workout_style': 'strength-focused'
            },
            'performance_trends': {
                'acceptance_rate': 0.85,
                'improvement_rate': 0.78,
                'consistency_score': 0.92
            }
        }
        
        with patch('app.get_enhanced_engine') as mock_engine:
            mock_engine.return_value.get_user_insights.return_value = mock_insights
            
            response = await async_client.get("/user/test_user_123/insights")
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] == True
            assert 'insights' in data
            assert data['insights']['preference_summary']['preferred_intensity'] == 7.5
    
    @pytest.mark.asyncio
    async def test_user_profile_endpoint(self, async_client):
        """Test /user/{user_id}/profile endpoint"""
        mock_profile = {
            'user_id': 'test_user_123',
            'preferred_intensity': 7.5,
            'acceptance_rate': 0.85,
            'total_interactions': 156
        }
        
        with patch('app.get_enhanced_engine') as mock_engine:
            mock_engine.return_value.get_user_profile.return_value = type('MockProfile', (), mock_profile)()
            
            response = await async_client.get("/user/test_user_123/profile")
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] == True
            assert 'profile' in data
            assert data['profile']['user_id'] == 'test_user_123'
    
    @pytest.mark.asyncio
    async def test_legacy_event_endpoint(self, async_client):
        """Test legacy /event endpoint for backward compatibility"""
        event_data = {
            "user_id": "test_user_123",
            "event": "form_degradation",
            "user_data": {
                "energy_level": 6,
                "motivation": 7
            },
            "context": {
                "exercise": "Squat",
                "planned_sets": 3,
                "planned_reps": 8,
                "current_set": 2
            }
        }
        
        with patch('app.get_enhanced_engine') as mock_engine:
            mock_recommendation = AIRecommendation(
                type='decrease_weight',
                original_value=185,
                suggested_value=175,
                confidence=0.78,
                reasoning='Form quality maintenance',
                factors=['form_degradation'],
                expected_outcome='Better form execution',
                risk_assessment='low'
            )
            mock_engine.return_value.generate_personalized_recommendation.return_value = mock_recommendation
            
            response = await async_client.post("/event", json=event_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data['success'] == True
            assert data['ai_powered'] == True
            assert data['enhanced_ai'] == True
    
    @pytest.mark.asyncio
    async def test_error_handling(self, async_client):
        """Test error handling in endpoints"""
        # Test with missing required fields
        incomplete_request = {
            "user_id": "test_user_123"
            # Missing required fields
        }
        
        response = await async_client.post("/recommendation", json=incomplete_request)
        assert response.status_code == 422  # Validation error
        
        # Test with engine not available
        with patch('app.get_enhanced_engine') as mock_engine:
            mock_engine.return_value = None
            
            complete_request = {
                "user_id": "test_user_123",
                "exercise_data": {
                    "exercise_name": "Test",
                    "planned_sets": 1,
                    "planned_reps": 1,
                    "planned_weight": 100,
                    "current_set": 1
                },
                "context": {"time_of_day": "morning", "day_of_week": 1},
                "event_type": "test"
            }
            
            response = await async_client.post("/recommendation", json=complete_request)
            assert response.status_code == 503  # Service unavailable


class TestPerformanceAndScalability:
    """Test suite for performance and scalability"""
    
    def test_recommendation_generation_performance(self):
        """Test recommendation generation performance"""
        engine = EnhancedAIEngine()
        
        exercise_data = {
            'exercise_name': 'Performance Test',
            'planned_sets': 3,
            'planned_reps': 10,
            'planned_weight': 100,
            'current_set': 1
        }
        
        context = WorkoutContext(
            time_of_day='morning',
            day_of_week=1,
            user_energy=8,
            user_motivation=7,
            available_time=60
        )
        
        import time
        start_time = time.time()
        
        # Generate multiple recommendations to test performance
        with patch.object(engine, 'model') as mock_model:
            mock_model.generate.return_value = [torch.tensor([1, 2, 3])]
            
            for i in range(10):
                engine.generate_personalized_recommendation(
                    f'perf_user_{i}', exercise_data, context, 'performance_test'
                )
        
        end_time = time.time()
        avg_time = (end_time - start_time) / 10
        
        # Should generate recommendation in under 1 second
        assert avg_time < 1.0, f"Average recommendation time {avg_time:.3f}s exceeds 1.0s threshold"
    
    def test_memory_usage_optimization(self):
        """Test memory usage remains reasonable"""
        engine = EnhancedAIEngine()
        
        # Simulate multiple user profiles in memory
        user_profiles = {}
        for i in range(100):
            user_id = f'memory_test_user_{i}'
            profile = UserPreferenceProfile(
                user_id=user_id,
                preferred_intensity=7.0,
                volume_tolerance=8.0,
                acceptance_rate=0.85,
                total_interactions=50
            )
            user_profiles[user_id] = profile
        
        # Memory usage should be reasonable
        import sys
        profile_size = sys.getsizeof(user_profiles)
        assert profile_size < 1_000_000, f"User profiles using {profile_size} bytes, exceeds 1MB limit"


# Integration test configuration
if __name__ == "__main__":
    pytest.main([
        __file__,
        "-v",
        "--asyncio-mode=auto",
        "--cov=app",
        "--cov-report=html",
        "--cov-report=term-missing"
    ])