// Admin Privacy & GDPR Compliance Functions

import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";

// Privacy Tables Schema (to be added to schema.ts)
// privacyRequests: defineTable({
//   userId: v.id("users"),
//   requestType: v.union(v.literal("access"), v.literal("portability"), v.literal("deletion"), v.literal("rectification")),
//   status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("rejected")),
//   handledBy: v.optional(v.id("adminUsers")),
//   requestedAt: v.string(),
//   completedAt: v.optional(v.string()),
//   notes: v.optional(v.string()),
//   estimatedCompletion: v.optional(v.string()),
//   rejectionReason: v.optional(v.string()),
// }).index("by_user", ["userId"])
//   .index("by_type", ["requestType"])
//   .index("by_status", ["status"])
//   .index("by_requested", ["requestedAt"]),

// dataExports: defineTable({
//   userId: v.id("users"),
//   requestedBy: v.id("adminUsers"),
//   exportType: v.union(v.literal("full"), v.literal("basic"), v.literal("deleted")),
//   status: v.union(v.literal("pending"), v.literal("processing"), v.literal("completed"), v.literal("failed")),
//   downloadUrl: v.optional(v.string()),
//   expiresAt: v.optional(v.string()),
//   includeDeleted: v.boolean(),
//   requestedAt: v.string(),
//   completedAt: v.optional(v.string()),
//   fileSize: v.optional(v.number()),
//   errorMessage: v.optional(v.string()),
// }).index("by_user", ["userId"])
//   .index("by_requested_by", ["requestedBy"])
//   .index("by_status", ["status"])
//   .index("by_expires", ["expiresAt"]),

// dataDeletions: defineTable({
//   userId: v.id("users"),
//   deletionType: v.union(v.literal("soft"), v.literal("hard")),
//   deletedBy: v.id("adminUsers"),
//   deletedAt: v.string(),
//   reason: v.string(),
//   deletedRecords: v.number(),
//   backupLocation: v.optional(v.string()),
//   isReversible: v.boolean(),
// }).index("by_user", ["userId"])
//   .index("by_deleted_by", ["deletedBy"])
//   .index("by_deleted_at", ["deletedAt"]),

/**
 * Handle GDPR privacy request
 */
export const handleGDPRRequest = mutation({
  args: {
    userId: v.id("users"),
    requestType: v.union(v.literal("access"), v.literal("portability"), v.literal("deletion"), v.literal("rectification")),
    handledBy: v.id("adminUsers"),
    notes: v.optional(v.string()),
    requestedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Calculate estimated completion time based on request type
    const estimatedDays = {
      access: 30, // 30 days for data access requests
      portability: 30, // 30 days for data portability
      deletion: 30, // 30 days for deletion (with verification period)
      rectification: 15 // 15 days for data rectification
    };

    const estimatedCompletion = new Date(
      Date.now() + estimatedDays[args.requestType] * 24 * 60 * 60 * 1000
    ).toISOString();

    // Create privacy request record
    const requestId = await ctx.db.insert("privacyRequests", {
      userId: args.userId,
      requestType: args.requestType,
      status: "pending",
      handledBy: args.handledBy,
      requestedAt: args.requestedAt,
      notes: args.notes,
      estimatedCompletion
    });

    // For deletion requests, start the process immediately
    if (args.requestType === "deletion") {
      // TODO: Implement automated deletion workflow
      // This would typically involve:
      // 1. Marking user for deletion
      // 2. Sending confirmation email
      // 3. Waiting for confirmation period
      // 4. Executing deletion
    }

    return {
      requestId: requestId,
      status: "pending",
      estimatedCompletion
    };
  }
});

/**
 * Export user data for GDPR compliance
 */
