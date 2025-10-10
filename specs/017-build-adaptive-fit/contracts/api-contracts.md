# API Contracts: Build Adaptive Fit

**Date**: October 3, 2025  
**Feature**: 017-build-adaptive-fit

## Alice Interface API

### Update Alice State

```http
POST /api/alice/state
Content-Type: application/json

Request:
{
  "mode": "workout" | "nutrition" | "analytics" | "radio" | "zen" | "play",
  "eyeState": "normal" | "wink" | "droop" | "excited",
  "isVisible": boolean
}

Response:
{
  "success": boolean,
  "aliceState": {
    "userId": string,
    "subscriptionTier": string,
    "appearance": object,
    "currentMode": string,
    "isVisible": boolean,
    "lastInteraction": string
  }
}
```

### Customize Alice Appearance

```http
PUT /api/alice/customize
Content-Type: application/json

Request:
{
  "bodyPattern": "solid" | "stripes" | "spots" | "leopard" | "chrome" | "glitch",
  "bodyColor": string, // hex color
  "ringColor"?: string // trainers only
}

Response:
{
  "success": boolean,
  "customization": object,
  "subscriptionRestrictions"?: string[]
}
```

## Adaptive Fitness API

### Trigger Calibration

```http
POST /api/fitness/calibrate
Content-Type: application/json

Request:
{
  "exerciseId": string,
  "reason": "stale_data" | "performance_drop" | "manual"
}

Response:
{
  "success": boolean,
  "calibrationRequired": boolean,
  "testSets": number,
  "baseline": object
}
```

### Record Workout Data

```http
POST /api/fitness/workout
Content-Type: application/json

Request:
{
  "mode": "workout" | "play",
  "exercises": [{
    "exerciseId": string,
    "sets": [{
      "reps"?: number,
      "weight"?: number,
      "duration"?: number,
      "heartRate"?: number,
      "strain"?: number
    }]
  }],
  "heartRateData": [{
    "timestamp": string,
    "bpm": number
  }]
}

Response:
{
  "success": boolean,
  "sessionId": string,
  "intensityScore": number,
  "adaptations": string[],
  "intensityWarning"?: {
    "level": number,
    "action": "pause" | "continue"
  }
}
```

## Community Features API

### Submit Exercise

```http
POST /api/community/exercises
Content-Type: application/json

Request:
{
  "name": string,
  "muscleGroups": string[],
  "equipment": string[],
  "description": string
}

Response:
{
  "success": boolean,
  "exerciseId": string,
  "status": "local",
  "approvalThreshold": 8
}
```

### Vote on Exercise

```http
POST /api/community/exercises/:id/vote
Content-Type: application/json

Request:
{
  "vote": "like" | "dislike"
}

Response:
{
  "success": boolean,
  "totalLikes": number,
  "totalDislikes": number,
  "approvalStatus": string,
  "requiresTrainerReview": boolean
}
```

### Create Team Post

```http
POST /api/community/posts
Content-Type: application/json

Request:
{
  "type": "workout" | "exercise" | "streak",
  "content": {
    "workoutIcon": string,
    "intensity": number,
    "heartIcon": "pulsing" | "static"
  }
}

Response:
{
  "success": boolean,
  "postId": string,
  "autoPosted": boolean,
  "likesEnabled": boolean
}
```

## Subscription Management API

### Update Subscription Tier

```http
PUT /api/subscription/tier
Content-Type: application/json

Request:
{
  "newTier": "free" | "trial" | "paid" | "trainer",
  "trialDuration"?: number // days
}

Response:
{
  "success": boolean,
  "subscriptionTier": string,
  "features": string[],
  "restrictions": string[],
  "dataRetentionPolicy": object
}
```

## Background Monitoring API

### Record Heart Rate

```http
POST /api/monitoring/heartrate
Content-Type: application/json

Request:
{
  "timestamp": string,
  "heartRate": number,
  "isElevated": boolean,
  "duration"?: number // minutes sustained
}

Response:
{
  "success": boolean,
  "requiresPrompt": boolean,
  "promptOptions": ["workout", "play", "ignore"]?,
  "timeoutSeconds": 30?
}
```

### Respond to Activity Prompt

```http
POST /api/monitoring/respond
Content-Type: application/json

Request:
{
  "response": "workout" | "play" | "ignore",
  "responseTime": number // seconds
}

Response:
{
  "success": boolean,
  "trackingMode": string,
  "streakUpdated": boolean
}
```

## Marketplace API

### List Videos

```http
GET /api/marketplace/videos
Query: category?, tags?, seller?, sort=popularity|newest|rating

Response:
{
  "videos": [{
    "id": string,
    "title": string,
    "description": string,
    "price": number,
    "previewUrl": string,
    "tags": string[],
    "performanceMetrics": object,
    "badges": string[]
  }],
  "pagination": object
}
```

### Purchase Video

```http
POST /api/marketplace/purchase
Content-Type: application/json

Request:
{
  "videoId": string,
  "paymentMethod": object
}

Response:
{
  "success": boolean,
  "purchaseId": string,
  "downloadUrl": string,
  "localPath": string, // AdaptiveFitDownloads folder
  "accessIndefinitely": true,
  "commission": {
    "platform": number, // 30%
    "seller": number    // 70%
  }
}
```

## Error Responses

### Standard Error Format

```http
{
  "success": false,
  "error": {
    "code": string,
    "message": string,
    "details"?: object
  }
}
```

### Common Error Codes

- `SUBSCRIPTION_REQUIRED`: Feature requires paid subscription
- `CALIBRATION_NEEDED`: Exercise requires calibration before use
- `INTENSITY_WARNING`: Workout intensity exceeds safe levels
- `VOTE_LIMIT_REACHED`: User has already voted on this item
- `INSUFFICIENT_LIKES`: Exercise needs more approval votes
- `TIMEOUT_EXPIRED`: User response window expired
- `DOWNLOAD_FAILED`: Video download unsuccessful
- `PAYMENT_FAILED`: Marketplace purchase failed
