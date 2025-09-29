"""
Enhanced AI Coaching Engine for Adaptive fIt
Implements comprehensive user preference learning and real-time workout adjustments
"""

import json
import logging
import numpy as np
import pickle
import os
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from collections import defaultdict, deque

logger = logging.getLogger(__name__)

@dataclass  
class UserPreferenceProfile:
    """User preference profile learned from interactions"""
    user_id: str
    
    # Workout Preferences (0-1 scales)
    preferred_intensity: float = 0.7
    volume_tolerance: float = 0.8
    rest_time_preference: float = 90.0  # seconds
    exercise_variety: float = 0.6
    progression_rate: float = 0.5
    form_focus: float = 0.8
    time_constraints: float = 60.0  # minutes
    
    # Feedback Learning
    acceptance_rate: float = 0.5
    modification_frequency: float = 0.3
    skip_rate: float = 0.1
    common_rejection_reasons: List[str] = None
    
    # Confidence Scores (0-1)
    workout_confidence: float = 0.5
    exercise_confidence: float = 0.5
    intensity_confidence: float = 0.5
    
    # Learning Metadata
    total_interactions: int = 0
    last_updated: float = 0.0
    learning_rate: float = 0.1
    
    def __post_init__(self):
        if self.common_rejection_reasons is None:
            self.common_rejection_reasons = []

@dataclass
class WorkoutContext:
    """Context information for AI decision making"""
    time_of_day: str
    day_of_week: int
    user_energy: Optional[float] = None
    user_motivation: Optional[float] = None
    available_time: Optional[float] = None
    equipment_availability: Optional[Dict[str, bool]] = None
    gym_crowding: Optional[str] = None
    previous_performance: Optional[Dict[str, Any]] = None
    wearable_data: Optional[Dict[str, Any]] = None
    
@dataclass  
class AIRecommendation:
    """AI recommendation with detailed reasoning"""
    type: str  # 'weight_adjustment', 'rep_modification', 'rest_change', etc.
    original_value: Any
    suggested_value: Any
    confidence: float
    reasoning: str
    factors: List[str]
    expected_outcome: str
    risk_assessment: str
    alternative_options: List[Dict[str, Any]] = None
    
    def __post_init__(self):
        if self.alternative_options is None:
            self.alternative_options = []