export const exportUserData = mutation({
  args: {
    userId: v.id("users"),
    requestedBy: v.id("adminUsers"),
    includeDeleted: v.boolean(),
    requestedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Create export record
    const exportId = await ctx.db.insert("dataExports", {
      userId: args.userId,
      requestedBy: args.requestedBy,
      exportType: args.includeDeleted ? "deleted" : "full",
      status: "pending",
      includeDeleted: args.includeDeleted,
      requestedAt: args.requestedAt
    });

    // TODO: Trigger background job to collect and export user data
    // This would typically involve:
    // 1. Collecting all user data from various tables
    // 2. Formatting data according to GDPR requirements
    // 3. Creating downloadable file (JSON/CSV)
    // 4. Uploading to secure storage
    // 5. Generating time-limited download URL

    // For now, simulate the process
    const downloadUrl = `https://exports.example.com/${exportId}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    // Update export record with download info
    await ctx.db.patch(exportId, {
      status: "completed",
      downloadUrl,
      expiresAt,
      completedAt: new Date().toISOString(),
      fileSize: 1024 * 1024 // Placeholder file size
    });

    return {
      exportId: exportId,
      downloadUrl,
      expiresAt
    };
  }
});

/**
 * Process user data deletion
 */
export const processUserDataDeletion = mutation({
  args: {
    userId: v.id("users"),
    deletionType: v.union(v.literal("soft"), v.literal("hard")),
    deletedBy: v.id("adminUsers"),
    reason: v.string(),
    deletedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new Error("User not found");
    }

    let deletedRecords = 0;
    let backupLocation: string | undefined;

    if (args.deletionType === "soft") {
      // Soft delete: Mark user as deleted but keep data
      await ctx.db.patch(args.userId, {
        isActive: false,
        deletedAt: args.deletedAt,
        deletedBy: args.deletedBy,
        deletionReason: args.reason
      });
      deletedRecords = 1;
    } else {
      // Hard delete: Actually remove user data
      // TODO: Implement comprehensive data deletion
      // This would involve deleting from all related tables:
      
      // 1. Delete fitness data
      const fitnessData = await ctx.db
        .query("fitnessData")
        .withIndex("by_user_and_type", q => q.eq("userId", args.userId))
        .collect();
      
      for (const data of fitnessData) {
        await ctx.db.delete(data._id);
        deletedRecords++;
      }

      // 2. Delete workout sessions
      const workoutSessions = await ctx.db
        .query("workoutSessions")
        .withIndex("by_user", q => q.eq("userId", args.userId))
        .collect();
      
      for (const session of workoutSessions) {
        await ctx.db.delete(session._id);
        deletedRecords++;
      }

      // 3. Delete user programs
      const userPrograms = await ctx.db
        .query("userPrograms")
        .withIndex("by_user", q => q.eq("userId", args.userId))
        .collect();
      
      for (const program of userPrograms) {
        await ctx.db.delete(program._id);
        deletedRecords++;
      }

      // 4. Delete messages
      const messages = await ctx.db
        .query("trainerClientMessages")
        .filter(q => q.or(
          q.eq(q.field("senderId"), args.userId),
          q.eq(q.field("receiverId"), args.userId)
        ))
        .collect();
      
      for (const message of messages) {
        await ctx.db.delete(message._id);
        deletedRecords++;
      }

      // 5. Delete support tickets and messages
      const supportTickets = await ctx.db
        .query("supportTickets")
        .withIndex("by_user", q => q.eq("userId", args.userId))
        .collect();
      
      for (const ticket of supportTickets) {
        // Delete ticket messages first
        const ticketMessages = await ctx.db
          .query("supportMessages")
          .withIndex("by_ticket", q => q.eq("ticketId", ticket._id))
          .collect();
        
        for (const message of ticketMessages) {
          await ctx.db.delete(message._id);
          deletedRecords++;
        }
        
        await ctx.db.delete(ticket._id);
        deletedRecords++;
      }

      // 6. Finally delete the user record
      await ctx.db.delete(args.userId);
      deletedRecords++;

      // Create backup reference (in real implementation, this would be actual backup)
      backupLocation = `backup://user-${args.userId}-${Date.now()}`;
    }

    // Record the deletion
    const deletionId = await ctx.db.insert("dataDeletions", {
      userId: args.userId,
      deletionType: args.deletionType,
      deletedBy: args.deletedBy,
      deletedAt: args.deletedAt,
      reason: args.reason,
      deletedRecords,
      backupLocation,
      isReversible: args.deletionType === "soft"
    });

    return {
      deletionId,
      deletedRecords,
      isReversible: args.deletionType === "soft"
    };
  }
});

/**
 * Get privacy requests with filtering
 */
export const getPrivacyRequests = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("rejected"))),
    requestType: v.optional(v.union(v.literal("access"), v.literal("portability"), v.literal("deletion"), v.literal("rectification"))),
    handledBy: v.optional(v.id("adminUsers")),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("privacyRequests");

    if (args.status) {
      query = query.filter(q => q.eq(q.field("status"), args.status));
    }

    if (args.requestType) {
      query = query.filter(q => q.eq(q.field("requestType"), args.requestType));
    }

    if (args.handledBy) {
      query = query.filter(q => q.eq(q.field("handledBy"), args.handledBy));
    }

    const requests = await query
      .order("desc")
      .take((args.limit || 50) + 1);

    const hasMore = requests.length > (args.limit || 50);
    const paginatedRequests = requests.slice(0, args.limit || 50);

    // Enrich with user and admin information
    const enrichedRequests = await Promise.all(
      paginatedRequests.map(async (request) => {
        const user = await ctx.db.get(request.userId);
        const handler = request.handledBy ? await ctx.db.get(request.handledBy) : null;
        
        return {
          ...request,
          user: user ? { name: user.name, email: user.email } : null,
          handler: handler ? { name: handler.name, email: handler.email } : null
        };
      })
    );

    return {
      requests: enrichedRequests,
      hasMore
    };
  }
});

