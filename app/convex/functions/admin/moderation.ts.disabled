// Admin Moderation Functions

import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";

// ============================================================================
// Moderation Actions
// ============================================================================

export const createModerationAction = mutation({
  args: {
    userId: v.id("users"),
    action: v.union(
      v.literal("warning"),
      v.literal("suspension"),
      v.literal("termination"),
      v.literal("content_removal")
    ),
    reason: v.string(),
    duration: v.optional(v.number()),
    performedBy: v.id("adminUsers"),
    timestamp: v.string(),
    details: v.any()
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would be stored in a dedicated moderation actions table
    // For now, we'll create a record in the moderation queue as a placeholder

    const moderationRecord = await ctx.db.insert("moderationQueue", {
      itemType: "user_report",
      itemId: args.userId,
      priority: "medium",
      status: "approved", // Since this is a completed action
      assignedTo: args.performedBy,
      content: {
        action: args.action,
        reason: args.reason,
        duration: args.duration,
        details: args.details
      },
      flags: [args.action],
      reviewNotes: args.reason,
      decision: "approved",
      decisionReason: args.reason,
      createdAt: args.timestamp,
      assignedAt: args.timestamp,
      reviewedAt: args.timestamp,
      autoFlagged: false
    });

    return {
      id: moderationRecord,
      action: args.action,
      reason: args.reason,
      duration: args.duration,
      performedBy: args.performedBy,
      timestamp: args.timestamp,
      details: args.details
    };
  }
});

export const getModerationHistory = query({
  args: {
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("moderationQueue");

    if (args.userId) {
      query = query.filter((q: any) => q.eq(q.field("itemId"), args.userId));
    }

    const moderationRecords = await query
      .order("desc")
      .take(args.limit || 50);

    return moderationRecords.map(record => ({
      id: record._id,
      action: record.content?.action || "unknown",
      reason: record.reviewNotes || record.content?.reason || "",
      duration: record.content?.duration,
      performedBy: record.assignedTo!,
      timestamp: record.reviewedAt || record.createdAt,
      details: record.content?.details || {}
    }));
  }
});

// ============================================================================
// Content Moderation Queue
// ============================================================================

export const getModerationQueue = query({
  args: {
    itemType: v.optional(v.union(
      v.literal("custom_exercise"),
      v.literal("trainer_message"),
      v.literal("user_report"),
      v.literal("program_content"),
      v.literal("user_profile")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("escalated")
    )),
    priority: v.optional(v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    )),
    assignedTo: v.optional(v.id("adminUsers")),
    autoFlagged: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("moderationQueue");

    // Apply filters
    if (args.itemType) {
      query = query.filter((q: any) => q.eq(q.field("itemType"), args.itemType));
    }

    if (args.status) {
      query = query.filter((q: any) => q.eq(q.field("status"), args.status));
    }

    if (args.priority) {
      query = query.filter((q: any) => q.eq(q.field("priority"), args.priority));
    }

    if (args.assignedTo) {
      query = query.filter((q: any) => q.eq(q.field("assignedTo"), args.assignedTo));
    }

    if (args.autoFlagged !== undefined) {
      query = query.filter((q: any) => q.eq(q.field("autoFlagged"), args.autoFlagged));
    }

    // Get total count for pagination
    const allItems = await query.collect();
    const total = allItems.length;

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;

    const items = await query
      .order("desc")
      .take(limit + offset);

    const paginatedItems = items.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      items: paginatedItems,
      total,
      hasMore
    };
  }
});

export const getModerationItem = query({
  args: {
    itemId: v.string()
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.query("moderationQueue")
      .filter((q: any) => q.eq(q.field("itemId"), args.itemId))
      .first();

    return item;
  }
});

