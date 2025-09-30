# Dashboard Configuration API Contract

**Endpoint**: `/api/analytics/dashboards`  
**Purpose**: Manage customizable analytics dashboards and visualizations  
**Authentication**: JWT Bearer token required  
**Permissions**: Role-based access (Viewer, Editor, Admin)  

## 📊 Dashboard Management

### Create Dashboard
```http
POST /api/analytics/dashboards
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Executive Dashboard",
  "description": "High-level business metrics for leadership team",
  "type": "executive",
  "layout": {
    "gridSize": {
      "columns": 12,
      "rows": 8
    },
    "widgets": [
      {
        "id": "widget_revenue",
        "type": "metric_card",
        "position": {
          "x": 0,
          "y": 0,
          "width": 3,
          "height": 2
        },
        "config": {
          "metric": "monthly_revenue",
          "title": "Monthly Revenue",
          "format": "currency",
          "showTrend": true,
          "timeRange": "30d"
        }
      },
      {
        "id": "widget_users_chart",
        "type": "line_chart",
        "position": {
          "x": 3,
          "y": 0,
          "width": 6,
          "height": 4
        },
        "config": {
          "metrics": ["daily_active_users", "new_users"],
          "title": "User Growth Trends",
          "timeRange": "7d",
          "granularity": "hour"
        }
      }
    ]
  },
  "permissions": {
    "isPublic": false,
    "viewers": ["user_123", "user_456"],
    "editors": ["user_789"]
  },
  "settings": {
    "refreshInterval": 300,
    "theme": "light",
    "timezone": "America/New_York",
    "defaultTimeRange": "7d"
  },
  "tags": ["executive", "revenue", "growth"]
}
```

### Response
```http
HTTP/1.1 201 Created
Content-Type: application/json

{
  "success": true,
  "dashboard": {
    "id": "dash_987654321",
    "name": "Executive Dashboard",
    "type": "executive",
    "url": "/analytics/dashboards/dash_987654321",
    "shareUrl": "/analytics/shared/dash_987654321?token=abc123",
    "permissions": {
      "owner": "user_current",
      "role": "admin",
      "canEdit": true,
      "canShare": true,
      "canDelete": true
    },
    "createdAt": 1674567890123,
    "updatedAt": 1674567890123
  }
}
```

### Get Dashboard List
```http
GET /api/analytics/dashboards?type=executive&tags=revenue,growth&limit=20&offset=0
Authorization: Bearer {jwt_token}

{
  "dashboards": [
    {
      "id": "dash_987654321",
      "name": "Executive Dashboard",
      "description": "High-level business metrics for leadership team",
      "type": "executive",
      "owner": {
        "id": "user_123",
        "name": "John Smith",
        "role": "admin"
      },
      "permissions": {
        "role": "viewer",
        "canEdit": false,
        "canShare": true
      },
      "lastViewed": 1674567890123,
      "createdAt": 1674500000000,
      "updatedAt": 1674567890123,
      "tags": ["executive", "revenue", "growth"],
      "widgetCount": 8,
      "viewCount": 145
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

### Get Dashboard Details
```http
GET /api/analytics/dashboards/dash_987654321
Authorization: Bearer {jwt_token}

{
  "dashboard": {
    "id": "dash_987654321",
    "name": "Executive Dashboard",
    "description": "High-level business metrics for leadership team",
    "type": "executive",
    "layout": {
      "gridSize": {
        "columns": 12,
        "rows": 8
      },
      "widgets": [
        {
          "id": "widget_revenue",
          "type": "metric_card",
          "position": {
            "x": 0,
            "y": 0,
            "width": 3,
            "height": 2
          },
          "config": {
            "metric": "monthly_revenue",
            "title": "Monthly Revenue",
            "format": "currency",
            "showTrend": true,
            "timeRange": "30d"
          },
          "data": {
            "value": 125000,
            "previousValue": 118000,
            "percentChange": 5.9,
            "trend": "up",
            "sparkline": [110000, 115000, 118000, 125000]
          }
        }
      ]
    },
    "permissions": {
      "owner": "user_123",
      "isPublic": false,
      "viewers": ["user_123", "user_456"],
      "editors": ["user_789"]
    },
    "settings": {
      "refreshInterval": 300,
      "theme": "light",
      "timezone": "America/New_York",
      "defaultTimeRange": "7d",
      "autoRefresh": true
    },
    "metadata": {
      "createdAt": 1674500000000,
      "updatedAt": 1674567890123,
      "lastViewedAt": 1674567800000,
      "viewCount": 145,
      "tags": ["executive", "revenue", "growth"]
    }
  }
}
```

## 🎨 Widget Configuration

### Widget Types & Configurations
```typescript
interface WidgetConfig {
  id: string;
  type: WidgetType;
  position: GridPosition;
  config: WidgetSpecificConfig;
  data?: WidgetData;
}

