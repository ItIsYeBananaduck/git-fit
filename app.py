from fastapi import FastAPI, HTTPException
from transformers import GPT2LMHeadModel, GPT2Tokenizer
from huggingface_hub import hf_hub_download
import torch
import os
import json
import logging
from typing import Dict, Any
from pydantic import BaseModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
MODEL_REPO = "PhilmoLSC/philmoLSC"
MODEL_NAME = "distilgpt2"
HF_TOKEN = os.getenv("HF_TOKEN")
MAX_LENGTH = 150
DEVICE = "cpu" if not torch.cuda.is_available() else "cuda"

class EventRequest(BaseModel):
    event: str
    user_id: str
    context: Dict[str, Any] = {}
    user_data: Dict[str, Any] = {}

def load_model():
    """Load the fine-tuned DistilGPT2 model from Hugging Face"""
    try:
        logger.info(f"Loading model from {MODEL_REPO}...")

        if not HF_TOKEN:
            logger.warning("HF_TOKEN not set - using base model")
            model = GPT2LMHeadModel.from_pretrained(
                MODEL_NAME,
                torch_dtype=torch.float32,
                low_cpu_mem_usage=True
            )
            tokenizer = GPT2Tokenizer.from_pretrained(MODEL_NAME)
            tokenizer.pad_token = tokenizer.eos_token
        else:
            # Try to load fine-tuned model from private repo
            try:
                model_path = hf_hub_download(
                    repo_id=MODEL_REPO,
                    filename="pytorch_model.bin",
                    token=HF_TOKEN,
                    cache_dir="./model_cache"
                )
                config_path = hf_hub_download(
                    repo_id=MODEL_REPO,
                    filename="config.json",
                    token=HF_TOKEN,
                    cache_dir="./model_cache"
                )

                logger.info("Loading fine-tuned model...")
                model = GPT2LMHeadModel.from_pretrained(
                    MODEL_NAME,
                    state_dict=torch.load(model_path, map_location=DEVICE),
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=True
                )
                tokenizer = GPT2Tokenizer.from_pretrained(MODEL_NAME)
                tokenizer.pad_token = tokenizer.eos_token

            except Exception as e:
                logger.warning(f"Could not load fine-tuned model: {e}. Using base model.")
                model = GPT2LMHeadModel.from_pretrained(
                    MODEL_NAME,
                    torch_dtype=torch.float32,
                    low_cpu_mem_usage=True
                )
                tokenizer = GPT2Tokenizer.from_pretrained(MODEL_NAME)
                tokenizer.pad_token = tokenizer.eos_token

        model.to(DEVICE)
        logger.info("✅ Model loaded successfully!")
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

        # Create context-aware prompt
        prompt_parts = [
            f"Event: {event_type}",
            f"User Fitness Level: {fitness_level}",
            f"Goals: {', '.join(goals) if goals else 'general fitness'}",
            f"Current Program: {json.dumps(current_program)}",
            f"Context: {json.dumps(context)}",
            "Generate a JSON workout tweak following these rules:",
            "- No rep drops below 80% of planned reps",
            "- Maintain progressive overload principles",
            "- Consider user's fitness level and goals",
            "- Return only valid JSON with 'action', 'reason', and 'modifications' fields",
            "JSON Response:"
        ]

        prompt = "\n".join(prompt_parts)

        # Tokenize and generate
        inputs = tokenizer.encode(prompt, return_tensors="pt", max_length=512, truncation=True).to(DEVICE)

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

        # Extract JSON from response
        try:
            # Find JSON in response
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                tweak = json.loads(json_str)

                # Validate required fields
                if not all(key in tweak for key in ["action", "reason", "modifications"]):
                    raise ValueError("Missing required fields")

                # Apply safety rules
                tweak = apply_safety_rules(tweak, user_data)

                return tweak
            else:
                raise ValueError("No JSON found in response")

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
app = FastAPI(title="Technically Fit AI Service", version="1.0.0")

# Load model and tokenizer
try:
    model, tokenizer = load_model()
except Exception as e:
    logger.error(f"Failed to initialize model: {e}")
    model, tokenizer = None, None

@app.post("/event")
async def handle_event(request: EventRequest):
    """Handle app events and return AI-powered workout tweaks"""
    if model is None or tokenizer is None:
        raise HTTPException(status_code=503, detail="AI model not available")

    try:
        tweak = generate_ai_tweak(
            event_type=request.event,
            user_data=request.user_data,
            context=request.context
        )

        return {
            "success": True,
            "tweak": tweak,
            "user_id": request.user_id,
            "event": request.event
        }

    except Exception as e:
        logger.error(f"Error processing event: {e}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if model is not None else "unhealthy",
        "model": MODEL_REPO if model is not None else None,
        "device": DEVICE
    }

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Technically Fit AI Service",
        "version": "1.0.0",
        "endpoints": ["/event", "/health"]
    }

if __name__ == "__main__":
    import uvicorn
    logger.info("🚀 Starting Technically Fit AI Service...")
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False
    )