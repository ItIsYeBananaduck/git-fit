# Business Intelligence API Contract

**Endpoint**: `/api/analytics/business`  
**Purpose**: Business intelligence and executive reporting  
**Authentication**: JWT Bearer token with BI role required  
**Data Sources**: Analytics events, user data, financial systems  

## 📊 Executive KPI Metrics

### Get Executive Summary
```http
GET /api/analytics/business/executive?period=monthly&currency=USD
Authorization: Bearer {jwt_token}

{
  "period": {
    "type": "monthly",
    "current": "2024-01",
    "start": 1704067200000,
    "end": 1706745599999
  },
  "kpis": {
    "revenue": {
      "value": 125000,
      "currency": "USD",
      "previousPeriod": 118000,
      "percentChange": 5.9,
      "trend": "up",
      "target": 130000,
      "targetProgress": 0.96,
      "forecast": 127500,
      "confidenceInterval": [122000, 133000]
    },
    "monthlyRecurringRevenue": {
      "value": 89000,
      "previousPeriod": 85000,
      "percentChange": 4.7,
      "trend": "up",
      "annualRunRate": 1068000,
      "churnImpact": -3200
    },
    "activeUsers": {
      "total": 15420,
      "previousPeriod": 14200,
      "percentChange": 8.6,
      "trend": "up",
      "breakdown": {
        "free": 12000,
        "premium": 3420
      }
    },
    "conversionRate": {
      "value": 0.045,
      "previousPeriod": 0.041,
      "percentChange": 9.8,
      "trend": "up",
      "target": 0.05,
      "funnelStages": {
        "signup": 0.85,
        "onboarding": 0.73,
        "firstWorkout": 0.68,
        "subscription": 0.045
      }
    },
    "customerAcquisitionCost": {
      "value": 45.50,
      "previousPeriod": 48.20,
      "percentChange": -5.6,
      "trend": "down",
      "byChannel": {
        "organic": 12.00,
        "paid_social": 78.50,
        "google_ads": 65.30,
        "referral": 8.40
      }
    },
    "customerLifetimeValue": {
      "value": 340.00,
      "previousPeriod": 325.00,
      "percentChange": 4.6,
      "trend": "up",
      "ltvCacRatio": 7.47,
      "paybackPeriod": 3.2
    },
    "churnRate": {
      "value": 0.08,
      "previousPeriod": 0.09,
      "percentChange": -11.1,
      "trend": "down",
      "target": 0.07,
      "voluntary": 0.06,
      "involuntary": 0.02
    },
    "netPromoterScore": {
      "value": 42,
      "previousPeriod": 38,
      "percentChange": 10.5,
      "trend": "up",
      "distribution": {
        "promoters": 0.35,
        "passives": 0.42,
        "detractors": 0.23
      }
    }
  },
  "trends": {
    "revenueGrowthRate": 0.059,
    "userGrowthRate": 0.086,
    "productMarketFit": 0.73,
    "businessHealth": "strong"
  }
}
```

