# User Experience Enhancement (011) - API Contracts

**API Version**: v1.0  
**Documentation Standard**: OpenAPI 3.0  
**Authentication**: JWT Bearer Token  
**Rate Limiting**: 1000 requests/hour per user  
**Last Updated**: 2024-12-28  

## 🎯 API Overview

This document defines the comprehensive API contracts for the User Experience Enhancement system, covering accessibility preferences, achievement tracking, dashboard personalization, navigation optimization, and progressive feature management.

### API Design Principles

**Accessibility-First API Design**
- All endpoints support screen reader-compatible responses
- Error messages follow plain language guidelines
- Response formats accommodate assistive technology parsing
- Consistent semantic structure across all endpoints

**Performance and Reliability**
- Response times <500ms for all interactive endpoints
- Graceful degradation for accessibility features
- Offline-capable endpoints for core functionality
- Progressive enhancement support

**Privacy and Security**
- GDPR/CCPA compliant data handling
- User consent tracking for all data collection
- Accessibility preference encryption
- Audit logging for compliance

---

## 🔑 Authentication and Authorization

### Authentication Flow

```yaml
# JWT Token Structure
{
  "iss": "git-fit-ux",
  "sub": "user_id", 
  "iat": 1640995200,
  "exp": 1641081600,
  "scope": ["ux:read", "ux:write", "accessibility:manage"],
  "accessibility_context": {
    "assistive_technology": ["screen_reader"],
    "interaction_mode": "keyboard",
    "preferences_version": "1.2"
  }
}
```

### Authorization Scopes

```typescript
type UXScope = 
  | 'ux:read'                    // Read UX preferences and data
  | 'ux:write'                   // Modify UX settings and preferences
  | 'accessibility:manage'       // Manage accessibility settings
  | 'achievements:read'          // View achievements and progress  
  | 'achievements:write'         // Update achievement progress
  | 'dashboard:customize'        // Customize dashboard layouts
  | 'navigation:adapt'           // Modify navigation preferences
  | 'onboarding:progress'        // Track onboarding progress
  | 'analytics:track'            // Submit usage analytics
  | 'admin:manage'               // Administrative access
```

---

## 👤 User Experience Profile API

### Get User Experience Profile

```typescript
GET /api/v1/users/{userId}/ux-profile

// Response
interface UXProfileResponse {
  userId: string;
  accessibility: AccessibilityPreferences;
  personalization: PersonalizationSettings;
  navigation: NavigationPreferences;
  onboarding: OnboardingProgress;
  metadata: {
    lastUpdated: string;
    version: string;
    syncedDevices: string[];
  };
}

// Example Response
{
  "userId": "user_123",
  "accessibility": {
    "screenReader": {
      "enabled": true,
      "type": "nvda",
      "verbosityLevel": "standard",
      "announcementSpeed": 1.2
    },
    "keyboardNavigation": {
      "enabled": true,
      "customShortcuts": {
        "search": "ctrl+/",
        "dashboard": "ctrl+h"
      },
      "focusIndicatorStyle": "high-contrast"
    },
    "visual": {
      "highContrastMode": true,
      "textScaling": 1.4,
      "reducedMotion": false,
      "colorScheme": "high-contrast"
    }
  },
  "personalization": {
    "dashboard": {
      "defaultLayoutId": "layout_456",
      "autoAdaptLayout": true,
      "widgetRecommendations": true
    },
    "theme": {
      "colorScheme": "dark",
      "accentColor": "#3B82F6",
      "borderRadius": "rounded"
    }
  }
}
```

### Update Accessibility Preferences

```typescript
PATCH /api/v1/users/{userId}/accessibility-preferences

// Request Body
interface AccessibilityUpdateRequest {
  screenReader?: Partial<ScreenReaderSettings>;
  keyboardNavigation?: Partial<KeyboardNavigationSettings>;
  visual?: Partial<VisualSettings>;
  motor?: Partial<MotorSettings>;
  cognitive?: Partial<CognitiveSettings>;
  audioHaptic?: Partial<AudioHapticSettings>;
}

// Example Request
{
  "visual": {
    "textScaling": 1.6,
    "highContrastMode": true
  },
  "cognitive": {
    "simplifiedLanguage": true,
    "memoryAidsEnabled": true
  }
}

// Response
{
  "success": true,
  "updated": ["visual", "cognitive"],
  "accessibility": {
    // Updated accessibility preferences
  },
  "syncStatus": {
    "syncedAt": "2024-12-28T10:30:00Z",
    "syncedDevices": ["device_1", "device_2"]
  }
}
```

