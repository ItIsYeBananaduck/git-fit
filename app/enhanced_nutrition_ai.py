"""
Enhanced Nutrition AI Engine for Adaptive fIt
Implements recovery-aware nutrition adjustments, safety monitoring, and personalized recommendations
"""

import json
import logging
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
from collections import defaultdict
import pickle
import os

logger = logging.getLogger(__name__)

@dataclass
class UserHealthProfile:
    """Comprehensive health profile for nutrition safety"""
    user_id: str
    medical_conditions: List[str]
    allergies: List[str]
    medications: List[Dict[str, Any]]
    safety_flags: Dict[str, bool]
    metabolic_data: Dict[str, float]
    
    def has_diabetes(self) -> bool:
        return self.safety_flags.get('diabetesFlag', False)
    
    def has_heart_condition(self) -> bool:
        return self.safety_flags.get('heartConditionFlag', False)
    
    def has_kidney_issues(self) -> bool:
        return self.safety_flags.get('kidneyIssueFlag', False)
    
    def get_protein_limit(self) -> Optional[float]:
        """Get safe protein limit based on medical conditions"""
        if self.has_kidney_issues():
            return 1.2  # g/kg body weight max for kidney issues
        elif self.has_diabetes():
            return 2.0  # g/kg body weight max for diabetes
        return None  # No specific limit
    
    def get_sodium_limit(self) -> Optional[float]:
        """Get sodium limit based on medical conditions"""
        if self.has_heart_condition() or 'hypertension' in self.medical_conditions:
            return 1500  # mg per day for heart/BP issues
        return 2300  # mg per day general recommendation

@dataclass
class RecoveryMetrics:
    """Recovery data for nutrition adjustments"""
    user_id: str
    date: str
    hrv_score: Optional[float]
    resting_heart_rate: Optional[float]
    sleep_quality: Optional[float]
    sleep_duration: Optional[float]
    stress_level: Optional[float]
    hydration_status: Optional[float]
    recovery_score: float
    source: str
    
    def needs_recovery_boost(self) -> bool:
        """Determine if user needs nutritional recovery support"""
        return self.recovery_score < 60
    
    def needs_protein_boost(self) -> bool:
        """Determine if user needs extra protein for recovery"""
        return self.recovery_score < 50 or (self.sleep_quality and self.sleep_quality < 6)
    
    def needs_hydration_boost(self) -> bool:
        """Determine if user needs extra hydration"""
        return (self.hydration_status and self.hydration_status < 70) or self.recovery_score < 40

@dataclass
class NutritionRecommendation:
    """AI-generated nutrition recommendation"""
    user_id: str
    recommendation_type: str
    title: str
    description: str
    action: str
    target_value: Optional[float]
    target_unit: Optional[str]
    priority: str
    reasoning: Dict[str, Any]
    confidence: float
    safety_checked: bool
    expires_at: Optional[float]
    
    def is_safe_for_user(self, health_profile: UserHealthProfile) -> Tuple[bool, List[str]]:
        """Check if recommendation is safe given user's health profile"""
        warnings = []
        
        # Protein safety checks
        if self.action == 'increase_protein' and self.target_value:
            protein_limit = health_profile.get_protein_limit()
            if protein_limit and self.target_value > protein_limit:
                warnings.append(f"Protein recommendation exceeds safe limit for kidney/diabetes conditions")
                return False, warnings
        
        # Sodium safety checks
        if self.action == 'adjust_sodium' and self.target_value:
            sodium_limit = health_profile.get_sodium_limit()
            if sodium_limit and self.target_value > sodium_limit:
                warnings.append(f"Sodium recommendation exceeds safe limit for heart/BP conditions")
                return False, warnings
        
        # Diabetes-specific checks
        if health_profile.has_diabetes():
            if self.action in ['increase_simple_carbs', 'add_sugar']:
                warnings.append("Recommendation not suitable for diabetes management")
                return False, warnings
        
        # Medication interaction checks
        for medication in health_profile.medications:
            interactions = medication.get('nutritionInteractions', [])
            if any(nutrient in self.action.lower() for nutrient in interactions):
                warnings.append(f"Potential interaction with medication: {medication['name']}")
                return False, warnings
        
        return True, warnings

