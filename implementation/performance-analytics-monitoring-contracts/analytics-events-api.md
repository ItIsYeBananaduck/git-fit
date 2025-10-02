# Analytics Events API Contract

**Endpoint**: `/api/analytics/events`  
**Purpose**: High-performance event collection for analytics data  
**Authentication**: API Key or JWT Bearer token  
**Rate Limit**: 10,000 requests/minute per API key  

## 📤 Event Collection

### Batch Event Submission
```http
POST /api/analytics/events/batch
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "events": [
    {
      "eventId": "evt_123456789",
      "sessionId": "session_abc123", 
      "userId": "user_xyz789",
      "eventType": "user_action",
      "category": "workout",
      "action": "start_exercise",
      "properties": {
        "exerciseId": "ex_123",
        "exerciseName": "Push-ups",
        "sets": 3,
        "reps": 15,
        "difficulty": "intermediate",
        "duration": 120,
        "metadata": {
          "device": "mobile",
          "appVersion": "2.1.0"
        }
      },
      "timestamp": 1674567890123,
      "platform": "ios",
      "userAgent": "GitFit/2.1.0 iOS/16.0",
      "consentLevel": "analytics"
    }
  ],
  "batchMetadata": {
    "batchId": "batch_987654321",
    "deviceId": "device_456",
    "appVersion": "2.1.0",
    "platform": "ios"
  }
}
```

### Response
```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "success": true,
  "batchId": "batch_987654321",
  "processedEvents": 1,
  "failedEvents": 0,
  "errors": [],
  "processingTime": 45,
  "timestamp": 1674567890200
}
```

### Single Event Submission
```http
POST /api/analytics/events
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "eventId": "evt_123456789",
  "sessionId": "session_abc123",
  "userId": "user_xyz789",
  "eventType": "system_performance",
  "category": "api_performance",
  "action": "api_response",
  "properties": {
    "endpoint": "/api/workouts",
    "method": "GET",
    "statusCode": 200,
    "responseTime": 145,
    "cacheHit": true,
    "region": "us-east-1"
  },
  "timestamp": 1674567890123,
  "platform": "web"
}
```

## 📊 Event Types & Categories

### User Action Events
```typescript
interface UserActionEvent {
  eventType: "user_action";
  category: 
    | "navigation"      // Page/screen navigation
    | "workout"         // Exercise and workout activities  
    | "nutrition"       // Food logging and nutrition
    | "social"          // Social features and sharing
    | "profile"         // Profile and settings management
    | "marketplace"     // Program purchases and browsing
    | "subscription";   // Subscription management
  
  action: string;       // Specific action taken
  properties: {
    // Category-specific properties
    [key: string]: any;
  };
}

// Navigation Events
{
  "category": "navigation",
  "action": "page_view",
  "properties": {
    "page": "/workouts/123",
    "title": "Upper Body Strength",
    "referrer": "/dashboard",
    "timeOnPage": 125000,
    "scrollDepth": 75
  }
}

// Workout Events  
{
  "category": "workout",
  "action": "complete_workout",
  "properties": {
    "workoutId": "workout_456",
    "programId": "program_789",
    "duration": 1800,
    "exercisesCompleted": 8,
    "caloriesBurned": 320,
    "difficulty": "intermediate",
    "rating": 4
  }
}

// Nutrition Events
{
  "category": "nutrition", 
  "action": "log_meal",
  "properties": {
    "mealType": "breakfast",
    "foods": ["eggs", "toast", "orange"],
    "totalCalories": 450,
    "macros": {
      "protein": 25,
      "carbs": 35,
      "fat": 18
    },
    "aiSuggested": true
  }
}
```

### AI Recommendation Events
```typescript
interface AIRecommendationEvent {
  eventType: "ai_recommendation";
  category:
    | "workout_suggestion"
    | "nutrition_advice" 
    | "recovery_recommendation"
    | "goal_adjustment"
    | "form_feedback";
    
  action:
    | "generated"       // Recommendation created
    | "displayed"       // Shown to user
    | "accepted"        // User accepted
    | "rejected"        // User rejected  
    | "modified";       // User modified
    
  properties: {
    modelId: string;
    modelVersion: string;
    confidence: number;
    reasoning?: string;
    // Recommendation-specific data
  };
}

// AI Recommendation Generated
{
  "category": "workout_suggestion",
  "action": "generated", 
  "properties": {
    "modelId": "workout_recommender_v2",
    "modelVersion": "2.1.0",
    "confidence": 0.87,
    "recommendationType": "next_workout",
    "recommendedWorkout": "upper_body_strength",
    "reasoning": "Based on recovery time and progression goals",
    "personalizedFactors": ["recovery_state", "goal_progression", "equipment_available"],
    "alternatives": ["cardio_hiit", "flexibility_yoga"]
  }
}

// User Response to Recommendation
{
  "category": "workout_suggestion", 
  "action": "accepted",
  "properties": {
    "recommendationId": "rec_123456",
    "modelId": "workout_recommender_v2", 
    "responseTime": 15,
    "modifications": [],
    "feedback": {
      "rating": 5,
      "comment": "Perfect recommendation!"
    }
  }
}
```

