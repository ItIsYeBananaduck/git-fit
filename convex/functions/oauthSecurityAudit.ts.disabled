import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { api } from "../_generated/api";
// import { Id } from "../_generated/dataModel";

/**
 * OAuth Security Audit System
 * 
 * Comprehensive security monitoring and audit trail for OAuth operations.
 * Implements security best practices including rate limiting, anomaly detection,
 * and comprehensive audit logging.
 */

// Security event types for audit logging
const SECURITY_EVENTS = {
  LOGIN_ATTEMPT: "login_attempt",
  TOKEN_REFRESH: "token_refresh", 
  SUSPICIOUS_ACTIVITY: "suspicious_activity",
  RATE_LIMIT_EXCEEDED: "rate_limit_exceeded",
  INVALID_TOKEN: "invalid_token",
  UNAUTHORIZED_ACCESS: "unauthorized_access",
  PROVIDER_ERROR: "provider_error",
  SECURITY_VIOLATION: "security_violation"
} as const;

// Risk levels for security assessment
const RISK_LEVELS = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4
} as const;

/**
 * Log security event for audit trail
 */
export const logSecurityEvent = mutation({
  args: {
    userId: v.optional(v.id("users")),
    eventType: v.string(),
    riskLevel: v.number(),
    description: v.string(),
    metadata: v.optional(v.object({
      ip: v.optional(v.string()),
      userAgent: v.optional(v.string()),
      provider: v.optional(v.string()),
      endpoint: v.optional(v.string()),
      errorCode: v.optional(v.string()),
      additional: v.optional(v.any())
    }))
  },
  handler: async (ctx, args) => {
    const timestamp = Date.now();
    
    // Store security event in audit log
    const eventId = await ctx.db.insert("securityAuditLog", {
      userId: args.userId,
      eventType: args.eventType,
      riskLevel: args.riskLevel,
      description: args.description,
      metadata: args.metadata || {},
      timestamp,
      resolved: false,
      // Retention period: 2 years for security events
      expiresAt: timestamp + (2 * 365 * 24 * 60 * 60 * 1000)
    });

    // Check for pattern-based threats
    if (args.userId) {
      await checkSecurityPatterns(ctx, args.userId, args.eventType, timestamp);
    }

    // Alert on high-risk events
    if (args.riskLevel >= RISK_LEVELS.HIGH) {
      await triggerSecurityAlert(ctx, eventId, args);
    }

    return eventId;
  }
});

/**
 * Check for suspicious patterns in user activity
 */
async function checkSecurityPatterns(ctx: any, userId: Id<"users">, eventType: string, timestamp: number) {
  const lookbackWindow = 60 * 60 * 1000; // 1 hour
  const recentEvents = await ctx.db
    .query("securityAuditLog")
    .withIndex("by_userId_timestamp", (q: any) => 
      q.eq("userId", userId).gte("timestamp", timestamp - lookbackWindow)
    )
    .collect();

  // Check for rate limiting violations
  const sameTypeEvents = recentEvents.filter((e: any) => e.eventType === eventType);
  if (sameTypeEvents.length > getEventRateLimit(eventType)) {
    await ctx.db.insert("securityAuditLog", {
      userId,
      eventType: SECURITY_EVENTS.RATE_LIMIT_EXCEEDED,
      riskLevel: RISK_LEVELS.MEDIUM,
      description: `Rate limit exceeded for ${eventType}: ${sameTypeEvents.length} events in past hour`,
      metadata: {
        eventType,
        eventCount: sameTypeEvents.length,
        timeWindow: "1h"
      },
      timestamp,
      resolved: false,
      expiresAt: timestamp + (2 * 365 * 24 * 60 * 60 * 1000)
    });
  }

  // Check for anomalous behavior patterns
  await detectAnomalies(ctx, userId, recentEvents, timestamp);
}

/**
 * Get rate limits for different event types
 */