class NutritionSafetyMonitor:
    """Monitors nutrition intake for safety violations"""
    
    def __init__(self):
        self.safety_thresholds = {
            'min_calories_per_kg': 15,  # minimum calories per kg body weight
            'max_calories_per_kg': 50,  # maximum calories per kg body weight
            'min_protein_per_kg': 0.8,  # minimum protein per kg body weight
            'max_protein_per_kg': 3.0,  # maximum protein per kg body weight (general)
            'max_sodium_mg': 4000,      # absolute maximum sodium per day
            'min_fat_percent': 15,      # minimum fat as % of calories
            'max_sugar_percent': 25,    # maximum sugar as % of calories
        }
    
    def check_daily_intake(self, user_intake: Dict[str, float], 
                          health_profile: UserHealthProfile,
                          body_weight_kg: float) -> List[Dict[str, Any]]:
        """Check daily intake against safety thresholds"""
        alerts = []
        
        # Calorie checks
        calories_per_kg = user_intake.get('calories', 0) / body_weight_kg
        if calories_per_kg < self.safety_thresholds['min_calories_per_kg']:
            alerts.append({
                'type': 'excessive_deficit',
                'severity': 'critical',
                'message': f"Dangerously low calorie intake: {calories_per_kg:.1f} cal/kg (min: {self.safety_thresholds['min_calories_per_kg']})",
                'action_required': True
            })
        elif calories_per_kg > self.safety_thresholds['max_calories_per_kg']:
            alerts.append({
                'type': 'excessive_surplus',
                'severity': 'warning',
                'message': f"Very high calorie intake: {calories_per_kg:.1f} cal/kg",
                'action_required': False
            })
        
        # Protein checks
        protein_per_kg = user_intake.get('protein', 0) / body_weight_kg
        max_protein = health_profile.get_protein_limit() or self.safety_thresholds['max_protein_per_kg']
        
        if protein_per_kg < self.safety_thresholds['min_protein_per_kg']:
            alerts.append({
                'type': 'protein_deficiency',
                'severity': 'warning',
                'message': f"Low protein intake: {protein_per_kg:.1f}g/kg (min: {self.safety_thresholds['min_protein_per_kg']})",
                'action_required': True
            })
        elif protein_per_kg > max_protein:
            severity = 'critical' if health_profile.has_kidney_issues() else 'warning'
            alerts.append({
                'type': 'excessive_protein',
                'severity': severity,
                'message': f"High protein intake: {protein_per_kg:.1f}g/kg (max: {max_protein})",
                'action_required': health_profile.has_kidney_issues()
            })
        
        # Sodium checks
        sodium_mg = user_intake.get('sodium', 0)
        sodium_limit = health_profile.get_sodium_limit()
        
        if sodium_mg > sodium_limit:
            severity = 'critical' if health_profile.has_heart_condition() else 'warning'
            alerts.append({
                'type': 'excessive_sodium',
                'severity': severity,
                'message': f"High sodium intake: {sodium_mg:.0f}mg (limit: {sodium_limit}mg)",
                'action_required': health_profile.has_heart_condition()
            })
        
        return alerts

