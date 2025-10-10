// Content Moderation Service for Admin Dashboard

import { ConvexError } from "convex/values";
import type { 
  ModerationItem,
  ModerationDecision,
  ContentPolicy,
  PolicyRule,
  Investigation,
  ContentAnalytics,
  TimeFrame
} from "../types/admin";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import { convex } from "$lib/convex";
import { adminAuthService } from "./adminAuth";

export class ContentModerationService {
  /**
   * Get moderation queue items with filtering and pagination
   */
  async getModerationQueue(
    filters: {
      itemType?: "custom_exercise" | "trainer_message" | "user_report" | "program_content" | "user_profile";
      status?: "pending" | "under_review" | "approved" | "rejected" | "escalated";
      priority?: "low" | "medium" | "high" | "urgent";
      assignedTo?: Id<"adminUsers">;
      autoFlagged?: boolean;
    },
    adminId: Id<"adminUsers">,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ items: ModerationItem[]; total: number; hasMore: boolean }> {
    try {
      // Validate admin permissions
      const canViewModeration = await adminAuthService.validateAdminPermissions(adminId, "read", "content_moderation");
      if (!canViewModeration) {
        throw new ConvexError("Insufficient permissions to view moderation queue");
      }

      const result = await convex.query(api.functions.admin.moderation.getModerationQueue, {
        itemType: filters.itemType,
        status: filters.status,
        priority: filters.priority,
        assignedTo: filters.assignedTo,
        autoFlagged: filters.autoFlagged,
        limit,
        offset
      }) as { items: ModerationItem[]; total: number; hasMore: boolean };

      // Log moderation queue access
      await adminAuthService.logAdminAction(adminId, {
        action: "moderation_queue_viewed",
        resource: "content_moderation",
        details: { 
          filters,
          resultCount: result.items.length 
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get moderation queue");
    }
  }

  /**
   * Review content item and make moderation decision
   */
  async reviewContent(
    itemId: string,
    decision: ModerationDecision,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate admin permissions
      const canModerateContent = await adminAuthService.validateAdminPermissions(adminId, "moderate", "content");
      if (!canModerateContent) {
        throw new ConvexError("Insufficient permissions to moderate content");
      }

      // Get the moderation item
      const item = await convex.query(api.functions.admin.moderation.getModerationItem, { itemId }) as ModerationItem | null;
      if (!item) {
        throw new ConvexError("Moderation item not found");
      }

      // Update moderation item with decision
      await convex.mutation(api.functions.admin.moderation.reviewContent, {
        itemId,
        decision: decision.decision,
        reason: decision.reason,
        modifications: decision.modifications,
        followUpActions: decision.followUpActions,
        notifyUser: decision.notifyUser,
        reviewedBy: adminId,
        reviewedAt: new Date().toISOString()
      });

      // Execute the moderation decision
      await this.executeModerationDecision(item, decision, adminId);

      // Log moderation action
      await adminAuthService.logAdminAction(adminId, {
        action: "content_moderated",
        resource: "content_moderation",
        resourceId: itemId,
        details: { 
          itemType: item.itemType,
          decision: decision.decision,
          reason: decision.reason,
          notifyUser: decision.notifyUser
        },
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to review content");
    }
  }

  /**
   * Flag inappropriate content for review
   */
  async flagInappropriateContent(
    contentId: string,
    contentType: "custom_exercise" | "trainer_message" | "user_profile",
    reason: string,
    reportedBy?: Id<"users">,
    adminId?: Id<"adminUsers">
  ): Promise<{ moderationItemId: string }> {
    try {
      // Get the content to be flagged
      const content = await this.getContentForModeration(contentId, contentType);
      if (!content) {
        throw new ConvexError("Content not found");
      }

      // Determine priority based on reason and content type
      const priority = this.determinePriority(reason, contentType);

      // Create moderation item
      const moderationItemId = await convex.mutation(api.functions.admin.moderation.createModerationItem, {
        itemType: contentType,
        itemId: contentId,
        content,
        reportedBy,
        reportReason: reason,
        priority,
        status: "pending",
        autoFlagged: !reportedBy && !adminId,
        createdAt: new Date().toISOString()
      }) as string;

      // Log flagging action
      if (adminId) {
        await adminAuthService.logAdminAction(adminId, {
          action: "content_flagged",
          resource: "content_moderation",
          resourceId: moderationItemId,
          details: { 
            contentId,
            contentType,
            reason,
            reportedBy
          },
          ipAddress: "system",
          userAgent: "system"
        });
      }

      return { moderationItemId };

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to flag inappropriate content");
    }
  }

  /**
   * Handle user report and create investigation
   */
  async handleUserReport(
    reportId: string,
    investigation: Investigation,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate admin permissions
      const canHandleReports = await adminAuthService.validateAdminPermissions(adminId, "investigate", "user_reports");
      if (!canHandleReports) {
        throw new ConvexError("Insufficient permissions to handle user reports");
      }

      // Update the report with investigation findings
      await convex.mutation(api.functions.admin.moderation.updateUserReport, {
        reportId,
        findings: investigation.findings,
        evidence: investigation.evidence,
        recommendation: investigation.recommendation,
        followUpRequired: investigation.followUpRequired,
        investigatedBy: adminId,
        investigatedAt: new Date().toISOString()
      });

      // Execute recommended action if specified
      if (investigation.recommendation !== "dismiss") {
        await this.executeInvestigationRecommendation(reportId, investigation, adminId);
      }

      // Log investigation action
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
      throw new ConvexError("Failed to handle user report");
    }
  }

  /**
   * Set or update content policy
   */
  async setContentPolicy(
    policy: ContentPolicy,
    adminId: Id<"adminUsers">
  ): Promise<{ policyId: string }> {
    try {
      // Validate admin permissions
      const canManagePolicies = await adminAuthService.validateAdminPermissions(adminId, "write", "content_policies");
      if (!canManagePolicies) {
        throw new ConvexError("Insufficient permissions to manage content policies");
      }

      // Create or update content policy
      const policyId = await convex.mutation(api.functions.admin.moderation.setContentPolicy, {
        type: policy.type,
        rules: policy.rules,
        autoEnforcement: policy.autoEnforcement,
        severity: policy.severity,
        updatedBy: adminId,
        updatedAt: new Date().toISOString()
      }) as string;

      // Log policy update
      await adminAuthService.logAdminAction(adminId, {
        action: "content_policy_updated",
        resource: "content_policies",
        resourceId: policyId,
        details: { 
          policyType: policy.type,
          rulesCount: policy.rules.length,
          autoEnforcement: policy.autoEnforcement,
          severity: policy.severity
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return { policyId };

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to set content policy");
    }
  }

  /**
   * Get content analytics for moderation dashboard
   */
  async getContentAnalytics(
    timeframe: TimeFrame,
    adminId: Id<"adminUsers">
  ): Promise<ContentAnalytics> {
    try {
      // Validate admin permissions
      const canViewAnalytics = await adminAuthService.validateAdminPermissions(adminId, "read", "content_analytics");
      if (!canViewAnalytics) {
        throw new ConvexError("Insufficient permissions to view content analytics");
      }

      const analytics = await convex.query(api.functions.admin.moderation.getContentAnalytics, {
        startDate: timeframe.start,
        endDate: timeframe.end
      }) as ContentAnalytics;

      // Log analytics access
      await adminAuthService.logAdminAction(adminId, {
        action: "content_analytics_viewed",
        resource: "content_analytics",
        details: { timeframe },
        ipAddress: "system",
        userAgent: "system"
      });

      return analytics;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to get content analytics");
    }
  }

  /**
   * Automate content filtering with rules
   */
  async automateContentFiltering(
    rules: PolicyRule[],
    adminId: Id<"adminUsers">
  ): Promise<{ rulesApplied: number; itemsFlagged: number }> {
    try {
      // Validate admin permissions
      const canAutomateFiltering = await adminAuthService.validateAdminPermissions(adminId, "automate", "content_filtering");
      if (!canAutomateFiltering) {
        throw new ConvexError("Insufficient permissions to automate content filtering");
      }

      const result = await convex.mutation(api.functions.admin.moderation.automateContentFiltering, {
        rules,
        appliedBy: adminId,
        appliedAt: new Date().toISOString()
      }) as { rulesApplied: number; itemsFlagged: number };

      // Log automation setup
      await adminAuthService.logAdminAction(adminId, {
        action: "content_filtering_automated",
        resource: "content_filtering",
        details: { 
          rulesCount: rules.length,
          rulesApplied: result.rulesApplied,
          itemsFlagged: result.itemsFlagged
        },
        ipAddress: "system",
        userAgent: "system"
      });

      return result;

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to automate content filtering");
    }
  }

  /**
   * Assign moderation item to admin
   */
  async assignModerationItem(
    itemId: string,
    assignedTo: Id<"adminUsers">,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate admin permissions
      const canAssignItems = await adminAuthService.validateAdminPermissions(adminId, "assign", "moderation_items");
      if (!canAssignItems) {
        throw new ConvexError("Insufficient permissions to assign moderation items");
      }

      await convex.mutation(api.functions.admin.moderation.assignModerationItem, {
        itemId,
        assignedTo,
        assignedBy: adminId,
        assignedAt: new Date().toISOString()
      });

      // Log assignment
      await adminAuthService.logAdminAction(adminId, {
        action: "moderation_item_assigned",
        resource: "moderation_items",
        resourceId: itemId,
        details: { assignedTo },
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to assign moderation item");
    }
  }

  /**
   * Escalate moderation item to higher authority
   */
  async escalateModerationItem(
    itemId: string,
    escalationReason: string,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    try {
      // Validate admin permissions
      const canEscalate = await adminAuthService.validateAdminPermissions(adminId, "escalate", "moderation_items");
      if (!canEscalate) {
        throw new ConvexError("Insufficient permissions to escalate moderation items");
      }

      await convex.mutation(api.functions.admin.moderation.escalateModerationItem, {
        itemId,
        escalationReason,
        escalatedBy: adminId,
        escalatedAt: new Date().toISOString()
      });

      // Log escalation
      await adminAuthService.logAdminAction(adminId, {
        action: "moderation_item_escalated",
        resource: "moderation_items",
        resourceId: itemId,
        details: { 
          escalationReason,
          escalatedBy: adminId
        },
        ipAddress: "system",
        userAgent: "system"
      });

    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      throw new ConvexError("Failed to escalate moderation item");
    }
  }

  // Private helper methods

  private async executeModerationDecision(
    item: ModerationItem,
    decision: ModerationDecision,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    switch (decision.decision) {
      case "approve":
        await this.approveContent(item, adminId);
        break;
      case "reject":
        await this.rejectContent(item, decision.reason, adminId);
        break;
      case "modify":
        await this.modifyContent(item, decision.modifications, adminId);
        break;
      case "escalate":
        await this.escalateModerationItem(item.id, decision.reason, adminId);
        break;
    }

    // Send notification to user if requested
    if (decision.notifyUser) {
      await this.notifyUserOfModerationDecision(item, decision);
    }
  }

  private async approveContent(item: ModerationItem, adminId: Id<"adminUsers">): Promise<void> {
    // Approve the content based on its type
    switch (item.itemType) {
      case "custom_exercise":
        await convex.mutation(api.functions.admin.moderation.approveCustomExercise, {
          exerciseId: item.itemId,
          approvedBy: adminId
        });
        break;
      case "trainer_message":
        await convex.mutation(api.functions.admin.moderation.approveMessage, {
          messageId: item.itemId,
          approvedBy: adminId
        });
        break;
      case "user_profile":
        await convex.mutation(api.functions.admin.moderation.approveProfile, {
          profileId: item.itemId,
          approvedBy: adminId
        });
        break;
    }
  }

  private async rejectContent(item: ModerationItem, reason: string, adminId: Id<"adminUsers">): Promise<void> {
    // Reject the content based on its type
    switch (item.itemType) {
      case "custom_exercise":
        await convex.mutation(api.functions.admin.moderation.rejectCustomExercise, {
          exerciseId: item.itemId,
          reason,
          rejectedBy: adminId
        });
        break;
      case "trainer_message":
        await convex.mutation(api.functions.admin.moderation.rejectMessage, {
          messageId: item.itemId,
          reason,
          rejectedBy: adminId
        });
        break;
      case "user_profile":
        await convex.mutation(api.functions.admin.moderation.rejectProfile, {
          profileId: item.itemId,
          reason,
          rejectedBy: adminId
        });
        break;
    }
  }

  private async modifyContent(item: ModerationItem, modifications: any, adminId: Id<"adminUsers">): Promise<void> {
    // Apply modifications to content based on its type
    switch (item.itemType) {
      case "custom_exercise":
        await convex.mutation(api.functions.admin.moderation.modifyCustomExercise, {
          exerciseId: item.itemId,
          modifications,
          modifiedBy: adminId
        });
        break;
      case "trainer_message":
        await convex.mutation(api.functions.admin.moderation.modifyMessage, {
          messageId: item.itemId,
          modifications,
          modifiedBy: adminId
        });
        break;
      case "user_profile":
        await convex.mutation(api.functions.admin.moderation.modifyProfile, {
          profileId: item.itemId,
          modifications,
          modifiedBy: adminId
        });
        break;
    }
  }

  private async executeInvestigationRecommendation(
    reportId: string,
    investigation: Investigation,
    adminId: Id<"adminUsers">
  ): Promise<void> {
    // Execute the recommended action from investigation
    switch (investigation.recommendation) {
      case "warn":
        // Issue warning to reported user
        break;
      case "suspend":
        // Suspend reported user
        break;
      case "terminate":
        // Terminate reported user account
        break;
    }
  }

  private async getContentForModeration(contentId: string, contentType: string): Promise<any> {
    // Get content based on type for moderation review
    switch (contentType) {
      case "custom_exercise":
        // For now, return mock exercise data
        return {
          id: contentId,
          name: "Custom Exercise",
          description: "User-created exercise",
          instructions: ["Step 1", "Step 2"],
          category: "strength"
        };
      case "trainer_message":
        // For now, return mock message data
        return {
          id: contentId,
          content: "Trainer message content",
          senderId: "trainer_123",
          receiverId: "client_456",
          timestamp: new Date().toISOString()
        };
      case "user_profile":
        // For now, return mock profile data
        return {
          id: contentId,
          name: "User Name",
          bio: "User bio content",
          profileImage: "image_url"
        };
      default:
        return null;
    }
  }

  private determinePriority(reason: string, contentType: string): "low" | "medium" | "high" | "urgent" {
    // Determine priority based on reason and content type
    const urgentReasons = ["harassment", "threats", "illegal_content", "spam"];
    const highReasons = ["inappropriate_content", "copyright_violation", "misinformation"];
    const mediumReasons = ["quality_issues", "guideline_violation"];

    if (urgentReasons.some(r => reason.toLowerCase().includes(r))) {
      return "urgent";
    } else if (highReasons.some(r => reason.toLowerCase().includes(r))) {
      return "high";
    } else if (mediumReasons.some(r => reason.toLowerCase().includes(r))) {
      return "medium";
    } else {
      return "low";
    }
  }

  private async notifyUserOfModerationDecision(item: ModerationItem, decision: ModerationDecision): Promise<void> {
    // Send notification to user about moderation decision
    // This would integrate with the notification system
    console.log(`Notifying user about moderation decision: ${decision.decision} for ${item.itemType}`);
  }
}

// Export singleton instance
export const contentModerationService = new ContentModerationService();