function getEventRateLimit(eventType: string): number {
  const limits = {
    [SECURITY_EVENTS.LOGIN_ATTEMPT]: 10,
    [SECURITY_EVENTS.TOKEN_REFRESH]: 20,
    [SECURITY_EVENTS.INVALID_TOKEN]: 5,
    [SECURITY_EVENTS.UNAUTHORIZED_ACCESS]: 3
  };
  return limits[eventType as keyof typeof limits] || 50;
}

/**
 * Detect anomalous patterns in user behavior
 */
async function detectAnomalies(ctx: any, userId: Id<"users">, recentEvents: any[], timestamp: number) {
  // Check for multiple IP addresses
  const uniqueIPs = new Set(recentEvents.map(e => e.metadata?.ip).filter(Boolean));
  if (uniqueIPs.size > 3) {
    await ctx.db.insert("securityAuditLog", {
      userId,
      eventType: SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
      riskLevel: RISK_LEVELS.HIGH,
      description: `Multiple IP addresses detected: ${uniqueIPs.size} unique IPs in past hour`,
      metadata: {
        uniqueIPs: Array.from(uniqueIPs),
        pattern: "multiple_ips"
      },
      timestamp,
      resolved: false,
      expiresAt: timestamp + (2 * 365 * 24 * 60 * 60 * 1000)
    });
  }

  // Check for unusual timing patterns
  const eventTimes = recentEvents.map(e => e.timestamp).sort();
  const rapidSequence = eventTimes.some((time, i) => {
    if (i === 0) return false;
    return time - eventTimes[i - 1] < 1000; // Events less than 1 second apart
  });

  if (rapidSequence) {
    await ctx.db.insert("securityAuditLog", {
      userId,
      eventType: SECURITY_EVENTS.SUSPICIOUS_ACTIVITY,
      riskLevel: RISK_LEVELS.MEDIUM,
      description: "Rapid sequence of events detected (< 1s intervals)",
      metadata: {
        pattern: "rapid_sequence",
        eventCount: recentEvents.length
      },
      timestamp,
      resolved: false,
      expiresAt: timestamp + (2 * 365 * 24 * 60 * 60 * 1000)
    });
  }
}

/**
 * Trigger security alert for high-risk events
 */
async function triggerSecurityAlert(ctx: any, eventId: Id<"securityAuditLog">, eventData: any) {
  // In production, this would send alerts via email, SMS, or webhook
  console.warn("🚨 SECURITY ALERT:", {
    eventId,
    eventType: eventData.eventType,
    riskLevel: eventData.riskLevel,
    description: eventData.description,
    userId: eventData.userId,
    timestamp: new Date().toISOString()
  });

  // Store alert record
  await ctx.db.insert("securityAlerts", {
    eventId,
    alertLevel: eventData.riskLevel >= RISK_LEVELS.CRITICAL ? "critical" : "high",
    description: eventData.description,
    timestamp: Date.now(),
    acknowledged: false,
    resolvedAt: null
  });
}

/**
 * Get security audit log for a user
 */
export const getUserSecurityLog = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    riskLevelFilter: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("securityAuditLog")
      .withIndex("by_userId_timestamp", (q: any) => q.eq("userId", args.userId));

    if (args.riskLevelFilter) {
      query = query.filter((q: any) => q.gte(q.field("riskLevel"), args.riskLevelFilter));
    }

    return await query
      .order("desc")
      .take(args.limit || 100);
  }
});

/**
 * Get system-wide security metrics
 */
export const getSecurityMetrics = query({
  args: {
    timeRange: v.optional(v.string()) // "1h", "24h", "7d", "30d"
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
    const startTime = now - timeWindows[timeRange as keyof typeof timeWindows];

    const events = await ctx.db
      .query("securityAuditLog")
      .withIndex("by_timestamp", (q: any) => q.gte("timestamp", startTime))
      .collect();

    // Calculate metrics
    const metrics = {
      totalEvents: events.length,
      riskDistribution: {
        low: events.filter(e => e.riskLevel === RISK_LEVELS.LOW).length,
        medium: events.filter(e => e.riskLevel === RISK_LEVELS.MEDIUM).length,
        high: events.filter(e => e.riskLevel === RISK_LEVELS.HIGH).length,
        critical: events.filter(e => e.riskLevel === RISK_LEVELS.CRITICAL).length
      },
      eventTypes: events.reduce((acc: Record<string, number>, event) => {
        acc[event.eventType] = (acc[event.eventType] || 0) + 1;
        return acc;
      }, {}),
      uniqueUsers: new Set(events.map(e => e.userId).filter(Boolean)).size,
      timeRange,
      generatedAt: now
    };

    return metrics;
  }
});