export const assignModerationItem = mutation({
  args: {
    itemId: v.string(),
    assignedTo: v.id("adminUsers"),
    assignedBy: v.id("adminUsers"),
    assignedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Find the moderation item by itemId
    const item = await ctx.db.query("moderationQueue")
      .filter((q: any) => q.eq(q.field("itemId"), args.itemId))
      .first();

    if (!item) {
      throw new ConvexError("Moderation item not found");
    }

    await ctx.db.patch(item._id, {
      assignedTo: args.assignedTo,
      assignedAt: args.assignedAt,
      status: "under_review"
    });

    return { success: true };
  }
});

export const reviewContent = mutation({
  args: {
    itemId: v.string(),
    decision: v.union(v.literal("approve"), v.literal("reject"), v.literal("modify"), v.literal("escalate")),
    reason: v.string(),
    modifications: v.optional(v.any()),
    followUpActions: v.optional(v.array(v.string())),
    notifyUser: v.boolean(),
    reviewedBy: v.id("adminUsers"),
    reviewedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Find the moderation item by itemId
    const item = await ctx.db.query("moderationQueue")
      .filter(q => q.eq(q.field("itemId"), args.itemId))
      .first();

    if (!item) {
      throw new ConvexError("Moderation item not found");
    }

    const statusMap = {
      approve: "approved",
      reject: "rejected",
      modify: "approved", // Modified content is approved
      escalate: "escalated"
    } as const;

    await ctx.db.patch(item._id, {
      status: statusMap[args.decision],
      decision: args.decision,
      decisionReason: args.reason,
      reviewedAt: args.reviewedAt,
      reviewNotes: args.reason
    });

    // Handle follow-up actions
    if (args.followUpActions && args.followUpActions.length > 0) {
      // In a real implementation, this would trigger the appropriate actions
      // For now, we'll just log them
    }

    return { success: true };
  }
});

export const reviewModerationItem = mutation({
  args: {
    itemId: v.id("moderationQueue"),
    decision: v.union(v.literal("approve"), v.literal("reject"), v.literal("modify"), v.literal("escalate")),
    reason: v.string(),
    modifications: v.optional(v.any()),
    followUpActions: v.optional(v.array(v.string())),
    notifyUser: v.boolean(),
    reviewedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    const statusMap = {
      approve: "approved",
      reject: "rejected",
      modify: "approved", // Modified content is approved
      escalate: "escalated"
    } as const;

    await ctx.db.patch(args.itemId, {
      status: statusMap[args.decision],
      decision: args.decision,
      decisionReason: args.reason,
      reviewedAt: new Date().toISOString(),
      reviewNotes: args.reason
    });

    // Handle follow-up actions
    if (args.followUpActions && args.followUpActions.length > 0) {
      // In a real implementation, this would trigger the appropriate actions
      // For now, we'll just log them
    }

    return { success: true };
  }
});

export const createModerationItem = mutation({
  args: {
    itemType: v.union(
      v.literal("custom_exercise"),
      v.literal("trainer_message"),
      v.literal("user_report"),
      v.literal("program_content"),
      v.literal("user_profile")
    ),
    itemId: v.string(),
    content: v.any(),
    reportedBy: v.optional(v.id("users")),
    reportReason: v.optional(v.string()),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    status: v.union(v.literal("pending"), v.literal("under_review"), v.literal("approved"), v.literal("rejected"), v.literal("escalated")),
    autoFlagged: v.boolean(),
    createdAt: v.string()
  },
  handler: async (ctx, args) => {
    const moderationItemId = await ctx.db.insert("moderationQueue", {
      itemType: args.itemType,
      itemId: args.itemId,
      reportedBy: args.reportedBy,
      reportReason: args.reportReason,
      priority: args.priority,
      status: args.status,
      content: args.content,
      flags: [], // Will be populated by automated systems
      createdAt: args.createdAt,
      autoFlagged: args.autoFlagged
    });

    return moderationItemId;
  }
});

export const escalateModerationItem = mutation({
  args: {
    itemId: v.string(),
    escalationReason: v.string(),
    escalatedBy: v.id("adminUsers"),
    escalatedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Find the moderation item by itemId
    const item = await ctx.db.query("moderationQueue")
      .filter(q => q.eq(q.field("itemId"), args.itemId))
      .first();

    if (!item) {
      throw new ConvexError("Moderation item not found");
    }

    await ctx.db.patch(item._id, {
      status: "escalated",
      escalatedAt: args.escalatedAt,
      reviewNotes: args.escalationReason
    });

    return { success: true };
  }
});

