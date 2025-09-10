// Comprehensive Audit Logging Service

import { ConvexError } from "convex/values";
import type { 
  AuditLogEntry,
  AdminAction,
  TimeFrame,
  SearchOptions,
  ApiResponse,
  AdminUser
} from "../types/admin";
import type { Id } from "../../../../convex/_generated/dataModel";
import { api } from "../../../../convex/_generated/api";
import { convex } from "../convex";

export interface AuditSearchCriteria {
  adminId?: Id<"adminUsers">;
  action?: string;
  resource?: string;
  resourceId?: string;
  severity?: "low" | "medium" | "high" | "critical";
  category?: "authentication" | "user_management" | "content_moderation" | "financial" | "system_config" | "data_access";
  outcome?: "success" | "failure" | "partial";
  timeframe?: TimeFrame;
  ipAddress?: string;
  searchText?: string;
  limit?: number;
  offset?: number;
}

export interface SecurityAlert {
  id: string;
  type: "suspicious_activity" | "failed_logins" | "privilege_escalation" | "unusual_access" | "data_breach";
  severity: "low" | "medium" | "high" | "critical";
  adminId?: Id<"adminUsers">;
  description: string;
  details: any;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: Id<"adminUsers">;
  acknowledgedAt?: string;
}

export interface SuspiciousActivityPattern {
  pattern: string;
  description: string;
  threshold: number;
  timeWindow: number; // minutes
  severity: "low" | "medium" | "high" | "critical";
}

export interface AuditStatistics {
  totalActions: number;
  actionsByCategory: Record<string, number>;
  actionsBySeverity: Record<string, number>;
  actionsByOutcome: Record<string, number>;
  uniqueAdmins: number;
  timeRange: {
    start?: string;
    end?: string;
  };
  topActions: Array<{ action: string; count: number }>;
  topResources: Array<{ resource: string; count: number }>;
  failureRate: number;
  criticalActionsCount: number;
}

export interface AdminActivitySummary {
  adminId: Id<"adminUsers">;
  adminName: string;
  totalActions: number;
  lastActivity: string;
  actionsByCategory: Record<string, number>;
  riskScore: number;
  suspiciousActivities: number;
}

export class AuditLoggingService {
  private static readonly SUSPICIOUS_PATTERNS: SuspiciousActivityPattern[] = [
    {
      pattern: "multiple_failed_logins",
      description: "Multiple failed login attempts from same IP",
      threshold: 5,
      timeWindow: 15,
      severity: "high"
    },
    {
      pattern: "rapid_permission_changes",
      description: "Rapid permission changes for admin users",
      threshold: 3,
      timeWindow: 10,
      severity: "critical"
    },
    {
      pattern: "unusual_access_hours",
      description: "Access during unusual hours (outside 6 AM - 10 PM)",
      threshold: 1,
      timeWindow: 60,
      severity: "medium"
    },
    {
      pattern: "bulk_user_actions",
      description: "Bulk user actions performed rapidly",
      threshold: 10,
      timeWindow: 5,
      severity: "high"
    },
    {
      pattern: "financial_data_access",
      description: "Excessive financial data access",
      threshold: 20,
      timeWindow: 60,
      severity: "high"
    },
    {
      pattern: "data_export_activity",
      description: "Multiple data export operations",
      threshold: 5,
      timeWindow: 30,
      severity: "medium"
    }
  ];