### Voice Command Configuration

```typescript
POST /api/v1/users/{userId}/voice-commands

// Request Body
interface VoiceCommandRequest {
  command: string;
  action: string;
  context?: string[];
  enabled: boolean;
  customPhrase?: string;
}

// Example Request
{
  "command": "start_workout",
  "action": "navigate_to_workout_start", 
  "context": ["dashboard", "workout"],
  "enabled": true,
  "customPhrase": "begin my workout"
}

// Response
{
  "commandId": "cmd_789",
  "success": true,
  "voiceCommand": {
    "id": "cmd_789",
    "command": "start_workout",
    "phrases": ["start workout", "begin my workout"],
    "action": "navigate_to_workout_start",
    "confidence": 0.95,
    "enabled": true
  }
}
```

---

## 🏆 Achievement System API

### Get User Achievements

```typescript
GET /api/v1/users/{userId}/achievements
GET /api/v1/users/{userId}/achievements?category=workout_streak&unlocked=true

// Query Parameters
interface AchievementQuery {
  category?: AchievementCategory;
  tier?: AchievementTier;
  unlocked?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'unlocked_date' | 'progress' | 'category';
}

// Response
interface UserAchievementsResponse {
  achievements: UserAchievementDetails[];
  pagination: PaginationMetadata;
  summary: AchievementSummary;
}

interface UserAchievementDetails {
  id: string;
  achievementId: string;
  achievement: Achievement;
  progress: number;
  unlockedAt?: string;
  celebrationViewed: boolean;
  nextMilestone?: Milestone;
  progressHistory: ProgressSnapshot[];
}

// Example Response
{
  "achievements": [
    {
      "id": "user_ach_123",
      "achievementId": "first_workout",
      "achievement": {
        "id": "first_workout",
        "category": "workout_streak",
        "tier": "bronze",
        "title": "First Steps",
        "description": "Complete your first workout",
        "iconUrl": "/icons/first-workout.svg",
        "accessibility": {
          "audioDescription": "Bronze medal icon representing first workout completion",
          "screenReaderText": "Achievement unlocked: First Steps - Complete your first workout"
        }
      },
      "progress": 100,
      "unlockedAt": "2024-12-28T08:15:00Z",
      "celebrationViewed": true,
      "progressHistory": [
        {
          "timestamp": "2024-12-28T08:15:00Z",
          "progress": 100,
          "trigger": "workout_completed"
        }
      ]
    }
  ],
  "summary": {
    "totalUnlocked": 15,
    "totalAvailable": 52,
    "currentXP": 2850,
    "currentLevel": 8,
    "nextLevelXP": 3200
  }
}
```

### Track Achievement Progress

```typescript
POST /api/v1/users/{userId}/achievements/track-progress

// Request Body
interface ProgressTrackingRequest {
  activity: ActivityData;
  context: ActivityContext;
  timestamp?: string;
}

interface ActivityData {
  type: ActivityType;
  value: number;
  metadata: Record<string, any>;
}

type ActivityType = 
  | 'workout_completed' | 'streak_day' | 'goal_achieved'
  | 'nutrition_logged' | 'social_interaction' | 'feature_used'
  | 'data_quality_score' | 'consistency_bonus';

// Example Request
{
  "activity": {
    "type": "workout_completed",
    "value": 1,
    "metadata": {
      "workoutType": "strength_training",
      "duration": 45,
      "intensity": "moderate"
    }
  },
  "context": {
    "deviceType": "mobile",
    "assistiveTechnology": ["screen_reader"],
    "source": "workout_tracker"
  }
}

// Response
{
  "success": true,
  "updatedAchievements": [
    {
      "achievementId": "week_warrior",
      "oldProgress": 85.7,
      "newProgress": 100,
      "unlocked": true,
      "celebration": {
        "type": "level_up",
        "xpAwarded": 500,
        "accessibility": {
          "announcement": "Achievement unlocked: Week Warrior! You've worked out for 7 consecutive days. 500 XP awarded.",
          "hapticPattern": [200, 100, 200],
          "audioAlert": "achievement_major.mp3"
        }
      }
    }
  ],
  "xpGained": 150,
  "newLevel": false
}
```

