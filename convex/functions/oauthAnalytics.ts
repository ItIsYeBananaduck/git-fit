import { v } from "convex/values";
import { mutation, query } from "../_generated/server.js";
import { api } from "../_generated/api.js";
// import { Id } from "../_generated/dataModel";

/**
 * OAuth Analytics & Provider Performance Tracking
 * 
 * Comprehensive analytics system for monitoring OAuth usage, provider performance,
 * and user engagement across all connected music platforms.
 */

// Analytics event types
const ANALYTICS_EVENTS = {
  CONNECTION: "connection",
  DISCONNECTION: "disconnection", 
  TOKEN_REFRESH: "token_refresh",
  API_CALL: "api_call",
  SYNC: "sync",
  ERROR: "error",
  USER_ACTION: "user_action"
} as const;

// Performance metrics
const PERFORMANCE_METRICS = {
  RESPONSE_TIME: "response_time",
  SUCCESS_RATE: "success_rate",
  ERROR_RATE: "error_rate",
  THROUGHPUT: "throughput",
  AVAILABILITY: "availability"
} as const;

/**
 * Track OAuth analytics event
 */
export const trackOAuthEvent = mutation({
  args: {
    userId: v.optional(v.id("users")),
    providerId: v.string(),
    eventType: v.string(),
    action: v.string(),
    success: v.boolean(),
    duration: v.optional(v.number()),
    errorCode: v.optional(v.string()),
    errorMessage: v.optional(v.string()),
    metadata: v.optional(v.object({}))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const date = new Date(now);
    
    // Create analytics record
    const analyticsId = await ctx.db.insert("oauthAnalytics", {
      userId: args.userId,
      providerId: args.providerId,
      eventType: args.eventType,
      action: args.action,
      metadata: {
        platform: args.metadata?.platform,
        userAgent: args.metadata?.userAgent,
        ipAddress: args.metadata?.ipAddress,
        duration: args.duration,
        success: args.success,
        errorCode: args.errorCode,
        errorMessage: args.errorMessage,
        dataSize: args.metadata?.dataSize,
        responseTime: args.metadata?.responseTime
      },
      dimensions: {
        hour: date.getHours(),
        dayOfWeek: date.getDay(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
      },
      metrics: {
        count: 1,
        duration: args.duration,
        bytes: args.metadata?.dataSize,
        errorRate: args.success ? 0 : 1
      },
      timestamp: now
    });

    // Update provider performance metrics
    await updateProviderPerformance(ctx, args.providerId, args.success, args.duration, args.errorCode);

    return analyticsId;
  }
});

/**
 * Update real-time provider performance metrics
 */
async function updateProviderPerformance(
  ctx: any,
  providerId: string,
  success: boolean,
  duration?: number,
  errorCode?: string
) {
  const now = Date.now();
  const oneHour = 60 * 60 * 1000;
  const windowStart = now - oneHour;
  
  // Get existing 1h performance record or create new one
  let perfRecord = await ctx.db
    .query("providerPerformance")
    .withIndex("by_provider_window", (q: any) => 
      q.eq("providerId", providerId).eq("timeWindow", "1h")
    )
    .filter((q: any) => q.gte(q.field("windowStart"), windowStart))
    .first();

  if (!perfRecord) {
    // Create new performance window
    perfRecord = await ctx.db.insert("providerPerformance", {
      providerId,
      timeWindow: "1h",
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        errorRate: 0,
        uptime: 1.0,
        throughput: 0
      },
      errors: {
        authentication: 0,
        rateLimit: 0,
        serverError: 0,
        network: 0,
        timeout: 0,
        other: 0
      },
      health: {
        status: "healthy",
        lastIncident: undefined,
        mttr: undefined,
        availability: 1.0
      },
      timestamp: now,
      windowStart,
      windowEnd: now + oneHour
    });
  }

  // Update metrics
  const updatedMetrics = {
    ...perfRecord.metrics,
    totalRequests: perfRecord.metrics.totalRequests + 1
  };

  if (success) {
    updatedMetrics.successfulRequests = perfRecord.metrics.successfulRequests + 1;
  } else {
    updatedMetrics.failedRequests = perfRecord.metrics.failedRequests + 1;
  }

  // Update response time if provided
  if (duration) {
    const currentAvg = perfRecord.metrics.averageResponseTime;
    const totalRequests = updatedMetrics.totalRequests;
    updatedMetrics.averageResponseTime = 
      (currentAvg * (totalRequests - 1) + duration) / totalRequests;
  }

  // Update error rates
  updatedMetrics.errorRate = updatedMetrics.failedRequests / updatedMetrics.totalRequests;

  // Update error categories
  const updatedErrors = { ...perfRecord.errors };
  if (!success && errorCode) {
    if (errorCode.includes("401") || errorCode.includes("403")) {
      updatedErrors.authentication += 1;
    } else if (errorCode.includes("429")) {
      updatedErrors.rateLimit += 1;
    } else if (errorCode.includes("5")) {
      updatedErrors.serverError += 1;
    } else if (errorCode.includes("timeout")) {
      updatedErrors.timeout += 1;
    } else if (errorCode.includes("network")) {
      updatedErrors.network += 1;
    } else {
      updatedErrors.other += 1;
    }
  }

  // Update health status
  const updatedHealth = { ...perfRecord.health };
  if (updatedMetrics.errorRate > 0.1) {
    updatedHealth.status = "degraded";
  } else if (updatedMetrics.errorRate > 0.25) {
    updatedHealth.status = "down";
    updatedHealth.lastIncident = now;
  } else {
    updatedHealth.status = "healthy";
  }

  updatedHealth.availability = updatedMetrics.successfulRequests / updatedMetrics.totalRequests;

  // Update performance record
  await ctx.db.patch(perfRecord._id, {
    metrics: updatedMetrics,
    errors: updatedErrors,
    health: updatedHealth,
    timestamp: now
  });
}