### Revenue Analytics
```http
GET /api/analytics/business/revenue?breakdown=plan&timeRange=6m&granularity=month
Authorization: Bearer {jwt_token}

{
  "totalRevenue": {
    "value": 750000,
    "timeRange": "6m",
    "growth": {
      "absolute": 125000,
      "percentage": 20.0
    }
  },
  "revenueBreakdown": {
    "byPlan": [
      {
        "plan": "premium_monthly",
        "revenue": 420000,
        "percentage": 56.0,
        "subscribers": 3500,
        "avgRevenuePerUser": 120.00
      },
      {
        "plan": "premium_annual",
        "revenue": 280000,
        "percentage": 37.3,
        "subscribers": 875,
        "avgRevenuePerUser": 320.00
      },
      {
        "plan": "marketplace_commission",
        "revenue": 50000,
        "percentage": 6.7,
        "transactions": 2500,
        "avgCommission": 20.00
      }
    ],
    "byChannel": [
      {
        "channel": "direct",
        "revenue": 525000,
        "percentage": 70.0,
        "conversionRate": 0.055
      },
      {
        "channel": "affiliate",
        "revenue": 150000,
        "percentage": 20.0,
        "commissionRate": 0.15
      },
      {
        "channel": "corporate",
        "revenue": 75000,
        "percentage": 10.0,
        "contractValue": 25000
      }
    ]
  },
  "monthlyTrends": [
    {
      "month": "2023-08",
      "revenue": 105000,
      "newRevenue": 18000,
      "expansionRevenue": 5000,
      "churnedRevenue": -8000,
      "netRevenue": 15000
    },
    {
      "month": "2023-09", 
      "revenue": 112000,
      "newRevenue": 22000,
      "expansionRevenue": 8000,
      "churnedRevenue": -7000,
      "netRevenue": 23000
    }
  ],
  "forecasting": {
    "nextMonth": {
      "predicted": 135000,
      "confidence": 0.87,
      "range": [128000, 142000]
    },
    "nextQuarter": {
      "predicted": 425000,
      "confidence": 0.82,
      "assumptions": ["current_growth_rate", "seasonal_adjustment"]
    }
  }
}
```

## 👥 User Analytics & Segmentation

### User Cohort Analysis
```http
GET /api/analytics/business/cohorts?type=monthly&startDate=2023-01-01&metrics=retention,ltv
Authorization: Bearer {jwt_token}

{
  "cohortType": "monthly",
  "dateRange": {
    "start": "2023-01-01",
    "end": "2023-12-31"
  },
  "cohorts": [
    {
      "cohortId": "2023-01",
      "name": "January 2023",
      "startDate": "2023-01-01",
      "initialSize": 1200,
      "acquisitionChannel": {
        "organic": 480,
        "paid": 540,
        "referral": 180
      },
      "retentionData": [
        {"period": 0, "retained": 1200, "rate": 1.00},
        {"period": 1, "retained": 840, "rate": 0.70},
        {"period": 3, "retained": 600, "rate": 0.50},
        {"period": 6, "retained": 480, "rate": 0.40},
        {"period": 12, "retained": 360, "rate": 0.30}
      ],
      "revenueData": [
        {"period": 0, "revenue": 0, "cumulativeRevenue": 0},
        {"period": 1, "revenue": 25200, "cumulativeRevenue": 25200},
        {"period": 3, "revenue": 45000, "cumulativeRevenue": 118800},
        {"period": 6, "revenue": 38400, "cumulativeRevenue": 246000},
        {"period": 12, "revenue": 28800, "cumulativeRevenue": 408000}
      ],
      "metrics": {
        "lifetimeValue": 340.00,
        "paybackPeriod": 2.8,
        "avgSessionsPerUser": 45,
        "avgWorkoutsCompleted": 32
      }
    }
  ],
  "aggregateMetrics": {
    "retentionRates": {
      "month1": 0.68,
      "month3": 0.47,
      "month6": 0.38,
      "month12": 0.28
    },
    "ltv": {
      "average": 315.00,
      "median": 280.00,
      "percentile90": 650.00
    },
    "benchmarks": {
      "industryRetentionMonth1": 0.65,
      "industryLtv": 290.00
    }
  }
}
```

