# AI Coaching System Quickstart Guide

## Overview

This guide provides step-by-step instructions to test the AI coaching system integration with GPT-2 and ElevenLabs TTS. Follow these scenarios to validate core functionality before full implementation.

## Prerequisites

- Node.js 18+ and pnpm installed
- Convex account and project setup
- ElevenLabs API key (free tier: 10k chars/month)
- Hugging Face account for model access
- Development environment with audio capabilities

## Quick Setup

### 1. Environment Configuration

```bash
# Clone and setup
cd /workspaces/git-fit
pnpm install

# Environment variables (.env.local)
CONVEX_DEPLOYMENT=your-convex-deployment
ELEVENLABS_API_KEY=your-elevenlabs-key
HUGGING_FACE_TOKEN=your-hf-token
OPENAI_API_KEY=your-openai-key  # Fallback for development
```

### 2. Database Initialization

```bash
# Initialize Convex schema
cd app/convex
npx convex dev

# Seed initial data
npx convex run setup:seedAIPersonas
npx convex run setup:seedWorkoutTriggers
```

### 3. Mobile App Setup

```bash
# Start development server
cd app
pnpm dev

# For mobile testing
pnpm build
npx cap sync
npx cap run ios  # or android
```

## Test Scenarios

### Scenario 1: Basic Coaching Trigger (5 minutes)

**Goal**: Verify core coaching response generation

```bash
# Test API endpoint
curl -X POST http://localhost:5173/api/coaching/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "triggerId": "pre-start",
    "userId": "test-user-001",
    "personaId": "alice",
    "workoutContext": {
      "exercise": "Squats",
      "reps": 10,
      "weight": 135
    },
    "deviceState": {
      "hasEarbuds": false,
      "audioEnabled": true
    }
  }'
```

**Expected Result**:

- 200 response with coaching text (<200 chars)
- Toast message (<50 chars)
- Response time <500ms
- No audio URL (earbuds not detected)

### Scenario 2: Audio Generation with Earbuds (10 minutes)

**Goal**: Test TTS pipeline with ElevenLabs

```bash
# Test with earbuds detected
curl -X POST http://localhost:5173/api/coaching/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "triggerId": "set-end",
    "userId": "test-user-002",
    "personaId": "aiden",
    "workoutContext": {
      "exercise": "Deadlifts",
      "reps": 8,
      "weight": 225,
      "strain": 85
    },
    "deviceState": {
      "hasEarbuds": true,
      "audioEnabled": true
    }
  }'
```

**Expected Result**:

- 200 response with coaching text
- `hasAudio: true`
- Valid `audioUrl` pointing to MP3 file
- Total response time <500ms
- Audio file playable and matches text

### Scenario 3: Subscription Management (8 minutes)

**Goal**: Verify user preferences and persona switching

```bash
# Get current subscription
curl -H "Authorization: Bearer test-token" \
  http://localhost:5173/api/coaching/subscription

# Update preferences
curl -X PUT http://localhost:5173/api/coaching/subscription \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{
    "preferredPersona": "aiden",
    "devicePreferences": {
      "autoDetectEarbuds": true,
      "fallbackToSpeaker": false,
      "toastDuration": 3000
    },
    "privacySettings": {
      "allowDataCollection": true,
      "allowAITraining": false,
      "dataRetentionDays": 30
    }
  }'
```

**Expected Result**:

- Subscription retrieved successfully
- Preferences updated and persisted
- Next coaching request uses new persona

### Scenario 4: Rate Limiting Test (5 minutes)

**Goal**: Verify rate limiting prevents abuse

```bash
# Rapid-fire requests (should trigger rate limit)
for i in {1..60}; do
  curl -X POST http://localhost:5173/api/coaching/trigger \
    -H "Content-Type: application/json" \
    -d '{
      "triggerId": "onboarding",
      "userId": "test-user-rate-limit",
      "workoutContext": {},
      "deviceState": {"hasEarbuds": false, "audioEnabled": true}
    }' &
done
wait
```

**Expected Result**:

- First 50 requests succeed (free tier limit)
- Subsequent requests return 429 status
- `retryAfter` header indicates wait time

### Scenario 5: Audio Caching Test (7 minutes)

**Goal**: Verify audio caching reduces API costs