/**
 * Generate analytics dashboard data
 */
export const getAnalyticsDashboard = query({
  args: {
    timeRange: v.optional(v.string()), // '1h' | '24h' | '7d' | '30d'
    providerId: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "24h";
    const now = Date.now();
    const timeWindows = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000
    };
    const windowStart = now - timeWindows[timeRange as keyof typeof timeWindows];

    // Base query for analytics
    let analyticsQuery = ctx.db
      .query("oauthAnalytics")
      .withIndex("by_timestamp", (q: any) => q.gte("timestamp", windowStart));

    if (args.providerId) {
      analyticsQuery = analyticsQuery.filter((q: any) => q.eq(q.field("providerId"), args.providerId));
    }

    const analyticsData = await analyticsQuery.collect();

    // Calculate overview metrics
    const totalEvents = analyticsData.length;
    const successfulEvents = analyticsData.filter(e => e.metadata.success).length;
    const failedEvents = totalEvents - successfulEvents;
    const errorRate = totalEvents > 0 ? failedEvents / totalEvents : 0;

    // Provider breakdown
    const providerStats = analyticsData.reduce((acc: Record<string, any>, event) => {
      if (!acc[event.providerId]) {
        acc[event.providerId] = {
          providerId: event.providerId,
          totalEvents: 0,
          successfulEvents: 0,
          failedEvents: 0,
          averageResponseTime: 0,
          lastActive: 0
        };
      }
      
      acc[event.providerId].totalEvents += 1;
      if (event.metadata.success) {
        acc[event.providerId].successfulEvents += 1;
      } else {
        acc[event.providerId].failedEvents += 1;
      }
      
      if (event.metadata.responseTime) {
        const current = acc[event.providerId].averageResponseTime;
        const total = acc[event.providerId].totalEvents;
        acc[event.providerId].averageResponseTime = 
          (current * (total - 1) + event.metadata.responseTime) / total;
      }
      
      acc[event.providerId].lastActive = Math.max(acc[event.providerId].lastActive, event.timestamp);
      
      return acc;
    }, {});

    // Event type breakdown
    const eventTypeStats = analyticsData.reduce((acc: Record<string, number>, event) => {
      acc[event.eventType] = (acc[event.eventType] || 0) + 1;
      return acc;
    }, {});

    // Time series data for charts
    const timeSeriesData = generateTimeSeriesData(analyticsData, timeRange);

    // Error analysis
    const errorBreakdown = analyticsData
      .filter(e => !e.metadata.success)
      .reduce((acc: Record<string, number>, event) => {
        const errorCode = event.metadata.errorCode || "unknown";
        acc[errorCode] = (acc[errorCode] || 0) + 1;
        return acc;
      }, {});

    return {
      overview: {
        totalEvents,
        successfulEvents,
        failedEvents,
        errorRate,
        timeRange,
        generatedAt: now
      },
      providerStats: Object.values(providerStats),
      eventTypeStats,
      timeSeriesData,
      errorBreakdown,
      topErrors: Object.entries(errorBreakdown)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 5)
    };
  }
});