/**
 * Perform OAuth token security validation
 */
export const validateTokenSecurity = mutation({
  args: {
    userId: v.id("users"),
    provider: v.string(),
    tokenData: v.object({
      accessToken: v.string(),
      refreshToken: v.optional(v.string()),
      expiresAt: v.number()
    })
  },
  handler: async (ctx, args) => {
    const securityChecks = [];
    let overallRisk = RISK_LEVELS.LOW;

    // Check token expiration
    const now = Date.now();
    const timeToExpiry = args.tokenData.expiresAt - now;
    
    if (timeToExpiry < 5 * 60 * 1000) { // Less than 5 minutes
      securityChecks.push({
        check: "token_expiry",
        status: "warning",
        message: "Token expires in less than 5 minutes"
      });
      overallRisk = Math.max(overallRisk, RISK_LEVELS.MEDIUM);
    }

    // Check token format and length
    if (args.tokenData.accessToken.length < 20) {
      securityChecks.push({
        check: "token_length",
        status: "critical",
        message: "Access token is suspiciously short"
      });
      overallRisk = RISK_LEVELS.CRITICAL;
    }

    // Check for token reuse patterns
    const recentTokens = await ctx.db
      .query("oauthTokens")
      .withIndex("by_userId_provider", (q: any) => 
        q.eq("userId", args.userId).eq("provider", args.provider)
      )
      .order("desc")
      .take(5);

    const duplicateTokens = recentTokens.filter(t => t.accessToken === args.tokenData.accessToken);
    if (duplicateTokens.length > 1) {
      securityChecks.push({
        check: "token_reuse",
        status: "high",
        message: "Token appears to be reused"
      });
      overallRisk = Math.max(overallRisk, RISK_LEVELS.HIGH);
    }

    // Log security validation
    await ctx.db.insert("securityAuditLog", {
      userId: args.userId,
      eventType: "token_validation",
      riskLevel: overallRisk,
      description: `Token security validation for ${args.provider}`,
      metadata: {
        provider: args.provider,
        checksPerformed: securityChecks.length,
        overallRisk,
        checks: securityChecks
      },
      timestamp: now,
      resolved: true,
      expiresAt: now + (2 * 365 * 24 * 60 * 60 * 1000)
    });

    return {
      isValid: overallRisk < RISK_LEVELS.CRITICAL,
      riskLevel: overallRisk,
      securityChecks,
      recommendation: overallRisk >= RISK_LEVELS.HIGH ? 
        "Recommend immediate token refresh" : 
        "Token passes security validation"
    };
  }
});

/**
 * Generate security report
 */
export const generateSecurityReport = query({
  args: {
    reportType: v.string(), // "daily", "weekly", "monthly"
    includeDetails: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const reportPeriods = {
      "daily": 24 * 60 * 60 * 1000,
      "weekly": 7 * 24 * 60 * 60 * 1000,
      "monthly": 30 * 24 * 60 * 60 * 1000
    };
    
    const period = reportPeriods[args.reportType as keyof typeof reportPeriods];
    const startTime = now - period;

    const events = await ctx.db
      .query("securityAuditLog")
      .withIndex("by_timestamp", (q: any) => q.gte("timestamp", startTime))
      .collect();

    const alerts = await ctx.db
      .query("securityAlerts")
      .withIndex("by_timestamp", (q: any) => q.gte("timestamp", startTime))
      .collect();

    const report = {
      period: args.reportType,
      generatedAt: now,
      summary: {
        totalEvents: events.length,
        totalAlerts: alerts.length,
        criticalEvents: events.filter(e => e.riskLevel === RISK_LEVELS.CRITICAL).length,
        highRiskEvents: events.filter(e => e.riskLevel === RISK_LEVELS.HIGH).length,
        unresolvedAlerts: alerts.filter(a => !a.acknowledged).length
      },
      topRisks: events
        .filter(e => e.riskLevel >= RISK_LEVELS.HIGH)
        .slice(0, 10)
        .map(e => ({
          eventType: e.eventType,
          riskLevel: e.riskLevel,
          description: e.description,
          timestamp: e.timestamp
        })),
      recommendations: generateSecurityRecommendations(events, alerts)
    };

    if (args.includeDetails) {
      report.details = {
        eventBreakdown: events.reduce((acc: Record<string, number>, event) => {
          acc[event.eventType] = (acc[event.eventType] || 0) + 1;
          return acc;
        }, {}),
        riskTrends: calculateRiskTrends(events),
        userRisks: calculateUserRiskProfiles(events)
      };
    }

    return report;
  }
});