### Achievement Celebration

```typescript
POST /api/v1/users/{userId}/achievements/{achievementId}/celebrate

// Request Body
interface CelebrationRequest {
  celebrationType: 'minimal' | 'standard' | 'enhanced';
  accessibilityOptions: {
    reducedMotion: boolean;
    audioFeedback: boolean;
    hapticFeedback: boolean;
    screenReaderAnnouncement: boolean;
  };
}

// Response
{
  "celebrationId": "celebration_456",
  "achievement": {
    "title": "Week Warrior",
    "description": "Work out for 7 consecutive days"
  },
  "celebration": {
    "animation": {
      "type": "confetti",
      "duration": 3000,
      "reducedMotion": false
    },
    "audio": {
      "soundEffect": "achievement_unlock.mp3",
      "announcement": "Achievement unlocked: Week Warrior!"
    },
    "haptic": {
      "pattern": [200, 100, 200, 100, 300],
      "intensity": 0.8
    }
  },
  "socialSharing": {
    "enabled": true,
    "platforms": ["internal", "facebook", "twitter"],
    "shareText": "Just unlocked Week Warrior achievement! 🏆"
  }
}
```

---

## 📊 Dashboard Personalization API

### Get Dashboard Layouts

```typescript
GET /api/v1/users/{userId}/dashboard/layouts
GET /api/v1/users/{userId}/dashboard/layouts/{layoutId}

// Response
interface DashboardLayoutsResponse {
  layouts: DashboardLayout[];
  activeLayoutId: string;
  templates: LayoutTemplate[];
  recommendations: LayoutRecommendation[];
}

interface DashboardLayout {
  id: string;
  name: string;
  layoutData: LayoutConfiguration;
  isActive: boolean;
  isTemplate: boolean;
  themeSettings: ThemeConfiguration;
  accessibility: LayoutAccessibility;
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    deviceOptimized: string[];
  };
}

// Example Response
{
  "layouts": [
    {
      "id": "layout_123",
      "name": "My Fitness Dashboard", 
      "layoutData": {
        "grid": {
          "columns": 4,
          "rows": 6,
          "gap": 16,
          "responsive": true
        },
        "widgets": [
          {
            "widgetId": "workout_summary",
            "position": { "x": 0, "y": 0, "width": 2, "height": 2 },
            "config": {
              "showLastWorkout": true,
              "showStreak": true,
              "dataSource": "workouts"
            },
            "accessibility": {
              "label": "Workout Summary Widget",
              "description": "Shows your recent workout and current streak",
              "landmarks": ["main", "summary"]
            }
          }
        ]
      },
      "isActive": true,
      "accessibility": {
        "keyboardNavigation": true,
        "screenReaderOptimized": true,
        "focusManagement": "automatic",
        "skipLinks": ["main-content", "widget-grid", "settings"]
      }
    }
  ],
  "recommendations": [
    {
      "type": "widget_addition",
      "widgetType": "achievement_showcase",
      "reasoning": "Based on your recent achievement unlocks",
      "confidence": 0.85,
      "position": { "x": 2, "y": 0, "width": 2, "height": 1 }
    }
  ]
}
```

### Update Dashboard Layout

```typescript
PUT /api/v1/users/{userId}/dashboard/layouts/{layoutId}

// Request Body
interface LayoutUpdateRequest {
  name?: string;
  layoutData: LayoutConfiguration;
  themeSettings?: ThemeConfiguration;
  makeActive?: boolean;
}

// Example Request
{
  "name": "Updated Fitness Dashboard",
  "layoutData": {
    "grid": { "columns": 4, "rows": 6, "gap": 16 },
    "widgets": [
      {
        "widgetId": "workout_summary",
        "position": { "x": 0, "y": 0, "width": 2, "height": 2 },
        "config": { "showLastWorkout": true }
      },
      {
        "widgetId": "achievement_showcase", 
        "position": { "x": 2, "y": 0, "width": 2, "height": 1 },
        "config": { "maxAchievements": 3 }
      }
    ]
  },
  "makeActive": true
}

// Response
{
  "success": true,
  "layout": {
    // Updated layout object
  },
  "accessibility": {
    "complianceCheck": "passed",
    "warnings": [],
    "recommendations": [
      "Consider adding skip links for keyboard navigation"
    ]
  }
}
```

