# API Contracts: Mobile UI Feature

## Authentication Endpoints

### POST /auth/biometric/init
Initialize biometric authentication for user
```json
{
  "request": {
    "userId": "string",
    "deviceId": "string",
    "biometricType": "fingerprint" | "faceId"
  },
  "response": {
    "success": boolean,
    "challengeToken": "string",
    "expiresIn": number
  }
}
```

### POST /auth/biometric/verify
Verify biometric authentication
```json
{
  "request": {
    "challengeToken": "string",
    "biometricData": "string" // encrypted
  },
  "response": {
    "success": boolean,
    "sessionToken": "string",
    "expiresIn": number
  }
}
```

## User Profile Endpoints

### GET /user/profile
Get user profile with mobile UI preferences
```json
{
  "response": {
    "id": "string",
    "weight": number,
    "unitPreference": "imperial" | "metric",
    "fitnessGoal": "weightLoss" | "muscleGain" | "maintenance" | "powerlifting" | "bodyBuilding",
    "macroTargets": {
      "protein": number,
      "carbs": number,
      "fat": number,
      "calories": number,
      "proteinPerLb": number
    },
    "biometricEnabled": boolean,
    "privacySettings": {
      "dataCollection": boolean,
      "trainerDataSharing": boolean,
      "analyticsOptIn": boolean,
      "dataRetentionDays": number
    }
  }
}
```

### PATCH /user/profile/units
Switch unit system with real-time conversion
```json
{
  "request": {
    "unitPreference": "imperial" | "metric"
  },
  "response": {
    "success": boolean,
    "convertedData": {
      "weight": number,
      "macroTargets": object
    }
  }
}
```

## Workout Session Endpoints  

### POST /workout/session/start
Start new workout session with mobile tracking
```json
{
  "request": {
    "workoutId": "string",
    "deviceCapabilities": {
      "hapticFeedback": boolean,
      "biometricAuth": boolean,
      "cameraAccess": boolean
    }
  },
  "response": {
    "sessionId": "string",
    "exercises": array,
    "initialIntensity": number
  }
}
```

### POST /workout/session/feedback
Submit user feedback during workout
```json
{
  "request": {
    "sessionId": "string",
    "exerciseId": "string",
    "setIndex": number,
    "reason": "tired" | "notFeelingIt" | "formShaky" | "pain" | "hurtEarlier",
    "painLevel": number, // 0-10, required if reason is "pain"
    "painLocation": "string" // required if painLevel > 3
  },
  "response": {
    "success": boolean,
    "aiAdjustment": {
      "type": "skipSet" | "reduceWeight" | "changeExercise",
      "suggestion": "string"
    }
  }
}
```

### POST /workout/session/vitals
Update real-time vitals during workout
```json
{
  "request": {
    "sessionId": "string",
    "vitals": {
      "heartRate": number,
      "spO2": number,
      "strain": number,
      "source": "whoop" | "appleWatch" | "mock" | "manual",
      "timestamp": "ISO8601"
    }
  },
  "response": {
    "success": boolean,
    "intensityUpdate": number // 0-100
  }
}
```

## Nutrition Tracking Endpoints

### POST /nutrition/barcode/scan
Process barcode scan for food identification
```json
{
  "request": {
    "barcodeData": "string",
    "preferredUnits": "imperial" | "metric"
  },
  "response": {
    "success": boolean,
    "foodItem": {
      "id": "string",
      "name": "string",
      "brand": "string",
      "macrosPer100g": {
        "protein": number,
        "carbs": number,
        "fat": number,
        "calories": number
      }
    } | null,
    "alternativeSuggestions": array // if not found
  }
}
```

### POST /nutrition/food/custom
Create custom food entry with manual macros
```json
{
  "request": {
    "name": "string",
    "servingSize": number,
    "unit": "string",
    "macros": {
      "protein": number,
      "carbs": number,
      "fat": number,
      "calories": number
    }
  },
  "response": {
    "success": boolean,
    "foodId": "string",
    "validated": boolean
  }
}
```

### GET /nutrition/timeline/{date}
Get nutrition timeline for meal time selection
```json
{
  "response": {
    "date": "YYYY-MM-DD",
    "entries": [
      {
        "id": "string",
        "mealTime": "ISO8601",
        "timelinePosition": number, // 0-1
        "foodItem": object,
        "quantity": number,
        "macros": object
      }
    ],
    "dailyTotals": {
      "protein": number,
      "carbs": number,
      "fat": number,
      "calories": number
    },
    "targets": object
  }
}
```

## Trainer Mode Endpoints

### POST /trainer/access/request
Request access to client data
```json
{
  "request": {
    "clientId": "string",
    "accessLevel": "view" | "edit" | "full",
    "requestMessage": "string"
  },
  "response": {
    "success": boolean,
    "requestId": "string",
    "pendingApproval": boolean
  }
}
```

### GET /trainer/clients
Get trainer's client list with live session data
```json
{
  "response": {
    "clients": [
      {
        "id": "string",
        "name": "string",
        "avatar": "string",
        "status": "active" | "inactive" | "inWorkout",
        "liveIntensity": number, // 0-100 if in workout
        "lastActivity": "ISO8601",
        "accessLevel": "string"
      }
    ],
    "activeSessions": number
  }
}
```

### POST /trainer/session/share
Share trainer session to calendar
```json
{
  "request": {
    "sessionId": "string",
    "calendarType": "native" | "google" | "outlook",
    "includeNotes": boolean
  },
  "response": {
    "success": boolean,
    "calendarEventId": "string",
    "shareUrl": "string"
  }
}
```

## Synchronization Endpoints

### POST /sync/offline/upload
Upload pending offline changes
```json
{
  "request": {
    "deviceId": "string",
    "lastSyncTime": "ISO8601",
    "changes": [
      {
        "id": "string",
        "entityType": "workout" | "nutrition" | "profile" | "feedback",
        "entityId": "string",
        "operation": "create" | "update" | "delete",
        "data": object,
        "timestamp": "ISO8601"
      }
    ]
  },
  "response": {
    "success": boolean,
    "conflicts": [
      {
        "changeId": "string",
        "conflictFields": array,
        "remoteVersion": object,
        "requiresResolution": boolean
      }
    ],
    "syncTime": "ISO8601"
  }
}
```

### POST /sync/conflict/resolve
Resolve sync conflicts with user choice
```json
{
  "request": {
    "conflictId": "string",
    "resolution": "local" | "remote" | "merged",
    "mergedData": object // if resolution is "merged"
  },
  "response": {
    "success": boolean,
    "finalData": object
  }
}
```

## Error Responses

All endpoints return consistent error format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": object
  }
}
```

Common error codes:
- `BIOMETRIC_FAILED`: Biometric authentication failed
- `BARCODE_NOT_FOUND`: Barcode not in food database  
- `SYNC_CONFLICT`: Data conflict requires resolution
- `TRAINER_ACCESS_DENIED`: Client denied trainer access
- `OFFLINE_LIMIT_EXCEEDED`: Too many offline changes
- `PERFORMANCE_TARGET_MISSED`: Response time exceeded limits