### User Segmentation Analytics
```http
GET /api/analytics/business/segments?segmentType=behavioral&includeMetrics=true
Authorization: Bearer {jwt_token}

{
  "segmentationType": "behavioral",
  "segments": [
    {
      "id": "power_users",
      "name": "Power Users",
      "description": "Highly engaged users with consistent activity",
      "criteria": {
        "workoutsPerWeek": {"gte": 4},
        "sessionDuration": {"gte": 1800},
        "featureUsage": {"gte": 0.7}
      },
      "size": 2340,
      "percentage": 15.2,
      "metrics": {
        "avgRevenuePerUser": 180.00,
        "churnRate": 0.03,
        "lifetimeValue": 520.00,
        "nps": 62,
        "avgSessionDuration": 2400,
        "workoutsPerMonth": 18
      },
      "trends": {
        "growthRate": 0.12,
        "revenueContribution": 0.34
      }
    },
    {
      "id": "casual_users",
      "name": "Casual Users", 
      "description": "Moderate engagement with occasional activity",
      "criteria": {
        "workoutsPerWeek": {"gte": 1, "lt": 4},
        "sessionDuration": {"gte": 900, "lt": 1800}
      },
      "size": 8940,
      "percentage": 58.0,
      "metrics": {
        "avgRevenuePerUser": 85.00,
        "churnRate": 0.08,
        "lifetimeValue": 240.00,
        "nps": 38,
        "avgSessionDuration": 1200,
        "workoutsPerMonth": 8
      }
    },
    {
      "id": "at_risk",
      "name": "At-Risk Users",
      "description": "Low engagement, high churn probability",
      "criteria": {
        "daysSinceLastActivity": {"gte": 14},
        "engagementScore": {"lt": 0.3}
      },
      "size": 1820,
      "percentage": 11.8,
      "metrics": {
        "churnProbability": 0.65,
        "daysToChurn": 28,
        "reactivationRate": 0.23,
        "potentialLostRevenue": 82000
      },
      "interventions": [
        {
          "type": "email_campaign",
          "name": "Re-engagement Series",
          "effectiveness": 0.31
        },
        {
          "type": "discount_offer",
          "name": "Come Back Special",
          "effectiveness": 0.42
        }
      ]
    }
  ],
  "crossSegmentAnalysis": {
    "migrationRates": {
      "casual_to_power": 0.08,
      "power_to_casual": 0.05,
      "casual_to_at_risk": 0.12
    },
    "revenueDistribution": {
      "power_users": 0.34,
      "casual_users": 0.58,
      "at_risk": 0.08
    }
  }
}
```

## 📈 Growth & Acquisition Analytics

### Acquisition Funnel Analysis
```http
GET /api/analytics/business/funnel?type=acquisition&timeRange=30d&breakdown=channel
Authorization: Bearer {jwt_token}

{
  "funnelType": "acquisition",
  "timeRange": "30d",
  "overallMetrics": {
    "topOfFunnel": 25000,
    "conversionRate": 0.045,
    "totalConversions": 1125,
    "costPerAcquisition": 45.50
  },
  "funnelStages": [
    {
      "stage": "visitor",
      "name": "Website Visitors",
      "count": 25000,
      "conversionRate": 1.00,
      "dropoffRate": 0.00
    },
    {
      "stage": "signup",
      "name": "Account Signups",
      "count": 21250,
      "conversionRate": 0.85,
      "dropoffRate": 0.15,
      "avgTimeToConvert": 180
    },
    {
      "stage": "onboarding",
      "name": "Completed Onboarding",
      "count": 15513,
      "conversionRate": 0.73,
      "dropoffRate": 0.27,
      "avgTimeToConvert": 1200
    },
    {
      "stage": "first_workout",
      "name": "First Workout Completed",
      "count": 10549,
      "conversionRate": 0.68,
      "dropoffRate": 0.32,
      "avgTimeToConvert": 2400
    },
    {
      "stage": "subscription",
      "name": "Subscription Purchase",
      "count": 1125,
      "conversionRate": 0.045,
      "dropoffRate": 0.955,
      "avgTimeToConvert": 7200
    }
  ],
  "channelBreakdown": [
    {
      "channel": "organic_search",
      "visitors": 8500,
      "conversions": 459,
      "conversionRate": 0.054,
      "costPerAcquisition": 12.00,
      "roi": 8.5
    },
    {
      "channel": "paid_social",
      "visitors": 7200,
      "conversions": 288,
      "conversionRate": 0.040,
      "costPerAcquisition": 78.50,
      "roi": 4.3
    },
    {
      "channel": "google_ads",
      "visitors": 5800,
      "conversions": 232,
      "conversionRate": 0.040,
      "costPerAcquisition": 65.30,
      "roi": 5.2
    },
    {
      "channel": "referral",
      "visitors": 3500,
      "conversions": 146,
      "conversionRate": 0.042,
      "costPerAcquisition": 8.40,
      "roi": 15.2
    }
  ],
  "optimization": {
    "biggestDropoff": "first_workout_to_subscription",
    "improvementOpportunity": 0.32,
    "recommendedActions": [
      "Improve workout completion experience",
      "Add subscription incentives after first workout",
      "Implement progress tracking features"
    ]
  }
}
```