### Widget Management

```typescript
GET /api/v1/widgets
GET /api/v1/widgets/{widgetId}

// Response
interface WidgetsResponse {
  widgets: Widget[];
  categories: WidgetCategory[];
  userWidgets: UserWidget[];
}

interface Widget {
  id: string;
  type: WidgetType;
  name: string;
  description: string;
  category: string;
  configSchema: JSONSchema;
  accessibility: WidgetAccessibilityFeatures;
  permissions: WidgetPermissions;
  performanceMetrics: {
    averageLoadTime: number;
    memoryUsage: number;
    accessibility: {
      screenReaderCompatible: boolean;
      keyboardNavigable: boolean;
      highContrastSupport: boolean;
    };
  };
}

// Add Widget to Layout
POST /api/v1/users/{userId}/dashboard/layouts/{layoutId}/widgets

{
  "widgetType": "nutrition_tracker",
  "position": { "x": 0, "y": 2, "width": 2, "height": 2 },
  "config": {
    "trackingMode": "detailed",
    "showCalories": true,
    "showMacros": false
  },
  "accessibility": {
    "customLabel": "Daily Nutrition Tracking",
    "announceUpdates": true
  }
}
```

---

## 🧭 Navigation and Search API

### Adaptive Navigation

```typescript
GET /api/v1/users/{userId}/navigation/patterns

// Response
interface NavigationPatternsResponse {
  patterns: NavigationPattern[];
  adaptedMenu: MenuConfiguration;
  shortcuts: CustomShortcut[];
  efficiency: NavigationEfficiency;
}

interface MenuConfiguration {
  items: MenuItem[];
  organization: 'usage_based' | 'alphabetical' | 'custom';
  accessibility: {
    skipLinks: string[];
    landmarks: ARIALandmark[];
    keyboardShortcuts: Record<string, string>;
  };
}

// Example Response
{
  "adaptedMenu": {
    "items": [
      {
        "id": "dashboard",
        "label": "Dashboard",
        "path": "/dashboard",
        "icon": "dashboard.svg",
        "usageFrequency": 0.95,
        "averageTime": 0.8,
        "accessibility": {
          "shortcut": "ctrl+h",
          "ariaLabel": "Navigate to main dashboard",
          "description": "View your fitness overview and recent activity"
        }
      },
      {
        "id": "workouts",
        "label": "Workouts", 
        "path": "/workouts",
        "usageFrequency": 0.87,
        "submenu": [
          {
            "id": "start_workout",
            "label": "Start Workout",
            "path": "/workouts/start",
            "shortcut": "ctrl+w"
          }
        ]
      }
    ],
    "organization": "usage_based"
  },
  "efficiency": {
    "averageTaskTime": 2.3,
    "clicksPerTask": 3.1,
    "backtrackRate": 0.15,
    "improvementSuggestions": [
      "Add quick action for workout logging",
      "Create shortcut for progress view"
    ]
  }
}
```

### Search API

```typescript
GET /api/v1/search?q={query}&type={type}&context={context}

// Query Parameters
interface SearchParams {
  q: string;                    // Search query
  type?: 'all' | 'features' | 'help' | 'content';
  context?: string;             // Current page context
  accessibility?: boolean;      // Prioritize accessible results
  limit?: number;
  offset?: number;
}

// Response
interface SearchResponse {
  query: string;
  results: SearchResult[];
  suggestions: string[];
  accessibility: SearchAccessibility;
  analytics: {
    responseTime: number;
    totalResults: number;
    relevanceScore: number;
  };
}

interface SearchResult {
  id: string;
  type: 'page' | 'feature' | 'help' | 'action';
  title: string;
  description: string;
  url: string;
  relevanceScore: number;
  accessibility: {
    screenReaderFriendly: boolean;
    keyboardAccessible: boolean;
    plainLanguageDescription: string;
  };
  highlightedTerms: string[];
}

// Example Response
{
  "query": "change text size",
  "results": [
    {
      "id": "accessibility_text_scaling",
      "type": "feature",
      "title": "Text Size Settings",
      "description": "Adjust text size from 100% to 200% for better readability",
      "url": "/settings/accessibility#text-scaling",
      "relevanceScore": 0.95,
      "accessibility": {
        "screenReaderFriendly": true,
        "keyboardAccessible": true,
        "plainLanguageDescription": "Make text bigger or smaller to read more easily"
      },
      "highlightedTerms": ["text", "size"]
    }
  ],
  "suggestions": [
    "accessibility settings",
    "font size",
    "visual preferences"
  ]
}
```