/**
 * Update privacy request status
 */
export const updatePrivacyRequestStatus = mutation({
  args: {
    requestId: v.id("privacyRequests"),
    status: v.union(v.literal("pending"), v.literal("in_progress"), v.literal("completed"), v.literal("rejected")),
    notes: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
    updatedBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    const updates: any = {
      status: args.status
    };

    if (args.notes) {
      updates.notes = args.notes;
    }

    if (args.status === "completed") {
      updates.completedAt = new Date().toISOString();
    }

    if (args.status === "rejected" && args.rejectionReason) {
      updates.rejectionReason = args.rejectionReason;
    }

    await ctx.db.patch(args.requestId, updates);
  }
});

/**
 * Get data export status
 */
export const getDataExportStatus = query({
  args: {
    exportId: v.id("dataExports")
  },
  handler: async (ctx, args) => {
    const exportRecord = await ctx.db.get(args.exportId);
    if (!exportRecord) {
      return null;
    }

    // Check if download URL has expired
    if (exportRecord.expiresAt && new Date(exportRecord.expiresAt) < new Date()) {
      await ctx.db.patch(args.exportId, {
        status: "failed",
        errorMessage: "Download link expired"
      });
      
      return {
        ...exportRecord,
        status: "failed" as const,
        errorMessage: "Download link expired"
      };
    }

    return exportRecord;
  }
});

/**
 * Get privacy compliance statistics
 */
export const getPrivacyComplianceStats = query({
  args: {
    timeframe: v.object({
      start: v.string(),
      end: v.string()
    })
  },
  handler: async (ctx, args) => {
    // Get privacy requests in timeframe
    const requests = await ctx.db
      .query("privacyRequests")
      .filter(q => 
        q.and(
          q.gte(q.field("requestedAt"), args.timeframe.start),
          q.lte(q.field("requestedAt"), args.timeframe.end)
        )
      )
      .collect();

    // Get data exports in timeframe
    const exports = await ctx.db
      .query("dataExports")
      .filter(q => 
        q.and(
          q.gte(q.field("requestedAt"), args.timeframe.start),
          q.lte(q.field("requestedAt"), args.timeframe.end)
        )
      )
      .collect();

    // Get deletions in timeframe
    const deletions = await ctx.db
      .query("dataDeletions")
      .filter(q => 
        q.and(
          q.gte(q.field("deletedAt"), args.timeframe.start),
          q.lte(q.field("deletedAt"), args.timeframe.end)
        )
      )
      .collect();

    return {
      totalRequests: requests.length,
      requestsByType: {
        access: requests.filter(r => r.requestType === "access").length,
        portability: requests.filter(r => r.requestType === "portability").length,
        deletion: requests.filter(r => r.requestType === "deletion").length,
        rectification: requests.filter(r => r.requestType === "rectification").length
      },
      requestsByStatus: {
        pending: requests.filter(r => r.status === "pending").length,
        inProgress: requests.filter(r => r.status === "in_progress").length,
        completed: requests.filter(r => r.status === "completed").length,
        rejected: requests.filter(r => r.status === "rejected").length
      },
      dataExports: exports.length,
      dataDeletions: {
        total: deletions.length,
        soft: deletions.filter(d => d.deletionType === "soft").length,
        hard: deletions.filter(d => d.deletionType === "hard").length,
        totalRecordsDeleted: deletions.reduce((sum, d) => sum + d.deletedRecords, 0)
      },
      averageProcessingTime: this.calculateAverageProcessingTime(requests)
    };
  }
});

// Helper function to calculate average processing time
function calculateAverageProcessingTime(requests: any[]): number {
  const completedRequests = requests.filter(r => r.completedAt);
  if (completedRequests.length === 0) return 0;

  const totalTime = completedRequests.reduce((sum, request) => {
    const requested = new Date(request.requestedAt).getTime();
    const completed = new Date(request.completedAt).getTime();
    return sum + (completed - requested);
  }, 0);

  return totalTime / completedRequests.length / (1000 * 60 * 60 * 24); // Convert to days
}