class EnhancedAIEngine:
    """Enhanced AI coaching engine with preference learning and real-time adaptation"""
    
    def __init__(self, model=None, tokenizer=None, user_profiles_path: str = "./user_profiles.pkl"):
        self.model = model
        self.tokenizer = tokenizer
        self.user_profiles_path = user_profiles_path
        self.user_profiles: Dict[str, UserPreferenceProfile] = {}
        self.interaction_history = defaultdict(lambda: deque(maxlen=100))
        
        # Load existing profiles
        self._load_user_profiles()
        
        # Safety constraints
        self.safety_constraints = {
            'min_rep_percentage': 0.8,  # Never suggest < 80% of planned reps
            'max_weight_increase': 0.1,  # Max 10% weight increase per session
            'min_rest_time': 30,  # Minimum rest time in seconds
            'max_session_extension': 0.2,  # Max 20% session duration extension
        }
        
        logger.info("Enhanced AI Engine initialized")
    
    def _load_user_profiles(self):
        """Load user preference profiles from disk"""
        try:
            if os.path.exists(self.user_profiles_path):
                with open(self.user_profiles_path, 'rb') as f:
                    profiles_data = pickle.load(f)
                    self.user_profiles = {
                        uid: UserPreferenceProfile(**data) if isinstance(data, dict) else data
                        for uid, data in profiles_data.items()
                    }
                logger.info(f"Loaded {len(self.user_profiles)} user profiles")
        except Exception as e:
            logger.warning(f"Could not load user profiles: {e}")
            self.user_profiles = {}
    
    def _save_user_profiles(self):
        """Save user preference profiles to disk"""
        try:
            profiles_data = {
                uid: asdict(profile) for uid, profile in self.user_profiles.items()
            }
            with open(self.user_profiles_path, 'wb') as f:
                pickle.dump(profiles_data, f)
            logger.info(f"Saved {len(self.user_profiles)} user profiles")
        except Exception as e:
            logger.error(f"Could not save user profiles: {e}")
    
    def get_user_profile(self, user_id: str) -> UserPreferenceProfile:
        """Get or create user preference profile"""
        if user_id not in self.user_profiles:
            self.user_profiles[user_id] = UserPreferenceProfile(
                user_id=user_id,
                last_updated=datetime.now().timestamp()
            )
        return self.user_profiles[user_id]
    
    def update_user_preferences(self, user_id: str, feedback: Dict[str, Any]) -> None:
        """Update user preferences based on feedback"""
        profile = self.get_user_profile(user_id)
        
        # Extract feedback signals
        action = feedback.get('action', 'ignored')
        rating = feedback.get('rating')
        response_time = feedback.get('response_time')
        modification_reason = feedback.get('modification_reason')
        
        # Update acceptance and modification rates
        profile.total_interactions += 1
        
        if action == 'accepted':
            profile.acceptance_rate = self._exponential_moving_average(
                profile.acceptance_rate, 1.0, profile.learning_rate
            )
        elif action == 'rejected':
            profile.acceptance_rate = self._exponential_moving_average(
                profile.acceptance_rate, 0.0, profile.learning_rate
            )
            if modification_reason:
                profile.common_rejection_reasons.append(modification_reason)
                # Keep only recent rejection reasons
                profile.common_rejection_reasons = profile.common_rejection_reasons[-20:]
        elif action == 'modified':
            profile.modification_frequency = self._exponential_moving_average(
                profile.modification_frequency, 1.0, profile.learning_rate
            )
        
        # Update confidence based on rating
        if rating is not None:
            confidence_adjustment = (rating - 3.0) / 5.0  # Convert 1-5 to -0.4 to 0.4
            profile.workout_confidence = np.clip(
                profile.workout_confidence + confidence_adjustment * profile.learning_rate,
                0.0, 1.0
            )
        
        # Learn from response time
        if response_time is not None:
            # Quick responses (< 5s) suggest good recommendations
            if response_time < 5:
                profile.workout_confidence = min(1.0, profile.workout_confidence + 0.01)
            elif response_time > 30:
                # Slow responses suggest uncertainty
                profile.workout_confidence = max(0.0, profile.workout_confidence - 0.01)
        
        profile.last_updated = datetime.now().timestamp()
        self._save_user_profiles()
        
        logger.info(f"Updated preferences for user {user_id}: acceptance_rate={profile.acceptance_rate:.2f}")
    
    def _exponential_moving_average(self, current: float, new_value: float, learning_rate: float) -> float:
        """Calculate exponential moving average"""
        return current * (1 - learning_rate) + new_value * learning_rate
    
    def generate_personalized_recommendation(
        self, 
        user_id: str, 
        exercise_data: Dict[str, Any], 
        context: WorkoutContext,
        event_type: str = "workout_tweak"
    ) -> AIRecommendation:
        """Generate personalized AI recommendation based on user profile and context"""
        
        profile = self.get_user_profile(user_id)
        
        # Analyze user's current state and context
        context_analysis = self._analyze_context(context, profile)
        
        # Generate AI-powered recommendation
        if self.model is not None:
            ai_suggestion = self._generate_ai_suggestion(
                user_id, exercise_data, context, profile, event_type
            )
        else:
            ai_suggestion = self._generate_fallback_recommendation(
                exercise_data, context, profile, event_type
            )
        
        # Apply personalization based on user profile
        personalized_recommendation = self._personalize_recommendation(
            ai_suggestion, profile, context_analysis
        )
        
        # Apply safety constraints
        safe_recommendation = self._apply_safety_constraints(
            personalized_recommendation, exercise_data
        )
        
        # Calculate confidence based on profile and context
        confidence = self._calculate_confidence(profile, context_analysis, safe_recommendation)
        
        return AIRecommendation(
            type=safe_recommendation.get('type', 'maintain_program'),
            original_value=exercise_data.get('planned_value'),
            suggested_value=safe_recommendation.get('suggested_value'),
            confidence=confidence,
            reasoning=safe_recommendation.get('reasoning', 'Based on your workout history and preferences'),
            factors=safe_recommendation.get('factors', ['user_profile', 'context_analysis']),
            expected_outcome=safe_recommendation.get('expected_outcome', 'Improved workout performance'),
            risk_assessment=safe_recommendation.get('risk_assessment', 'Low risk'),
            alternative_options=safe_recommendation.get('alternatives', [])
        )
    
    def _analyze_context(self, context: WorkoutContext, profile: UserPreferenceProfile) -> Dict[str, Any]:
        """Analyze workout context to inform recommendations"""
        analysis = {
            'energy_alignment': 1.0,
            'time_pressure': 0.0,
            'equipment_constraints': 0.0,
            'motivation_factor': 1.0,
            'crowding_impact': 0.0,
            'performance_trend': 'stable'
        }
        
        # Analyze energy levels
        if context.user_energy is not None:
            energy_optimal = 7.0  # Optimal energy level
            analysis['energy_alignment'] = max(0.0, 1.0 - abs(context.user_energy - energy_optimal) / energy_optimal)
        
        # Analyze time constraints
        if context.available_time is not None and profile.time_constraints > 0:
            time_ratio = context.available_time / profile.time_constraints
            if time_ratio < 0.8:
                analysis['time_pressure'] = 0.8 - time_ratio
        
        # Analyze equipment availability
        if context.equipment_availability:
            unavailable_count = sum(1 for available in context.equipment_availability.values() if not available)
            total_equipment = len(context.equipment_availability)
            if total_equipment > 0:
                analysis['equipment_constraints'] = unavailable_count / total_equipment
        
        # Analyze motivation
        if context.user_motivation is not None:
            analysis['motivation_factor'] = context.user_motivation / 10.0
        
        # Analyze gym crowding
        crowding_impact = {
            'low': 0.0,
            'medium': 0.3,
            'high': 0.7
        }
        analysis['crowding_impact'] = crowding_impact.get(context.gym_crowding, 0.0)
        
        return analysis
    
    def _generate_ai_suggestion(
        self, 
        user_id: str, 
        exercise_data: Dict[str, Any], 
        context: WorkoutContext,
        profile: UserPreferenceProfile,
        event_type: str
    ) -> Dict[str, Any]:
        """Generate AI suggestion using the language model"""
        
        try:
            # Create comprehensive prompt
            prompt = self._create_enhanced_prompt(user_id, exercise_data, context, profile, event_type)
            
            # Generate response
            inputs = self.tokenizer.encode(prompt, return_tensors="pt", max_length=800, truncation=True)
            
            import torch
            with torch.no_grad():
                outputs = self.model.generate(
                    inputs,
                    max_length=min(len(inputs[0]) + 120, 900),
                    num_return_sequences=1,
                    temperature=0.2,  # Low temperature for consistent recommendations
                    do_sample=True,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )
            
            response_text = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
            
            # Parse AI response
            suggestion = self._parse_ai_response(response_text, exercise_data)
            
            return suggestion
            
        except Exception as e:
            logger.error(f"AI suggestion generation failed: {e}")
            return self._generate_fallback_recommendation(exercise_data, context, profile, event_type)
    
    def _create_enhanced_prompt(
        self,
        user_id: str,
        exercise_data: Dict[str, Any],
        context: WorkoutContext,
        profile: UserPreferenceProfile,
        event_type: str
    ) -> str:
        """Create enhanced prompt with user profile and context"""
        
        # User profile summary
        profile_summary = f"""
User Profile:
- Experience Level: {self._get_experience_level(profile)}
- Preferred Intensity: {profile.preferred_intensity:.1f}/1.0
- Volume Tolerance: {profile.volume_tolerance:.1f}/1.0
- Form Focus: {profile.form_focus:.1f}/1.0
- Progression Rate: {profile.progression_rate:.1f}/1.0
- AI Acceptance Rate: {profile.acceptance_rate:.1f}/1.0
- Total Interactions: {profile.total_interactions}
"""
        
        # Context summary
        context_summary = f"""
Current Context:
- Time: {context.time_of_day}
- User Energy: {context.user_energy}/10
- User Motivation: {context.user_motivation}/10
- Available Time: {context.available_time} minutes
- Gym Crowding: {context.gym_crowding}
"""
        
        # Exercise data summary
        exercise_summary = f"""
Current Exercise:
- Exercise: {exercise_data.get('exercise_name', 'Unknown')}
- Planned Sets: {exercise_data.get('planned_sets', 'N/A')}
- Planned Reps: {exercise_data.get('planned_reps', 'N/A')}
- Planned Weight: {exercise_data.get('planned_weight', 'N/A')}
- Set Number: {exercise_data.get('current_set', 1)}
"""
        
        # Event context
        event_context = f"Event Type: {event_type}\n"
        if event_type == "struggle_set":
            event_context += "User is struggling with the current set. Consider reducing intensity or providing encouragement."
        elif event_type == "complete_set":
            event_context += "User completed the set successfully. Consider progression or maintaining current parameters."
        elif event_type == "skip_exercise":
            event_context += "User wants to skip this exercise. Suggest alternatives or modifications."
        
        prompt = f"""You are an AI fitness coach providing personalized workout adjustments.

{profile_summary}
{context_summary}
{exercise_summary}
{event_context}

Safety Rules:
- Never reduce reps below 80% of planned
- Weight increases should not exceed 10% per session
- Minimum rest time is 30 seconds
- Consider user's energy and motivation levels
- Respect time constraints

Generate a JSON recommendation with this exact structure:
{{
  "type": "adjustment_type",
  "suggested_value": "new_value",
  "reasoning": "detailed_explanation",
  "factors": ["factor1", "factor2"],
  "expected_outcome": "expected_result",
  "risk_assessment": "risk_level",
  "confidence_score": 0.85
}}

JSON:"""
        
        return prompt
    
    def _get_experience_level(self, profile: UserPreferenceProfile) -> str:
        """Determine user experience level from profile"""
        if profile.total_interactions < 10:
            return "Beginner"
        elif profile.total_interactions < 50:
            return "Intermediate" 
        else:
            return "Advanced"
    
    def _parse_ai_response(self, response_text: str, exercise_data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse AI response and extract structured recommendation"""
        try:
            # Find JSON in response
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            
            if json_start == -1 or json_end <= json_start:
                raise ValueError("No valid JSON found in response")
            
            json_str = response_text[json_start:json_end]
            suggestion = json.loads(json_str)
            
            # Validate and clean suggestion
            required_fields = ['type', 'suggested_value', 'reasoning']
            for field in required_fields:
                if field not in suggestion:
                    suggestion[field] = f"AI generated {field}"
            
            return suggestion
            
        except Exception as e:
            logger.warning(f"Failed to parse AI response: {e}")
            return {
                'type': 'maintain_program',
                'suggested_value': exercise_data.get('planned_value'),
                'reasoning': 'Using fallback due to parsing error',
                'factors': ['parsing_error'],
                'expected_outcome': 'Maintain current program',
                'risk_assessment': 'Low',
                'confidence_score': 0.3
            }
    
    def _generate_fallback_recommendation(
        self,
        exercise_data: Dict[str, Any],
        context: WorkoutContext,
        profile: UserPreferenceProfile,
        event_type: str
    ) -> Dict[str, Any]:
        """Generate fallback recommendation when AI model is unavailable"""
        
        # Rule-based recommendations based on context and profile
        if event_type == "struggle_set":
            # User struggling - reduce intensity
            current_reps = exercise_data.get('planned_reps', 10)
            if isinstance(current_reps, (list, tuple)):
                suggested_reps = [max(1, int(rep * 0.9)) for rep in current_reps]
            else:
                suggested_reps = max(1, int(current_reps * 0.9))
            
            return {
                'type': 'rep_reduction',
                'suggested_value': suggested_reps,
                'reasoning': f'Reduced reps by 10% to accommodate current difficulty level. User energy: {context.user_energy}/10',
                'factors': ['user_struggling', 'energy_level', 'safety_first'],
                'expected_outcome': 'Maintain form while completing the set',
                'risk_assessment': 'Low',
                'confidence_score': 0.8
            }
        
        elif event_type == "complete_set" and profile.progression_rate > 0.7:
            # Successful completion with high progression preference
            return {
                'type': 'weight_increase',
                'suggested_value': exercise_data.get('planned_weight', 0) * 1.025,  # 2.5% increase
                'reasoning': 'Set completed successfully with high progression preference. Small weight increase recommended.',
                'factors': ['successful_completion', 'progression_preference', 'user_profile'],
                'expected_outcome': 'Progressive overload for continued strength gains',
                'risk_assessment': 'Low',
                'confidence_score': 0.7
            }
        
        elif context.available_time and context.available_time < profile.time_constraints * 0.8:
            # Time pressure - reduce volume
            return {
                'type': 'volume_reduction',
                'suggested_value': exercise_data.get('planned_sets', 3) - 1,
                'reasoning': f'Reduced sets due to time constraints. {context.available_time} min available vs {profile.time_constraints} min preferred.',
                'factors': ['time_constraint', 'user_preferences'],
                'expected_outcome': 'Complete workout within available time',
                'risk_assessment': 'Low',
                'confidence_score': 0.9
            }
        
        else:
            # Default: maintain program
            return {
                'type': 'maintain_program',
                'suggested_value': exercise_data.get('planned_value'),
                'reasoning': 'Maintaining current program parameters based on user profile and context.',
                'factors': ['user_profile', 'stable_context'],
                'expected_outcome': 'Consistent training progression',
                'risk_assessment': 'Very Low',
                'confidence_score': 0.6
            }
    
    def _personalize_recommendation(
        self,
        base_suggestion: Dict[str, Any],
        profile: UserPreferenceProfile,
        context_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Personalize recommendation based on user profile"""
        
        suggestion = base_suggestion.copy()
        
        # Adjust based on form focus preference
        if profile.form_focus > 0.8 and suggestion['type'] in ['weight_increase', 'rep_increase']:
            # High form focus - be more conservative
            if 'suggested_value' in suggestion and isinstance(suggestion['suggested_value'], (int, float)):
                suggestion['suggested_value'] *= 0.95  # More conservative adjustment
            suggestion['reasoning'] += " (Adjusted for high form focus preference)"
        
        # Adjust based on volume tolerance
        if profile.volume_tolerance < 0.4 and suggestion['type'] in ['volume_increase', 'set_increase']:
            # Low volume tolerance - reduce suggested volume
            suggestion['type'] = 'maintain_program'
            suggestion['reasoning'] = "Maintaining volume due to low volume tolerance preference"
        
        # Adjust based on energy and motivation
        if context_analysis['energy_alignment'] < 0.5 or context_analysis['motivation_factor'] < 0.5:
            # Low energy/motivation - make suggestions more conservative
            if suggestion['type'] in ['weight_increase', 'rep_increase', 'intensity_increase']:
                suggestion['type'] = 'maintain_program'
                suggestion['reasoning'] = f"Conservative approach due to current energy/motivation levels"
        
        # Adjust based on acceptance rate
        if profile.acceptance_rate < 0.3:
            # Low acceptance rate - provide more moderate suggestions
            suggestion['confidence_score'] = suggestion.get('confidence_score', 0.5) * 0.8
            suggestion['reasoning'] += f" (Conservative due to preference history)"
        
        return suggestion
    
    def _apply_safety_constraints(
        self,
        recommendation: Dict[str, Any],
        exercise_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Apply safety constraints to recommendations"""
        
        safe_recommendation = recommendation.copy()
        constraints_applied = []
        
        # Rep reduction constraint
        if recommendation['type'] == 'rep_reduction':
            original_reps = exercise_data.get('planned_reps', 10)
            suggested_reps = recommendation['suggested_value']
            
            if isinstance(original_reps, (list, tuple)) and isinstance(suggested_reps, (list, tuple)):
                min_reps = [max(1, int(orig * self.safety_constraints['min_rep_percentage'])) 
                           for orig in original_reps]
                safe_reps = [max(suggested, min_rep) for suggested, min_rep in zip(suggested_reps, min_reps)]
                if safe_reps != suggested_reps:
                    safe_recommendation['suggested_value'] = safe_reps
                    constraints_applied.append('min_rep_constraint')
            elif isinstance(original_reps, (int, float)) and isinstance(suggested_reps, (int, float)):
                min_reps = max(1, int(original_reps * self.safety_constraints['min_rep_percentage']))
                if suggested_reps < min_reps:
                    safe_recommendation['suggested_value'] = min_reps
                    constraints_applied.append('min_rep_constraint')
        
        # Weight increase constraint
        if recommendation['type'] == 'weight_increase':
            original_weight = exercise_data.get('planned_weight', 0)
            suggested_weight = recommendation['suggested_value']
            
            if original_weight > 0:
                max_increase = original_weight * (1 + self.safety_constraints['max_weight_increase'])
                if suggested_weight > max_increase:
                    safe_recommendation['suggested_value'] = max_increase
                    constraints_applied.append('max_weight_constraint')
        
        # Rest time constraint
        if recommendation['type'] == 'rest_reduction':
            min_rest = self.safety_constraints['min_rest_time']
            if recommendation['suggested_value'] < min_rest:
                safe_recommendation['suggested_value'] = min_rest
                constraints_applied.append('min_rest_constraint')
        
        # Add constraint info to reasoning
        if constraints_applied:
            safe_recommendation['reasoning'] += f" (Safety constraints applied: {', '.join(constraints_applied)})"
            safe_recommendation['risk_assessment'] = 'Very Low'
        
        return safe_recommendation
    
    def _calculate_confidence(
        self,
        profile: UserPreferenceProfile,
        context_analysis: Dict[str, Any],
        recommendation: Dict[str, Any]
    ) -> float:
        """Calculate confidence score for recommendation"""
        
        base_confidence = recommendation.get('confidence_score', 0.5)
        
        # Adjust based on user interaction history
        if profile.total_interactions > 20:
            # More interactions = higher confidence in profile
            interaction_boost = min(0.2, profile.total_interactions / 100)
            base_confidence += interaction_boost
        
        # Adjust based on user acceptance rate
        acceptance_factor = profile.acceptance_rate
        base_confidence *= (0.5 + acceptance_factor * 0.5)  # Scale between 0.5-1.0 based on acceptance
        
        # Adjust based on context clarity
        context_clarity = (
            context_analysis['energy_alignment'] * 0.3 +
            (1 - context_analysis['time_pressure']) * 0.2 +
            context_analysis['motivation_factor'] * 0.3 +
            (1 - context_analysis['crowding_impact']) * 0.2
        )
        base_confidence *= (0.7 + context_clarity * 0.3)  # Scale between 0.7-1.0 based on context
        
        # Adjust based on recommendation type
        conservative_types = ['maintain_program', 'rest_increase', 'form_focus']
        if recommendation['type'] in conservative_types:
            base_confidence *= 1.1  # Boost confidence for conservative recommendations
        
        return np.clip(base_confidence, 0.0, 1.0)
    
    def process_user_feedback(self, user_id: str, tweak_id: str, feedback: Dict[str, Any]) -> None:
        """Process user feedback to improve future recommendations"""
        
        # Update user preferences
        self.update_user_preferences(user_id, feedback)
        
        # Store interaction for pattern analysis
        interaction = {
            'tweak_id': tweak_id,
            'feedback': feedback,
            'timestamp': datetime.now().timestamp()
        }
        self.interaction_history[user_id].append(interaction)
        
        # Analyze patterns if we have enough data
        if len(self.interaction_history[user_id]) >= 10:
            self._analyze_interaction_patterns(user_id)
        
        logger.info(f"Processed feedback for user {user_id}: {feedback.get('action', 'unknown')}")
    
    def _analyze_interaction_patterns(self, user_id: str) -> None:
        """Analyze user interaction patterns to identify learning opportunities"""
        
        interactions = list(self.interaction_history[user_id])
        profile = self.get_user_profile(user_id)
        
        # Analyze recent acceptance rate trend
        recent_interactions = interactions[-20:]  # Last 20 interactions
        recent_acceptances = sum(1 for i in recent_interactions 
                               if i['feedback'].get('action') == 'accepted')
        recent_acceptance_rate = recent_acceptances / len(recent_interactions)
        
        # Adjust learning rate based on stability
        if abs(recent_acceptance_rate - profile.acceptance_rate) > 0.2:
            # Significant change in pattern - increase learning rate
            profile.learning_rate = min(0.3, profile.learning_rate * 1.2)
            logger.info(f"Increased learning rate for user {user_id} due to pattern change")
        else:
            # Stable pattern - decrease learning rate
            profile.learning_rate = max(0.05, profile.learning_rate * 0.95)
        
        # Identify common rejection reasons
        rejections = [i for i in recent_interactions 
                     if i['feedback'].get('action') == 'rejected']
        
        if len(rejections) > 3:
            reasons = [r['feedback'].get('modification_reason', 'unknown') 
                      for r in rejections if r['feedback'].get('modification_reason')]
            
            # Update common rejection patterns
            profile.common_rejection_reasons.extend(reasons)
            profile.common_rejection_reasons = profile.common_rejection_reasons[-10:]  # Keep recent
            
            logger.info(f"Updated rejection patterns for user {user_id}: {reasons}")
    
    def get_user_insights(self, user_id: str) -> Dict[str, Any]:
        """Get comprehensive insights about user preferences and AI performance"""
        
        profile = self.get_user_profile(user_id)
        interactions = list(self.interaction_history[user_id])
        
        insights = {
            'user_profile': asdict(profile),
            'interaction_summary': {
                'total_interactions': len(interactions),
                'recent_acceptance_rate': self._calculate_recent_acceptance_rate(interactions),
                'improvement_trend': self._calculate_improvement_trend(interactions),
                'preferred_recommendation_types': self._analyze_preferred_types(interactions)
            },
            'ai_performance': {
                'confidence_trend': self._calculate_confidence_trend(interactions),
                'accuracy_estimate': profile.workout_confidence,
                'learning_stability': 1.0 - profile.learning_rate,  # Inverse relationship
                'personalization_level': min(1.0, profile.total_interactions / 50)
            },
            'recommendations': self._generate_coaching_recommendations(profile, interactions)
        }
        
        return insights
    
    def _calculate_recent_acceptance_rate(self, interactions: List[Dict[str, Any]]) -> float:
        """Calculate acceptance rate for recent interactions"""
        if not interactions:
            return 0.5
        
        recent = interactions[-10:]  # Last 10 interactions
        accepted = sum(1 for i in recent if i['feedback'].get('action') == 'accepted')
        return accepted / len(recent) if recent else 0.5
    
    def _calculate_improvement_trend(self, interactions: List[Dict[str, Any]]) -> str:
        """Calculate whether user satisfaction is improving"""
        if len(interactions) < 10:
            return 'insufficient_data'
        
        # Compare first half vs second half ratings
        mid = len(interactions) // 2
        first_half = interactions[:mid]
        second_half = interactions[mid:]
        
        first_avg = np.mean([i['feedback'].get('rating', 3) for i in first_half])
        second_avg = np.mean([i['feedback'].get('rating', 3) for i in second_half])
        
        if second_avg > first_avg + 0.3:
            return 'improving'
        elif second_avg < first_avg - 0.3:
            return 'declining'
        else:
            return 'stable'
    
    def _analyze_preferred_types(self, interactions: List[Dict[str, Any]]) -> Dict[str, int]:
        """Analyze which types of recommendations user prefers"""
        preferences = defaultdict(int)
        
        for interaction in interactions:
            if interaction['feedback'].get('action') == 'accepted':
                # Would need to track recommendation type in interaction
                # For now, return placeholder
                preferences['placeholder'] += 1
        
        return dict(preferences)
    
    def _calculate_confidence_trend(self, interactions: List[Dict[str, Any]]) -> str:
        """Calculate AI confidence trend"""
        if len(interactions) < 5:
            return 'establishing_baseline'
        
        # This would require tracking confidence scores in interactions
        # For now, return placeholder
        return 'stable'
    
    def _generate_coaching_recommendations(
        self, 
        profile: UserPreferenceProfile, 
        interactions: List[Dict[str, Any]]
    ) -> List[str]:
        """Generate meta-recommendations for improving coaching"""
        
        recommendations = []
        
        if profile.acceptance_rate < 0.3:
            recommendations.append("AI recommendations may be too aggressive. Consider more conservative suggestions.")
        
        if profile.modification_frequency > 0.7:
            recommendations.append("User frequently modifies suggestions. AI should learn from modification patterns.")
        
        if profile.total_interactions < 10:
            recommendations.append("Limited interaction history. AI is still learning user preferences.")
        elif profile.total_interactions > 100:
            recommendations.append("Extensive interaction history available. AI should be highly personalized.")
        
        return recommendations

# Global instance for integration
enhanced_ai_engine = None

def initialize_enhanced_engine(model=None, tokenizer=None):
    """Initialize the enhanced AI engine"""
    global enhanced_ai_engine
    enhanced_ai_engine = EnhancedAIEngine(model, tokenizer)
    return enhanced_ai_engine

def get_enhanced_engine() -> Optional[EnhancedAIEngine]:
    """Get the global enhanced AI engine instance"""
    return enhanced_ai_engine