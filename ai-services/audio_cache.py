"""
Audio Caching Service
Manages local audio file caching for TTS responses
"""

import os
import asyncio
import hashlib
import json
import time
import logging
from typing import Dict, Any, Optional, List
from config import AUDIO_CACHE_DIR, MAX_CACHE_SIZE_MB

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AudioCacheService:
    """Service for managing audio file caching"""
    
    def __init__(self):
        self.cache_dir = AUDIO_CACHE_DIR
        self.max_cache_size = MAX_CACHE_SIZE_MB * 1024 * 1024  # Convert to bytes
        self.cache_index_file = os.path.join(self.cache_dir, "cache_index.json")
        self.cache_index = {}
        
        # Ensure cache directory exists
        os.makedirs(self.cache_dir, exist_ok=True)
        
        # Load existing cache index
        self._load_cache_index()
    
    def _load_cache_index(self):
        """Load cache index from disk"""
        try:
            if os.path.exists(self.cache_index_file):
                with open(self.cache_index_file, 'r') as f:
                    self.cache_index = json.load(f)
                logger.info(f"Loaded cache index with {len(self.cache_index)} entries")
        except Exception as e:
            logger.warning(f"Failed to load cache index: {e}")
            self.cache_index = {}
    
    def _save_cache_index(self):
        """Save cache index to disk"""
        try:
            with open(self.cache_index_file, 'w') as f:
                json.dump(self.cache_index, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save cache index: {e}")
    
    def generate_cache_key(
        self,
        text: str,
        persona_id: str,
        voice_settings: Dict[str, Any]
    ) -> str:
        """Generate a unique cache key for audio content"""
        content = f"{text}:{persona_id}:{json.dumps(voice_settings, sort_keys=True)}"
        return hashlib.md5(content.encode()).hexdigest()
    
    async def get_cached_audio(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve cached audio file if it exists and is valid
        
        Args:
            cache_key: Unique cache key for the audio
            
        Returns:
            Cache entry with file path and metadata, or None if not found
        """
        if cache_key not in self.cache_index:
            return None
        
        entry = self.cache_index[cache_key]
        file_path = os.path.join(self.cache_dir, f"{cache_key}.mp3")
        
        # Check if file exists
        if not os.path.exists(file_path):
            logger.warning(f"Cache file missing: {cache_key}")
            del self.cache_index[cache_key]
            self._save_cache_index()
            return None
        
        # Check if expired
        current_time = time.time()
        if current_time > entry.get("expires_at", 0):
            logger.info(f"Cache entry expired: {cache_key}")
            await self._remove_cache_entry(cache_key)
            return None
        
        # Update access stats
        entry["hit_count"] = entry.get("hit_count", 0) + 1
        entry["last_accessed"] = current_time
        self._save_cache_index()
        
        return {
            "cache_key": cache_key,
            "file_path": file_path,
            "audio_url": f"/audio_cache/{cache_key}.mp3",
            "file_size": entry.get("file_size", 0),
            "audio_length": entry.get("audio_length", 0),
            "hit_count": entry["hit_count"],
            "created_at": entry.get("created_at", current_time)
        }
    
    async def store_audio(
        self,
        cache_key: str,
        audio_data: bytes,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Store audio data in cache
        
        Args:
            cache_key: Unique cache key
            audio_data: Audio file bytes
            metadata: Audio metadata (persona_id, text_content, etc.)
            
        Returns:
            Cache entry information
        """
        file_path = os.path.join(self.cache_dir, f"{cache_key}.mp3")
        
        try:
            # Write audio file
            with open(file_path, 'wb') as f:
                f.write(audio_data)
            
            file_size = len(audio_data)
            current_time = time.time()
            
            # Create cache entry
            cache_entry = {
                "cache_key": cache_key,
                "text_content": metadata.get("text_content", ""),
                "persona_id": metadata.get("persona_id", ""),
                "audio_length": metadata.get("audio_length", 0),
                "file_size": file_size,
                "format": "mp3",
                "quality": metadata.get("quality", "high"),
                "generation_cost": metadata.get("generation_cost", 0.0),
                "hit_count": 0,
                "last_accessed": current_time,
                "created_at": current_time,
                "expires_at": current_time + (24 * 60 * 60)  # 24 hours TTL
            }
            
            # Add to index
            self.cache_index[cache_key] = cache_entry
            self._save_cache_index()
            
            # Check cache size and cleanup if needed
            await self._cleanup_cache_if_needed()
            
            logger.info(f"Stored audio in cache: {cache_key} ({file_size} bytes)")
            
            return {
                "cache_key": cache_key,
                "file_path": file_path,
                "audio_url": f"/audio_cache/{cache_key}.mp3",
                "file_size": file_size,
                "cached": True
            }
            
        except Exception as e:
            logger.error(f"Failed to store audio in cache: {e}")
            # Clean up partial file
            if os.path.exists(file_path):
                os.remove(file_path)
            raise
    
    async def _remove_cache_entry(self, cache_key: str):
        """Remove a cache entry and its file"""
        file_path = os.path.join(self.cache_dir, f"{cache_key}.mp3")
        
        # Remove file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                logger.warning(f"Failed to remove cache file {file_path}: {e}")
        
        # Remove from index
        if cache_key in self.cache_index:
            del self.cache_index[cache_key]
            self._save_cache_index()
    
    async def _cleanup_cache_if_needed(self):
        """Clean up cache if it exceeds size limit"""
        current_size = await self._calculate_cache_size()
        
        if current_size <= self.max_cache_size:
            return
        
        logger.info(f"Cache size ({current_size / 1024 / 1024:.2f}MB) exceeds limit, cleaning up...")
        
        # Sort entries by last accessed time (LRU)
        sorted_entries = sorted(
            self.cache_index.items(),
            key=lambda x: x[1].get("last_accessed", 0)
        )
        
        # Remove entries until under limit
        for cache_key, entry in sorted_entries:
            await self._remove_cache_entry(cache_key)
            
            current_size = await self._calculate_cache_size()
            if current_size <= self.max_cache_size * 0.8:  # Leave some buffer
                break
        
        logger.info(f"Cache cleanup complete. New size: {current_size / 1024 / 1024:.2f}MB")
    
    async def _calculate_cache_size(self) -> int:
        """Calculate total cache size in bytes"""
        total_size = 0
        
        for cache_key in self.cache_index:
            file_path = os.path.join(self.cache_dir, f"{cache_key}.mp3")
            if os.path.exists(file_path):
                total_size += os.path.getsize(file_path)
        
        return total_size
    
    async def cleanup_expired_entries(self):
        """Remove all expired cache entries"""
        current_time = time.time()
        expired_keys = []
        
        for cache_key, entry in self.cache_index.items():
            if current_time > entry.get("expires_at", 0):
                expired_keys.append(cache_key)
        
        if expired_keys:
            logger.info(f"Removing {len(expired_keys)} expired cache entries")
            for cache_key in expired_keys:
                await self._remove_cache_entry(cache_key)
    
    async def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        current_size = await self._calculate_cache_size()
        
        total_hits = sum(entry.get("hit_count", 0) for entry in self.cache_index.values())
        total_cost_saved = sum(entry.get("generation_cost", 0) for entry in self.cache_index.values())
        
        return {
            "total_entries": len(self.cache_index),
            "total_size_bytes": current_size,
            "total_size_mb": current_size / 1024 / 1024,
            "max_size_mb": self.max_cache_size / 1024 / 1024,
            "usage_percentage": (current_size / self.max_cache_size) * 100,
            "total_hits": total_hits,
            "estimated_cost_saved": total_cost_saved,
            "cache_hit_rate": self._calculate_hit_rate()
        }
    
    def _calculate_hit_rate(self) -> float:
        """Calculate cache hit rate"""
        if not self.cache_index:
            return 0.0
        
        total_hits = sum(entry.get("hit_count", 0) for entry in self.cache_index.values())
        total_entries = len(self.cache_index)
        
        # Estimate hit rate based on hits per entry
        if total_entries == 0:
            return 0.0
        
        avg_hits = total_hits / total_entries
        return min(avg_hits / (avg_hits + 1), 1.0) * 100  # Convert to percentage
    
    async def clear_cache(self, persona_id: Optional[str] = None):
        """
        Clear cache entries
        
        Args:
            persona_id: If provided, only clear entries for this persona
        """
        if persona_id:
            keys_to_remove = [
                key for key, entry in self.cache_index.items()
                if entry.get("persona_id") == persona_id
            ]
        else:
            keys_to_remove = list(self.cache_index.keys())
        
        for cache_key in keys_to_remove:
            await self._remove_cache_entry(cache_key)
        
        logger.info(f"Cleared {len(keys_to_remove)} cache entries")
    
    async def health_check(self) -> bool:
        """Check if cache service is healthy"""
        try:
            # Check if cache directory is accessible
            if not os.path.exists(self.cache_dir):
                return False
            
            # Check if we can write to cache directory
            test_file = os.path.join(self.cache_dir, "health_check.tmp")
            with open(test_file, 'w') as f:
                f.write("test")
            os.remove(test_file)
            
            return True
            
        except Exception as e:
            logger.error(f"Cache health check failed: {e}")
            return False


# Service instance
audio_cache_service = AudioCacheService()