### Marketing Campaign Performance
```http
GET /api/analytics/business/campaigns?status=active&timeRange=90d&includeAttribution=true
Authorization: Bearer {jwt_token}

{
  "campaigns": [
    {
      "id": "campaign_new_year_2024",
      "name": "New Year Fitness Resolution",
      "status": "active",
      "type": "acquisition",
      "channels": ["facebook", "instagram", "google_ads"],
      "budget": {
        "total": 50000,
        "spent": 32500,
        "remaining": 17500
      },
      "timeline": {
        "start": "2024-01-01",
        "end": "2024-01-31",
        "daysRunning": 15,
        "daysRemaining": 16
      },
      "performance": {
        "impressions": 1250000,
        "clicks": 18750,
        "clickThroughRate": 0.015,
        "costPerClick": 1.73,
        "signups": 890,
        "conversions": 124,
        "conversionRate": 0.139,
        "costPerAcquisition": 262.10,
        "returnOnAdSpend": 3.8
      },
      "attribution": {
        "firstTouch": 65,
        "lastTouch": 124,
        "assisted": 89,
        "totalAttributed": 189
      },
      "demographics": {
        "ageGroups": {
          "18-24": 0.15,
          "25-34": 0.42,
          "35-44": 0.28,
          "45-54": 0.12,
          "55+": 0.03
        },
        "gender": {
          "male": 0.48,
          "female": 0.51,
          "other": 0.01
        }
      }
    }
  ],
  "aggregateMetrics": {
    "totalSpend": 125000,
    "totalConversions": 456,
    "blendedCostPerAcquisition": 274.12,
    "overallROAS": 4.2,
    "attributionBreakdown": {
      "direct": 0.35,
      "organic_search": 0.28,
      "paid_campaigns": 0.22,
      "referral": 0.15
    }
  }
}
```

## 🏪 Marketplace Analytics