class EnhancedNutritionAI:
    """Enhanced Nutrition AI Engine with recovery awareness and safety monitoring"""
    
    def __init__(self):
        self.safety_monitor = NutritionSafetyMonitor()
        self.model_version = "nutrition-ai-v1.0"
        
        # Load user profiles cache
        self.user_profiles_cache = {}
        self.load_user_profiles()
    
    def load_user_profiles(self):
        """Load cached user health profiles"""
        try:
            if os.path.exists('user_health_profiles.pkl'):
                with open('user_health_profiles.pkl', 'rb') as f:
                    self.user_profiles_cache = pickle.load(f)
                logger.info(f"Loaded {len(self.user_profiles_cache)} user health profiles from cache")
        except Exception as e:
            logger.error(f"Error loading user profiles: {e}")
            self.user_profiles_cache = {}
    
    def save_user_profiles(self):
        """Save user health profiles to cache"""
        try:
            with open('user_health_profiles.pkl', 'wb') as f:
                pickle.dump(self.user_profiles_cache, f)
            logger.info(f"Saved {len(self.user_profiles_cache)} user health profiles to cache")
        except Exception as e:
            logger.error(f"Error saving user profiles: {e}")
    
    def get_recovery_adjusted_goals(self, user_id: str, base_goals: Dict[str, float],
                                   recovery_metrics: RecoveryMetrics) -> Dict[str, Any]:
        """Calculate recovery-adjusted nutrition goals"""
        adjusted_goals = base_goals.copy()
        adjustments_made = []
        
        # Recovery score based adjustments
        if recovery_metrics.needs_recovery_boost():
            # Increase calories slightly for recovery
            calorie_boost = min(0.1, (60 - recovery_metrics.recovery_score) / 100)
            adjusted_goals['calories'] *= (1 + calorie_boost)
            adjustments_made.append(f"Increased calories by {calorie_boost*100:.1f}% for recovery")
        
        if recovery_metrics.needs_protein_boost():
            # Increase protein for muscle recovery
            protein_boost = min(0.2, (50 - recovery_metrics.recovery_score) / 100)
            adjusted_goals['protein'] *= (1 + protein_boost)
            adjustments_made.append(f"Increased protein by {protein_boost*100:.1f}% for muscle recovery")
        
        if recovery_metrics.needs_hydration_boost():
            # Increase hydration target
            hydration_boost = 0.5  # Extra 500ml
            adjusted_goals['hydration'] = base_goals.get('hydration', 2.5) + hydration_boost
            adjustments_made.append(f"Added {hydration_boost}L hydration for recovery")
        
        # Sleep-based adjustments
        if recovery_metrics.sleep_duration and recovery_metrics.sleep_duration < 7:
            # Poor sleep = need more carbs for energy
            carb_boost = (7 - recovery_metrics.sleep_duration) * 0.05
            adjusted_goals['carbs'] *= (1 + carb_boost)
            adjustments_made.append(f"Increased carbs by {carb_boost*100:.1f}% due to insufficient sleep")
        
        return {
            'adjusted_goals': adjusted_goals,
            'adjustments_made': adjustments_made,
            'recovery_score': recovery_metrics.recovery_score,
            'adjustment_timestamp': datetime.now().timestamp()
        }
    
    def generate_hydration_recommendations(self, user_id: str, 
                                         recovery_metrics: RecoveryMetrics,
                                         current_intake: float,
                                         target_intake: float) -> List[Dict[str, Any]]:
        """Generate personalized hydration recommendations"""
        recommendations = []
        remaining = target_intake - current_intake
        
        if remaining <= 0:
            return [{
                'time': 'now',
                'amount': 0.25,
                'reason': 'maintenance',
                'priority': 'low',
                'completed': False
            }]
        
        # Calculate hourly distribution
        current_hour = datetime.now().hour
        hours_remaining = 22 - current_hour  # Stop recommendations at 10 PM
        
        if hours_remaining <= 0:
            hours_remaining = 1
        
        base_hourly = remaining / hours_remaining
        
        # Recovery-based adjustments
        if recovery_metrics.needs_hydration_boost():
            # Front-load hydration when recovery is poor
            recommendations.extend([
                {
                    'time': f"{current_hour:02d}:00",
                    'amount': min(0.5, remaining * 0.3),
                    'reason': 'recovery_boost',
                    'priority': 'high',
                    'completed': False
                },
                {
                    'time': f"{current_hour + 1:02d}:00",
                    'amount': min(0.4, remaining * 0.25),
                    'reason': 'recovery_support',
                    'priority': 'medium',
                    'completed': False
                }
            ])
        else:
            # Normal distribution
            for i in range(min(4, hours_remaining)):
                hour = current_hour + i
                if hour > 22:  # Don't recommend past 10 PM
                    break
                    
                amount = base_hourly
                reason = 'maintenance'
                priority = 'medium'
                
                # Increase before workouts (if we had workout schedule)
                if hour in [16, 17, 18]:  # Common workout times
                    amount *= 1.2
                    reason = 'pre_workout'
                    priority = 'high'
                
                recommendations.append({
                    'time': f"{hour:02d}:00",
                    'amount': round(amount, 2),
                    'reason': reason,
                    'priority': priority,
                    'completed': False
                })
        
        return recommendations
    
    def generate_nutrition_recommendations(self, user_id: str,
                                         health_profile: UserHealthProfile,
                                         recovery_metrics: RecoveryMetrics,
                                         current_intake: Dict[str, float],
                                         goals: Dict[str, float]) -> List[NutritionRecommendation]:
        """Generate AI-powered nutrition recommendations"""
        recommendations = []
        
        # Calculate deficits/surpluses
        deficits = {}
        surpluses = {}
        
        for nutrient, target in goals.items():
            current = current_intake.get(nutrient, 0)
            diff = target - current
            
            if diff > 0:
                deficits[nutrient] = diff
            elif diff < 0:
                surpluses[nutrient] = abs(diff)
        
        # Protein recommendations
        if 'protein' in deficits and deficits['protein'] > 10:
            protein_rec = self._generate_protein_recommendation(
                user_id, deficits['protein'], health_profile, recovery_metrics
            )
            if protein_rec:
                recommendations.append(protein_rec)
        
        # Hydration recommendations
        if 'hydration' in deficits:
            hydration_rec = self._generate_hydration_recommendation(
                user_id, current_intake.get('hydration', 0), 
                goals.get('hydration', 2.5), recovery_metrics
            )
            if hydration_rec:
                recommendations.append(hydration_rec)
        
        # Recovery-specific recommendations
        if recovery_metrics.recovery_score < 60:
            recovery_rec = self._generate_recovery_recommendation(
                user_id, recovery_metrics, health_profile
            )
            if recovery_rec:
                recommendations.append(recovery_rec)
        
        # Safety-based recommendations
        if health_profile.has_diabetes() and current_intake.get('sugar', 0) > 50:
            sugar_warning = NutritionRecommendation(
                user_id=user_id,
                recommendation_type='safety_warning',
                title='Monitor Sugar Intake',
                description='Your sugar intake is high today. Consider reducing added sugars.',
                action='reduce_sugar',
                target_value=30,
                target_unit='g',
                priority='high',
                reasoning={'medical_condition': 'diabetes', 'current_sugar': current_intake.get('sugar', 0)},
                confidence=0.95,
                safety_checked=True,
                expires_at=(datetime.now() + timedelta(hours=4)).timestamp()
            )
            recommendations.append(sugar_warning)
        
        return recommendations
    
    def _generate_protein_recommendation(self, user_id: str, deficit: float,
                                       health_profile: UserHealthProfile,
                                       recovery_metrics: RecoveryMetrics) -> Optional[NutritionRecommendation]:
        """Generate protein-specific recommendation"""
        
        # Check protein safety limits
        protein_limit = health_profile.get_protein_limit()
        if protein_limit and deficit > protein_limit * 70:  # Assuming 70kg average
            return None  # Too much protein for medical condition
        
        priority = 'high' if recovery_metrics.needs_protein_boost() else 'medium'
        confidence = 0.85
        
        # Adjust confidence based on recovery metrics
        if recovery_metrics.sleep_quality and recovery_metrics.sleep_quality < 6:
            confidence += 0.1
        
        return NutritionRecommendation(
            user_id=user_id,
            recommendation_type='macro_adjustment',
            title='Increase Protein Intake',
            description=f'You need {deficit:.0f}g more protein today. Consider lean meats, fish, or protein shakes.',
            action='increase_protein',
            target_value=deficit,
            target_unit='g',
            priority=priority,
            reasoning={
                'deficit_amount': deficit,
                'recovery_score': recovery_metrics.recovery_score,
                'sleep_quality': recovery_metrics.sleep_quality,
                'muscle_recovery_need': recovery_metrics.needs_protein_boost()
            },
            confidence=min(confidence, 1.0),
            safety_checked=True,
            expires_at=(datetime.now() + timedelta(hours=6)).timestamp()
        )
    
    def _generate_hydration_recommendation(self, user_id: str, current: float,
                                         target: float, recovery_metrics: RecoveryMetrics) -> Optional[NutritionRecommendation]:
        """Generate hydration-specific recommendation"""
        deficit = target - current
        
        if deficit <= 0:
            return None
        
        priority = 'high' if recovery_metrics.needs_hydration_boost() else 'medium'
        
        return NutritionRecommendation(
            user_id=user_id,
            recommendation_type='hydration',
            title='Increase Water Intake',
            description=f'Drink {deficit:.1f}L more water today. Spread it throughout the day.',
            action='increase_hydration',
            target_value=deficit,
            target_unit='L',
            priority=priority,
            reasoning={
                'deficit_amount': deficit,
                'recovery_score': recovery_metrics.recovery_score,
                'hydration_status': recovery_metrics.hydration_status
            },
            confidence=0.9,
            safety_checked=True,
            expires_at=(datetime.now() + timedelta(hours=8)).timestamp()
        )
    
    def _generate_recovery_recommendation(self, user_id: str,
                                        recovery_metrics: RecoveryMetrics,
                                        health_profile: UserHealthProfile) -> Optional[NutritionRecommendation]:
        """Generate recovery-focused recommendation"""
        
        if recovery_metrics.recovery_score >= 60:
            return None
        
        # Determine the best recovery nutrition strategy
        if recovery_metrics.sleep_quality and recovery_metrics.sleep_quality < 6:
            action = 'improve_sleep_nutrition'
            description = 'Poor sleep detected. Consider magnesium-rich foods and avoid caffeine after 2 PM.'
            target_value = None
        elif recovery_metrics.stress_level and recovery_metrics.stress_level > 7:
            action = 'stress_nutrition'
            description = 'High stress levels. Focus on omega-3 rich foods and complex carbohydrates.'
            target_value = None
        else:
            action = 'general_recovery'
            description = 'Low recovery score. Increase anti-inflammatory foods and ensure adequate protein.'
            target_value = None
        
        return NutritionRecommendation(
            user_id=user_id,
            recommendation_type='recovery_optimization',
            title='Recovery Nutrition Focus',
            description=description,
            action=action,
            target_value=target_value,
            target_unit=None,
            priority='medium',
            reasoning={
                'recovery_score': recovery_metrics.recovery_score,
                'sleep_quality': recovery_metrics.sleep_quality,
                'stress_level': recovery_metrics.stress_level,
                'hrv_score': recovery_metrics.hrv_score
            },
            confidence=0.75,
            safety_checked=True,
            expires_at=(datetime.now() + timedelta(days=1)).timestamp()
        )
    
    def process_nutrition_feedback(self, user_id: str, recommendation_id: str,
                                 feedback: Dict[str, Any]) -> Dict[str, Any]:
        """Process user feedback on nutrition recommendations"""
        
        # Update user preference learning (integrate with existing AI engine if available)
        feedback_data = {
            'user_id': user_id,
            'recommendation_id': recommendation_id,
            'accepted': feedback.get('accepted', False),
            'implemented': feedback.get('implemented', False),
            'feedback_text': feedback.get('feedback', ''),
            'modified_value': feedback.get('modified_value'),
            'timestamp': datetime.now().timestamp()
        }
        
        # Learn from feedback patterns
        self._update_user_preferences(user_id, feedback_data)
        
        return {
            'success': True,
            'feedback_recorded': True,
            'learning_updated': True,
            'message': 'Thank you for your feedback! This helps improve future recommendations.'
        }
    
    def _update_user_preferences(self, user_id: str, feedback_data: Dict[str, Any]):
        """Update user preference learning based on feedback"""
        
        if user_id not in self.user_profiles_cache:
            self.user_profiles_cache[user_id] = {
                'nutrition_preferences': {
                    'protein_acceptance_rate': 0.5,
                    'hydration_acceptance_rate': 0.5,
                    'recovery_recommendation_acceptance': 0.5,
                    'modification_frequency': 0.0,
                    'total_recommendations': 0,
                    'total_accepted': 0
                }
            }
        
        profile = self.user_profiles_cache[user_id]['nutrition_preferences']
        profile['total_recommendations'] += 1
        
        if feedback_data['accepted']:
            profile['total_accepted'] += 1
        
        if feedback_data.get('modified_value') is not None:
            profile['modification_frequency'] = (profile['modification_frequency'] * 0.9 + 0.1)
        
        # Update acceptance rates with exponential moving average
        alpha = 0.1  # Learning rate
        if 'protein' in feedback_data.get('recommendation_id', ''):
            current_rate = profile['protein_acceptance_rate']
            new_value = 1.0 if feedback_data['accepted'] else 0.0
            profile['protein_acceptance_rate'] = current_rate * (1 - alpha) + new_value * alpha
        
        # Save updated profile
        self.save_user_profiles()
    
    def get_nutrition_insights(self, user_id: str, days: int = 7) -> Dict[str, Any]:
        """Generate nutrition insights and analytics"""
        
        # This would integrate with the database to get historical data
        # For now, return a structure for the frontend
        
        profile = self.user_profiles_cache.get(user_id, {}).get('nutrition_preferences', {})
        
        return {
            'user_id': user_id,
            'period_days': days,
            'insights': {
                'recommendation_acceptance_rate': profile.get('total_accepted', 0) / max(profile.get('total_recommendations', 1), 1),
                'most_accepted_type': 'hydration',  # This would be calculated from data
                'improvement_areas': ['protein_timing', 'hydration_consistency'],
                'safety_alerts_count': 0,  # This would be calculated from safety monitoring
                'recovery_nutrition_effectiveness': 0.75  # This would be calculated from outcomes
            },
            'trends': {
                'protein_adherence': [0.8, 0.85, 0.9, 0.88, 0.92, 0.87, 0.91],
                'hydration_adherence': [0.7, 0.75, 0.8, 0.78, 0.82, 0.85, 0.88],
                'recovery_scores': [65, 68, 72, 70, 75, 73, 78]
            },
            'recommendations_summary': {
                'total_generated': profile.get('total_recommendations', 0),
                'total_accepted': profile.get('total_accepted', 0),
                'modification_rate': profile.get('modification_frequency', 0),
                'active_recommendations': 2  # This would be calculated from active recs
            }
        }