/**
 * Generate security recommendations based on audit data
 */
function generateSecurityRecommendations(events: any[], alerts: any[]) {
  const recommendations = [];
  const criticalEvents = events.filter(e => e.riskLevel === RISK_LEVELS.CRITICAL);
  const highRiskEvents = events.filter(e => e.riskLevel === RISK_LEVELS.HIGH);

  if (criticalEvents.length > 0) {
    recommendations.push({
      priority: "critical",
      message: `${criticalEvents.length} critical security events require immediate attention`,
      action: "Review and resolve critical security violations"
    });
  }

  if (highRiskEvents.length > 5) {
    recommendations.push({
      priority: "high",
      message: "High number of high-risk events detected",
      action: "Consider implementing additional security controls"
    });
  }

  const unresolvedAlerts = alerts.filter(a => !a.acknowledged);
  if (unresolvedAlerts.length > 0) {
    recommendations.push({
      priority: "medium",
      message: `${unresolvedAlerts.length} security alerts need acknowledgment`,
      action: "Review and acknowledge pending security alerts"
    });
  }

  return recommendations;
}

/**
 * Calculate risk trends over time
 */
function calculateRiskTrends(events: any[]) {
  const now = Date.now();
  const hourlyBuckets: Record<number, any> = {};
  
  events.forEach(event => {
    const hourBucket = Math.floor(event.timestamp / (60 * 60 * 1000));
    if (!hourlyBuckets[hourBucket]) {
      hourlyBuckets[hourBucket] = { low: 0, medium: 0, high: 0, critical: 0 };
    }
    
    const riskLevel = event.riskLevel;
    if (riskLevel === RISK_LEVELS.LOW) hourlyBuckets[hourBucket].low++;
    else if (riskLevel === RISK_LEVELS.MEDIUM) hourlyBuckets[hourBucket].medium++;
    else if (riskLevel === RISK_LEVELS.HIGH) hourlyBuckets[hourBucket].high++;
    else if (riskLevel === RISK_LEVELS.CRITICAL) hourlyBuckets[hourBucket].critical++;
  });

  return Object.entries(hourlyBuckets).map(([hour, counts]) => ({
    timestamp: parseInt(hour) * 60 * 60 * 1000,
    ...counts
  }));
}

/**
 * Calculate user risk profiles
 */
function calculateUserRiskProfiles(events: any[]) {
  const userRisks: Record<string, any> = {};
  
  events.forEach(event => {
    if (event.userId) {
      const userId = event.userId;
      if (!userRisks[userId]) {
        userRisks[userId] = { totalEvents: 0, riskScore: 0, highestRisk: 0 };
      }
      
      userRisks[userId].totalEvents++;
      userRisks[userId].riskScore += event.riskLevel;
      userRisks[userId].highestRisk = Math.max(userRisks[userId].highestRisk, event.riskLevel);
    }
  });

  return Object.entries(userRisks)
    .map(([userId, risk]) => ({
      userId,
      ...risk,
      averageRisk: risk.riskScore / risk.totalEvents
    }))
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 20); // Top 20 highest risk users
}