/**
 * Get provider performance metrics
 */
export const getProviderPerformance = query({
  args: {
    providerId: v.optional(v.string()),
    timeWindow: v.optional(v.string()) // '1h' | '24h' | '7d' | '30d'
  },
  handler: async (ctx, args) => {
    const timeWindow = args.timeWindow || "24h";
    
    let query = ctx.db
      .query("providerPerformance")
      .withIndex("by_provider_window", (q: any) => q.eq("timeWindow", timeWindow));

    if (args.providerId) {
      query = query.filter((q: any) => q.eq(q.field("providerId"), args.providerId));
    }

    const performanceData = await query
      .order("desc")
      .take(50);

    return performanceData.map(perf => ({
      ...perf,
      healthScore: calculateHealthScore(perf),
      trend: calculatePerformanceTrend(perf)
    }));
  }
});

/**
 * Get user engagement analytics
 */
export const getUserEngagementAnalytics = query({
  args: {
    timeRange: v.optional(v.string()),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const timeRange = args.timeRange || "7d";
    const now = Date.now();
    const timeWindows = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000
    };
    const windowStart = now - timeWindows[timeRange as keyof typeof timeWindows];

    // Get user engagement data
    let query = ctx.db
      .query("oauthAnalytics")
      .withIndex("by_timestamp", (q: any) => q.gte("timestamp", windowStart));

    if (args.userId) {
      query = query.filter((q: any) => q.eq(q.field("userId"), args.userId));
    }

    const engagementData = await query.collect();

    // Calculate engagement metrics
    const uniqueUsers = new Set(engagementData.map(e => e.userId).filter(Boolean)).size;
    const totalSessions = engagementData.filter(e => e.eventType === ANALYTICS_EVENTS.CONNECTION).length;
    const avgSessionsPerUser = uniqueUsers > 0 ? totalSessions / uniqueUsers : 0;

    // Platform distribution
    const platformDistribution = engagementData.reduce((acc: Record<string, number>, event) => {
      const platform = event.metadata.platform || "unknown";
      acc[platform] = (acc[platform] || 0) + 1;
      return acc;
    }, {});

    // Peak usage times
    const hourlyDistribution = engagementData.reduce((acc: Record<number, number>, event) => {
      const hour = event.dimensions.hour;
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});

    const peakHours = Object.entries(hourlyDistribution)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }));

    return {
      summary: {
        uniqueUsers,
        totalSessions,
        avgSessionsPerUser,
        timeRange
      },
      platformDistribution,
      peakHours,
      engagementTrends: generateEngagementTrends(engagementData, timeRange)
    };
  }
});

/**
 * Generate custom analytics report
 */