// ============================================================================
// Content Policy Management
// ============================================================================

export const getContentPolicies = query({
  args: {},
  handler: async (ctx, args) => {
    // In a real implementation, this would query a content policies table
    // For now, returning some default policies
    return [
      {
        type: "inappropriate_language",
        rules: [
          {
            name: "Profanity Filter",
            description: "Detect and flag profane language",
            keywords: ["inappropriate", "offensive"],
            threshold: 0.8,
            action: "flag"
          }
        ],
        autoEnforcement: true,
        severity: "warning"
      },
      {
        type: "spam_content",
        rules: [
          {
            name: "Repetitive Content",
            description: "Detect repetitive or spam-like content",
            threshold: 0.9,
            action: "auto_reject"
          }
        ],
        autoEnforcement: true,
        severity: "content_removal"
      }
    ];
  }
});

export const updateContentPolicy = mutation({
  args: {
    policyType: v.string(),
    rules: v.array(v.any()),
    autoEnforcement: v.boolean(),
    severity: v.union(v.literal("warning"), v.literal("content_removal"), v.literal("account_suspension"))
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would update the content policies table
    return { success: true };
  }
});

// ============================================================================
// Automated Content Filtering
// ============================================================================

export const flagContent = mutation({
  args: {
    contentType: v.union(
      v.literal("custom_exercise"),
      v.literal("trainer_message"),
      v.literal("user_profile")
    ),
    contentId: v.string(),
    content: v.any(),
    flags: v.array(v.string()),
    confidenceScore: v.optional(v.number()),
    reportedBy: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    // Determine priority based on flags and confidence
    let priority: "low" | "medium" | "high" | "urgent" = "medium";

    if (args.flags.includes("inappropriate_language") || args.flags.includes("harassment")) {
      priority = "high";
    }
    if (args.flags.includes("illegal_content") || args.flags.includes("violence")) {
      priority = "urgent";
    }
    if (args.confidenceScore && args.confidenceScore < 0.5) {
      priority = "low";
    }

    const moderationItem = await ctx.db.insert("moderationQueue", {
      itemType: args.contentType,
      itemId: args.contentId,
      reportedBy: args.reportedBy,
      priority,
      status: "pending",
      content: args.content,
      flags: args.flags,
      createdAt: new Date().toISOString(),
      autoFlagged: !args.reportedBy, // Auto-flagged if no reporter
      confidenceScore: args.confidenceScore
    });

    return {
      success: true,
      moderationItemId: moderationItem,
      priority
    };
  }
});

export const setContentPolicy = mutation({
  args: {
    type: v.string(),
    rules: v.array(v.any()),
    autoEnforcement: v.boolean(),
    severity: v.union(v.literal("warning"), v.literal("content_removal"), v.literal("account_suspension")),
    updatedBy: v.id("adminUsers"),
    updatedAt: v.string()
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would update a content policies table
    // For now, we'll return a mock policy ID
    return `policy_${args.type}_${Date.now()}`;
  }
});

