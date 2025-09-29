# AI Services for GPT-2 and ElevenLabs Integration

This directory contains Python services for AI coaching functionality.

## Setup

```bash
python -m venv ai-services-env
source ai-services-env/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

## Services

- `gpt2_service.py` - GPT-2 model fine-tuning and inference
- `tts_service.py` - ElevenLabs TTS integration
- `persona_engine.py` - AI coaching persona logic
- `audio_cache.py` - Audio file caching and management

## Environment Variables

```
ELEVENLABS_API_KEY=your_api_key_here
HUGGING_FACE_TOKEN=your_token_here
OPENAI_API_KEY=your_fallback_key_here
```