# Initialize the enhanced nutrition AI engine
nutrition_ai_engine = EnhancedNutritionAI()

# Export functions for FastAPI integration
def get_nutrition_recommendations(user_id: str, health_data: Dict[str, Any],
                                recovery_data: Dict[str, Any],
                                current_intake: Dict[str, float],
                                goals: Dict[str, float]) -> Dict[str, Any]:
    """Main API function for getting nutrition recommendations"""
    
    try:
        # Parse health profile
        health_profile = UserHealthProfile(
            user_id=user_id,
            medical_conditions=health_data.get('medical_conditions', []),
            allergies=health_data.get('allergies', []),
            medications=health_data.get('medications', []),
            safety_flags=health_data.get('safety_flags', {}),
            metabolic_data=health_data.get('metabolic_data', {})
        )
        
        # Parse recovery metrics
        recovery_metrics = RecoveryMetrics(
            user_id=user_id,
            date=recovery_data.get('date', datetime.now().strftime('%Y-%m-%d')),
            hrv_score=recovery_data.get('hrv_score'),
            resting_heart_rate=recovery_data.get('resting_heart_rate'),
            sleep_quality=recovery_data.get('sleep_quality'),
            sleep_duration=recovery_data.get('sleep_duration'),
            stress_level=recovery_data.get('stress_level'),
            hydration_status=recovery_data.get('hydration_status'),
            recovery_score=recovery_data.get('recovery_score', 50),
            source=recovery_data.get('source', 'manual')
        )
        
        # Get adjusted goals based on recovery
        adjusted_goals_data = nutrition_ai_engine.get_recovery_adjusted_goals(
            user_id, goals, recovery_metrics
        )
        
        # Generate recommendations
        recommendations = nutrition_ai_engine.generate_nutrition_recommendations(
            user_id, health_profile, recovery_metrics, current_intake,
            adjusted_goals_data['adjusted_goals']
        )
        
        # Safety check all recommendations
        safe_recommendations = []
        for rec in recommendations:
            is_safe, warnings = rec.is_safe_for_user(health_profile)
            if is_safe:
                safe_recommendations.append(asdict(rec))
            else:
                logger.warning(f"Unsafe recommendation filtered for user {user_id}: {warnings}")
        
        # Check for safety alerts
        safety_alerts = nutrition_ai_engine.safety_monitor.check_daily_intake(
            current_intake, health_profile, health_data.get('body_weight_kg', 70)
        )
        
        return {
            'success': True,
            'recommendations': safe_recommendations,
            'adjusted_goals': adjusted_goals_data['adjusted_goals'],
            'adjustments_made': adjusted_goals_data['adjustments_made'],
            'safety_alerts': safety_alerts,
            'recovery_score': recovery_metrics.recovery_score,
            'ai_model_version': nutrition_ai_engine.model_version
        }
        
    except Exception as e:
        logger.error(f"Error generating nutrition recommendations: {e}")
        return {
            'success': False,
            'error': str(e),
            'fallback_message': 'Unable to generate personalized recommendations. Please consult with a nutritionist.'
        }