export const getContentAnalytics = query({
  args: {
    startDate: v.string(),
    endDate: v.string()
  },
  handler: async (ctx, args) => {
    const { startDate, endDate } = args;

    let query = ctx.db.query("moderationQueue");

    // Use narrowed locals to keep TypeScript happy when used inside the query
    const sd = startDate;
    const ed = endDate;
    query = query.filter(q =>
      q.and(
        q.gte(q.field("createdAt"), sd),
        q.lte(q.field("createdAt"), ed)
      )
    );

    const allItems = await query.collect();

    // Calculate average review time
    const reviewedItems = allItems.filter(item => item.reviewedAt && item.createdAt);
    let averageReviewTime = 0;

    if (reviewedItems.length > 0) {
      const totalReviewTime = reviewedItems.reduce((sum, item) => {
        const created = new Date(item.createdAt).getTime();
        const reviewed = new Date(item.reviewedAt!).getTime();
        return sum + (reviewed - created);
      }, 0);
      averageReviewTime = totalReviewTime / reviewedItems.length / (1000 * 60 * 60); // Convert to hours
    }

    const analytics = {
      totalItems: allItems.length,
      pendingReview: allItems.filter(item => item.status === "pending").length,
      approvedToday: allItems.filter(item =>
        item.status === "approved" &&
        item.reviewedAt &&
        new Date(item.reviewedAt).toDateString() === new Date().toDateString()
      ).length,
      rejectedToday: allItems.filter(item =>
        item.status === "rejected" &&
        item.reviewedAt &&
        new Date(item.reviewedAt).toDateString() === new Date().toDateString()
      ).length,
      averageReviewTime,
      flaggedByAI: allItems.filter(item => item.autoFlagged && item.confidenceScore).length,
      escalatedItems: allItems.filter(item => item.status === "escalated").length
    };

    return analytics;
  }
});

export const automateContentFiltering = mutation({
  args: {
    rules: v.array(v.any()),
    appliedBy: v.id("adminUsers"),
    appliedAt: v.string()
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would apply filtering rules to existing content
    // For now, we'll return mock results
    return {
      rulesApplied: args.rules.length,
      itemsFlagged: Math.floor(Math.random() * 10) // Mock number of items flagged
    };
  }
});

export const updateUserReport = mutation({
  args: {
    reportId: v.string(),
    findings: v.string(),
    evidence: v.array(v.string()),
    recommendation: v.union(v.literal("dismiss"), v.literal("warn"), v.literal("suspend"), v.literal("terminate")),
    followUpRequired: v.boolean(),
    investigatedBy: v.id("adminUsers"),
    investigatedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Find the report in moderation queue
    const report = await ctx.db.query("moderationQueue")
      .filter((q: any) => q.eq(q.field("itemId"), args.reportId))
      .first();

    if (!report) {
      throw new ConvexError("User report not found");
    }

    await ctx.db.patch(report._id, {
      reviewNotes: args.findings,
      decision: args.recommendation,
      decisionReason: args.findings,
      reviewedAt: args.investigatedAt,
      status: args.recommendation === "dismiss" ? "approved" : "rejected"
    });

    return { success: true };
  }
});

export const getModerationStats = query({
  args: {
    timeframe: v.optional(v.object({
      start: v.string(),
      end: v.string()
    }))
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("moderationQueue");

    if (args.timeframe) {
      const { start, end } = args.timeframe;
      query = query.filter(q =>
        q.and(
          q.gte(q.field("createdAt"), start),
          q.lte(q.field("createdAt"), end)
        )
      );
    }

    const allItems = await query.collect();

    const stats = {
      totalItems: allItems.length,
      pendingReview: allItems.filter(item => item.status === "pending").length,
      underReview: allItems.filter(item => item.status === "under_review").length,
      approved: allItems.filter(item => item.status === "approved").length,
      rejected: allItems.filter(item => item.status === "rejected").length,
      escalated: allItems.filter(item => item.status === "escalated").length,
      autoFlagged: allItems.filter(item => item.autoFlagged).length,
      averageReviewTime: 0, // Would need to calculate based on timestamps
      flaggedByAI: allItems.filter(item => item.autoFlagged && item.confidenceScore).length
    };

    return stats;
  }
});

// ============================================================================
// Content-Specific Moderation Actions
// ============================================================================

export const approveCustomExercise = mutation({
  args: {
    exerciseId: v.string(),
    approvedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would update the exercise status
    // For now, we'll just return success
    return { success: true };
  }
});

export const rejectCustomExercise = mutation({
  args: {
    exerciseId: v.string(),
    reason: v.string(),
    rejectedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would update the exercise status
    // For now, we'll just return success
    return { success: true };
  }
});