### Marketplace Performance
```http
GET /api/analytics/business/marketplace?timeRange=30d&breakdown=category,trainer
Authorization: Bearer {jwt_token}

{
  "overallMetrics": {
    "totalRevenue": 85000,
    "totalTransactions": 1420,
    "averageOrderValue": 59.86,
    "commissionRevenue": 12750,
    "commissionRate": 0.15,
    "activePrograms": 156,
    "activeTrainers": 23
  },
  "categoryPerformance": [
    {
      "category": "strength_training",
      "name": "Strength Training",
      "revenue": 32000,
      "percentage": 37.6,
      "transactions": 534,
      "avgPrice": 59.93,
      "programs": 45,
      "conversionRate": 0.12,
      "topProgram": {
        "id": "program_strongfit_basics",
        "name": "StrongFit Basics",
        "revenue": 8500,
        "sales": 170
      }
    },
    {
      "category": "cardio_fitness",
      "name": "Cardio & HIIT",
      "revenue": 28500,
      "percentage": 33.5,
      "transactions": 475,
      "avgPrice": 60.00,
      "programs": 38,
      "conversionRate": 0.14
    },
    {
      "category": "yoga_wellness",
      "name": "Yoga & Wellness",
      "revenue": 15500,
      "percentage": 18.2,
      "transactions": 258,
      "avgPrice": 60.08,
      "programs": 31,
      "conversionRate": 0.09
    },
    {
      "category": "nutrition",
      "name": "Nutrition Plans",
      "revenue": 9000,
      "percentage": 10.7,
      "transactions": 153,
      "avgPrice": 58.82,
      "programs": 22,
      "conversionRate": 0.08
    }
  ],
  "trainerPerformance": [
    {
      "trainerId": "trainer_sarah_fitness",
      "name": "Sarah Johnson",
      "specialization": "Strength Training",
      "revenue": 18500,
      "sales": 310,
      "programs": 8,
      "rating": 4.8,
      "studentCount": 890,
      "completionRate": 0.78,
      "commissionEarned": 2775
    },
    {
      "trainerId": "trainer_mike_cardio",
      "name": "Mike Chen",
      "specialization": "HIIT & Cardio",
      "revenue": 15200,
      "sales": 253,
      "programs": 6,
      "rating": 4.7,
      "studentCount": 720,
      "completionRate": 0.82,
      "commissionEarned": 2280
    }
  ],
  "trends": {
    "growthRate": 0.15,
    "seasonalPatterns": {
      "januaryBoost": 0.35,
      "summerDip": -0.15,
      "fallResurgence": 0.20
    },
    "emerging": [
      "functional_fitness",
      "recovery_programs",
      "nutrition_coaching"
    ]
  }
}
```

## 📊 AI Performance Business Impact

### AI Recommendation ROI
```http
GET /api/analytics/business/ai-impact?timeRange=90d&breakdown=model,outcome
Authorization: Bearer {jwt_token}

{
  "overallImpact": {
    "totalRecommendations": 45000,
    "acceptanceRate": 0.73,
    "revenueAttribution": 125000,
    "costSavings": 35000,
    "userSatisfactionImprovement": 0.15,
    "retentionImprovement": 0.08
  },
  "modelPerformance": [
    {
      "modelId": "workout_recommender_v2",
      "name": "Workout Recommendation Engine",
      "recommendations": 25000,
      "acceptanceRate": 0.78,
      "businessImpact": {
        "workoutCompletionIncrease": 0.23,
        "sessionDurationIncrease": 420,
        "subscriptionUplift": 0.12,
        "attributedRevenue": 68000
      },
      "userFeedback": {
        "satisfactionScore": 4.3,
        "improvementSuggestions": [
          "More variety in recommendations",
          "Better difficulty progression"
        ]
      }
    },
    {
      "modelId": "nutrition_ai_v1",
      "name": "Nutrition AI Assistant",
      "recommendations": 18000,
      "acceptanceRate": 0.65,
      "businessImpact": {
        "mealLoggingIncrease": 0.35,
        "nutritionGoalAchievement": 0.18,
        "premiumConversion": 0.08,
        "attributedRevenue": 42000
      },
      "costSavings": {
        "reducedSupportTickets": 850,
        "automatedNutritionPlanning": 15000
      }
    }
  ],
  "outcomeAnalysis": {
    "revenueImpact": {
      "directSubscriptions": 85000,
      "upsellsFromRecommendations": 28000,
      "reducedChurnValue": 12000
    },
    "operationalEfficiency": {
      "contentPersonalizationCost": -8000,
      "customerSupportCost": -12000,
      "manualCurationCost": -15000
    },
    "userExperience": {
      "timeToValue": -35,
      "featureDiscovery": 0.42,
      "overallSatisfaction": 0.15
    }
  },
  "recommendations": [
    {
      "priority": "high",
      "action": "Expand workout recommendation model to nutrition timing",
      "expectedImpact": "15% increase in nutrition goal achievement"
    },
    {
      "priority": "medium", 
      "action": "Implement cross-model recommendations",
      "expectedImpact": "8% increase in overall engagement"
    }
  ]
}
```