type WidgetType = 
  | "metric_card"           // Single KPI display
  | "line_chart"            // Time-series line chart
  | "bar_chart"             // Bar/column chart
  | "pie_chart"             // Pie/donut chart
  | "table"                 // Data table
  | "funnel_chart"          // Conversion funnel
  | "heatmap"               // Activity heatmap
  | "gauge"                 // Progress gauge
  | "list"                  // Top/bottom lists
  | "text"                  // Text/markdown content
  | "iframe";               // Embedded content

// Metric Card Configuration
{
  "type": "metric_card",
  "config": {
    "metric": "daily_active_users",
    "title": "Daily Active Users",
    "subtitle": "Last 24 hours",
    "format": "number",
    "showTrend": true,
    "showSparkline": true,
    "trendPeriod": "7d",
    "target": 2000,
    "thresholds": {
      "good": 1800,
      "warning": 1500,
      "critical": 1000
    },
    "colors": {
      "primary": "#3B82F6",
      "trend": "#10B981",
      "warning": "#F59E0B",
      "critical": "#EF4444"
    }
  }
}

// Line Chart Configuration
{
  "type": "line_chart",
  "config": {
    "metrics": [
      {
        "name": "daily_active_users",
        "label": "Daily Active Users",
        "color": "#3B82F6",
        "yAxis": "left"
      },
      {
        "name": "new_users",
        "label": "New Users",
        "color": "#10B981",
        "yAxis": "right"
      }
    ],
    "title": "User Growth Trends",
    "timeRange": "30d",
    "granularity": "day",
    "showPoints": true,
    "showGrid": true,
    "showLegend": true,
    "annotations": [
      {
        "date": "2024-01-15",
        "label": "Marketing Campaign Launch",
        "color": "#F59E0B"
      }
    ]
  }
}

// Table Configuration
{
  "type": "table",
  "config": {
    "query": {
      "select": ["category", "action", "count(*) as events"],
      "from": "analyticsEvents",
      "where": {"timestamp": {"gte": "7d"}},
      "groupBy": ["category", "action"],
      "orderBy": [{"field": "events", "direction": "desc"}],
      "limit": 10
    },
    "title": "Top Events (Last 7 Days)",
    "columns": [
      {
        "field": "category",
        "label": "Category",
        "width": "25%",
        "sortable": true
      },
      {
        "field": "action", 
        "label": "Action",
        "width": "35%",
        "sortable": true
      },
      {
        "field": "events",
        "label": "Count",
        "width": "20%",
        "format": "number",
        "sortable": true
      }
    ],
    "pagination": true,
    "searchable": true,
    "exportable": true
  }
}
```

### Update Widget
```http
PUT /api/analytics/dashboards/dash_987654321/widgets/widget_revenue
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "position": {
    "x": 0,
    "y": 0,
    "width": 4,
    "height": 2
  },
  "config": {
    "metric": "monthly_revenue",
    "title": "Monthly Revenue (Updated)",
    "format": "currency",
    "showTrend": true,
    "timeRange": "60d",
    "target": 150000
  }
}
```

### Add Widget to Dashboard
```http
POST /api/analytics/dashboards/dash_987654321/widgets
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "type": "pie_chart",
  "position": {
    "x": 8,
    "y": 0,
    "width": 4,
    "height": 4
  },
  "config": {
    "query": {
      "select": ["category", "count(*) as events"],
      "from": "analyticsEvents", 
      "where": {"timestamp": {"gte": "7d"}},
      "groupBy": ["category"],
      "orderBy": [{"field": "events", "direction": "desc"}],
      "limit": 5
    },
    "title": "Events by Category",
    "showLegend": true,
    "showValues": true,
    "colorScheme": "categorical"
  }
}
```

## 🔒 Dashboard Permissions

### Share Dashboard
```http
POST /api/analytics/dashboards/dash_987654321/share
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "shareType": "public_link",
  "permissions": {
    "allowDownload": false,
    "allowEmbed": true,
    "requireAuth": false
  },
  "expiresAt": 1677246000000,
  "password": "optional_password"
}
```

### Response
```http
{
  "success": true,
  "shareToken": "share_abc123def456",
  "publicUrl": "https://app.gitfit.com/analytics/shared/dash_987654321?token=share_abc123def456",
  "embedUrl": "https://app.gitfit.com/analytics/embed/dash_987654321?token=share_abc123def456",
  "expiresAt": 1677246000000,
  "permissions": {
    "allowDownload": false,
    "allowEmbed": true,
    "requireAuth": false
  }
}
```

### Manage Dashboard Users
```http
PUT /api/analytics/dashboards/dash_987654321/permissions
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "permissions": {
    "viewers": [
      {"userId": "user_123", "role": "viewer"},
      {"userId": "user_456", "role": "viewer"},
      {"email": "new-user@company.com", "role": "viewer"}
    ],
    "editors": [
      {"userId": "user_789", "role": "editor"}
    ],
    "isPublic": false,
    "publicPermissions": {
      "canView": false,
      "canComment": false,
      "canDownload": false
    }
  }
}
```

## 📊 Dashboard Templates

### Get Available Templates
```http
GET /api/analytics/dashboards/templates?category=business&industry=fitness
Authorization: Bearer {jwt_token}