export const modifyCustomExercise = mutation({
  args: {
    exerciseId: v.string(),
    modifications: v.any(),
    modifiedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would apply modifications to the exercise
    // For now, we'll just return success
    return { success: true };
  }
});

export const approveMessage = mutation({
  args: {
    messageId: v.string(),
    approvedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would update the message status
    // For now, we'll just return success
    return { success: true };
  }
});

export const rejectMessage = mutation({
  args: {
    messageId: v.string(),
    reason: v.string(),
    rejectedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would update the message status
    // For now, we'll just return success
    return { success: true };
  }
});

export const modifyMessage = mutation({
  args: {
    messageId: v.string(),
    modifications: v.any(),
    modifiedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would apply modifications to the message
    // For now, we'll just return success
    return { success: true };
  }
});

export const approveProfile = mutation({
  args: {
    profileId: v.string(),
    approvedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would update the profile status
    // For now, we'll just return success
    return { success: true };
  }
});

export const rejectProfile = mutation({
  args: {
    profileId: v.string(),
    reason: v.string(),
    rejectedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would update the profile status
    // For now, we'll just return success
    return { success: true };
  }
});

export const modifyProfile = mutation({
  args: {
    profileId: v.string(),
    modifications: v.any(),
    modifiedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would apply modifications to the profile
    // For now, we'll just return success
    return { success: true };
  }
});

// ============================================================================
// User Report Handling and Investigation System
// ============================================================================

export const createUserReport = mutation({
  args: {
    reportedUserId: v.id("users"),
    reportedBy: v.id("users"),
    reportType: v.union(
      v.literal("harassment"),
      v.literal("inappropriate_content"),
      v.literal("spam"),
      v.literal("fake_profile"),
      v.literal("safety_concern"),
      v.literal("other")
    ),
    reason: v.string(),
    description: v.string(),
    evidence: v.optional(v.array(v.string())), // URLs to screenshots, messages, etc.
    relatedContentId: v.optional(v.string()), // ID of related content (message, exercise, etc.)
    createdAt: v.string()
  },
  handler: async (ctx, args) => {
    // Create a moderation item for the user report
    const moderationItemId = await ctx.db.insert("moderationQueue", {
      itemType: "user_report",
      itemId: `report_${Date.now()}`, // Generate unique report ID
      reportedBy: args.reportedBy,
      reportReason: args.reason,
      priority: args.reportType === "harassment" || args.reportType === "safety_concern" ? "high" : "medium",
      status: "pending",
      content: {
        reportedUserId: args.reportedUserId,
        reportType: args.reportType,
        description: args.description,
        evidence: args.evidence,
        relatedContentId: args.relatedContentId
      },
      flags: [args.reportType],
      createdAt: args.createdAt,
      autoFlagged: false
    });

    return moderationItemId;
  }
});