### System Performance Events
```typescript
interface SystemPerformanceEvent {
  eventType: "system_performance";
  category:
    | "api_performance"
    | "database_performance" 
    | "ui_performance"
    | "infrastructure"
    | "error_tracking";
    
  properties: {
    // Performance-specific metrics
    responseTime?: number;
    errorCode?: string;
    stackTrace?: string;
    resourceUsage?: object;
  };
}

// API Performance
{
  "category": "api_performance",
  "action": "api_request",
  "properties": {
    "endpoint": "/api/workouts/123",
    "method": "GET", 
    "statusCode": 200,
    "responseTime": 145,
    "cacheHit": true,
    "region": "us-east-1",
    "userId": "user_123",
    "requestSize": 1024,
    "responseSize": 4096
  }
}

// Error Tracking
{
  "category": "error_tracking",
  "action": "javascript_error",
  "properties": {
    "errorMessage": "TypeError: Cannot read property 'length' of undefined",
    "stackTrace": "at workoutService.js:45:12...",
    "userAgent": "Mozilla/5.0...",
    "url": "/workouts/123", 
    "userId": "user_456",
    "severity": "error",
    "tags": ["workout", "frontend"]
  }
}
```

## 🔒 Privacy & Consent

### Consent Levels
```typescript
type ConsentLevel = 
  | "necessary"     // Essential functionality only
  | "analytics"     // Basic analytics and performance
  | "marketing"     // Marketing and advertising
  | "full";         // All data collection permitted

// Consent-aware event submission
{
  "events": [{
    // ... event data
    "consentLevel": "analytics",
    "privacySettings": {
      "allowPersonalization": true,
      "allowCrossPlatform": false,
      "allowThirdParty": false,
      "dataRetentionDays": 365
    }
  }]
}
```

### Data Anonymization
```http
POST /api/analytics/events/anonymous
Content-Type: application/json

{
  "events": [{
    "eventId": "evt_123456789",
    "sessionId": "anon_session_abc123",
    "userId": null,              // No user ID for anonymous events
    "eventType": "user_action", 
    "category": "navigation",
    "action": "page_view",
    "properties": {
      "page": "/workouts",       // No specific workout ID
      "pageType": "workout_list",
      "timeOnPage": 125000
    },
    "isAnonymized": true,
    "anonymizationLevel": "k_anonymity_5"
  }]
}
```

## 📈 Analytics Query API

### Dashboard Data
```http
GET /api/analytics/dashboard?timeRange=7d&metrics=users,sessions,events
Authorization: Bearer {jwt_token}

{
  "timeRange": {
    "start": 1674480000000,
    "end": 1674566400000,
    "granularity": "hour"
  },
  "metrics": {
    "totalUsers": 15420,
    "activeUsers": 8930,
    "newUsers": 1250,
    "sessions": 23450,
    "events": 234500,
    "avgSessionDuration": 1800,
    "bounceRate": 0.35
  },
  "trends": {
    "users": [
      {"timestamp": 1674480000000, "value": 450},
      {"timestamp": 1674483600000, "value": 520},
      // ... hourly data points
    ]
  },
  "topEvents": [
    {"category": "workout", "action": "start_exercise", "count": 12500},
    {"category": "navigation", "action": "page_view", "count": 45000},
    {"category": "nutrition", "action": "log_meal", "count": 8900}
  ]
}
```

