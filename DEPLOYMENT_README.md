# 🚀 Technically Fit AI Service Deployment

## Prerequisites
- Fly.io account (free tier available)
- GitHub Copilot access (for authentication)

## Quick Deploy

### Step 1: Authenticate with Fly.io
```bash
# Install flyctl (if not already installed)
curl -L https://fly.io/install.sh | sh
export PATH="$HOME/.fly/bin:$PATH"

# Authenticate
flyctl auth login
```

### Step 2: Deploy
```bash
# Run the deployment script
./deploy.sh

# Or deploy manually
flyctl deploy
```

## Configuration

### Fly.io Settings (`fly.toml`)
- **App Name**: `technically-fit-ai`
- **Region**: `iad` (Virginia)
- **Memory**: 1GB
- **CPU**: Shared (1 core)
- **Port**: 8080

### Environment Variables
Set these in Fly.io dashboard or via CLI:
```bash
flyctl secrets set HF_TOKEN=your_huggingface_token  # Optional, for private models
```

## API Endpoints

Once deployed, your AI service will be available at:
- **Base URL**: `https://technically-fit-ai.fly.dev`
- **Health Check**: `https://technically-fit-ai.fly.dev/health`
- **API Docs**: `https://technically-fit-ai.fly.dev/docs`
- **AI Endpoint**: `https://technically-fit-ai.fly.dev/event`

### Example API Call
```bash
curl -X POST "https://technically-fit-ai.fly.dev/event" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "workout_complete",
    "user_id": "test_user",
    "user_data": {"fitness_level": "beginner"},
    "context": {"exercises": ["push-ups"], "duration": 30}
  }'
```

## Constitution Compliance ✅

- ✅ **AI Model**: PhilmoLSC/philmoLSC (fine-tuned DistilGPT-2)
- ✅ **Cost**: Free tier deployment
- ✅ **Performance**: <1GB RAM, shared CPU
- ✅ **Scalability**: Supports 100-1,000 users

## Troubleshooting

### Deployment Issues
```bash
# Check app status
flyctl status

# View logs
flyctl logs

# Restart app
flyctl restart
```

### Model Loading Issues
- The service automatically falls back to local fine-tuned model
- If PhilmoLSC/philmoLSC becomes available, it will prioritize that
- Base DistilGPT-2 is always available as final fallback

## Cost Optimization

- **Free Tier**: 100 hours/month free
- **Memory**: 1GB (optimized for AI model)
- **Storage**: Model cached in container
- **Scaling**: Manual scaling available

---
**Ready for beta launch!** 🎉