```bash
# First request (cache miss)
START_TIME=$(date +%s%3N)
curl -X POST http://localhost:5173/api/coaching/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "triggerId": "workout-end",
    "userId": "test-user-cache-1",
    "personaId": "alice",
    "workoutContext": {"exercise": "Push-ups", "reps": 20},
    "deviceState": {"hasEarbuds": true, "audioEnabled": true}
  }'
FIRST_TIME=$(($(date +%s%3N) - START_TIME))

# Second request with identical context (cache hit)
START_TIME=$(date +%s%3N)
curl -X POST http://localhost:5173/api/coaching/trigger \
  -H "Content-Type: application/json" \
  -d '{
    "triggerId": "workout-end",
    "userId": "test-user-cache-2",
    "personaId": "alice",
    "workoutContext": {"exercise": "Push-ups", "reps": 20},
    "deviceState": {"hasEarbuds": true, "audioEnabled": true}
  }'
SECOND_TIME=$(($(date +%s%3N) - START_TIME))

echo "First request: ${FIRST_TIME}ms"
echo "Second request: ${SECOND_TIME}ms"
```

**Expected Result**:

- First request: `metadata.cacheHit: false`, longer response time
- Second request: `metadata.cacheHit: true`, <100ms response time
- Same audio URL returned for both requests

### Scenario 6: Mobile Integration Test (15 minutes)

**Goal**: Test complete mobile workflow

1. **Setup Mobile Environment**:

   ```bash
   cd app
   npx cap run ios  # or android
   ```

2. **Test Workout Flow**:

   - Open app and navigate to workout
   - Start exercise with earbuds connected
   - Verify coaching triggers at appropriate moments
   - Check toast notifications appear correctly
   - Validate audio plays through earbuds

3. **Test Offline Handling**:
   - Disconnect internet
   - Trigger coaching event
   - Verify graceful fallback (cached responses or text-only)

**Expected Results**:

- Smooth workout experience with coaching
- Audio plays correctly through earbuds
- Toast messages don't interrupt workout flow
- Offline mode handles gracefully

### Scenario 7: Privacy Compliance Test (10 minutes)

**Goal**: Verify GDPR/CCPA compliance features

```bash
# Test data export
curl -H "Authorization: Bearer test-token" \
  http://localhost:5173/api/user/data-export

# Test data deletion request
curl -X DELETE http://localhost:5173/api/user/data \
  -H "Authorization: Bearer test-token" \
  -H "Content-Type: application/json" \
  -d '{"confirmDeletion": true}'

# Verify anonymization
curl -H "Authorization: Bearer admin-token" \
  http://localhost:5173/api/admin/training-data/anonymize
```

**Expected Results**:

- Data export contains all user data in portable format
- Deletion request schedules data removal in 30 days
- Training data anonymized (no personal identifiers)

## Performance Benchmarks

### Latency Targets

- **Text Generation**: <200ms (GPT-2 local inference)
- **TTS Generation**: <300ms (ElevenLabs API)
- **Total Response**: <500ms (end-to-end)
- **Cache Hit**: <50ms (audio retrieval)

### Load Testing

```bash
# Install load testing tool
npm install -g artillery

# Run load test
artillery run load-test-config.yml

# Expected results:
# - 100 concurrent users: <500ms p95 response time
# - 1000 requests/minute: No errors
# - Rate limiting properly enforced
```

## Troubleshooting

### Common Issues

1. **Slow Response Times**:

   - Check GPT-2 model loading (first request slower)
   - Verify ElevenLabs API latency
   - Monitor Convex database performance

2. **Audio Not Playing**:

   - Verify earbuds detection logic
   - Check ElevenLabs API key and quota
   - Validate audio URL accessibility

3. **Rate Limiting Errors**:

   - Check user subscription tier
   - Verify rate limit windows reset correctly
   - Monitor API usage patterns

4. **Privacy Compliance**:
   - Verify data retention policies active
   - Check anonymization functions
   - Validate consent management

### Debug Commands

```bash
# Check service health
curl http://localhost:5173/api/health

# Monitor API usage
curl -H "Authorization: Bearer admin-token" \
  http://localhost:5173/api/admin/usage-stats

# Test model performance
curl -X POST http://localhost:5173/api/admin/model-benchmark \
  -H "Authorization: Bearer admin-token"
```

## Next Steps

After successful quickstart validation:

1. **Production Deployment**: Configure production environment variables
2. **Monitoring Setup**: Implement logging and analytics
3. **Model Fine-tuning**: Begin collecting training data
4. **User Onboarding**: Create persona selection flow
5. **Performance Optimization**: Implement advanced caching strategies

## Success Criteria

✅ All 7 scenarios complete without errors  
✅ Response times meet <500ms target  
✅ Audio generation and playback working  
✅ Rate limiting prevents abuse  
✅ Caching reduces API costs by >70%  
✅ Mobile integration seamless  
✅ Privacy compliance features active

**Ready for development phase** when all criteria met.
