"""
Configuration settings for AI services
"""

import os
from dotenv import load_dotenv

load_dotenv()

# API Keys
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")
HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Model Configuration
GPT2_MODEL_NAME = "gpt2"
GPT2_FINE_TUNED_PATH = "./fine_tuned_gpt2"

# ElevenLabs Configuration
ELEVENLABS_BASE_URL = "https://api.elevenlabs.io/v1"
ALICE_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # Example voice ID
AIDEN_VOICE_ID = "AZnzlk1XvdvUeBnXmlld"  # Example voice ID

# Audio Configuration
AUDIO_CACHE_DIR = "./audio_cache"
AUDIO_FORMAT = "mp3"
AUDIO_QUALITY = "high"
MAX_CACHE_SIZE_MB = 500

# Performance Configuration
MAX_RESPONSE_LENGTH = 200  # characters
RESPONSE_TIMEOUT = 5  # seconds
TTS_TIMEOUT = 10  # seconds

# Rate Limiting
FREE_TIER_REQUESTS_PER_HOUR = 20
PRO_TIER_REQUESTS_PER_HOUR = 100