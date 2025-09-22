# Technically Fit AI Enhancement System

This directory contains the AI-powered enhancement system for Technically Fit, providing intelligent coaching responses, dynamic narration composition, and advanced user interaction capabilities.

## 🏗️ Architecture Overview

The AI system consists of several integrated components:

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   TypeScript    │    │    FastAPI       │    │   Python AI     │
│   Frontend      │◄──►│   Service        │◄──►│   Services      │
│                 │    │   (ai_api_service│    │                 │
│ - aiCoaching.ts │    │    .py)          │    │ - GPT-2 Model   │
│ - narrationComp │    │                  │    │ - Coaching      │
│   oser.ts       │    │ • REST API       │    │   Enhancer      │
│ - ttsEngine.ts  │    │ • Request/Resp   │    │ - Narration     │
└─────────────────┘    │ • CORS enabled   │    │   Composer      │
                       └──────────────────┘    └─────────────────┘
```

## 📁 File Structure

```
app/
├── ai_coaching_enhancer.py    # Main AI coaching service
├── narration_composer.py      # Workout narration composition
├── ai_api_service.py          # FastAPI REST service
├── fine_tune.py              # GPT-2 fine-tuning script
├── create_scripts_jsonl.py   # Training data preparation
├── scripts.jsonl             # Training dataset (480 phrases)
└── fine_tuned_gpt2/          # Fine-tuned model directory (created after training)
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python packages
pip install transformers torch fastapi uvicorn pydantic

# For development
pip install python-multipart
```

### 2. Fine-tune the Model (One-time setup)

```bash
# Run the fine-tuning script
python fine_tune.py
```

This will create a `fine_tuned_gpt2/` directory with the trained model.

### 3. Start the AI Service

```bash
# Start the FastAPI service
python ai_api_service.py
```

The service will be available at:

- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## 🔧 API Endpoints

### Core Endpoints

#### Generate Coaching Response

```http
POST /api/coaching/generate
Content-Type: application/json

{
  "coach_persona": "alice",
  "workout_phase": "set_start",
  "exercise_name": "Bench Press",
  "set_number": 1,
  "rep_count": 10,
  "has_pr": false
}
```

#### Compose Workout Narration

```http
POST /api/narration/compose
Content-Type: application/json

{
  "workout_plan": {
    "id": "workout_001",
    "exercises": [
      {
        "name": "Bench Press",
        "sets": [
          {"reps": 10, "rest_seconds": 60, "is_pr": false}
        ]
      }
    ]
  },
  "coach_persona": "alice"
}
```

#### Analyze User Sentiment

```http
POST /api/sentiment/analyze
Content-Type: application/json

{
  "user_input": "I feel great after that workout!"
}
```

#### Generate Pronunciation Guide

```http
POST /api/pronunciation/guide
Content-Type: application/json

{
  "exercise_name": "Romanian Deadlift"
}
```

## 💡 Usage Examples

### Python Integration

```python
from ai_coaching_enhancer import AICoachingEnhancer, CoachingContext

# Initialize the AI enhancer
enhancer = AICoachingEnhancer()

# Create coaching context
context = CoachingContext(
    coach_persona='alice',
    workout_phase='set_start',
    exercise_name='Bench Press',
    set_number=1,
    rep_count=10,
    has_pr=False
)

# Generate enhanced response
response = enhancer.generate_enhanced_response(context)
print(f"AI Response: {response}")

# Analyze user sentiment
sentiment = enhancer.analyze_user_sentiment("I'm feeling motivated!")
print(f"Sentiment: {sentiment['sentiment']} ({sentiment['confidence']:.2f})")
```

### JavaScript/TypeScript Integration

```typescript
// Example integration with existing aiCoaching.ts
async function getEnhancedCoachingResponse(context: CoachingContext) {
	const response = await fetch('http://localhost:8000/api/coaching/generate', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(context)
	});

	const result = await response.json();
	return result.data.response;
}
```

## 🎯 Key Features

### AI Coaching Enhancer

- **Fine-tuned GPT-2 Model**: Trained on existing persona scripts for contextually appropriate responses
- **Fallback System**: Gracefully falls back to original GPT-2 if fine-tuned model unavailable
- **Repetition Prevention**: Tracks used phrases to avoid repetitive responses
- **Sentiment Analysis**: Analyzes user feedback for adaptive coaching
- **Pronunciation Guides**: Generates phonetic guides for complex exercise names

### Narration Composer

- **Complete Workout Narrations**: Composes full workout scripts with timing
- **Phase-based Segments**: Organized by workout phases (welcome, sets, rest, transitions)
- **Timeline Generation**: Provides precise timing for each narration segment
- **Export Capability**: Saves narration scripts as JSON for TypeScript integration

### FastAPI Service

- **RESTful Endpoints**: Clean API design for frontend integration
- **CORS Enabled**: Ready for cross-origin requests from frontend
- **Error Handling**: Comprehensive error responses and logging
- **Background Tasks**: Asynchronous processing for heavy operations
- **Health Monitoring**: Built-in health checks and status endpoints

## 🔄 Integration with Existing System

### TypeScript Services Integration

The AI system is designed to enhance rather than replace your existing TypeScript services:

1. **aiCoaching.ts**: Enhanced with dynamic response generation
2. **narrationComposer.ts**: Extended with AI-powered composition
3. **ttsEngine.ts**: Improved pronunciation handling

### Backward Compatibility

- All existing functionality remains unchanged
- AI enhancements are opt-in and additive
- Fallback to original behavior if AI service unavailable
- No breaking changes to existing APIs

## 🛠️ Development & Testing

### Testing the AI Service

```bash
# Test individual components
python ai_coaching_enhancer.py
python narration_composer.py