  /**
   * Log admin action with comprehensive audit trail
   */
  async logAdminAction(
    adminId: Id<"adminUsers">, 
    action: AdminAction,
    outcome: "success" | "failure" | "partial" = "success",
    errorMessage?: string
  ): Promise<void> {
    try {
      const severity = this.determineSeverity(action.action);
      const category = this.determineCategory(action.resource);

      await convex.mutation(api.admin.audit.logAdminAction, {
        adminId,
        action: action.action,
        resource: action.resource,
        resourceId: action.resourceId,
        details: action.details,
        ipAddress: action.ipAddress,
        userAgent: action.userAgent,
        timestamp: new Date().toISOString(),
        severity,
        category,
        outcome,
        errorMessage
      });

      // Check for suspicious activity patterns
      await this.checkSuspiciousActivity(adminId, action);

    } catch (error) {
      console.error("Failed to log admin action:", error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Search audit logs with advanced filtering
   */
  async searchAuditLogs(criteria: AuditSearchCriteria): Promise<ApiResponse<AuditLogEntry[]>> {
    try {
      const logs = await convex.query(api.admin.audit.getAdminAuditLog, {
        adminId: criteria.adminId,
        startTime: criteria.timeframe?.start,
        endTime: criteria.timeframe?.end,
        action: criteria.action,
        resource: criteria.resource,
        severity: criteria.severity,
        category: criteria.category,
        limit: criteria.limit || 100,
        offset: criteria.offset || 0
      });

      // Apply additional client-side filtering
      let filteredLogs = logs;

      if (criteria.resourceId) {
        filteredLogs = filteredLogs.filter(log => log.resourceId === criteria.resourceId);
      }

      if (criteria.outcome) {
        filteredLogs = filteredLogs.filter(log => log.outcome === criteria.outcome);
      }

      if (criteria.ipAddress) {
        filteredLogs = filteredLogs.filter(log => log.ipAddress === criteria.ipAddress);
      }

      if (criteria.searchText) {
        const searchLower = criteria.searchText.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.action.toLowerCase().includes(searchLower) ||
          log.resource.toLowerCase().includes(searchLower) ||
          (log.resourceId && log.resourceId.toLowerCase().includes(searchLower)) ||
          JSON.stringify(log.details).toLowerCase().includes(searchLower)
        );
      }

      return {
        data: filteredLogs,
        success: true,
        pagination: {
          total: filteredLogs.length,
          page: Math.floor((criteria.offset || 0) / (criteria.limit || 100)) + 1,
          limit: criteria.limit || 100,
          hasMore: filteredLogs.length === (criteria.limit || 100)
        }
      };

    } catch (error) {
      console.error("Failed to search audit logs:", error);
      return {
        data: [],
        success: false,
        message: "Failed to search audit logs"
      };
    }
  }

  /**
   * Get audit statistics for dashboard
   */
  async getAuditStatistics(timeframe?: TimeFrame): Promise<AuditStatistics> {
    try {
      const stats = await convex.query(api.admin.audit.getAuditStatistics, {
        startTime: timeframe?.start,
        endTime: timeframe?.end
      });

      // Get additional statistics
      const logs = await convex.query(api.admin.audit.getAdminAuditLog, {
        startTime: timeframe?.start,
        endTime: timeframe?.end,
        limit: 1000
      });

      // Calculate top actions and resources
      const actionCounts = logs.reduce((acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const resourceCounts = logs.reduce((acc, log) => {
        acc[log.resource] = (acc[log.resource] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topActions = Object.entries(actionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      const topResources = Object.entries(resourceCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([resource, count]) => ({ resource, count }));

      const failureCount = logs.filter(log => log.outcome === "failure").length;
      const failureRate = logs.length > 0 ? (failureCount / logs.length) * 100 : 0;

      const criticalActionsCount = logs.filter(log => log.severity === "critical").length;

      return {
        ...stats,
        topActions,
        topResources,
        failureRate,
        criticalActionsCount
      };

    } catch (error) {
      console.error("Failed to get audit statistics:", error);
      return {
        totalActions: 0,
        actionsByCategory: {},
        actionsBySeverity: {},
        actionsByOutcome: {},
        uniqueAdmins: 0,
        timeRange: {},
        topActions: [],
        topResources: [],
        failureRate: 0,
        criticalActionsCount: 0
      };
    }
  }

  /**
   * Get admin activity summary
   */
  async getAdminActivitySummary(
    adminId: Id<"adminUsers">, 
    timeframe?: TimeFrame
  ): Promise<AdminActivitySummary> {
    try {
      const logs = await convex.query(api.admin.audit.getAdminAuditLog, {
        adminId,
        startTime: timeframe?.start,
        endTime: timeframe?.end,
        limit: 1000
      });

      const admin = await convex.query(api.admin.auth.getAdminById, { adminId });
      
      const actionsByCategory = logs.reduce((acc, log) => {
        acc[log.category] = (acc[log.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const lastActivity = logs.length > 0 ? logs[0].timestamp : "Never";
      
      // Calculate risk score based on various factors
      const riskScore = this.calculateRiskScore(logs);
      
      // Count suspicious activities
      const suspiciousActivities = await this.countSuspiciousActivities(adminId, timeframe);

      return {
        adminId,
        adminName: admin?.name || "Unknown",
        totalActions: logs.length,
        lastActivity,
        actionsByCategory,
        riskScore,
        suspiciousActivities
      };

    } catch (error) {
      console.error("Failed to get admin activity summary:", error);
      return {
        adminId,
        adminName: "Unknown",
        totalActions: 0,
        lastActivity: "Never",
        actionsByCategory: {},
        riskScore: 0,
        suspiciousActivities: 0
      };
    }
  }

  /**
   * Get recent critical actions
   */
  async getRecentCriticalActions(hours: number = 24, limit: number = 20): Promise<AuditLogEntry[]> {
    try {
      return await convex.query(api.admin.audit.getRecentCriticalActions, {
        hours,
        limit
      });
    } catch (error) {
      console.error("Failed to get recent critical actions:", error);
      return [];
    }
  }

  /**
   * Export audit logs for compliance
   */
  async exportAuditLogs(
    criteria: AuditSearchCriteria,
    format: "csv" | "json" = "csv"
  ): Promise<string> {
    try {
      const response = await this.searchAuditLogs({ ...criteria, limit: 10000 });
      const logs = response.data;

      if (format === "json") {
        return JSON.stringify(logs, null, 2);
      }

      // CSV format
      const headers = [
        "Timestamp", "Admin ID", "Admin Name", "Action", "Resource", "Resource ID",
        "IP Address", "User Agent", "Severity", "Category", "Outcome", "Details"
      ];

      const csvRows = [headers.join(",")];

      for (const log of logs) {
        const admin = await convex.query(api.admin.auth.getAdminById, { adminId: log.adminId });
        const row = [
          log.timestamp,
          log.adminId,
          admin?.name || "Unknown",
          log.action,
          log.resource,
          log.resourceId || "",
          log.ipAddress,
          `"${log.userAgent}"`,
          log.severity,
          log.category,
          log.outcome,
          `"${JSON.stringify(log.details).replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      }

      return csvRows.join("\n");

    } catch (error) {
      console.error("Failed to export audit logs:", error);
      throw new ConvexError("Failed to export audit logs");
    }
  }

  /**
   * Check for suspicious activity patterns
   */
  private async checkSuspiciousActivity(
    adminId: Id<"adminUsers">, 
    action: AdminAction
  ): Promise<void> {
    try {
      const now = new Date();
      
      for (const pattern of AuditLoggingService.SUSPICIOUS_PATTERNS) {
        const windowStart = new Date(now.getTime() - pattern.timeWindow * 60 * 1000);
        
        const recentLogs = await convex.query(api.admin.audit.getAdminAuditLog, {
          adminId,
          startTime: windowStart.toISOString(),
          endTime: now.toISOString(),
          limit: 100
        });

        const matchingActions = this.getMatchingActions(recentLogs, pattern, action);
        
        if (matchingActions >= pattern.threshold) {
          await this.createSecurityAlert({
            type: "suspicious_activity",
            severity: pattern.severity,
            adminId,
            description: `${pattern.description}: ${matchingActions} occurrences in ${pattern.timeWindow} minutes`,
            details: {
              pattern: pattern.pattern,
              count: matchingActions,
              timeWindow: pattern.timeWindow,
              recentActions: recentLogs.slice(0, 5)
            },
            timestamp: now.toISOString(),
            acknowledged: false
          });
        }
      }

    } catch (error) {
      console.error("Failed to check suspicious activity:", error);
    }
  }

  /**
   * Get matching actions for a suspicious pattern
   */
  private getMatchingActions(
    logs: AuditLogEntry[], 
    pattern: SuspiciousActivityPattern, 
    currentAction: AdminAction
  ): number {
    switch (pattern.pattern) {
      case "multiple_failed_logins":
        return logs.filter(log => 
          log.action === "failed_login" || 
          log.outcome === "failure" && log.category === "authentication"
        ).length;

      case "rapid_permission_changes":
        return logs.filter(log => 
          log.action.includes("permission") || 
          log.action.includes("role") ||
          log.resource === "admin_users"
        ).length;

      case "unusual_access_hours":
        return logs.filter(log => {
          const hour = new Date(log.timestamp).getHours();
          return hour < 6 || hour > 22;
        }).length;

      case "bulk_user_actions":
        return logs.filter(log => 
          log.resource === "users" && 
          (log.action.includes("bulk") || log.action.includes("batch"))
        ).length;

      case "financial_data_access":
        return logs.filter(log => 
          log.category === "financial" || 
          log.resource.includes("financial") ||
          log.resource.includes("revenue") ||
          log.resource.includes("payout")
        ).length;

      case "data_export_activity":
        return logs.filter(log => 
          log.action.includes("export") || 
          log.action.includes("download") ||
          log.details?.export === true
        ).length;

      default:
        return 0;
    }
  }

  /**
   * Create security alert
   */
  private async createSecurityAlert(alert: Omit<SecurityAlert, "id">): Promise<void> {
    try {
      // In a real implementation, this would store alerts in the database
      // For now, we'll log it as a critical audit entry
      await convex.mutation(api.admin.audit.logAdminAction, {
        adminId: alert.adminId || "system" as any,
        action: "security_alert_created",
        resource: "security",
        resourceId: alert.type,
        details: {
          alertType: alert.type,
          severity: alert.severity,
          description: alert.description,
          alertDetails: alert.details
        },
        ipAddress: "system",
        userAgent: "security_monitor",
        timestamp: alert.timestamp,
        severity: "critical",
        category: "system_config",
        outcome: "success"
      });

      // TODO: Send notifications to security team
      console.warn("Security Alert:", alert);

    } catch (error) {
      console.error("Failed to create security alert:", error);
    }
  }

  /**
   * Calculate risk score for admin user
   */
  private calculateRiskScore(logs: AuditLogEntry[]): number {
    if (logs.length === 0) return 0;

    let riskScore = 0;
    const now = new Date();

    for (const log of logs) {
      // Base risk factors
      if (log.outcome === "failure") riskScore += 2;
      if (log.severity === "critical") riskScore += 5;
      if (log.severity === "high") riskScore += 3;
      if (log.severity === "medium") riskScore += 1;

      // Time-based risk (recent actions are riskier)
      const logTime = new Date(log.timestamp);
      const hoursAgo = (now.getTime() - logTime.getTime()) / (1000 * 60 * 60);
      if (hoursAgo < 1) riskScore += 2;
      else if (hoursAgo < 24) riskScore += 1;

      // Action-specific risk
      if (log.action.includes("delete") || log.action.includes("revoke")) riskScore += 2;
      if (log.category === "financial") riskScore += 1;
      if (log.category === "system_config") riskScore += 2;

      // Unusual access patterns
      const hour = logTime.getHours();
      if (hour < 6 || hour > 22) riskScore += 1;
    }

    // Normalize to 0-100 scale
    return Math.min(100, Math.round((riskScore / logs.length) * 10));
  }

  /**
   * Count suspicious activities for admin
   */
  private async countSuspiciousActivities(
    adminId: Id<"adminUsers">, 
    timeframe?: TimeFrame
  ): Promise<number> {
    try {
      const logs = await convex.query(api.admin.audit.getAdminAuditLog, {
        adminId,
        startTime: timeframe?.start,
        endTime: timeframe?.end,
        severity: "critical",
        limit: 100
      });

      return logs.filter(log => 
        log.action === "security_alert_created" ||
        log.outcome === "failure" ||
        log.details?.suspicious === true
      ).length;

    } catch (error) {
      console.error("Failed to count suspicious activities:", error);
      return 0;
    }
  }

  /**
   * Determine severity level for action
   */
  private determineSeverity(action: string): "low" | "medium" | "high" | "critical" {
    const criticalActions = [
      "admin_user_created", "admin_access_revoked", "system_config_changed",
      "database_backup", "security_alert_created", "mass_user_deletion"
    ];
    
    const highActions = [
      "user_suspended", "content_rejected", "financial_transaction",
      "admin_permissions_updated", "user_data_deleted", "payout_processed"
    ];
    
    const mediumActions = [
      "user_impersonated", "content_approved", "data_exported",
      "user_created", "trainer_verified", "report_generated"
    ];

    if (criticalActions.some(ca => action.includes(ca))) return "critical";
    if (highActions.some(ha => action.includes(ha))) return "high";
    if (mediumActions.some(ma => action.includes(ma))) return "medium";
    return "low";
  }

  /**
   * Determine category for resource
   */
  private determineCategory(resource: string): "authentication" | "user_management" | "content_moderation" | "financial" | "system_config" | "data_access" {
    const categoryMap: Record<string, "authentication" | "user_management" | "content_moderation" | "financial" | "system_config" | "data_access"> = {
      "authentication": "authentication",
      "auth": "authentication",
      "login": "authentication",
      "session": "authentication",
      
      "users": "user_management",
      "admin_users": "user_management",
      "trainers": "user_management",
      "clients": "user_management",
      
      "content": "content_moderation",
      "moderation": "content_moderation",
      "exercises": "content_moderation",
      "programs": "content_moderation",
      
      "financial": "financial",
      "revenue": "financial",
      "payouts": "financial",
      "transactions": "financial",
      "payments": "financial",
      
      "system": "system_config",
      "config": "system_config",
      "settings": "system_config",
      "security": "system_config",
      
      "data": "data_access",
      "export": "data_access",
      "import": "data_access",
      "backup": "data_access"
    };

    for (const [key, category] of Object.entries(categoryMap)) {
      if (resource.toLowerCase().includes(key)) {
        return category;
      }
    }

    return "data_access";
  }
}

// Export singleton instance
export const auditLoggingService = new AuditLoggingService();