### Quick Actions

```typescript
GET /api/v1/users/{userId}/quick-actions
POST /api/v1/users/{userId}/quick-actions

// Get Quick Actions Response
{
  "actions": [
    {
      "id": "start_workout",
      "label": "Start Workout",
      "icon": "play.svg",
      "action": "navigate",
      "target": "/workouts/start",
      "shortcut": "ctrl+shift+w",
      "context": ["dashboard", "workouts"],
      "usageCount": 45,
      "accessibility": {
        "ariaLabel": "Quick action: Start a new workout session",
        "voiceCommand": "start workout",
        "description": "Begin tracking a new exercise session"
      }
    }
  ],
  "contextualActions": {
    "dashboard": ["start_workout", "log_nutrition", "view_progress"],
    "workouts": ["start_workout", "view_history", "edit_routine"]
  }
}

// Create Custom Quick Action
{
  "label": "Quick Meal Log",
  "action": "navigate",
  "target": "/nutrition/quick-add",
  "icon": "utensils.svg",
  "context": ["dashboard", "nutrition"],
  "accessibility": {
    "ariaLabel": "Quick action: Log a meal or snack",
    "voiceCommand": "log meal",
    "description": "Quickly record what you ate"
  }
}
```

---

## 🎓 Onboarding and Feature Management API

### Onboarding Progress

```typescript
GET /api/v1/users/{userId}/onboarding
PUT /api/v1/users/{userId}/onboarding/step/{stepId}

// Get Onboarding Response
interface OnboardingResponse {
  currentStep: string;
  completedSteps: CompletedStep[];
  personalizedPath: OnboardingPath;
  competencyAssessment: CompetencyAssessment;
  nextRecommendations: OnboardingRecommendation[];
}

// Example Response
{
  "currentStep": "dashboard_customization",
  "completedSteps": [
    {
      "stepId": "profile_setup",
      "completedAt": "2024-12-27T14:30:00Z",
      "timeSpent": 180,
      "satisfaction": 4.5,
      "helpUsed": false
    },
    {
      "stepId": "accessibility_preferences",
      "completedAt": "2024-12-27T14:35:00Z", 
      "timeSpent": 240,
      "satisfaction": 5.0,
      "helpUsed": true
    }
  ],
  "personalizedPath": {
    "pathId": "accessibility_focused_path",
    "userType": "accessibility_user",
    "estimatedDuration": 25,
    "adaptations": [
      {
        "trigger": "screen_reader_detected",
        "changes": {
          "addedSteps": ["keyboard_navigation_tutorial"],
          "modifiedSteps": {
            "dashboard_customization": {
              "estimatedTime": 15,
              "accessibility": {
                "screenReaderInstructions": true,
                "keyboardOnlyMode": true
              }
            }
          }
        }
      }
    ]
  },
  "nextRecommendations": [
    {
      "type": "feature_introduction",
      "featureKey": "voice_commands",
      "reasoning": "Based on your accessibility preferences",
      "priority": 8
    }
  ]
}
```

### Feature Unlock Management