export const getUserReports = query({
  args: {
    userId: v.optional(v.id("users")),
    reportType: v.optional(v.union(
      v.literal("harassment"),
      v.literal("inappropriate_content"),
      v.literal("spam"),
      v.literal("fake_profile"),
      v.literal("safety_concern"),
      v.literal("other")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("under_review"),
      v.literal("resolved"),
      v.literal("dismissed")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("moderationQueue")
      .filter(q => q.eq(q.field("itemType"), "user_report"));

    // Apply filters
    if (args.userId) {
      query = query.filter(q => q.eq(q.field("content.reportedUserId"), args.userId));
    }

    if (args.reportType) {
      query = query.filter(q => q.eq(q.field("content.reportType"), args.reportType));
    }

    if (args.status) {
      const statusMap: Record<string, string> = {
        pending: "pending",
        under_review: "under_review",
        resolved: "approved",
        dismissed: "rejected"
      };
      const mapped = statusMap[args.status as string];
      if (mapped) {
        query = query.filter(q => q.eq(q.field("status"), mapped));
      }
    }

    // Get total count for pagination
    const allItems = await query.collect();
    const total = allItems.length;

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;

    const items = await query
      .order("desc")
      .take(limit + offset);

    const paginatedItems = items.slice(offset, offset + limit);
    const hasMore = offset + limit < total;

    return {
      reports: paginatedItems,
      total,
      hasMore
    };
  }
});

export const investigateUserReport = mutation({
  args: {
    reportId: v.string(),
    investigatorId: v.id("adminUsers"),
    investigationNotes: v.string(),
    findings: v.string(),
    evidence: v.array(v.string()),
    recommendation: v.union(
      v.literal("dismiss"),
      v.literal("warn_user"),
      v.literal("suspend_user"),
      v.literal("ban_user"),
      v.literal("remove_content"),
      v.literal("escalate")
    ),
    actionTaken: v.optional(v.string()),
    followUpRequired: v.boolean(),
    investigatedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Find the report in moderation queue
    const report = await ctx.db.query("moderationQueue")
      .filter(q => q.eq(q.field("itemId"), args.reportId))
      .first();

    if (!report) {
      throw new ConvexError("User report not found");
    }

    // Update the report with investigation results
    await ctx.db.patch(report._id, {
      status: args.recommendation === "dismiss" ? "rejected" : "approved",
      assignedTo: args.investigatorId,
      reviewNotes: args.investigationNotes,
      decision: args.recommendation,
      decisionReason: args.findings,
      reviewedAt: args.investigatedAt,
      content: {
        ...report.content,
        investigation: {
          investigatorId: args.investigatorId,
          findings: args.findings,
          evidence: args.evidence,
          recommendation: args.recommendation,
          actionTaken: args.actionTaken,
          followUpRequired: args.followUpRequired,
          investigatedAt: args.investigatedAt
        }
      }
    });

    return { success: true };
  }
});

export const flagInappropriateContentAuto = mutation({
  args: {
    contentId: v.string(),
    contentType: v.union(
      v.literal("message"),
      v.literal("exercise"),
      v.literal("profile"),
      v.literal("review")
    ),
    contentData: v.any(),
    flagReason: v.string(),
    confidenceScore: v.number(),
    detectionMethod: v.string(), // "keyword_filter", "ml_model", "user_report", etc.
    createdAt: v.string()
  },
  handler: async (ctx, args) => {
    // Determine priority based on confidence score and flag reason
    let priority: "low" | "medium" | "high" | "urgent" = "medium";

    if (args.confidenceScore >= 0.9) {
      priority = "high";
    } else if (args.confidenceScore >= 0.7) {
      priority = "medium";
    } else {
      priority = "low";
    }

    // High-risk content gets urgent priority
    if (args.flagReason.includes("harassment") || args.flagReason.includes("threat")) {
      priority = "urgent";
    }

    const moderationItemId = await ctx.db.insert("moderationQueue", {
      itemType: args.contentType === "message" ? "trainer_message" :
        args.contentType === "exercise" ? "custom_exercise" : "user_profile",
      itemId: args.contentId,
      priority,
      status: "pending",
      content: args.contentData,
      flags: [args.flagReason],
      createdAt: args.createdAt,
      autoFlagged: true,
      confidenceScore: args.confidenceScore
    });

    return {
      success: true,
      moderationItemId,
      priority
    };
  }
});

export const getModerationActions = query({
  args: {
    userId: v.optional(v.id("users")),
    actionType: v.optional(v.union(
      v.literal("warning"),
      v.literal("suspension"),
      v.literal("ban"),
      v.literal("content_removal")
    )),
    performedBy: v.optional(v.id("adminUsers")),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    // For now, we'll query the moderation queue for completed actions
    // In a real implementation, this would be a separate moderationActions table
    let query = ctx.db.query("moderationQueue")
      .filter(q => q.neq(q.field("status"), "pending"));

    if (args.userId) {
      query = query.filter(q => q.eq(q.field("content.reportedUserId"), args.userId));
    }

    if (args.performedBy) {
      query = query.filter(q => q.eq(q.field("assignedTo"), args.performedBy));
    }

    const startDate = args.startDate;
    const endDate = args.endDate;
    if (startDate) {
      const s = startDate;
      query = query.filter(q => q.gte(q.field("reviewedAt"), s));
    }

    if (endDate) {
      const e = endDate;
      query = query.filter(q => q.lte(q.field("reviewedAt"), e));
    }

    const actions = await query
      .order("desc")
      .take(args.limit || 100);

    return actions.map(action => ({
      id: action._id,
      userId: action.content?.reportedUserId,
      actionType: action.decision,
      reason: action.decisionReason,
      performedBy: action.assignedTo,
      performedAt: action.reviewedAt,
      details: action.content
    }));
  }
});

export const createModerationAppeal = mutation({
  args: {
    originalActionId: v.string(),
    userId: v.id("users"),
    appealReason: v.string(),
    additionalEvidence: v.optional(v.array(v.string())),
    createdAt: v.string()
  },
  handler: async (ctx, args) => {
    // Create a new moderation item for the appeal
    const appealId = await ctx.db.insert("moderationQueue", {
      itemType: "user_report",
      itemId: `appeal_${args.originalActionId}_${Date.now()}`,
      priority: "medium",
      status: "pending",
      content: {
        appealType: "moderation_appeal",
        originalActionId: args.originalActionId,
        userId: args.userId,
        appealReason: args.appealReason,
        additionalEvidence: args.additionalEvidence
      },
      flags: ["appeal"],
      createdAt: args.createdAt,
      autoFlagged: false
    });

    return appealId;
  }
});

export const getContentAnalyticsDetailed = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
    contentType: v.optional(v.union(
      v.literal("custom_exercise"),
      v.literal("trainer_message"),
      v.literal("user_report"),
      v.literal("program_content"),
      v.literal("user_profile")
    ))
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("moderationQueue");

    const start = args.startDate;
    const end = args.endDate;
    query = query.filter(q =>
      q.and(
        q.gte(q.field("createdAt"), start),
        q.lte(q.field("createdAt"), end)
      )
    );

    if (args.contentType) {
      query = query.filter(q => q.eq(q.field("itemType"), args.contentType));
    }

    const allItems = await query.collect();

    // Calculate detailed analytics
    const analytics = {
      totalItems: allItems.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      autoFlagged: allItems.filter(item => item.autoFlagged).length,
      manualReports: allItems.filter(item => !item.autoFlagged).length,
      averageResolutionTime: 0,
      topFlags: {} as Record<string, number>,
      escalationRate: 0,
      appealRate: 0
    };

    // Count by type
    allItems.forEach(item => {
      analytics.byType[item.itemType] = (analytics.byType[item.itemType] || 0) + 1;
      analytics.byStatus[item.status] = (analytics.byStatus[item.status] || 0) + 1;
      analytics.byPriority[item.priority] = (analytics.byPriority[item.priority] || 0) + 1;

      // Count flags
      item.flags.forEach(flag => {
        analytics.topFlags[flag] = (analytics.topFlags[flag] || 0) + 1;
      });
    });

    // Calculate resolution time
    const resolvedItems = allItems.filter(item => item.reviewedAt && item.createdAt);
    if (resolvedItems.length > 0) {
      const totalResolutionTime = resolvedItems.reduce((sum, item) => {
        const created = new Date(item.createdAt).getTime();
        const resolved = new Date(item.reviewedAt!).getTime();
        return sum + (resolved - created);
      }, 0);
      analytics.averageResolutionTime = totalResolutionTime / resolvedItems.length / (1000 * 60 * 60); // Convert to hours
    }

    // Calculate escalation rate
    const escalatedItems = allItems.filter(item => item.status === "escalated");
    analytics.escalationRate = allItems.length > 0 ? (escalatedItems.length / allItems.length) * 100 : 0;

    // Calculate appeal rate (items with "appeal" flag)
    const appealItems = allItems.filter(item => item.flags.includes("appeal"));
    analytics.appealRate = allItems.length > 0 ? (appealItems.length / allItems.length) * 100 : 0;

    return analytics;
  }
});