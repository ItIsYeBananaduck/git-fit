// User Report Handling and Investigation Service

import { ConvexError } from "convex/values";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { convex } from "../convex";
import { adminAuthService } from "./adminAuth";

export interface UserReport {
  _id: Id<"moderationQueue">;
  reportedUserId: Id<"users">;
  reportedBy: Id<"users">;
  reportType: "harassment" | "inappropriate_content" | "spam" | "fake_profile" | "safety_concern" | "other";
  reason: string;
  description: string;
  evidence?: string[];
  relatedContentId?: string;
  status: "pending" | "under_review" | "resolved" | "dismissed";
  priority: "low" | "medium" | "high" | "urgent";
  assignedTo?: Id<"adminUsers">;
  createdAt: string;
  reviewedAt?: string;
}

export interface Investigation {
  investigatorId: Id<"adminUsers">;
  findings: string;
  evidence: string[];
  recommendation: "dismiss" | "warn_user" | "suspend_user" | "ban_user" | "remove_content" | "escalate";
  actionTaken?: string;
  followUpRequired: boolean;
  investigatedAt: string;
}

export interface ModerationAction {
  id: string;
  userId: Id<"users">;
  actionType: string;
  reason: string;
  performedBy: Id<"adminUsers">;
  performedAt: string;
  details: any;
}

export interface ContentAnalytics {
  totalItems: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  autoFlagged: number;
  manualReports: number;
  averageResolutionTime: number;
  topFlags: Record<string, number>;
  escalationRate: number;
  appealRate: number;
}

export class UserReportService {
  /**
   * Create a new user report
   */
  async createUserReport(
    reportData: {
      reportedUserId: Id<"users">;
      reportedBy: Id<"users">;
      reportType: "harassment" | "inappropriate_content" | "spam" | "fake_profile" | "safety_concern" | "other";
      reason: string;
      description: string;
      evidence?: string[];
      relatedContentId?: string;
    }
  ): Promise<{ reportId: Id<"moderationQueue"> }> {
    try {
      const reportId = await convex.mutation(api.admin.moderation.createUserReport, {
        ...reportData,
        createdAt: new Date().toISOString()
      });

      return { reportId };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to create user report");
    }
  }

