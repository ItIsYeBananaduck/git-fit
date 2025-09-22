"""
FastAPI Service for Git-Fit AI Integration

This service provides REST API endpoints for:
1. AI-enhanced coaching response generation
2. Workout narration composition
3. Sentiment analysis for user feedback
4. Pronunciation guide generation
5. Model health and status monitoring

Integration Points:
- Called by TypeScript services (aiCoaching.ts, narrationComposer.ts)
- Provides AI capabilities without breaking existing architecture
- Supports both development and production deployment
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List, Optional, Any
import json
import os
from datetime import datetime
import uvicorn

# Import our AI services
from ai_coaching_enhancer import AICoachingEnhancer, CoachingContext
from narration_composer import NarrationComposer, WorkoutNarration

# Initialize FastAPI app
app = FastAPI(
    title="Git-Fit AI Service",
    description="AI-powered coaching and narration services for Git-Fit",
    version="1.0.0"
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],  # Add your frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize AI services
ai_enhancer = AICoachingEnhancer()
narration_composer = NarrationComposer(ai_enhancer)

# Pydantic models for API requests/responses
class CoachingRequest(BaseModel):
    coach_persona: str  # 'alice' or 'aiden'
    workout_phase: str
    exercise_name: str
    set_number: int
    rep_count: int
    has_pr: bool = False
    heart_rate: Optional[int] = None
    rest_time: Optional[int] = None
    user_sentiment: Optional[str] = None

class NarrationRequest(BaseModel):
    workout_plan: Dict[str, Any]
    coach_persona: str = 'alice'
    user_preferences: Optional[Dict[str, Any]] = None

class SentimentRequest(BaseModel):
    user_input: str

class PronunciationRequest(BaseModel):
    exercise_name: str

class APIResponse(BaseModel):
    success: bool
    data: Optional[Any] = None
    error: Optional[str] = None
    timestamp: str

# API Endpoints
@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "Git-Fit AI Service is running",
        "version": "1.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    try:
        # Test AI model availability
        test_context = CoachingContext(
            coach_persona='alice',
            workout_phase='set_start',
            exercise_name='Test',
            set_number=1,
            rep_count=10,
            has_pr=False
        )
        test_response = ai_enhancer.generate_enhanced_response(test_context)

        return APIResponse(
            success=True,
            data={
                "ai_service": "operational",
                "model_loaded": True,
                "test_response": test_response[:50] + "...",
                "persona_scripts_loaded": len(ai_enhancer.persona_scripts)
            },
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        return APIResponse(
            success=False,
            error=f"AI service error: {str(e)}",
            timestamp=datetime.now().isoformat()
        )

@app.post("/api/coaching/generate")
async def generate_coaching_response(request: CoachingRequest):
    """Generate an AI-enhanced coaching response"""
    try:
        context = CoachingContext(
            coach_persona=request.coach_persona,
            workout_phase=request.workout_phase,
            exercise_name=request.exercise_name,
            set_number=request.set_number,
            rep_count=request.rep_count,
            has_pr=request.has_pr,
            heart_rate=request.heart_rate,
            rest_time=request.rest_time,
            user_sentiment=request.user_sentiment
        )

        response = ai_enhancer.generate_enhanced_response(context)

        return APIResponse(
            success=True,
            data={
                "response": response,
                "context": {
                    "persona": request.coach_persona,
                    "phase": request.workout_phase,
                    "exercise": request.exercise_name
                }
            },
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate coaching response: {str(e)}")

@app.post("/api/narration/compose")
async def compose_narration(request: NarrationRequest, background_tasks: BackgroundTasks):
    """Compose a complete workout narration"""
    try:
        narration = narration_composer.compose_workout_narration(
            workout_plan=request.workout_plan,
            coach_persona=request.coach_persona,
            user_preferences=request.user_preferences
        )

        # Convert to serializable format
        narration_data = {
            "workout_id": narration.workout_id,
            "coach_persona": narration.coach_persona,
            "total_duration": narration.total_duration,
            "segment_count": len(narration.segments),
            "segments": [
                {
                    "phase": seg.phase,
                    "text": seg.text,
                    "duration_seconds": seg.duration_seconds,
                    "priority": seg.priority,
                    "exercise_name": seg.exercise_name,
                    "set_number": seg.set_number,
                    "rep_count": seg.rep_count,
                    "has_pr": seg.has_pr
                }
                for seg in narration.segments
            ],
            "timeline": narration_composer.get_narration_timeline(narration),
            "metadata": narration.metadata
        }

        # Optionally save narration script in background
        if request.workout_plan.get('save_script', False):
            background_tasks.add_task(
                narration_composer.export_narration_script,
                narration,
                f"src/lib/data/narrations/{narration.workout_id}.json"
            )

        return APIResponse(
            success=True,
            data=narration_data,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compose narration: {str(e)}")

@app.post("/api/sentiment/analyze")
async def analyze_sentiment(request: SentimentRequest):
    """Analyze user sentiment from text input"""
    try:
        result = ai_enhancer.analyze_user_sentiment(request.user_input)

        return APIResponse(
            success=True,
            data=result,
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to analyze sentiment: {str(e)}")

@app.post("/api/pronunciation/guide")
async def generate_pronunciation_guide(request: PronunciationRequest):
    """Generate pronunciation guide for exercise names"""
    try:
        guide = ai_enhancer.generate_pronunciation_guide(request.exercise_name)

        return APIResponse(
            success=True,
            data={
                "exercise_name": request.exercise_name,
                "pronunciation_guide": guide
            },
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate pronunciation guide: {str(e)}")

@app.get("/api/personas/available")
async def get_available_personas():
    """Get list of available coach personas"""
    try:
        personas = list(ai_enhancer.persona_scripts.keys())
        persona_info = {}

        for persona in personas:
            script = ai_enhancer.persona_scripts[persona]
            persona_info[persona] = {
                "name": persona.title(),
                "phases": list(script.get('phrases', {}).keys()),
                "phrase_count": sum(len(phrases) for phrases in script.get('phrases', {}).values())
            }

        return APIResponse(
            success=True,
            data={
                "personas": personas,
                "details": persona_info
            },
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get personas: {str(e)}")

@app.post("/api/enhanced-scripts/export")
async def export_enhanced_scripts(background_tasks: BackgroundTasks):
    """Export enhanced persona scripts with AI-generated variations"""
    try:
        output_dir = "src/lib/data/personas/enhanced"
        background_tasks.add_task(ai_enhancer.export_enhanced_scripts, output_dir)

        return APIResponse(
            success=True,
            data={
                "message": "Enhanced scripts export started",
                "output_directory": output_dir,
                "status": "processing"
            },
            timestamp=datetime.now().isoformat()
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start script export: {str(e)}")

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return APIResponse(
        success=False,
        error=str(exc.detail),
        timestamp=datetime.now().isoformat()
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return APIResponse(
        success=False,
        error=f"Internal server error: {str(exc)}",
        timestamp=datetime.now().isoformat()
    )

if __name__ == "__main__":
    print("Starting Git-Fit AI Service...")
    print("API endpoints available at: http://localhost:8000")
    print("API documentation at: http://localhost:8000/docs")

    uvicorn.run(
        "ai_api_service:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload to avoid multiprocessing issues
        log_level="info"
    )