{
  "templates": [
    {
      "id": "template_executive",
      "name": "Executive Dashboard",
      "description": "High-level business metrics and KPIs",
      "category": "business",
      "industry": "fitness",
      "difficulty": "beginner",
      "estimatedSetupTime": 10,
      "features": [
        "Revenue tracking",
        "User growth metrics", 
        "Conversion funnels",
        "Retention analysis"
      ],
      "preview": {
        "imageUrl": "/templates/executive-preview.png",
        "demoUrl": "/templates/executive-demo"
      },
      "widgetCount": 8,
      "popularityScore": 95,
      "tags": ["revenue", "growth", "executive", "kpi"]
    },
    {
      "id": "template_product_analytics",
      "name": "Product Analytics Dashboard", 
      "description": "Feature usage and user engagement metrics",
      "category": "product",
      "industry": "fitness",
      "difficulty": "intermediate",
      "estimatedSetupTime": 20,
      "features": [
        "Feature adoption tracking",
        "User journey analysis",
        "A/B test results",
        "Cohort analysis"
      ],
      "widgetCount": 12,
      "popularityScore": 88
    }
  ],
  "categories": [
    {"id": "business", "name": "Business Intelligence", "count": 15},
    {"id": "product", "name": "Product Analytics", "count": 12},
    {"id": "marketing", "name": "Marketing Analytics", "count": 8},
    {"id": "ai", "name": "AI Performance", "count": 5}
  ]
}
```

### Create Dashboard from Template
```http
POST /api/analytics/dashboards/templates/template_executive/create
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "My Executive Dashboard",
  "description": "Custom executive dashboard for our team",
  "customizations": {
    "companyName": "GitFit",
    "timeZone": "America/New_York",
    "currency": "USD",
    "targetMetrics": {
      "monthlyRevenue": 150000,
      "monthlyActiveUsers": 20000,
      "conversionRate": 0.05
    }
  },
  "permissions": {
    "viewers": ["user_123", "user_456"],
    "editors": [],
    "isPublic": false
  }
}
```

## 📈 Real-time Dashboard Updates

### WebSocket Connection
```javascript
// Connect to dashboard real-time updates
const ws = new WebSocket('wss://api.gitfit.com/analytics/dashboards/dash_987654321/stream?token=jwt_token');

ws.onmessage = (event) => {
  const update = JSON.parse(event.data);
  
  switch (update.type) {
    case 'widget_data_update':
      updateWidget(update.widgetId, update.data);
      break;
      
    case 'dashboard_config_change':
      reloadDashboard(update.config);
      break;
      
    case 'permission_change':
      handlePermissionChange(update.permissions);
      break;
  }
};

// Widget data update message
{
  "type": "widget_data_update",
  "widgetId": "widget_revenue",
  "data": {
    "value": 125500,
    "previousValue": 125000,
    "percentChange": 0.4,
    "trend": "up",
    "timestamp": 1674567890123
  },
  "timestamp": 1674567890123
}
```

### Dashboard Export
```http
GET /api/analytics/dashboards/dash_987654321/export?format=pdf&layout=landscape
Authorization: Bearer {jwt_token}

