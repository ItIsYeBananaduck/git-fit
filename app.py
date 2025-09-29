from fastapi import FastAPI, HTTPException
from transformers import GPT2LMHeadModel, GPT2Tokenizer
from huggingface_hub import hf_hub_download
import torch
import os
import json
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MODEL_REPO = "PhilmoLSC/philmoLSC"  # Use the user's Hugging Face model repo
MODEL_NAME = "distilgpt2"
HF_TOKEN = os.getenv("HF_TOKEN")
MAX_LENGTH = 150
DEVICE = "cpu"  # Force CPU for Fly.io cost optimization
PORT = int(os.getenv("PORT", 8080))  # Default to 8080 for Fly.io

# Memory optimization settings
MODEL_DTYPE = torch.float16  # Use float16 for reduced memory usage
LOW_CPU_MEM = True
# Remove device_map to avoid accelerate dependency and reduce memory usage

class EventRequest(BaseModel):
    event: str
    user_id: str
    context: Dict[str, Any] = {}
    user_data: Dict[str, Any] = {}

# Enhanced Nutrition AI Models
class NutritionRecommendationRequest(BaseModel):
    user_id: str
    health_data: Dict[str, Any]  # medical conditions, allergies, etc.
    recovery_data: Dict[str, Any]  # HRV, sleep, stress data
    current_intake: Dict[str, float]  # today's nutrition intake
    goals: Dict[str, float]  # nutrition goals

class NutritionFeedbackRequest(BaseModel):
    user_id: str
    recommendation_id: str
    feedback: Dict[str, Any]  # accepted, implemented, feedback text, etc.

class HydrationRequest(BaseModel):
    user_id: str
    recovery_data: Dict[str, Any]
    current_intake: float  # liters consumed today
    target_intake: float  # target liters per day

def load_model():
    """Load the PhilmoLSC/philmoLSC model or fallback options"""
    try:
        logger.info(f"Loading model from {MODEL_REPO}...")

        # Priority 1: Try PhilmoLSC/philmoLSC from Hugging Face
        try:
            model = GPT2LMHeadModel.from_pretrained(
                MODEL_REPO,
                torch_dtype=MODEL_DTYPE,
                low_cpu_mem_usage=LOW_CPU_MEM,
                token=HF_TOKEN if HF_TOKEN else None
            )
            tokenizer = GPT2Tokenizer.from_pretrained(
                MODEL_REPO,
                token=HF_TOKEN if HF_TOKEN else None
            )
            tokenizer.pad_token = tokenizer.eos_token
            logger.info("✅ PhilmoLSC/philmoLSC model loaded successfully!")
            return model, tokenizer

        except Exception as e:
            logger.warning(f"Could not load PhilmoLSC/philmoLSC model: {e}")

        # Priority 2: Try local fine-tuned model
        try:
            local_model_path = "./app/fine_tuned_gpt2"
            logger.info(f"Trying local model at {local_model_path}...")
            model = GPT2LMHeadModel.from_pretrained(
                local_model_path,
                torch_dtype=MODEL_DTYPE,
                low_cpu_mem_usage=LOW_CPU_MEM
            )
            tokenizer = GPT2Tokenizer.from_pretrained(local_model_path)
            tokenizer.pad_token = tokenizer.eos_token
            logger.info("✅ Local fine-tuned model loaded successfully!")
            return model, tokenizer

        except Exception as e:
            logger.warning(f"Could not load local model: {e}")

        # Priority 3: Base DistilGPT-2 fallback (constitution compliant)
        logger.info("🔄 Falling back to base DistilGPT-2 model (constitution compliant)...")
        model = GPT2LMHeadModel.from_pretrained(
            MODEL_NAME,
            torch_dtype=MODEL_DTYPE,
            low_cpu_mem_usage=LOW_CPU_MEM
        )
        tokenizer = GPT2Tokenizer.from_pretrained(MODEL_NAME)
        tokenizer.pad_token = tokenizer.eos_token
        logger.info("✅ Base DistilGPT-2 model loaded successfully!")

        return model, tokenizer

    except Exception as e:
        logger.error(f"❌ Error loading model: {e}")
        return None, None

