"""
ElevenLabs TTS Service Integration
"""

import httpx
import asyncio
import hashlib
import os
from typing import Optional, Dict, Any
from audio_cache import audio_cache_service
from config import (
    ELEVENLABS_API_KEY,
    ELEVENLABS_BASE_URL,
    ALICE_VOICE_ID,
    AIDEN_VOICE_ID,
    AUDIO_CACHE_DIR,
    TTS_TIMEOUT
)


class ElevenLabsTTSService:
    """Service for generating speech using ElevenLabs TTS API"""
    
    def __init__(self):
        self.api_key = ELEVENLABS_API_KEY
        self.base_url = ELEVENLABS_BASE_URL
        self.voice_map = {
            "alice": ALICE_VOICE_ID,
            "aiden": AIDEN_VOICE_ID
        }
        
        # Ensure cache directory exists
        os.makedirs(AUDIO_CACHE_DIR, exist_ok=True)
    
    async def generate_speech(
        self, 
        text: str, 
        persona_id: str,
        voice_settings: Optional[Dict[str, float]] = None
    ) -> Dict[str, Any]:
        """
        Generate speech from text using ElevenLabs TTS
        
        Args:
            text: Text to convert to speech
            persona_id: AI persona identifier (alice/aiden)
            voice_settings: Optional voice configuration
            
        Returns:
            Dict containing audio_url, file_size, generation_time
        """
        if not self.api_key:
            raise ValueError("ElevenLabs API key not configured")
        
        voice_id = self.voice_map.get(persona_id)
        if not voice_id:
            raise ValueError(f"Unknown persona: {persona_id}")
        
        # Default voice settings
        if voice_settings is None:
            voice_settings = {
                "stability": 0.75,
                "similarity_boost": 0.75
            }
        
        # Generate cache key
        cache_key = audio_cache_service.generate_cache_key(text, persona_id, voice_settings)
        
        # Check if audio is already cached
        cached_audio = await audio_cache_service.get_cached_audio(cache_key)
        if cached_audio:
            return {
                "audio_url": cached_audio["audio_url"],
                "file_size": cached_audio["file_size"],
                "generation_time": 0,
                "cache_hit": True
            }
        
        # Generate new audio
        start_time = asyncio.get_event_loop().time()
        
        url = f"{self.base_url}/text-to-speech/{voice_id}"
        headers = {
            "Accept": "audio/mpeg",
            "Content-Type": "application/json",
            "xi-api-key": self.api_key
        }
        
        data = {
            "text": text,
            "model_id": "eleven_monolingual_v1",
            "voice_settings": voice_settings
        }
        
        async with httpx.AsyncClient(timeout=TTS_TIMEOUT) as client:
            response = await client.post(url, json=data, headers=headers)
            response.raise_for_status()
            
            # Store audio in cache
            cache_result = await audio_cache_service.store_audio(
                cache_key=cache_key,
                audio_data=response.content,
                metadata={
                    "text_content": text,
                    "persona_id": persona_id,
                    "audio_length": self._estimate_audio_length(text),
                    "generation_cost": self._calculate_cost(text)
                }
            )
        
        generation_time = (asyncio.get_event_loop().time() - start_time) * 1000
        
        return {
            "audio_url": cache_result["audio_url"],
            "file_size": cache_result["file_size"],
            "generation_time": generation_time,
            "cache_hit": False
        }
    
    def _estimate_audio_length(self, text: str) -> float:
        """Estimate audio length in seconds based on text length"""
        # Rough estimate: ~150 words per minute, ~5 characters per word
        words = len(text) / 5
        return (words / 150) * 60
    
    def _calculate_cost(self, text: str) -> float:
        """Calculate estimated cost for TTS generation"""
        # ElevenLabs pricing: ~$0.22 per 1000 characters
        return (len(text) / 1000) * 0.22
    
    async def get_voice_info(self, persona_id: str) -> Dict[str, Any]:
        """Get information about a voice"""
        voice_id = self.voice_map.get(persona_id)
        if not voice_id:
            raise ValueError(f"Unknown persona: {persona_id}")
        
        url = f"{self.base_url}/voices/{voice_id}"
        headers = {"xi-api-key": self.api_key}
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            return response.json()
    
    async def health_check(self) -> bool:
        """Check if the ElevenLabs API is accessible"""
        try:
            url = f"{self.base_url}/user"
            headers = {"xi-api-key": self.api_key}
            
            async with httpx.AsyncClient(timeout=5) as client:
                response = await client.get(url, headers=headers)
                return response.status_code == 200
        except Exception:
            return False


# Service instance
tts_service = ElevenLabsTTSService()