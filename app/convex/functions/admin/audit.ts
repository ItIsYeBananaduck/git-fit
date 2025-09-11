// Admin Audit Logging Convex Functions

import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";

// Mutation to log admin action
export const logAdminAction = mutation({
  args: {
    adminId: v.id("adminUsers"),
    action: v.string(),
    resource: v.string(),
    resourceId: v.optional(v.string()),
    details: v.any(),
    ipAddress: v.string(),
    userAgent: v.string(),
    timestamp: v.string(),
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    category: v.union(
      v.literal("authentication"),
      v.literal("user_management"),
      v.literal("content_moderation"),
      v.literal("financial"),
      v.literal("system_config"),
      v.literal("data_access")
    ),
    outcome: v.union(v.literal("success"), v.literal("failure"), v.literal("partial")),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auditLogId = await ctx.db.insert("auditLogs", {
      adminId: args.adminId,
      action: args.action,
      resource: args.resource,
      resourceId: args.resourceId,
      details: args.details,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      timestamp: args.timestamp,
      severity: args.severity,
      category: args.category,
      outcome: args.outcome,
      errorMessage: args.errorMessage,
    });

    return auditLogId;
  },
});

// Mutation to log failed login attempt
export const logFailedLogin = mutation({
  args: {
    email: v.string(),
    reason: v.string(),
    ipAddress: v.string(),
    timestamp: v.string(),
  },
  handler: async (ctx, args) => {
    // Create a special audit log entry for failed login attempts
    // We use a system admin ID or create a special entry type
    const auditLogId = await ctx.db.insert("auditLogs", {
      adminId: "system" as any, // Special system identifier
      action: "failed_login_attempt",
      resource: "authentication",
      resourceId: args.email,
      details: {
        email: args.email,
        reason: args.reason,
      },
      ipAddress: args.ipAddress,
      userAgent: "unknown",
      timestamp: args.timestamp,
      severity: "medium",
      category: "authentication",
      outcome: "failure",
      errorMessage: args.reason,
    });

    return auditLogId;
  },
});