  /**
   * Get user reports with filtering and pagination
   */
  async getUserReports(
    filters: {
      userId?: Id<"users">;
      reportType?: "harassment" | "inappropriate_content" | "spam" | "fake_profile" | "safety_concern" | "other";
      status?: "pending" | "under_review" | "resolved" | "dismissed";
    },
    adminId: Id<"adminUsers">,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ reports: UserReport[]; total: number; hasMore: boolean }> {
    try {
      // Validate admin permissions
      const canViewReports = await adminAuthService.validateAdminPermissions(adminId, "read", "user_reports");
      if (!canViewReports) {
        throw new ConvexError("Insufficient permissions to view user reports");
      }

      const result = await convex.query(api.admin.moderation.getUserReports, {
        ...filters,
        limit,
        offset
      });

      // Log report access
      await adminAuthService.logAdminAction(adminId, {
        action: "user_reports_viewed",
        resource: "user_reports",
        details: { 
          filters,
          resultCount: result.reports.length 
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return {
        reports: result.reports as UserReport[],
        total: result.total,
        hasMore: result.hasMore
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get user reports");
    }
  }

  /**
   * Investigate a user report
   */
  async investigateUserReport(
    reportId: string,
    investigation: Investigation,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate admin permissions
      const canInvestigate = await adminAuthService.validateAdminPermissions(adminId, "investigate", "user_reports");
      if (!canInvestigate) {
        throw new ConvexError("Insufficient permissions to investigate user reports");
      }

      await convex.mutation(api.admin.moderation.investigateUserReport, {
        reportId,
        investigatorId: investigation.investigatorId,
        investigationNotes: `Investigation findings: ${investigation.findings}`,
        findings: investigation.findings,
        evidence: investigation.evidence,
        recommendation: investigation.recommendation,
        actionTaken: investigation.actionTaken,
        followUpRequired: investigation.followUpRequired,
        investigatedAt: investigation.investigatedAt
      });

      // Execute the recommended action
      await this.executeModerationAction(reportId, investigation, adminId);

      // Log investigation
      await adminAuthService.logAdminAction(adminId, {
        action: "user_report_investigated",
        resource: "user_reports",
        resourceId: reportId,
        details: { 
          recommendation: investigation.recommendation,
          followUpRequired: investigation.followUpRequired,
          evidenceCount: investigation.evidence.length
        },
        ipAddress: "system",
        userAgent: "system"
      });
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to investigate user report");
    }
  }

  /**
   * Flag inappropriate content automatically
   */
  async flagInappropriateContent(
    contentData: {
      contentId: string;
      contentType: "message" | "exercise" | "profile" | "review";
      contentData: any;
      flagReason: string;
      confidenceScore: number;
      detectionMethod: string;
    }
  ): Promise<{ moderationItemId: Id<"moderationQueue">; priority: string }> {
    try {
      const result = await convex.mutation(api.admin.moderation.flagInappropriateContentAuto, {
        ...contentData,
        createdAt: new Date().toISOString()
      });

      return {
        moderationItemId: result.moderationItemId,
        priority: result.priority
      };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to flag inappropriate content");
    }
  }

  /**
   * Get moderation actions history
   */
  async getModerationActions(
    filters: {
      userId?: Id<"users">;
      actionType?: "warning" | "suspension" | "ban" | "content_removal";
      performedBy?: Id<"adminUsers">;
      startDate?: string;
      endDate?: string;
    },
    adminId: Id<"adminUsers">,
    limit: number = 100
  ): Promise<ModerationAction[]> {
    try {
      // Validate admin permissions
      const canViewActions = await adminAuthService.validateAdminPermissions(adminId, "read", "moderation_actions");
      if (!canViewActions) {
        throw new ConvexError("Insufficient permissions to view moderation actions");
      }

      const actions = await convex.query(api.admin.moderation.getModerationActions, {
        ...filters,
        limit
      });

      // Log action history access
      await adminAuthService.logAdminAction(adminId, {
        action: "moderation_actions_viewed",
        resource: "moderation_actions",
        details: { 
          filters,
          resultCount: actions.length 
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return actions;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get moderation actions");
    }
  }

  /**
   * Create a moderation appeal
   */
  async createModerationAppeal(
    appealData: {
      originalActionId: string;
      userId: Id<"users">;
      appealReason: string;
      additionalEvidence?: string[];
    }
  ): Promise<{ appealId: Id<"moderationQueue"> }> {
    try {
      const appealId = await convex.mutation(api.admin.moderation.createModerationAppeal, {
        ...appealData,
        createdAt: new Date().toISOString()
      });

      return { appealId };
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to create moderation appeal");
    }
  }

  /**
   * Get detailed content analytics
   */
  async getContentAnalytics(
    timeframe: { start: string; end: string },
    contentType?: "custom_exercise" | "trainer_message" | "user_report" | "program_content" | "user_profile",
    adminId?: Id<"adminUsers">
  ): Promise<ContentAnalytics> {
    try {
      if (adminId) {
        // Validate admin permissions
        const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "content_analytics");
        if (!canViewAnalytics) {
          throw new ConvexError("Insufficient permissions to view content analytics");
        }
      }

      const analytics = await convex.query(api.admin.moderation.getContentAnalyticsDetailed, {
        startDate: timeframe.start,
        endDate: timeframe.end,
        contentType
      });

      if (adminId) {
        // Log analytics access
        await adminAuthService.logAdminAction(adminId, {
          action: "content_analytics_viewed",
          resource: "content_analytics",
          details: { timeframe, contentType },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return analytics;
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get content analytics");
    }
  }

  // Private helper methods

  private async executeModerationAction(
    reportId: string,
    investigation: Investigation,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    // Execute the recommended action based on investigation findings
    switch (investigation.recommendation) {
      case "warn_user":
        // Send warning to user
        break;
      case "suspend_user":
        // Suspend user account
        break;
      case "ban_user":
        // Ban user account permanently
        break;
      case "remove_content":
        // Remove the reported content
        break;
      case "escalate":
        // Escalate to higher authority
        break;
      case "dismiss":
        // No action needed
        break;
    }

    // Log the action taken
    await adminAuthService.logAdminAction(adminId, {
      action: `moderation_action_${investigation.recommendation}`,
      resource: "user_reports",
      resourceId: reportId,
      details: {
        recommendation: investigation.recommendation,
        actionTaken: investigation.actionTaken,
        findings: investigation.findings
      },
      ipAddress: "system",
      userAgent: "system"
    });
  }
}

// Export singleton instance
export const userReportService = new UserReportService();