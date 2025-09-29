"""
AI Coaching Persona Engine
Orchestrates GPT-2 and TTS services to generate personalized coaching responses
"""

import asyncio
import logging
from typing import Dict, Any, Optional
from gpt2_service import gpt2_service
from tts_service import tts_service
from config import MAX_RESPONSE_LENGTH

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PersonaEngine:
    """Main engine for generating personalized AI coaching responses"""
    
    def __init__(self):
        self.personas = {
            "alice": {
                "name": "Alice",
                "description": "Enthusiastic and supportive coach",
                "personality": {
                    "enthusiasm": 0.9,
                    "supportiveness": 0.8,
                    "directness": 0.6
                },
                "voice_settings": {
                    "stability": 0.75,
                    "similarity_boost": 0.75
                },
                "response_patterns": [
                    "Amazing work! {encouragement}",
                    "You're crushing it! {motivation}",
                    "Keep that energy up! {advice}",
                    "Fantastic form! {tip}",
                    "I love your dedication! {support}"
                ]
            },
            "aiden": {
                "name": "Aiden",
                "description": "Direct and motivational coach",
                "personality": {
                    "enthusiasm": 0.7,
                    "supportiveness": 0.7,
                    "directness": 0.9
                },
                "voice_settings": {
                    "stability": 0.8,
                    "similarity_boost": 0.7
                },
                "response_patterns": [
                    "Focus and push through! {motivation}",
                    "Time to level up! {challenge}",
                    "No excuses, just results! {push}",
                    "This is where you grow! {insight}",
                    "Own this moment! {empowerment}"
                ]
            }
        }
        
        self.trigger_templates = {
            "onboarding": "Welcome to AdaptiveFit! I'm {persona_name}, your AI coaching companion. I'll be here to motivate and guide you through your fitness journey. Let's start strong and make every workout count!",
            "pre-start": "Time to begin your {exercise} workout! You've got this. Remember your form and breathe steady.",
            "set-start": "Starting set {set_number} of {exercise}. {reps} reps at {weight} lbs. Focus and execute!",
            "set-end": "Set complete! Great work on those {reps} {exercise} reps. {strain_feedback}",
            "strainsync": "Your strain is at {strain}% with heart rate {heart_rate} BPM. {strain_advice}",
            "workout-end": "Workout complete! You pushed through {total_sets} sets and showed real dedication. {workout_summary}"
        }
    
    async def generate_coaching_response(
        self,
        trigger_id: str,
        persona_id: str,
        workout_context: Dict[str, Any],
        device_state: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete coaching response with text and optional audio
        
        Args:
            trigger_id: Type of workout trigger
            persona_id: AI persona identifier
            workout_context: Exercise context data
            device_state: User's device capabilities
            user_preferences: User subscription and preferences
            
        Returns:
            Complete coaching response with text, audio, and metadata
        """
        try:
            start_time = asyncio.get_event_loop().time()
            
            # Validate inputs
            if persona_id not in self.personas:
                raise ValueError(f"Unknown persona: {persona_id}")
            
            if trigger_id not in self.trigger_templates:
                raise ValueError(f"Unknown trigger: {trigger_id}")
            
            # Build contextual prompt
            prompt = self._build_prompt(trigger_id, persona_id, workout_context)
            
            # Generate text response using GPT-2
            text_result = await gpt2_service.generate_response(
                prompt=prompt,
                persona_id=persona_id,
                max_length=200 if trigger_id == "onboarding" else 75
            )
            
            response = {
                "responseId": f"response_{asyncio.get_event_loop().time()}_{persona_id}",
                "text": text_result["text"],
                "toastMessage": text_result["toast_message"],
                "hasAudio": False,
                "audioUrl": None,
                "metadata": text_result["metadata"]
            }
            
            # Generate audio if conditions are met
            should_generate_audio = self._should_generate_audio(
                device_state, user_preferences, persona_id
            )
            
            if should_generate_audio:
                try:
                    audio_result = await tts_service.generate_speech(
                        text=text_result["text"],
                        persona_id=persona_id,
                        voice_settings=self.personas[persona_id]["voice_settings"]
                    )
                    
                    response.update({
                        "hasAudio": True,
                        "audioUrl": audio_result["audio_url"],
                        "metadata": {
                            **response["metadata"],
                            "ttsLatency": audio_result["generation_time"],
                            "cacheHit": audio_result["cache_hit"],
                            "audioFileSize": audio_result["file_size"]
                        }
                    })
                    
                except Exception as e:
                    logger.warning(f"Audio generation failed, continuing with text: {e}")
                    # Continue with text-only response
            
            # Calculate total response time
            total_time = (asyncio.get_event_loop().time() - start_time) * 1000
            response["metadata"]["totalLatency"] = total_time
            
            logger.info(f"Generated response for {trigger_id} in {total_time:.2f}ms")
            return response
            
        except Exception as e:
            logger.error(f"Failed to generate coaching response: {e}")
            # Return fallback response
            return self._generate_fallback_response(trigger_id, persona_id)
    
    def _build_prompt(
        self,
        trigger_id: str,
        persona_id: str,
        workout_context: Dict[str, Any]
    ) -> str:
        """Build contextual prompt for GPT-2 generation"""
        
        # Get base template
        template = self.trigger_templates[trigger_id]
        persona = self.personas[persona_id]
        
        # Fill in context variables
        context_vars = {
            "persona_name": persona["name"],
            "exercise": workout_context.get("exercise", "exercise"),
            "reps": workout_context.get("reps", 10),
            "weight": workout_context.get("weight", 0),
            "strain": workout_context.get("strain", 0),
            "heart_rate": workout_context.get("heartRate", 0),
            "set_number": workout_context.get("setNumber", 1),
            "total_sets": workout_context.get("totalSets", 3)
        }
        
        # Add trigger-specific context
        if trigger_id == "set-end":
            strain = context_vars["strain"]
            if strain > 80:
                context_vars["strain_feedback"] = "That was intense! Perfect effort level."
            elif strain > 60:
                context_vars["strain_feedback"] = "Good intensity! Keep pushing."
            else:
                context_vars["strain_feedback"] = "Room to push harder next set!"
        
        elif trigger_id == "strainsync":
            strain = context_vars["strain"]
            if strain > 85:
                context_vars["strain_advice"] = "You're in the red zone! Focus on breathing."
            elif strain > 70:
                context_vars["strain_advice"] = "Perfect training zone! Maintain this pace."
            else:
                context_vars["strain_advice"] = "You can push harder! Increase intensity."
        
        elif trigger_id == "workout-end":
            context_vars["workout_summary"] = "Time to rest and recover!"
        
        # Format template with available variables
        try:
            prompt = template.format(**context_vars)
        except KeyError:
            # Fallback if some variables are missing
            prompt = template.format(
                persona_name=persona["name"],
                exercise="your workout",
                reps="",
                weight="",
                strain="",
                heart_rate="",
                set_number="",
                total_sets="",
                strain_feedback="",
                strain_advice="",
                workout_summary=""
            )
        
        return prompt
    
    def _should_generate_audio(
        self,
        device_state: Dict[str, Any],
        user_preferences: Optional[Dict[str, Any]],
        persona_id: str
    ) -> bool:
        """Determine if audio should be generated"""
        
        # Check if audio is enabled
        if not device_state.get("audioEnabled", False):
            return False
        
        # Check user subscription level
        if user_preferences:
            if not user_preferences.get("voiceAccess", False):
                return False
        
        # Check device capabilities
        has_earbuds = device_state.get("hasEarbuds", False)
        fallback_to_speaker = user_preferences and user_preferences.get(
            "devicePreferences", {}
        ).get("fallbackToSpeaker", False)
        
        return has_earbuds or fallback_to_speaker
    
    def _generate_fallback_response(
        self,
        trigger_id: str,
        persona_id: str
    ) -> Dict[str, Any]:
        """Generate a simple fallback response when main generation fails"""
        
        fallback_messages = {
            "onboarding": "Welcome to AdaptiveFit! Let's get started on your fitness journey!",
            "pre-start": "Ready to begin? You've got this!",
            "set-start": "Time to start your set. Focus and breathe!",
            "set-end": "Great set! Keep up the momentum.",
            "strainsync": "You're doing great! Keep pushing forward.",
            "workout-end": "Workout complete! Excellent effort today."
        }
        
        text = fallback_messages.get(trigger_id, "Keep going! You're doing amazing!")
        
        return {
            "responseId": f"fallback_{asyncio.get_event_loop().time()}_{persona_id}",
            "text": text,
            "toastMessage": text[:50],
            "hasAudio": False,
            "audioUrl": None,
            "metadata": {
                "generationLatency": 0,
                "fallbackUsed": True,
                "modelVersion": "fallback",
                "persona_id": persona_id
            }
        }
    
    async def get_persona_info(self, persona_id: str) -> Dict[str, Any]:
        """Get information about a specific persona"""
        if persona_id not in self.personas:
            raise ValueError(f"Unknown persona: {persona_id}")
        
        persona = self.personas[persona_id]
        return {
            "id": persona_id,
            "name": persona["name"],
            "description": persona["description"],
            "personalityTraits": persona["personality"],
            "voicePreview": f"/audio/{persona_id}-preview.mp3"
        }
    
    async def get_all_personas(self) -> list:
        """Get information about all available personas"""
        return [
            await self.get_persona_info(persona_id)
            for persona_id in self.personas.keys()
        ]
    
    async def health_check(self) -> Dict[str, bool]:
        """Check health of all persona engine components"""
        return {
            "gpt2_service": await gpt2_service.health_check(),
            "tts_service": await tts_service.health_check(),
            "personas_loaded": len(self.personas) > 0
        }


# Service instance
persona_engine = PersonaEngine()