// Query to get admin audit log
export const getAdminAuditLog = query({
  args: {
    adminId: v.optional(v.id("adminUsers")),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    action: v.optional(v.string()),
    resource: v.optional(v.string()),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    category: v.optional(v.union(
      v.literal("authentication"),
      v.literal("user_management"),
      v.literal("content_moderation"),
      v.literal("financial"),
      v.literal("system_config"),
      v.literal("data_access")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    // Use QueryInitializer separately so types remain correct when calling withIndex
    let qInit: any = ctx.db.query("auditLogs");
    let primaryUsed = false;

    // Apply filters using indices when possible; use locals to avoid referencing args inside callback
    if (args.adminId) {
      const adminId = args.adminId;
      qInit = qInit.withIndex("by_admin", (q: any) => q.eq("adminId", adminId));
      primaryUsed = true;
    }

    const q = qInit.order("desc");
    let results = await q.collect();

    // Apply additional filters
    const startTime = args.startTime;
    const endTime = args.endTime;
    if (startTime || endTime) {
      results = results.filter((log: Record<string, unknown>) => {
        const logTs = (log as any).timestamp;
        const logTime = new Date(logTs);
        if (startTime && logTime < new Date(startTime)) return false;
        if (endTime && logTime > new Date(endTime)) return false;
        return true;
      });
    }

    if (args.action) {
      results = results.filter((log: Record<string, unknown>) => (log as any).action === args.action);
    }

    if (args.resource) {
      results = results.filter((log: any) => log.resource === args.resource);
    }

    if (args.severity) {
      results = results.filter((log: any) => log.severity === args.severity);
    }

    if (args.category) {
      results = results.filter((log: any) => log.category === args.category);
    }

    // Apply pagination
    const offset = args.offset || 0;
    return results.slice(offset, offset + limit);
  },
});

// Query to get audit log by action
export const getAuditLogByAction = query({
  args: {
    action: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const actionVal = args.action;
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_action", (q) => q.eq("action", actionVal))
      .order("desc")
      .take(limit);

    return logs;
  },
});

// Query to get audit log by resource
export const getAuditLogByResource = query({
  args: {
    resource: v.string(),
    resourceId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const resourceVal = args.resource;
    let logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_resource", (q) => q.eq("resource", resourceVal))
      .order("desc")
      .take(limit);

    if (args.resourceId) {
      logs = logs.filter(log => log.resourceId === args.resourceId);
    }

    return logs;
  },
});

// Query to get audit log by severity
export const getAuditLogBySeverity = query({
  args: {
    severity: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const severityVal = args.severity;
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_severity", (q) => q.eq("severity", severityVal))
      .order("desc")
      .take(limit);

    return logs;
  },
});

// Query to get audit log by category
export const getAuditLogByCategory = query({
  args: {
    category: v.union(
      v.literal("authentication"),
      v.literal("user_management"),
      v.literal("content_moderation"),
      v.literal("financial"),
      v.literal("system_config"),
      v.literal("data_access")
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const categoryVal = args.category;
    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_category", (q) => q.eq("category", categoryVal))
      .order("desc")
      .take(limit);

    return logs;
  },
});

// Query to get audit log by timestamp range
export const getAuditLogByTimeRange = query({
  args: {
    startTime: v.string(),
    endTime: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_timestamp")
      .order("desc")
      .collect();

    // Filter by time range
    const filteredLogs = logs.filter(log => {
      const logTime = new Date(log.timestamp);
      return logTime >= new Date(args.startTime) && logTime <= new Date(args.endTime);
    });

    return filteredLogs.slice(0, limit);
  },
});

// Query to get audit statistics
export const getAuditStatistics = query({
  args: {
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let logs = await ctx.db.query("auditLogs").collect();

    // Filter by time range if provided
    if (args.startTime || args.endTime) {
      logs = logs.filter(log => {
        const logTime = new Date(log.timestamp);
        if (args.startTime && logTime < new Date(args.startTime)) return false;
        if (args.endTime && logTime > new Date(args.endTime)) return false;
        return true;
      });
    }

    // Calculate statistics
    const totalActions = logs.length;
    const actionsByCategory = logs.reduce((acc, log) => {
      acc[log.category] = (acc[log.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actionsBySeverity = logs.reduce((acc, log) => {
      acc[log.severity] = (acc[log.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const actionsByOutcome = logs.reduce((acc, log) => {
      acc[log.outcome] = (acc[log.outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const uniqueAdmins = new Set(logs.map(log => log.adminId)).size;

    return {
      totalActions,
      actionsByCategory,
      actionsBySeverity,
      actionsByOutcome,
      uniqueAdmins,
      timeRange: {
        start: args.startTime,
        end: args.endTime,
      },
    };
  },
});

// Query to get recent critical actions
export const getRecentCriticalActions = query({
  args: {
    hours: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hours = args.hours || 24;
    const limit = args.limit || 20;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_severity", (q) => q.eq("severity", "critical"))
      .order("desc")
      .collect();

    // Filter by time and limit
    const recentLogs = logs
      .filter(log => new Date(log.timestamp) >= cutoffTime)
      .slice(0, limit);

    return recentLogs;
  },
});

// Query to get audit logs with advanced search
export const searchAuditLogsAdvanced = query({
  args: {
    adminId: v.optional(v.id("adminUsers")),
    action: v.optional(v.string()),
    resource: v.optional(v.string()),
    resourceId: v.optional(v.string()),
    severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("critical"))),
    category: v.optional(v.union(
      v.literal("authentication"),
      v.literal("user_management"),
      v.literal("content_moderation"),
      v.literal("financial"),
      v.literal("system_config"),
      v.literal("data_access")
    )),
    outcome: v.optional(v.union(v.literal("success"), v.literal("failure"), v.literal("partial"))),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    const offset = args.offset || 0;

    // Cast to any to avoid narrow typing issues between Query and QueryInitializer
    let qInit: any = ctx.db.query("auditLogs");
    let primaryUsed = false;

    // Apply primary index filters (pick only one index to leverage)
    const adminId = args.adminId;
    const severity = args.severity;
    const category = args.category;
    const action = args.action;
    const resource = args.resource;

    if (adminId) {
      qInit = qInit.withIndex("by_admin", (q: any) => q.eq("adminId", adminId));
      primaryUsed = true;
    } else if (severity) {
      qInit = qInit.withIndex("by_severity", (q: any) => q.eq("severity", severity));
      primaryUsed = true;
    } else if (category) {
      qInit = qInit.withIndex("by_category", (q: any) => q.eq("category", category));
      primaryUsed = true;
    } else if (action) {
      qInit = qInit.withIndex("by_action", (q: any) => q.eq("action", action));
      primaryUsed = true;
    } else if (resource) {
      qInit = qInit.withIndex("by_resource", (q: any) => q.eq("resource", resource));
      primaryUsed = true;
    }

    const q = qInit.order("desc");
    let results = await q.collect();

    // Apply additional filters
    const startTime = args.startTime;
    const endTime = args.endTime;
    if (startTime || endTime) {
      results = results.filter((log: Record<string, unknown>) => {
        const logTs = (log as any).timestamp;
        const logTime = new Date(logTs);
        if (startTime && logTime < new Date(startTime)) return false;
        if (endTime && logTime > new Date(endTime)) return false;
        return true;
      });
    }

    if (args.resourceId) {
      results = results.filter((log: any) => log.resourceId === args.resourceId);
    }

    if (args.outcome) {
      results = results.filter((log: any) => log.outcome === args.outcome);
    }

    if (args.ipAddress) {
      results = results.filter((log: any) => log.ipAddress === args.ipAddress);
    }

    // Apply additional filters that weren't used as primary index
    if (!primaryUsed && args.adminId !== undefined) {
      results = results.filter((log: any) => log.adminId === args.adminId);
    }

    if (!primaryUsed && args.severity !== undefined) {
      results = results.filter((log: any) => log.severity === args.severity);
    }

    if (!primaryUsed && args.category !== undefined) {
      results = results.filter((log: any) => log.category === args.category);
    }

    if (!primaryUsed && args.action !== undefined) {
      results = results.filter((log: any) => log.action === args.action);
    }

    if (!primaryUsed && args.resource !== undefined) {
      results = results.filter((log: any) => log.resource === args.resource);
    }

    // Apply pagination
    return results.slice(offset, offset + limit);
  },
});

// Query to get failed login attempts by IP
export const getFailedLoginsByIP = query({
  args: {
    ipAddress: v.string(),
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hours = args.hours || 24;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_category", (q) => q.eq("category", "authentication"))
      .filter((q) => q.eq(q.field("outcome"), "failure"))
      .collect();

    return logs.filter(log =>
      log.ipAddress === args.ipAddress &&
      new Date(log.timestamp) >= cutoffTime
    );
  },
});

// Query to get admin activity timeline
export const getAdminActivityTimeline = query({
  args: {
    adminId: v.id("adminUsers"),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;

    const adminIdVal = args.adminId;
    // Use any here to allow conditional withIndex usage (Query vs QueryInitializer typing)
    let logsQuery: any = ctx.db.query("auditLogs");
    if (adminIdVal) {
      logsQuery = logsQuery.withIndex("by_admin", (q: any) => q.eq("adminId", adminIdVal));
    }
    let logs = await logsQuery.order("desc").take(limit);

    // Filter by time range if provided
    if (args.startTime || args.endTime) {
      logs = logs.filter((log: any) => {
        const logTime = new Date(log.timestamp);
        if (args.startTime && logTime < new Date(args.startTime)) return false;
        if (args.endTime && logTime > new Date(args.endTime)) return false;
        return true;
      });
    }

    return logs;
  },
});

// Query to detect suspicious activity patterns
export const detectSuspiciousActivity = query({
  args: {
    adminId: v.optional(v.id("adminUsers")),
    hours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const hours = args.hours || 24;
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);

    // Cast to any so we can call withIndex() conditionally without TS complaining
    let query: any = ctx.db.query("auditLogs");

    // extract adminId to a local before using inside the withIndex callback
    const adminId = args.adminId;
    if (adminId) {
      query = query.withIndex("by_admin", (q: any) => q.eq("adminId", adminId));
    }

    const logs = await query.collect();

    // Filter by time
    const recentLogs = logs.filter((log: any) => new Date(log.timestamp) >= cutoffTime);

    // Analyze patterns
    const suspiciousPatterns = [];

    // Pattern 1: Multiple failed logins
    const failedLogins = recentLogs.filter((log: any) =>
      log.category === "authentication" && log.outcome === "failure"
    );

    if (failedLogins.length >= 5) {
      suspiciousPatterns.push({
        type: "multiple_failed_logins",
        count: failedLogins.length,
        severity: "high",
        description: `${failedLogins.length} failed login attempts in ${hours} hours`
      });
    }

    // Pattern 2: Unusual access hours
    const unusualHourLogs = recentLogs.filter((log: any) => {
      const hour = new Date(log.timestamp).getHours();
      return hour < 6 || hour > 22;
    });

    if (unusualHourLogs.length >= 3) {
      suspiciousPatterns.push({
        type: "unusual_access_hours",
        count: unusualHourLogs.length,
        severity: "medium",
        description: `${unusualHourLogs.length} actions during unusual hours (outside 6 AM - 10 PM)`
      });
    }

    // Pattern 3: Rapid permission changes
    const permissionChanges = recentLogs.filter((log: any) =>
      log.action.includes("permission") ||
      log.action.includes("role") ||
      log.resource === "admin_users"
    );

    if (permissionChanges.length >= 3) {
      suspiciousPatterns.push({
        type: "rapid_permission_changes",
        count: permissionChanges.length,
        severity: "critical",
        description: `${permissionChanges.length} permission/role changes in ${hours} hours`
      });
    }

    // Pattern 4: Excessive financial data access
    const financialAccess = recentLogs.filter((log: any) =>
      log.category === "financial" ||
      log.resource.includes("financial") ||
      log.resource.includes("revenue") ||
      log.resource.includes("payout")
    );

    if (financialAccess.length >= 20) {
      suspiciousPatterns.push({
        type: "excessive_financial_access",
        count: financialAccess.length,
        severity: "high",
        description: `${financialAccess.length} financial data access attempts in ${hours} hours`
      });
    }

    return suspiciousPatterns;
  },
});

// Mutation to acknowledge security alert
export const acknowledgeSecurityAlert = mutation({
  args: {
    alertId: v.string(),
    adminId: v.id("adminUsers"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Log the acknowledgment
    await ctx.db.insert("auditLogs", {
      adminId: args.adminId,
      action: "security_alert_acknowledged",
      resource: "security",
      resourceId: args.alertId,
      details: {
        alertId: args.alertId,
        notes: args.notes
      },
      ipAddress: "system",
      userAgent: "admin_dashboard",
      timestamp: new Date().toISOString(),
      severity: "medium",
      category: "system_config",
      outcome: "success"
    });

    return { acknowledged: true, acknowledgedAt: new Date().toISOString() };
  },
});