```typescript
GET /api/v1/users/{userId}/feature-unlocks
POST /api/v1/users/{userId}/feature-unlocks/check

// Feature Unlocks Response
interface FeatureUnlocksResponse {
  unlockedFeatures: FeatureUnlock[];
  pendingUnlocks: PendingUnlock[];
  competencyScores: CompetencyScore[];
  recommendations: FeatureRecommendation[];
}

interface FeatureUnlock {
  id: string;
  featureKey: string;
  feature: FeatureDefinition;
  unlockedAt: string;
  unlockReason: UnlockReason;
  competencyScore: number;
  usage: FeatureUsage;
}

// Example Response
{
  "unlockedFeatures": [
    {
      "id": "unlock_123",
      "featureKey": "advanced_analytics",
      "feature": {
        "key": "advanced_analytics",
        "name": "Advanced Analytics",
        "description": "Detailed progress analysis and insights",
        "complexity": "intermediate",
        "category": "data_analysis"
      },
      "unlockedAt": "2024-12-28T09:15:00Z",
      "unlockReason": "competency_achieved",
      "competencyScore": 0.78,
      "usage": {
        "firstUsed": "2024-12-28T10:00:00Z",
        "timesUsed": 3,
        "totalTimeSpent": 420,
        "proficiencyScore": 0.65
      }
    }
  ],
  "pendingUnlocks": [
    {
      "featureKey": "social_features",
      "currentScore": 0.68,
      "requiredScore": 0.75,
      "estimatedTimeToUnlock": "3-5 days",
      "missingPrerequisites": ["privacy_settings_configured"]
    }
  ]
}

// Check Feature Unlock Eligibility
POST /api/v1/users/{userId}/feature-unlocks/check
{
  "featureKey": "social_features"
}

// Response
{
  "eligible": false,
  "currentScore": 0.68,
  "requiredScore": 0.75,
  "missingPrerequisites": [
    {
      "type": "configuration",
      "requirement": "privacy_settings_configured",
      "description": "Configure your privacy preferences before enabling social features",
      "actionUrl": "/settings/privacy"
    }
  ],
  "recommendations": [
    "Complete privacy settings configuration",
    "Use basic profile features for 2 more days"
  ]
}
```

### Competency Assessment

```typescript
POST /api/v1/users/{userId}/competency/assess
GET /api/v1/users/{userId}/competency/scores

// Assessment Request
interface CompetencyAssessmentRequest {
  domain: CompetencyDomain;
  taskResults: TaskResult[];
  selfReportedConfidence: number;
  assistiveTechnologyUsed?: string[];
}

// Assessment Response
{
  "assessmentId": "assessment_456",
  "domain": "basic_navigation",
  "currentLevel": "intermediate",
  "previousLevel": "beginner",
  "score": 0.75,
  "confidence": 0.82,
  "improvement": 0.15,
  "nextLevelRequirements": {
    "targetScore": 0.85,
    "recommendedTasks": [
      "Practice keyboard shortcuts",
      "Customize navigation menu"
    ],
    "estimatedTime": "2-3 days"
  },
  "accessibility": {
    "assessmentAdaptations": [
      "Extended time provided",
      "Screen reader compatible tasks"
    ],
    "accommodationEffectiveness": 0.95
  }
}
```

---

## 📊 Analytics and Insights API

### UX Analytics

```typescript
POST /api/v1/analytics/ux-events
GET /api/v1/users/{userId}/analytics/insights

// Track UX Event
interface UXEventRequest {
  eventType: UXEventType;
  context: UXContext;
  data: any;
  accessibility?: AccessibilityContext;
  timestamp?: string;
}

// Example Event Tracking
{
  "eventType": "accessibility_feature_used",
  "context": {
    "page": "/dashboard",
    "section": "widget_grid",
    "deviceType": "desktop"
  },
  "data": {
    "feature": "high_contrast_mode",
    "enabled": true,
    "previousSetting": false
  },
  "accessibility": {
    "assistiveTechnology": ["screen_reader"],
    "screenReaderActive": true,
    "keyboardNavigationMode": true
  }
}

// Analytics Insights Response
{
  "insights": [
    {
      "type": "accessibility_adoption",
      "description": "High contrast mode usage increased 40% this week",
      "impact": "positive",
      "recommendations": [
        "Consider promoting high contrast theme to other users",
        "Ensure all widgets support high contrast mode"
      ]
    }
  ],
  "metrics": {
    "accessibility": {
      "featureUsageRate": 0.23,
      "taskCompletionParity": 0.95,
      "satisfactionScore": 4.6
    },
    "engagement": {
      "sessionDuration": 420,
      "featureAdoptionRate": 0.78,
      "retentionImprovement": 0.15
    }
  }
}
```

### Performance Monitoring

```typescript
GET /api/v1/analytics/performance
POST /api/v1/analytics/performance/report

// Performance Metrics Response
{
  "overall": {
    "averageLoadTime": 1.2,
    "accessibilityPerformance": 0.95,
    "userSatisfaction": 4.5
  },
  "byFeature": {
    "dashboard_customization": {
      "loadTime": 0.8,
      "renderTime": 0.3,
      "accessibilityScore": 0.98,
      "userSatisfaction": 4.7
    },
    "achievement_system": {
      "loadTime": 0.5,
      "celebrationRenderTime": 0.4,
      "accessibilityScore": 0.92,
      "userSatisfaction": 4.4
    }
  },
  "accessibility": {
    "screenReaderPerformance": 0.96,
    "keyboardNavigationSpeed": 0.94,
    "voiceCommandAccuracy": 0.91
  }
}
```