def generate_ai_tweak(event_type: str, user_data: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
    """Generate AI-powered workout tweak based on event and user data"""
    try:
        if model is None or tokenizer is None:
            return generate_fallback_tweak(event_type, context)

        # Extract relevant user data
        current_program = user_data.get("current_program", {})
        workout_history = user_data.get("workout_history", [])
        fitness_level = user_data.get("fitness_level", "intermediate")
        goals = user_data.get("goals", [])

        # Create context-aware prompt with better JSON formatting instructions
        prompt_parts = [
            "You are a fitness AI assistant. Generate a JSON workout tweak response.",
            "",
            f"Event: {event_type}",
            f"User Fitness Level: {fitness_level}",
            f"Goals: {', '.join(goals) if goals else 'general fitness'}",
            f"Current Program: {json.dumps(current_program)}",
            f"Context: {json.dumps(context)}",
            "",
            "Rules:",
            "- No rep drops below 80% of planned reps",
            "- Maintain progressive overload principles",
            "- Consider user's fitness level and goals",
            "",
            "Return ONLY valid JSON with these exact fields:",
            '{"action": "action_name", "reason": "explanation", "modifications": {"field": value}}',
            "",
            "JSON:"
        ]

        prompt = "\n".join(prompt_parts)

        # Tokenize and generate
        inputs = tokenizer.encode(prompt, return_tensors="pt", max_length=512, truncation=True)

        with torch.no_grad():
            outputs = model.generate(
                inputs,
                max_length=min(len(inputs[0]) + 100, MAX_LENGTH),
                num_return_sequences=1,
                temperature=0.3,  # Lower temperature for more consistent JSON
                do_sample=True,
                pad_token_id=tokenizer.eos_token_id,
                eos_token_id=tokenizer.eos_token_id
            )

        response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)

        # Extract JSON from response with better error handling
        try:
            # Clean the response text
            response_text = response_text.strip()
            
            # Find the first complete JSON object
            json_start = response_text.find("{")
            if json_start == -1:
                raise ValueError("No JSON object found in response")
            
            # Count braces to find complete JSON
            brace_count = 0
            json_end = json_start
            for i, char in enumerate(response_text[json_start:], json_start):
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                    if brace_count == 0:
                        json_end = i + 1
                        break
            
            if brace_count != 0:
                # Fallback: find the last closing brace
                json_end = response_text.rfind("}") + 1
            
            if json_end <= json_start:
                raise ValueError("Invalid JSON structure")
            
            json_str = response_text[json_start:json_end].strip()
            
            # Clean up common issues
            json_str = json_str.replace('```json', '').replace('```', '')
            json_str = json_str.strip()
            
            tweak = json.loads(json_str)

            # Validate required fields
            if not all(key in tweak for key in ["action", "reason", "modifications"]):
                raise ValueError("Missing required fields")

            # Apply safety rules
            tweak = apply_safety_rules(tweak, user_data)

            return tweak
        except (json.JSONDecodeError, ValueError) as e:
            logger.warning(f"Invalid AI response, using fallback: {e}")
            return generate_fallback_tweak(event_type, context)

    except Exception as e:
        logger.error(f"Error generating AI tweak: {e}")
        return generate_fallback_tweak(event_type, context)

