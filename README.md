# 🏋️ Technically Fit - AI Fitness Coach API

A FastAPI-based AI fitness service that provides personalized workout tweaks and training recommendations using fine-tuned language models.

## Features

- 🚀 **Event-Driven API**: RESTful endpoints for app integrations
- 🤖 **AI-Powered Tweaks**: Smart workout modifications based on user events
- 💪 **Safety Rules**: No rep drops below 80%, progressive overload maintained
- 🎯 **Context-Aware**: Considers user fitness level, goals, and current program
- 🔒 **Privacy-First**: Designed for fitness app integrations with data protection

## API Endpoints

### POST /event

Handle app events and return AI-powered workout tweaks.

**Request Body:**

```json
{
  "event": "skip_set|complete_workout|struggle_set",
  "user_id": "string",
  "context": {
    "exercise": "bench_press",
    "set_number": 3
  },
  "user_data": {
    "fitness_level": "beginner|intermediate|advanced",
    "current_program": { "planned_reps": 10 },
    "goals": ["build_muscle", "increase_strength"]
  }
}
```

**Response:**

```json
{
  "success": true,
  "tweak": {
    "action": "reduce_volume|progress_weight|reduce_reps",
    "reason": "Explanation of the tweak",
    "modifications": { "sets": -1, "weight": 2.5 }
  },
  "user_id": "string",
  "event": "string"
}
```

### GET /health

Health check endpoint.

### GET /

API information and available endpoints.

## Model Details

- **Base Model**: DistilGPT-2 fine-tuned on fitness knowledge
- **Source**: Private Hugging Face repo (PhilmoLSC/philmoLSC)
- **Safety Rules**: 80% minimum rep retention, progressive overload
- **Memory Usage**: ~150MB RAM (CPU optimized)

## Deployment

### Local Development

```bash
# Install dependencies
pip install -r requirements.txt

# Run locally
python app.py
```

### Fly.io Deployment

```bash
# 1. Download flyctl (Windows)
# Go to: https://github.com/superfly/flyctl/releases/latest
# Download: flyctl.exe
# Save to project directory

# 2. Authenticate
flyctl.exe auth login

# 3. Deploy
flyctl.exe deploy

# 4. Set Hugging Face token
flyctl.exe secrets set HF_TOKEN=your_actual_huggingface_token_here

# 5. Get app URL
flyctl.exe status

# 6. Test deployment
python test_deployment.py https://your-app.fly.dev
```

### Testing Endpoints

```bash
# Health check
curl https://your-app.fly.dev/health

# Event endpoint
curl -X POST https://your-app.fly.dev/event \
  -H "Content-Type: application/json" \
  -d '{
    "event": "skip_set",
    "user_id": "test123",
    "context": {"exercise": "bench_press"},
    "user_data": {"fitness_level": "intermediate"}
  }'
```

## Technical Stack

- **Framework**: FastAPI with Pydantic validation
- **Model**: Transformers library with PyTorch
- **Hosting**: Fly.io (cost-effective, scalable)
- **Container**: Python buildpack with optimized runtime

## Safety & Rules

- ✅ **No rep drops below 80%** of planned reps
- ✅ **Progressive overload** principles maintained
- ✅ **User fitness level** consideration
- ✅ **Goal alignment** for all recommendations
- ✅ **Fallback responses** when AI unavailable

## Privacy & Security

- 🔒 **Event-based**: No persistent user data storage
- 🛡️ **Minimal data**: Only current context processed
- 🔐 **Secure**: HTTPS-only endpoints
- 📊 **No tracking**: Anonymous event processing

## Cost Optimization

- 💰 **Fly.io**: $0-10/month based on usage
- ⚡ **CPU optimized**: No GPU required
- 📦 **Lightweight**: ~150MB memory footprint
- 🔄 **Scalable**: Auto-scaling for 100-1000 users

## Integration

Designed for integration with fitness apps like Technically Fit mobile app. Supports real-time workout adjustments and personalized coaching through event-driven architecture.

---

Powered by FastAPI, Transformers, and hosted on Fly.io