export const generateAnalyticsReport = mutation({
  args: {
    reportType: v.string(), // 'performance' | 'usage' | 'errors' | 'custom'
    timeRange: v.string(),
    filters: v.optional(v.object({
      providerId: v.optional(v.string()),
      userId: v.optional(v.string()),
      eventType: v.optional(v.string()),
      platform: v.optional(v.string())
    })),
    metrics: v.optional(v.array(v.string()))
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const timeWindows = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000
    };
    const windowStart = now - timeWindows[args.timeRange as keyof typeof timeWindows];

    // Build filtered query
    let query = ctx.db
      .query("oauthAnalytics")
      .withIndex("by_timestamp", (q: any) => q.gte("timestamp", windowStart));

    if (args.filters?.providerId) {
      query = query.filter((q: any) => q.eq(q.field("providerId"), args.filters.providerId));
    }
    if (args.filters?.userId) {
      query = query.filter((q: any) => q.eq(q.field("userId"), args.filters.userId));
    }
    if (args.filters?.eventType) {
      query = query.filter((q: any) => q.eq(q.field("eventType"), args.filters.eventType));
    }

    const analyticsData = await query.collect();

    // Generate report based on type
    let reportData: any = {};
    
    switch (args.reportType) {
      case "performance":
        reportData = generatePerformanceReport(analyticsData);
        break;
      case "usage":
        reportData = generateUsageReport(analyticsData);
        break;
      case "errors":
        reportData = generateErrorReport(analyticsData);
        break;
      case "custom":
        reportData = generateCustomReport(analyticsData, args.metrics || []);
        break;
    }

    return {
      reportId: `report_${now}`,
      type: args.reportType,
      timeRange: args.timeRange,
      filters: args.filters,
      generatedAt: now,
      dataPoints: analyticsData.length,
      ...reportData
    };
  }
});

// Helper functions for analytics processing

function generateTimeSeriesData(analyticsData: any[], timeRange: string) {
  const bucketSize = timeRange === "1h" ? 5 * 60 * 1000 : // 5 minutes
                     timeRange === "24h" ? 60 * 60 * 1000 : // 1 hour
                     timeRange === "7d" ? 24 * 60 * 60 * 1000 : // 1 day
                     24 * 60 * 60 * 1000; // 1 day for 30d

  const buckets: Record<number, { timestamp: number, count: number, errors: number }> = {};

  analyticsData.forEach(event => {
    const bucketTime = Math.floor(event.timestamp / bucketSize) * bucketSize;
    if (!buckets[bucketTime]) {
      buckets[bucketTime] = { timestamp: bucketTime, count: 0, errors: 0 };
    }
    buckets[bucketTime].count += 1;
    if (!event.metadata.success) {
      buckets[bucketTime].errors += 1;
    }
  });

  return Object.values(buckets).sort((a, b) => a.timestamp - b.timestamp);
}