# Test the API service
python ai_api_service.py

# In another terminal, test endpoints
curl -X GET http://localhost:8000/health
curl -X POST http://localhost:8000/api/coaching/generate \
  -H "Content-Type: application/json" \
  -d '{"coach_persona":"alice","workout_phase":"set_start","exercise_name":"Bench Press","set_number":1,"rep_count":10,"has_pr":false}'
```

### Model Training

The system uses a fine-tuned GPT-2 model trained on your existing persona scripts:

- **Training Data**: 480 coaching phrases from alice.json and aiden.json
- **Training Time**: ~5-10 minutes on CPU
- **Model Size**: ~500MB (GPT-2 base + fine-tuning)
- **Performance**: Generates contextually appropriate variations

### Customization

#### Adding New Persona Scripts

1. Add new persona JSON files to `src/lib/data/personas/`
2. Update the training data: `python create_scripts_jsonl.py`
3. Re-train the model: `python fine_tune.py`

#### Modifying Response Styles

Edit the prompts in `ai_coaching_enhancer.py` to change response generation behavior:

```python
# Customize the generation prompt
prompt = f"Coach {context.coach_persona.title()} style: {persona_style}\nPhase: {context.workout_phase}\nExercise: {context.exercise_name}\nBase: {base_response}\nVariation:"
```

## 📊 Performance & Monitoring

### Health Checks

The service provides comprehensive health monitoring:

```json
{
	"success": true,
	"data": {
		"ai_service": "operational",
		"model_loaded": true,
		"test_response": "Let's crush this Bench Press set!...",
		"persona_scripts_loaded": 2
	}
}
```

### Performance Metrics

- **Response Time**: < 2 seconds for coaching responses
- **Memory Usage**: ~1GB RAM for model loading
- **CPU Usage**: Minimal during inference, higher during training
- **Concurrent Requests**: Supports multiple simultaneous users

## 🚀 Deployment

### Production Deployment

```bash
# Install production dependencies
pip install gunicorn

# Run with gunicorn
gunicorn ai_api_service:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "ai_api_service.py"]
```

## 🤝 Contributing

### Adding New Features

1. **AI Enhancements**: Modify `ai_coaching_enhancer.py`
2. **API Endpoints**: Add routes to `ai_api_service.py`
3. **Narration Logic**: Update `narration_composer.py`
4. **Training Data**: Extend `create_scripts_jsonl.py`

### Testing

```bash
# Run unit tests (when implemented)
python -m pytest

# Manual testing
python ai_coaching_enhancer.py
```

## 📝 License & Credits

This AI enhancement system is part of the Git-Fit project and follows the same licensing terms.

### Dependencies

- **transformers**: Hugging Face transformers for GPT-2
- **torch**: PyTorch deep learning framework
- **fastapi**: Modern Python web framework
- **uvicorn**: ASGI server for FastAPI
- **pydantic**: Data validation and serialization

### Model Credits

- **Base Model**: GPT-2 by OpenAI (via Hugging Face)
- **Fine-tuning Data**: Generated from existing Git-Fit persona scripts
- **Training**: Custom fine-tuning pipeline using Hugging Face Trainer API

---

## 📞 Support

For questions about the AI system:

1. Check the API documentation at `http://localhost:8000/docs`
2. Review the example usage in the Python files
3. Test with the provided demo functions
4. Check the health endpoint for service status

The AI system is designed to be robust and will gracefully fall back to basic functionality if any component fails.