### Custom Query Builder
```http
POST /api/analytics/query
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "query": {
    "select": ["count(*)", "avg(properties.duration)"],
    "from": "analyticsEvents",
    "where": {
      "and": [
        {"field": "category", "operator": "=", "value": "workout"},
        {"field": "timestamp", "operator": ">=", "value": 1674480000000},
        {"field": "properties.difficulty", "operator": "in", "value": ["intermediate", "advanced"]}
      ]
    },
    "groupBy": ["action", "properties.difficulty"],
    "orderBy": [{"field": "count(*)", "direction": "desc"}],
    "limit": 100
  },
  "format": "json"
}
```

### Real-time Metrics Stream
```http
GET /api/analytics/stream?metrics=activeUsers,eventsPerMinute
Authorization: Bearer {jwt_token}
Accept: text/event-stream

data: {"activeUsers": 1250, "eventsPerMinute": 850, "timestamp": 1674567890123}

data: {"activeUsers": 1255, "eventsPerMinute": 870, "timestamp": 1674567950123}
```

## 🤖 AI Performance API

### Model Performance Metrics
```http
GET /api/analytics/ai/models/workout_recommender_v2/performance
Authorization: Bearer {jwt_token}

{
  "modelId": "workout_recommender_v2",
  "modelVersion": "2.1.0",
  "evaluationPeriod": {
    "start": 1674480000000,
    "end": 1674566400000
  },
  "performanceMetrics": {
    "accuracy": 0.87,
    "precision": 0.85,
    "recall": 0.89,
    "f1Score": 0.87,
    "acceptanceRate": 0.73,
    "modificationRate": 0.15,
    "satisfactionScore": 4.2
  },
  "driftDetection": {
    "dataDrift": {
      "detected": false,
      "score": 0.02,
      "threshold": 0.05
    },
    "modelDrift": {
      "detected": false, 
      "score": 0.01,
      "threshold": 0.03
    }
  },
  "safetyMetrics": {
    "violationCount": 0,
    "safetyScore": 98,
    "riskLevel": "low"
  },
  "resourceUsage": {
    "avgLatency": 45,
    "throughput": 1500,
    "cpuUtilization": 0.35,
    "memoryUsage": 0.42
  }
}
```

### A/B Test Results
```http
GET /api/analytics/ai/experiments/workout_recommendation_test/results
Authorization: Bearer {jwt_token}

{
  "experimentId": "workout_recommendation_test",
  "status": "completed",
  "duration": {
    "start": 1674000000000,
    "end": 1674500000000
  },
  "variants": [
    {
      "name": "control",
      "description": "Current recommendation algorithm",
      "trafficAllocation": 0.5,
      "sampleSize": 5000,
      "metrics": {
        "acceptanceRate": 0.70,
        "completionRate": 0.85,
        "satisfactionScore": 4.1
      }
    },
    {
      "name": "treatment", 
      "description": "New personalization algorithm",
      "trafficAllocation": 0.5,
      "sampleSize": 5000,
      "metrics": {
        "acceptanceRate": 0.78,
        "completionRate": 0.89,
        "satisfactionScore": 4.4
      }
    }
  ],
  "results": {
    "winningVariant": "treatment",
    "confidence": 0.95,
    "pValue": 0.012,
    "effect": {
      "acceptanceRate": {
        "lift": 0.08,
        "confidence_interval": [0.05, 0.11]
      }
    }
  },
  "recommendation": "Deploy treatment variant to production"
}
```

## 📊 Business Intelligence API

### Executive Metrics
```http
GET /api/analytics/business/executive?period=monthly
Authorization: Bearer {jwt_token}

{
  "period": "2024-01",
  "kpis": {
    "revenue": {
      "value": 125000,
      "previousPeriod": 118000,
      "percentChange": 5.9,
      "trend": "up",
      "target": 130000,
      "targetProgress": 0.96
    },
    "monthlyActiveUsers": {
      "value": 15420,
      "previousPeriod": 14200,
      "percentChange": 8.6,
      "trend": "up",
      "target": 16000,
      "targetProgress": 0.96
    },
    "conversionRate": {
      "value": 0.045,
      "previousPeriod": 0.041,
      "percentChange": 9.8,
      "trend": "up",
      "target": 0.05,
      "targetProgress": 0.90
    },
    "churnRate": {
      "value": 0.08,
      "previousPeriod": 0.09,
      "percentChange": -11.1,
      "trend": "down",
      "target": 0.07,
      "targetProgress": 0.88
    }
  },
  "segments": [
    {
      "name": "Premium Users",
      "size": 3420,
      "revenue": 89000,
      "ltv": 890,
      "churnRate": 0.05
    },
    {
      "name": "Free Users", 
      "size": 12000,
      "revenue": 36000,
      "ltv": 45,
      "conversionRate": 0.15
    }
  ]
}
```