function generateEngagementTrends(engagementData: any[], timeRange: string) {
  // Group by day for trends
  const dailyEngagement: Record<string, number> = {};
  
  engagementData.forEach(event => {
    const date = new Date(event.timestamp).toISOString().split('T')[0];
    dailyEngagement[date] = (dailyEngagement[date] || 0) + 1;
  });

  return Object.entries(dailyEngagement)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function calculateHealthScore(perf: any): number {
  const { metrics, health } = perf;
  
  // Weighted health score based on multiple factors
  const availabilityScore = health.availability * 0.4;
  const errorRateScore = (1 - metrics.errorRate) * 0.3;
  const responseTimeScore = Math.max(0, 1 - (metrics.averageResponseTime / 5000)) * 0.3; // 5s baseline
  
  return Math.round((availabilityScore + errorRateScore + responseTimeScore) * 100);
}

function calculatePerformanceTrend(perf: any): string {
  // Simple trend calculation - would be more sophisticated in production
  const healthScore = calculateHealthScore(perf);
  
  if (healthScore >= 90) return "improving";
  if (healthScore >= 70) return "stable";
  return "declining";
}

function generatePerformanceReport(analyticsData: any[]) {
  const totalRequests = analyticsData.length;
  const successfulRequests = analyticsData.filter(e => e.metadata.success).length;
  const avgResponseTime = analyticsData
    .filter(e => e.metadata.responseTime)
    .reduce((sum, e) => sum + e.metadata.responseTime, 0) / totalRequests || 0;

  return {
    summary: {
      totalRequests,
      successfulRequests,
      successRate: successfulRequests / totalRequests,
      avgResponseTime
    },
    recommendations: generatePerformanceRecommendations(analyticsData)
  };
}

function generateUsageReport(analyticsData: any[]) {
  const uniqueUsers = new Set(analyticsData.map(e => e.userId).filter(Boolean)).size;
  const providerUsage = analyticsData.reduce((acc: Record<string, number>, event) => {
    acc[event.providerId] = (acc[event.providerId] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalEvents: analyticsData.length,
      uniqueUsers,
      avgEventsPerUser: analyticsData.length / uniqueUsers || 0
    },
    providerUsage,
    recommendations: generateUsageRecommendations(analyticsData)
  };
}

function generateErrorReport(analyticsData: any[]) {
  const errors = analyticsData.filter(e => !e.metadata.success);
  const errorTypes = errors.reduce((acc: Record<string, number>, event) => {
    const errorCode = event.metadata.errorCode || "unknown";
    acc[errorCode] = (acc[errorCode] || 0) + 1;
    return acc;
  }, {});

  return {
    summary: {
      totalErrors: errors.length,
      errorRate: errors.length / analyticsData.length,
      uniqueErrorTypes: Object.keys(errorTypes).length
    },
    errorTypes,
    recommendations: generateErrorRecommendations(errors)
  };
}

function generateCustomReport(analyticsData: any[], metrics: string[]) {
  const customMetrics: Record<string, any> = {};
  
  metrics.forEach(metric => {
    switch (metric) {
      case "response_time_percentiles":
        const responseTimes = analyticsData
          .map(e => e.metadata.responseTime)
          .filter(Boolean)
          .sort((a, b) => a - b);
        
        if (responseTimes.length > 0) {
          customMetrics[metric] = {
            p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
            p90: responseTimes[Math.floor(responseTimes.length * 0.9)],
            p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
            p99: responseTimes[Math.floor(responseTimes.length * 0.99)]
          };
        }
        break;
      
      case "geographic_distribution":
        // Would use IP geolocation in production
        customMetrics[metric] = { "US": 0.7, "EU": 0.2, "Other": 0.1 };
        break;
      
      default:
        customMetrics[metric] = "Not implemented";
    }
  });

  return { customMetrics };
}

function generatePerformanceRecommendations(analyticsData: any[]): string[] {
  const recommendations = [];
  const avgResponseTime = analyticsData
    .filter(e => e.metadata.responseTime)
    .reduce((sum, e) => sum + e.metadata.responseTime, 0) / analyticsData.length;

  if (avgResponseTime > 2000) {
    recommendations.push("Consider implementing request caching to improve response times");
  }

  const errorRate = analyticsData.filter(e => !e.metadata.success).length / analyticsData.length;
  if (errorRate > 0.05) {
    recommendations.push("High error rate detected - review error handling and retry logic");
  }

  return recommendations;
}

function generateUsageRecommendations(analyticsData: any[]): string[] {
  const recommendations = [];
  const uniqueUsers = new Set(analyticsData.map(e => e.userId).filter(Boolean)).size;
  const avgEventsPerUser = analyticsData.length / uniqueUsers || 0;

  if (avgEventsPerUser < 5) {
    recommendations.push("Low user engagement - consider improving onboarding experience");
  }

  return recommendations;
}

function generateErrorRecommendations(errors: any[]): string[] {
  const recommendations = [];
  const authErrors = errors.filter(e => 
    e.metadata.errorCode?.includes("401") || e.metadata.errorCode?.includes("403")
  ).length;

  if (authErrors > errors.length * 0.3) {
    recommendations.push("High authentication error rate - review token refresh logic");
  }

  return recommendations;
}