---

## 🔒 Privacy and Compliance API

### Privacy Settings

```typescript
GET /api/v1/users/{userId}/privacy-settings
PUT /api/v1/users/{userId}/privacy-settings

// Privacy Settings Response
{
  "dataCollection": {
    "analytics": true,
    "behaviorTracking": false,
    "accessibilityNeeds": true,
    "performanceMetrics": true
  },
  "sharing": {
    "achievements": "friends",
    "progress": "private",
    "leaderboards": false
  },
  "retention": {
    "analytics": "standard",
    "personalData": "minimal",
    "activityHistory": "extended"
  },
  "consent": [
    {
      "type": "accessibility_data",
      "granted": true,
      "timestamp": "2024-12-28T08:00:00Z",
      "version": "1.0"
    }
  ]
}
```

### Data Export and Deletion

```typescript
POST /api/v1/users/{userId}/data-export
DELETE /api/v1/users/{userId}/data

// Data Export Request
{
  "dataTypes": [
    "accessibility_preferences",
    "achievement_progress", 
    "dashboard_layouts",
    "navigation_patterns"
  ],
  "format": "json",
  "includeMetadata": true
}

// Export Response
{
  "exportId": "export_789",
  "status": "processing",
  "estimatedCompletionTime": "2024-12-28T12:00:00Z",
  "downloadUrl": null,
  "dataTypes": ["accessibility_preferences", "achievement_progress"],
  "accessibility": {
    "alternativeFormats": ["json", "csv", "plain_text"],
    "screenReaderCompatible": true
  }
}
```

---

## 🚨 Error Handling and Status Codes

### Standard HTTP Status Codes

```typescript
// Success Codes
200 OK                    // Successful GET, PUT, PATCH
201 Created              // Successful POST
204 No Content          // Successful DELETE

// Client Error Codes  
400 Bad Request         // Invalid request format
401 Unauthorized        // Missing/invalid authentication
403 Forbidden          // Insufficient permissions
404 Not Found          // Resource doesn't exist
409 Conflict           // Resource conflict (e.g., duplicate)
422 Unprocessable Entity // Validation errors
429 Too Many Requests   // Rate limit exceeded

// Server Error Codes
500 Internal Server Error // Server-side error
503 Service Unavailable  // Temporary service issues
```

### Error Response Format

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    accessibility?: AccessibilityErrorInfo;
    timestamp: string;
    requestId: string;
  };
}

interface AccessibilityErrorInfo {
  screenReaderMessage: string;
  plainLanguageExplanation: string;
  suggestedActions: string[];
  alternativeApproaches?: string[];
}

// Example Error Response
{
  "error": {
    "code": "ACCESSIBILITY_VALIDATION_FAILED",
    "message": "The requested layout configuration does not meet accessibility requirements",
    "details": {
      "violations": [
        {
          "rule": "keyboard_navigation",
          "description": "Widget positioning prevents logical tab order",
          "severity": "high"
        }
      ]
    },
    "accessibility": {
      "screenReaderMessage": "Layout change failed: keyboard navigation blocked",
      "plainLanguageExplanation": "The new layout would make it hard to navigate with just a keyboard",
      "suggestedActions": [
        "Adjust widget positions to allow proper tab order",
        "Use the accessibility-approved layout template"
      ]
    },
    "timestamp": "2024-12-28T10:30:00Z",
    "requestId": "req_123456"
  }
}
```

---

## 🔄 Versioning and Backwards Compatibility

### API Versioning Strategy

```typescript
// Version Header
Headers: {
  "API-Version": "v1.0",
  "Accept": "application/json",
  "Content-Type": "application/json"
}

// Version-specific endpoints
/api/v1/users/{userId}/accessibility-preferences
/api/v2/users/{userId}/accessibility-preferences