### Cohort Analysis
```http
GET /api/analytics/business/cohorts?cohortType=monthly&startDate=2023-01-01
Authorization: Bearer {jwt_token}

{
  "cohortType": "monthly",
  "cohorts": [
    {
      "cohortId": "2023-01",
      "startDate": "2023-01-01",
      "initialSize": 1200,
      "retentionData": [
        {"period": 0, "retained": 1200, "rate": 1.00},
        {"period": 1, "retained": 840, "rate": 0.70},
        {"period": 3, "retained": 600, "rate": 0.50},
        {"period": 6, "retained": 480, "rate": 0.40},
        {"period": 12, "retained": 360, "rate": 0.30}
      ],
      "ltv": 340,
      "avgSessionsPerUser": 45
    }
  ],
  "aggregateMetrics": {
    "avgRetentionMonth1": 0.68,
    "avgRetentionMonth3": 0.47,
    "avgRetentionMonth6": 0.38,
    "avgRetentionMonth12": 0.28
  }
}
```

## ⚠️ Error Responses

### Validation Errors
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid event data",
    "details": [
      {
        "field": "timestamp",
        "message": "Timestamp must be a valid Unix timestamp",
        "value": "invalid_timestamp"
      },
      {
        "field": "category",
        "message": "Category must be one of: navigation, workout, nutrition, social, profile, marketplace, subscription",
        "value": "invalid_category"
      }
    ]
  },
  "timestamp": 1674567890123,
  "requestId": "req_123456789"
}
```

### Rate Limiting
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json
Retry-After: 60

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 10000,
      "remaining": 0,
      "resetTime": 1674567950123,
      "retryAfter": 60
    }
  },
  "timestamp": 1674567890123
}
```

### Authentication Errors
```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "AUTHENTICATION_REQUIRED",
    "message": "Valid authentication token required",
    "details": {
      "supportedMethods": ["Bearer", "API Key"],
      "documentation": "https://docs.gitfit.com/api/authentication"
    }
  },
  "timestamp": 1674567890123
}
```

## 🔧 Configuration & Settings

### API Configuration
```typescript
interface AnalyticsConfig {
  // Rate Limiting
  rateLimits: {
    eventsPerMinute: 10000;
    queriesPerHour: 1000;
    burstLimit: 100;
  };
  
  // Data Retention
  dataRetention: {
    rawEvents: "2 years";
    aggregatedData: "5 years";
    userDeletionGracePeriod: "30 days";
  };
  
  // Privacy Settings
  privacy: {
    automaticAnonymization: true;
    consentRequired: true;
    defaultRetentionDays: 365;
    allowDataExport: true;
  };
  
  // Performance Settings
  performance: {
    maxBatchSize: 100;
    queryTimeout: 30000;
    cacheExpiry: 300;
    compressionEnabled: true;
  };
}
```

### Webhook Configuration
```http
POST /api/analytics/webhooks
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Alert Processing",
  "url": "https://your-app.com/webhooks/analytics",
  "events": [
    "data_quality_alert",
    "performance_threshold",
    "ai_drift_detected",
    "compliance_violation"
  ],
  "secret": "webhook_secret_key",
  "retryConfig": {
    "maxRetries": 3,
    "backoffMultiplier": 2,
    "initialDelay": 1000
  }
}
```

---

## 📋 Implementation Checklist

### Required Headers
- [ ] `Content-Type: application/json` for POST requests
- [ ] `Authorization: Bearer {token}` for authenticated requests
- [ ] `User-Agent: {app_name}/{version}` for client identification

### Required Fields
- [ ] `eventId` - Unique identifier for each event
- [ ] `timestamp` - Unix timestamp in milliseconds
- [ ] `eventType` - One of: user_action, ai_recommendation, system_performance
- [ ] `category` - Event category classification
- [ ] `action` - Specific action performed

### Privacy Compliance
- [ ] `consentLevel` - User's consent level for data processing
- [ ] `isAnonymized` - Boolean flag for anonymized data
- [ ] `dataRetentionDays` - Retention period for this specific event

### Performance Requirements
- [ ] Event submission: <200ms response time
- [ ] Batch processing: Support up to 100 events per batch
- [ ] Query performance: <5 seconds for dashboard queries
- [ ] Real-time updates: <1 second latency for live metrics