## 📋 Custom Business Reports

### Generate Custom Report
```http
POST /api/analytics/business/reports
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "name": "Q4 2023 Executive Summary",
  "description": "Comprehensive quarterly business review",
  "template": "executive_quarterly",
  "parameters": {
    "startDate": "2023-10-01",
    "endDate": "2023-12-31",
    "currency": "USD",
    "timezone": "America/New_York",
    "includeForecasting": true,
    "comparisonPeriod": "previous_quarter"
  },
  "sections": [
    "executive_summary",
    "revenue_analysis", 
    "user_growth",
    "product_metrics",
    "marketing_performance",
    "ai_impact",
    "recommendations"
  ],
  "format": "pdf",
  "schedule": {
    "frequency": "quarterly",
    "recipients": [
      "ceo@gitfit.com",
      "cfo@gitfit.com", 
      "coo@gitfit.com"
    ],
    "nextRun": "2024-04-01T09:00:00Z"
  }
}
```

### Response
```http
HTTP/1.1 202 Accepted
Content-Type: application/json

{
  "success": true,
  "reportId": "report_q4_2023_exec",
  "status": "generating",
  "estimatedCompletionTime": 300,
  "downloadUrl": null,
  "previewUrl": "/api/analytics/business/reports/report_q4_2023_exec/preview",
  "schedule": {
    "id": "schedule_quarterly_exec",
    "nextRun": "2024-04-01T09:00:00Z"
  }
}
```

### Get Report Status
```http
GET /api/analytics/business/reports/report_q4_2023_exec/status
Authorization: Bearer {jwt_token}

{
  "reportId": "report_q4_2023_exec",
  "status": "completed",
  "progress": 100,
  "generatedAt": 1674567890123,
  "fileSize": 2048576,
  "downloadUrl": "https://api.gitfit.com/downloads/q4_2023_executive_summary.pdf",
  "expiresAt": 1677246000000,
  "sections": [
    {"name": "executive_summary", "status": "completed"},
    {"name": "revenue_analysis", "status": "completed"},
    {"name": "user_growth", "status": "completed"},
    {"name": "product_metrics", "status": "completed"},
    {"name": "marketing_performance", "status": "completed"},
    {"name": "ai_impact", "status": "completed"},
    {"name": "recommendations", "status": "completed"}
  ]
}
```

---

## 🔧 Error Handling & Rate Limits

### Rate Limits
```http
# Business Intelligence API Rate Limits
GET /api/analytics/business/* - 100 requests/hour
POST /api/analytics/business/reports - 10 requests/hour  
GET /api/analytics/business/reports/*/download - 50 downloads/day
```

### Error Responses
```http
HTTP/1.1 429 Too Many Requests
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Business intelligence API rate limit exceeded",
    "details": {
      "limit": 100,
      "window": "1 hour",
      "resetTime": 1674571490123
    }
  }
}
```

### Insufficient Permissions
```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "Business intelligence access requires elevated permissions",
    "details": {
      "required": "business_analyst",
      "current": "user",
      "requestAccess": "/api/permissions/request"
    }
  }
}
```

---

## 📋 Implementation Standards

### Performance Requirements
- [ ] Query response time: <10 seconds for complex BI queries
- [ ] Report generation: <5 minutes for standard reports
- [ ] Data freshness: BI data updated within 1 hour
- [ ] Concurrent access: Support 50+ simultaneous BI users

### Security & Compliance
- [ ] Role-based access control for financial data
- [ ] Audit logging for all BI data access
- [ ] Data anonymization for sensitive information
- [ ] SOX compliance for financial reporting

### Data Quality Standards
- [ ] 99.5% data accuracy for revenue metrics
- [ ] Automated data validation and reconciliation
- [ ] Clear data lineage and definitions
- [ ] Regular data quality monitoring and alerting