// Backwards compatibility support
{
  "data": {
    // Current version data
  },
  "deprecated": {
    "version": "v1.0",
    "sunsetDate": "2025-06-28",
    "migrationGuide": "/docs/migration/v1-to-v2"
  }
}
```

### Breaking Change Management

```typescript
interface DeprecationNotice {
  feature: string;
  deprecatedIn: string;
  removedIn: string;
  replacement?: string;
  migrationGuide: string;
  accessibilityImpact: AccessibilityImpact;
}

interface AccessibilityImpact {
  affectedFeatures: string[];
  migrationComplexity: 'low' | 'medium' | 'high';
  assistiveTechnologyUpdates: string[];
  userTrainingRequired: boolean;
}
```

---

## 📚 API Documentation and Testing

### Interactive Documentation

```yaml
# OpenAPI 3.0 specification excerpt
openapi: 3.0.0
info:
  title: GitFit UX Enhancement API
  version: 1.0.0
  description: Accessibility-first UX enhancement API
  contact:
    name: UX API Support
    email: ux-api@git-fit.com
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.git-fit.com/v1
    description: Production server
  - url: https://staging-api.git-fit.com/v1  
    description: Staging server

paths:
  /users/{userId}/accessibility-preferences:
    get:
      summary: Get user accessibility preferences
      description: Retrieve comprehensive accessibility settings for a user
      tags: [Accessibility]
      security:
        - BearerAuth: [ux:read, accessibility:manage]
      parameters:
        - name: userId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Accessibility preferences retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/AccessibilityPreferences'
        '404':
          description: User not found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ErrorResponse'
```

### SDK Examples

```typescript
// TypeScript SDK Usage Examples

import { GitFitUXClient } from '@git-fit/ux-sdk';

const client = new GitFitUXClient({
  apiKey: 'your-api-key',
  baseURL: 'https://api.git-fit.com/v1',
  accessibility: {
    announceResponses: true,
    timeoutExtension: 1.5
  }
});

// Get accessibility preferences
const preferences = await client.accessibility.getPreferences(userId);

// Update screen reader settings
await client.accessibility.updatePreferences(userId, {
  screenReader: {
    enabled: true,
    verbosityLevel: 'detailed'
  }
});

// Track achievement progress
await client.achievements.trackProgress(userId, {
  activity: {
    type: 'workout_completed',
    value: 1,
    metadata: { workoutType: 'strength' }
  }
});

// Customize dashboard
await client.dashboard.updateLayout(userId, layoutId, {
  widgets: [
    {
      widgetId: 'workout_summary',
      position: { x: 0, y: 0, width: 2, height: 2 }
    }
  ]
});
```

---

## 🧪 Testing and Quality Assurance

### API Testing Framework

```typescript
// Accessibility-focused API tests
describe('Accessibility API', () => {
  test('should return screen reader compatible responses', async () => {
    const response = await api.get('/users/123/accessibility-preferences');
    
    expect(response.status).toBe(200);
    expect(response.data).toHaveProperty('accessibility.screenReaderText');
    expect(response.headers['content-type']).toContain('application/json');
  });

  test('should validate WCAG compliance for layout updates', async () => {
    const invalidLayout = {
      widgets: [
        { position: { x: 0, y: 0, width: 1, height: 1 } } // Too small for accessibility
      ]
    };

    const response = await api.put('/users/123/dashboard/layouts/456', invalidLayout);
    
    expect(response.status).toBe(422);
    expect(response.data.error.code).toBe('ACCESSIBILITY_VALIDATION_FAILED');
  });
});

// Performance testing
describe('Performance Requirements', () => {
  test('should respond within 500ms for interactive endpoints', async () => {
    const startTime = Date.now();
    await api.get('/users/123/achievements');
    const responseTime = Date.now() - startTime;
    
    expect(responseTime).toBeLessThan(500);
  });
});
```

### Contract Testing

```yaml
# Pact contract testing example
interactions:
  - description: "Get accessibility preferences for screen reader user"
    given: "User exists with screen reader preferences"
    request:
      method: GET
      path: /users/123/accessibility-preferences
      headers:
        Authorization: Bearer valid-token
    response:
      status: 200
      headers:
        Content-Type: application/json
      body:
        accessibility:
          screenReader:
            enabled: true
            type: nvda
            verbosityLevel: standard
```

---

**API Maintainer**: UX Engineering Team  
**Documentation**: Swagger UI available at `/docs`  
**Support**: ux-api-support@git-fit.com  
**SLA**: 99.9% uptime, <500ms response time for interactive endpoints  