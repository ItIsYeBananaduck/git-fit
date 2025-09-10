// User Management Service for Admin Dashboard

import { ConvexError } from "convex/values";
import type { 
  UserSearchCriteria,
  UserSearchResult,
  DetailedUserProfile,
  SupportTicket,
  ImpersonationSession,
  BulkUserAction,
  BulkActionResult,
  UserActivityMetrics,
  UserBasicInfo,
  SubscriptionInfo,
  UserFinancialSummary,
  DeviceConnection,
  ModerationAction
} from "../types/admin";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { convex } from "$lib/convex";
import { adminAuthService } from "./adminAuth";

export class UserManagementService {
  /**
   * Search users with advanced criteria and pagination
   */
  async searchUsers(
    criteria: UserSearchCriteria,
    adminId: Id<"adminUsers">
  ): Promise<{ users: UserSearchResult[]; total: number; hasMore: boolean }> {
    try {
      // Validate admin permissions
      const canViewUsers = await adminAuthService.validateAdminPermissions(adminId, "read", "users");
      if (!canViewUsers) {
        throw new ConvexError("Insufficient permissions to view users");
      }

      const result = await convex.query(api.admin.users.searchUsers, {
        query: criteria.query,
        role: criteria.role,
        subscriptionStatus: criteria.subscriptionStatus,
        activityLevel: criteria.activityLevel,
        dateRange: criteria.dateRange,
        limit: criteria.limit || 50,
        offset: criteria.offset || 0
      });

      // Log user search action
      await adminAuthService.logAdminAction(adminId, {
        action: "users_searched",
        resource: "users",
        details: { 
          criteria: criteria,
          resultCount: result.users.length 
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to search users");
    }
  }

  /**
   * Get detailed user profile with all related information
   */
  async getUserProfile(
    userId: Id<"users">,
    adminId: Id<"adminUsers">
  ): Promise<DetailedUserProfile> {
    try {
      // Validate admin permissions
      const canViewUserDetails = await adminAuthService.validateAdminPermissions(adminId, "read", "user_details");
      if (!canViewUserDetails) {
        throw new ConvexError("Insufficient permissions to view user details");
      }

      // Get basic user info
      const basicInfo = await convex.query(api.admin.users.getUserBasicInfo, { userId });
      if (!basicInfo) {
        throw new ConvexError("User not found");
      }

      // Get subscription info
      const subscriptionInfo = await convex.query(api.admin.users.getUserSubscriptionInfo, { userId });

      // Get activity metrics
      const activityMetrics = await convex.query(api.admin.users.getUserActivityMetrics, { userId });

      // Get support history
      const supportHistory = await convex.query(api.admin.users.getUserSupportHistory, { userId });

      // Get moderation history
      const moderationHistory = await convex.query(api.admin.users.getUserModerationHistory, { userId });

      // Get financial summary
      const financialSummary = await convex.query(api.admin.users.getUserFinancialSummary, { userId });

      // Get device connections
      const deviceConnections = await convex.query(api.admin.users.getUserDeviceConnections, { userId });

      // Calculate risk score
      const riskScore = this.calculateUserRiskScore(basicInfo, activityMetrics, moderationHistory);

      const profile: DetailedUserProfile = {
        basicInfo,
        subscriptionInfo: subscriptionInfo || {
          status: "inactive",
          tier: undefined,
          startDate: undefined,
          endDate: undefined,
          autoRenew: false,
          paymentMethod: undefined
        },
        activityMetrics: activityMetrics || {
          lastLogin: undefined,
          sessionCount: 0,
          averageSessionDuration: 0,
          featureUsage: {},
          engagementScore: 0,
          retentionCohort: "new"
        },
        supportHistory: supportHistory || [],
        moderationHistory: moderationHistory || [],
        financialSummary: financialSummary || {
          totalSpent: 0,
          totalRefunds: 0,
          averageOrderValue: 0,
          paymentMethods: [],
          lastPayment: undefined,
          outstandingBalance: 0
        },
        deviceConnections: deviceConnections || [],
        riskScore
      };

      // Log user profile access
      await adminAuthService.logAdminAction(adminId, {
        action: "user_profile_viewed",
        resource: "users",
        resourceId: userId,
        details: { 
          userEmail: basicInfo.email,
          riskScore 
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return profile;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get user profile");
    }
  }

  /**
   * Suspend user account with reason and optional duration
   */
  async suspendUser(
    userId: Id<"users">,
    reason: string,
    adminId: Id<"adminUsers">,
    duration?: number
  ): Promise<void> {
    try {
      // Validate admin permissions
      const canSuspendUsers = await adminAuthService.validateAdminPermissions(adminId, "suspend", "users");
      if (!canSuspendUsers) {
        throw new ConvexError("Insufficient permissions to suspend users");
      }

      // Get user info for logging
      const userInfo = await convex.query(api.admin.users.getUserBasicInfo, { userId });
      if (!userInfo) {
        throw new ConvexError("User not found");
      }

      // Suspend user
      const suspensionEndDate = duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString() : undefined;
      
      await convex.mutation(api.admin.users.suspendUser, {
        userId,
        reason,
        suspendedBy: adminId,
        suspensionEndDate,
        suspendedAt: new Date().toISOString()
      });

      // Create moderation action record
      await convex.mutation(api.admin.moderation.createModerationAction, {
        userId,
        action: "suspension",
        reason,
        duration,
        performedBy: adminId,
        timestamp: new Date().toISOString(),
        details: { suspensionEndDate }
      });

      // Log suspension action
      await adminAuthService.logAdminAction(adminId, {
        action: "user_suspended",
        resource: "users",
        resourceId: userId,
        details: { 
          userEmail: userInfo.email,
          reason,
          duration,
          suspensionEndDate
        },
        ipAddress: "system",
        userAgent: "system"
      });

      // TODO: Send notification to user about suspension
      // await this.notifyUserSuspension(userId, reason, duration);

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to suspend user");
    }
  }

  /**
   * Delete user data (GDPR compliant)
   */
  async deleteUserData(
    userId: Id<"users">,
    deletionType: "soft" | "hard",
    adminId: Id<"adminUsers">
  ): Promise<{ success: boolean; deletedRecords: number }> {
    try {
      // Validate admin permissions
      const canDeleteUsers = await adminAuthService.validateAdminPermissions(adminId, "delete", "users");
      if (!canDeleteUsers) {
        throw new ConvexError("Insufficient permissions to delete user data");
      }

      // Get user info for logging
      const userInfo = await convex.query(api.admin.users.getUserBasicInfo, { userId });
      if (!userInfo) {
        throw new ConvexError("User not found");
      }

      // Perform deletion based on type
      const result = await convex.mutation(api.admin.users.deleteUserData, {
        userId,
        deletionType,
        deletedBy: adminId,
        deletedAt: new Date().toISOString()
      });

      // Log deletion action
      await adminAuthService.logAdminAction(adminId, {
        action: "user_data_deleted",
        resource: "users",
        resourceId: userId,
        details: { 
          userEmail: userInfo.email,
          deletionType,
          deletedRecords: result.deletedRecords
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to delete user data");
    }
  }

  /**
   * Start user impersonation session for support
   */
  async impersonateUser(
    userId: Id<"users">,
    reason: string,
    adminId: Id<"adminUsers">
  ): Promise<ImpersonationSession> {
    try {
      // Validate admin permissions
      const canImpersonateUsers = await adminAuthService.validateAdminPermissions(adminId, "impersonate", "users");
      if (!canImpersonateUsers) {
        throw new ConvexError("Insufficient permissions to impersonate users");
      }

      // Get user info for logging
      const userInfo = await convex.query(api.admin.users.getUserBasicInfo, { userId });
      if (!userInfo) {
        throw new ConvexError("User not found");
      }

      // Create impersonation session
      const sessionId = `imp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const session: ImpersonationSession = {
        sessionId,
        adminId,
        userId,
        startTime: new Date().toISOString(),
        reason
      };

      // Store impersonation session
      await convex.mutation(api.admin.users.createImpersonationSession, {
        sessionId,
        adminId,
        userId,
        reason,
        startTime: session.startTime
      });

      // Log impersonation start
      await adminAuthService.logAdminAction(adminId, {
        action: "user_impersonation_started",
        resource: "users",
        resourceId: userId,
        details: { 
          userEmail: userInfo.email,
          reason,
          sessionId
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return session;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to start user impersonation");
    }
  }

  /**
   * End user impersonation session
   */
  async endImpersonation(
    sessionId: string,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Get impersonation session
      const session = await convex.query(api.admin.users.getImpersonationSession, { sessionId });
      if (!session) {
        throw new ConvexError("Impersonation session not found");
      }

      // Verify admin owns this session
      if (session.adminId !== adminId) {
        throw new ConvexError("Unauthorized to end this impersonation session");
      }

      // End impersonation session
      await convex.mutation(api.admin.users.endImpersonationSession, {
        sessionId,
        endTime: new Date().toISOString()
      });

      // Log impersonation end
      await adminAuthService.logAdminAction(adminId, {
        action: "user_impersonation_ended",
        resource: "users",
        resourceId: session.userId,
        details: { 
          sessionId,
          duration: Date.now() - new Date(session.startTime).getTime()
        },
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to end impersonation session");
    }
  }

  /**
   * Get user activity timeline
   */
  async getUserActivityTimeline(
    userId: Id<"users">,
    adminId: Id<"adminUsers">,
    limit: number = 50
  ): Promise<Array<{
    timestamp: string;
    type: string;
    description: string;
    details?: any;
  }>> {
    try {
      // Validate admin permissions
      const canViewActivity = await adminAuthService.validateAdminPermissions(adminId, "read", "user_activity");
      if (!canViewActivity) {
        throw new ConvexError("Insufficient permissions to view user activity");
      }

      const timeline = await convex.query(api.admin.users.getUserActivityTimeline, {
        userId,
        limit
      });

      // Log activity timeline access
      await adminAuthService.logAdminAction(adminId, {
        action: "user_activity_timeline_viewed",
        resource: "users",
        resourceId: userId,
        details: { timelineEntries: timeline.length },
        ipAddress: "system",
        userAgent: "system"
      });

      return timeline;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get user activity timeline");
    }
  }

  /**
   * Perform bulk action on multiple users
   */
  async bulkUserAction(
    userIds: Id<"users">[],
    action: BulkUserAction,
    adminId: Id<"adminUsers">
  ): Promise<BulkActionResult> {
    try {
      // Validate admin permissions based on action
      const permissionMap = {
        suspend: "suspend",
        activate: "activate", 
        delete: "delete",
        send_message: "communicate"
      };

      const canPerformAction = await adminAuthService.validateAdminPermissions(
        adminId, 
        permissionMap[action.action], 
        "users"
      );
      
      if (!canPerformAction) {
        throw new ConvexError(`Insufficient permissions to ${action.action} users`);
      }

      const result: BulkActionResult = {
        successful: 0,
        failed: 0,
        errors: []
      };

      // Process each user
      for (const userId of userIds) {
        try {
          switch (action.action) {
            case "suspend":
              await this.suspendUser(userId, action.reason || "Bulk suspension", adminId, action.duration);
              break;
            case "activate":
              await convex.mutation(api.admin.users.activateUser, { userId });
              break;
            case "delete":
              await this.deleteUserData(userId, "soft", adminId);
              break;
            case "send_message":
              await convex.mutation(api.admin.users.sendUserMessage, {
                userId,
                message: action.message || "",
                sentBy: adminId
              });
              break;
          }
          result.successful++;
        } catch (error) {
          result.failed++;
          result.errors.push({
            userId,
            error: error instanceof Error ? error.message : "Unknown error"
          });
        }
      }

      // Log bulk action
      await adminAuthService.logAdminAction(adminId, {
        action: `bulk_user_${action.action}`,
        resource: "users",
        details: { 
          userCount: userIds.length,
          successful: result.successful,
          failed: result.failed,
          action: action
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to perform bulk user action");
    }
  }

  /**
   * Issue warning to user
   */
  async issueUserWarning(
    userId: Id<"users">,
    reason: string,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate admin permissions
      const canWarnUsers = await adminAuthService.validateAdminPermissions(adminId, "warn", "users");
      if (!canWarnUsers) {
        throw new ConvexError("Insufficient permissions to warn users");
      }

      // Get user info for logging
      const userInfo = await convex.query(api.admin.users.getUserBasicInfo, { userId });
      if (!userInfo) {
        throw new ConvexError("User not found");
      }

      // Create warning record
      await convex.mutation(api.admin.moderation.createModerationAction, {
        userId,
        action: "warning",
        reason,
        performedBy: adminId,
        timestamp: new Date().toISOString(),
        details: {}
      });

      // Log warning action
      await adminAuthService.logAdminAction(adminId, {
        action: "user_warned",
        resource: "users",
        resourceId: userId,
        details: { 
          userEmail: userInfo.email,
          reason
        },
        ipAddress: "system",
        userAgent: "system"
      });

      // TODO: Send notification to user about warning
      // await this.notifyUserWarning(userId, reason);

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to issue user warning");
    }
  }

  /**
   * Terminate user account permanently
   */
  async terminateUser(
    userId: Id<"users">,
    reason: string,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate admin permissions
      const canTerminateUsers = await adminAuthService.validateAdminPermissions(adminId, "terminate", "users");
      if (!canTerminateUsers) {
        throw new ConvexError("Insufficient permissions to terminate users");
      }

      // Get user info for logging
      const userInfo = await convex.query(api.admin.users.getUserBasicInfo, { userId });
      if (!userInfo) {
        throw new ConvexError("User not found");
      }

      // Terminate user account
      await convex.mutation(api.admin.users.terminateUser, {
        userId,
        reason,
        terminatedBy: adminId,
        terminatedAt: new Date().toISOString()
      });

      // Create moderation action record
      await convex.mutation(api.admin.moderation.createModerationAction, {
        userId,
        action: "termination",
        reason,
        performedBy: adminId,
        timestamp: new Date().toISOString(),
        details: {}
      });

      // Log termination action
      await adminAuthService.logAdminAction(adminId, {
        action: "user_terminated",
        resource: "users",
        resourceId: userId,
        details: { 
          userEmail: userInfo.email,
          reason
        },
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to terminate user");
    }
  }

  // Private helper methods

  private calculateUserRiskScore(
    basicInfo: UserBasicInfo,
    activityMetrics: UserActivityMetrics | null,
    moderationHistory: ModerationAction[]
  ): number {
    let riskScore = 0;

    // Account age factor (newer accounts are slightly riskier)
    const accountAge = Date.now() - new Date(basicInfo.createdAt).getTime();
    const daysSinceCreation = accountAge / (1000 * 60 * 60 * 24);
    if (daysSinceCreation < 7) riskScore += 10;
    else if (daysSinceCreation < 30) riskScore += 5;

    // Activity factors
    if (activityMetrics) {
      // Low engagement is riskier
      if (activityMetrics.engagementScore < 0.3) riskScore += 15;
      else if (activityMetrics.engagementScore < 0.5) riskScore += 10;

      // No recent activity
      if (activityMetrics.lastLogin) {
        const daysSinceLogin = (Date.now() - new Date(activityMetrics.lastLogin).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceLogin > 30) riskScore += 10;
        else if (daysSinceLogin > 7) riskScore += 5;
      } else {
        riskScore += 20; // Never logged in
      }
    } else {
      riskScore += 25; // No activity data
    }

    // Moderation history
    const recentModerationActions = moderationHistory.filter(
      action => Date.now() - new Date(action.timestamp).getTime() < 30 * 24 * 60 * 60 * 1000 // Last 30 days
    );

    riskScore += recentModerationActions.length * 20;

    // Warnings and suspensions carry more weight
    const warnings = moderationHistory.filter(action => action.action === "warning").length;
    const suspensions = moderationHistory.filter(action => action.action === "suspension").length;
    
    riskScore += warnings * 10;
    riskScore += suspensions * 30;

    // Cap at 100
    return Math.min(riskScore, 100);
  }
}

// Export singleton instance
export const userManagementService = new UserManagementService();