// Response includes download URL
{
  "success": true,
  "downloadUrl": "https://api.gitfit.com/downloads/dashboard_export_abc123.pdf",
  "expiresAt": 1674571490123,
  "fileSize": 2048576,
  "format": "pdf",
  "generatedAt": 1674567890123
}
```

### Dashboard Embed Configuration
```http
GET /api/analytics/dashboards/dash_987654321/embed?theme=light&hideControls=true
Authorization: Bearer {jwt_token}

{
  "embedCode": "<iframe src=\"https://app.gitfit.com/analytics/embed/dash_987654321?token=embed_abc123&theme=light&hideControls=true\" width=\"800\" height=\"600\" frameborder=\"0\"></iframe>",
  "embedUrl": "https://app.gitfit.com/analytics/embed/dash_987654321?token=embed_abc123&theme=light&hideControls=true",
  "token": "embed_abc123",
  "expiresAt": 1677246000000,
  "configuration": {
    "theme": "light",
    "hideControls": true,
    "allowInteraction": true,
    "showTitle": true,
    "autoRefresh": true
  }
}
```

## ⚙️ Dashboard Settings

### Update Dashboard Settings
```http
PUT /api/analytics/dashboards/dash_987654321/settings
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "settings": {
    "refreshInterval": 600,
    "theme": "dark",
    "timezone": "America/Los_Angeles",
    "defaultTimeRange": "30d",
    "autoRefresh": true,
    "showGrid": true,
    "snapToGrid": true,
    "allowMobileView": true,
    "notifications": {
      "emailAlerts": true,
      "slackNotifications": false,
      "alertThresholds": {
        "dataFreshness": 3600,
        "errorRate": 0.05
      }
    }
  }
}
```

### Dashboard Analytics
```http
GET /api/analytics/dashboards/dash_987654321/analytics?period=30d
Authorization: Bearer {jwt_token}

{
  "usage": {
    "totalViews": 456,
    "uniqueViewers": 23,
    "avgSessionDuration": 480,
    "mostViewedWidget": "widget_revenue",
    "peakUsageHour": 10,
    "deviceBreakdown": {
      "desktop": 0.75,
      "mobile": 0.20,
      "tablet": 0.05
    }
  },
  "performance": {
    "avgLoadTime": 2.3,
    "widgetLoadTimes": {
      "widget_revenue": 0.8,
      "widget_users_chart": 1.5
    },
    "errorRate": 0.01,
    "uptimePercentage": 99.9
  },
  "engagement": {
    "timeToFirstInteraction": 5.2,
    "interactionsPerSession": 3.4,
    "mostUsedFeatures": [
      "time_range_selector",
      "download_data",
      "widget_drill_down"
    ]
  }
}
```

---

## 🔧 Error Handling

### Widget Configuration Errors
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "INVALID_WIDGET_CONFIG",
    "message": "Widget configuration validation failed",
    "details": [
      {
        "field": "config.metric",
        "message": "Metric 'invalid_metric' does not exist",
        "suggestedValues": ["daily_active_users", "monthly_revenue", "conversion_rate"]
      },
      {
        "field": "position.width",
        "message": "Widget width cannot exceed grid width (12 columns)",
        "value": 15,
        "maxValue": 12
      }
    ]
  }
}
```

### Permission Errors
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You do not have permission to edit this dashboard",
    "details": {
      "required": "editor",
      "current": "viewer",
      "dashboardId": "dash_987654321",
      "owner": "user_123"
    }
  }
}
```

### Dashboard Not Found
```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "DASHBOARD_NOT_FOUND",
    "message": "Dashboard with ID 'dash_invalid' was not found",
    "suggestions": [
      "Check the dashboard ID is correct",
      "Ensure you have access to this dashboard",
      "Dashboard may have been deleted"
    ]
  }
}
```

---

## 📋 Implementation Requirements

### Performance Standards
- [ ] Dashboard load time: <3 seconds
- [ ] Widget refresh time: <1 second
- [ ] Real-time updates: <2 seconds latency
- [ ] Concurrent users: Support 100+ simultaneous dashboard viewers

### Security Requirements
- [ ] Role-based access control implementation
- [ ] Audit logging for all dashboard modifications
- [ ] Data privacy compliance for shared dashboards
- [ ] Secure token-based sharing with expiration

### Feature Requirements
- [ ] Drag-and-drop widget positioning
- [ ] Responsive design for mobile and tablet
- [ ] Export functionality (PDF, PNG, CSV)
- [ ] Embedding capabilities with security controls