def process_nutrition_feedback(user_id: str, recommendation_id: str,
                             feedback_data: Dict[str, Any]) -> Dict[str, Any]:
    """API function for processing nutrition feedback"""
    return nutrition_ai_engine.process_nutrition_feedback(user_id, recommendation_id, feedback_data)

def get_nutrition_insights(user_id: str, days: int = 7) -> Dict[str, Any]:
    """API function for getting nutrition insights"""
    return nutrition_ai_engine.get_nutrition_insights(user_id, days)

def get_hydration_recommendations(user_id: str, recovery_data: Dict[str, Any],
                                current_intake: float, target_intake: float) -> Dict[str, Any]:
    """API function for getting hydration recommendations"""
    
    try:
        recovery_metrics = RecoveryMetrics(
            user_id=user_id,
            date=recovery_data.get('date', datetime.now().strftime('%Y-%m-%d')),
            hrv_score=recovery_data.get('hrv_score'),
            resting_heart_rate=recovery_data.get('resting_heart_rate'),
            sleep_quality=recovery_data.get('sleep_quality'),
            sleep_duration=recovery_data.get('sleep_duration'),
            stress_level=recovery_data.get('stress_level'),
            hydration_status=recovery_data.get('hydration_status'),
            recovery_score=recovery_data.get('recovery_score', 50),
            source=recovery_data.get('source', 'manual')
        )
        
        recommendations = nutrition_ai_engine.generate_hydration_recommendations(
            user_id, recovery_metrics, current_intake, target_intake
        )
        
        return {
            'success': True,
            'hydration_recommendations': recommendations,
            'total_remaining': target_intake - current_intake,
            'recovery_boost_needed': recovery_metrics.needs_hydration_boost(),
            'recovery_score': recovery_metrics.recovery_score
        }
        
    except Exception as e:
        logger.error(f"Error generating hydration recommendations: {e}")
        return {
            'success': False,
            'error': str(e),
            'fallback_recommendations': [
                {
                    'time': 'now',
                    'amount': 0.5,
                    'reason': 'general_hydration',
                    'priority': 'medium',
                    'completed': False
                }
            ]
        }