def apply_safety_rules(tweak: Dict[str, Any], user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Apply safety rules to ensure tweaks don't violate constraints"""
    modifications = tweak.get("modifications", {})

    # Rule: No rep drops below 80%
    if "reps" in modifications:
        planned_reps = user_data.get("current_program", {}).get("planned_reps", modifications["reps"])
        min_reps = max(1, int(planned_reps * 0.8))  # 80% minimum
        if modifications["reps"] < min_reps:
            modifications["reps"] = min_reps
            tweak["reason"] += f" (adjusted to maintain 80% minimum reps)"

    # Rule: Ensure progressive overload
    if "weight" in modifications and modifications["weight"] < user_data.get("last_weight", modifications["weight"]):
        # Only decrease weight if user is struggling (based on context)
        pass  # Keep as-is for now

    tweak["modifications"] = modifications
    return tweak

def generate_fallback_tweak(event_type: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """Generate a safe fallback tweak when AI fails"""
    fallbacks = {
        "skip_set": {
            "action": "reduce_volume",
            "reason": "User skipped a set - reducing volume to prevent overtraining",
            "modifications": {"sets": -1, "rest_time": 30}
        },
        "complete_workout": {
            "action": "progress_weight",
            "reason": "Workout completed successfully - small weight increase for progression",
            "modifications": {"weight": 2.5}
        },
        "struggle_set": {
            "action": "reduce_reps",
            "reason": "User struggled with set - reducing reps while maintaining form",
            "modifications": {"reps": -2}
        }
    }

    return fallbacks.get(event_type, {
        "action": "maintain_program",
        "reason": "Unable to generate specific recommendation - maintaining current program",
        "modifications": {}
    })

# Initialize FastAPI app
app = FastAPI(title="Adaptive fIt AI Service", version="1.0.0")

# Load model and tokenizer
try:
    model, tokenizer = load_model()
except Exception as e:
    logger.error(f"Failed to initialize model: {e}")
    model, tokenizer = None, None

@app.post("/event")
async def handle_event(request: EventRequest):
    """Handle app events and return AI-powered workout tweaks"""
    
    try:
        # If model is not available, use fallback logic
        if model is None or tokenizer is None:
            logger.info("Using fallback logic - AI model not available")
            tweak = generate_fallback_tweak(
                event_type=request.event,
                context=request.context
            )
        else:
            tweak = generate_ai_tweak(
                event_type=request.event,
                user_data=request.user_data,
                context=request.context
            )

        return {
            "success": True,
            "tweak": tweak,
            "user_id": request.user_id,
            "event": request.event,
            "ai_powered": model is not None
        }

    except Exception as e:
        logger.error(f"Error processing event: {e}")
        # Return fallback even on error
        tweak = generate_fallback_tweak(request.event, request.context)
        return {
            "success": True,
            "tweak": tweak,
            "user_id": request.user_id,
            "event": request.event,
            "ai_powered": False,
            "note": "Used fallback due to error"
        }

# Enhanced Nutrition AI Endpoints

@app.post("/nutrition/recommendations")
async def get_nutrition_recommendations_endpoint(request: NutritionRecommendationRequest):
    """Generate personalized nutrition recommendations with recovery awareness and safety monitoring"""
    try:
        # Import nutrition AI functions (dynamic import to handle potential issues)
        try:
            from app.enhanced_nutrition_ai import get_nutrition_recommendations
            
            result = get_nutrition_recommendations(
                user_id=request.user_id,
                health_data=request.health_data,
                recovery_data=request.recovery_data,
                current_intake=request.current_intake,
                goals=request.goals
            )
            return result
            
        except ImportError as ie:
            logger.warning(f"Nutrition AI module not available: {ie}")
            # Return fallback nutrition recommendations
            return {
                'success': True,
                'recommendations': [
                    {
                        'recommendation_type': 'general_nutrition',
                        'title': 'Stay Hydrated',
                        'description': 'Drink plenty of water throughout the day',
                        'priority': 'medium',
                        'confidence': 0.8,
                        'fallback': True
                    }
                ],
                'adjusted_goals': request.goals,
                'adjustments_made': ['Using fallback recommendations'],
                'safety_alerts': [],
                'ai_model_version': 'fallback-v1.0'
            }
        
    except Exception as e:
        logger.error(f"Error in nutrition recommendations endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/nutrition/feedback")
async def process_nutrition_feedback_endpoint(request: NutritionFeedbackRequest):
    """Process user feedback on nutrition recommendations for learning"""
    try:
        try:
            from app.enhanced_nutrition_ai import process_nutrition_feedback
            
            result = process_nutrition_feedback(
                user_id=request.user_id,
                recommendation_id=request.recommendation_id,
                feedback_data=request.feedback
            )
            return result
            
        except ImportError:
            # Fallback feedback processing
            return {
                'success': True,
                'feedback_recorded': True,
                'learning_updated': False,
                'message': 'Feedback recorded (fallback mode)',
                'fallback': True
            }
        
    except Exception as e:
        logger.error(f"Error in nutrition feedback endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/nutrition/insights/{user_id}")
async def get_nutrition_insights_endpoint(user_id: str, days: int = 7):
    """Get nutrition insights and analytics for user"""
    try:
        try:
            from app.enhanced_nutrition_ai import get_nutrition_insights
            
            result = get_nutrition_insights(user_id=user_id, days=days)
            return result
            
        except ImportError:
            # Fallback insights
            return {
                'user_id': user_id,
                'period_days': days,
                'insights': {
                    'recommendation_acceptance_rate': 0.75,
                    'most_accepted_type': 'hydration',
                    'improvement_areas': ['protein_consistency'],
                    'safety_alerts_count': 0,
                    'recovery_nutrition_effectiveness': 0.8
                },
                'trends': {
                    'protein_adherence': [0.8] * 7,
                    'hydration_adherence': [0.75] * 7,
                    'recovery_scores': [70] * 7
                },
                'fallback': True
            }
        
    except Exception as e:
        logger.error(f"Error in nutrition insights endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/nutrition/hydration")
async def get_hydration_recommendations_endpoint(request: HydrationRequest):
    """Generate personalized hydration recommendations based on recovery data"""
    try:
        try:
            from app.enhanced_nutrition_ai import get_hydration_recommendations
            
            result = get_hydration_recommendations(
                user_id=request.user_id,
                recovery_data=request.recovery_data,
                current_intake=request.current_intake,
                target_intake=request.target_intake
            )
            return result
            
        except ImportError:
            # Fallback hydration recommendations
            remaining = request.target_intake - request.current_intake
            return {
                'success': True,
                'hydration_recommendations': [
                    {
                        'time': 'now',
                        'amount': min(0.5, remaining),
                        'reason': 'general_hydration',
                        'priority': 'medium',
                        'completed': False
                    }
                ],
                'total_remaining': remaining,
                'recovery_boost_needed': False,
                'fallback': True
            }
        
    except Exception as e:
        logger.error(f"Error in hydration recommendations endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/nutrition/safety-check/{user_id}")
async def nutrition_safety_check_endpoint(user_id: str, 
                                        body_weight_kg: float = 70,
                                        medical_conditions: str = ""):
    """Quick nutrition safety check for daily intake"""
    try:
        # Parse medical conditions from query parameter
        conditions = medical_conditions.split(",") if medical_conditions else []
        
        # Mock current intake for demonstration
        mock_current_intake = {
            'calories': 1800,
            'protein': 100,
            'carbs': 200,
            'fat': 80,
            'sodium': 2000,
            'sugar': 45
        }
        
        # Basic safety checks (fallback logic)
        safety_alerts = []
        
        # Basic calorie check
        calories_per_kg = mock_current_intake['calories'] / body_weight_kg
        if calories_per_kg < 15:
            safety_alerts.append({
                'type': 'low_calories',
                'severity': 'warning',
                'message': f'Low calorie intake: {calories_per_kg:.1f} cal/kg',
                'action_required': True
            })
        
        # Basic protein check
        protein_per_kg = mock_current_intake['protein'] / body_weight_kg
        if protein_per_kg < 0.8:
            safety_alerts.append({
                'type': 'low_protein',
                'severity': 'warning',
                'message': f'Low protein intake: {protein_per_kg:.1f}g/kg',
                'action_required': True
            })
        
        # Medical condition checks
        if 'diabetes' in conditions and mock_current_intake['sugar'] > 50:
            safety_alerts.append({
                'type': 'high_sugar_diabetes',
                'severity': 'critical',
                'message': 'High sugar intake detected with diabetes condition',
                'action_required': True
            })
        
        return {
            'success': True,
            'user_id': user_id,
            'safety_alerts': safety_alerts,
            'overall_safety': 'safe' if not safety_alerts else 'warning',
            'checked_intake': mock_current_intake,
            'body_weight_kg': body_weight_kg,
            'medical_conditions': conditions,
            'fallback_mode': True
        }
        
    except Exception as e:
        logger.error(f"Error in nutrition safety check endpoint: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",  # Always healthy if the service is running
        "model_available": model is not None,
        "model_repo": MODEL_REPO if model is not None else None,
        "device": DEVICE,
        "fallback_enabled": True
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Technically Fit AI Service - Enhanced with Nutrition AI",
        "version": "2.0.0",
        "endpoints": [
            "/event", 
            "/health",
            "/nutrition/recommendations",
            "/nutrition/feedback", 
            "/nutrition/insights/{user_id}",
            "/nutrition/hydration",
            "/nutrition/safety-check/{user_id}"
        ],
        "features": [
            "Workout AI recommendations",
            "Recovery-aware nutrition adjustments", 
            "Safety monitoring for medical conditions",
            "Personalized hydration recommendations",
            "Nutrition insights and analytics"
        ]
    }

if __name__ == "__main__":
    import uvicorn
    logger.info(f"🚀 Starting Adaptive fIt AI Service on port {PORT}...")
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=PORT,
        reload=False
    )