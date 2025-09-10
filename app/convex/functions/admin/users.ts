// Admin User Management Functions

import { v } from "convex/values";
import { query, mutation } from "../../_generated/server";
import { ConvexError } from "convex/values";
import type { Doc, Id } from "../../_generated/dataModel";

// ============================================================================
// User Search and Listing
// ============================================================================

export const searchUsers = query({
  args: {
    query: v.optional(v.string()),
    role: v.optional(v.union(v.literal("client"), v.literal("trainer"), v.literal("admin"))),
    subscriptionStatus: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("cancelled"))),
    activityLevel: v.optional(v.union(v.literal("high"), v.literal("medium"), v.literal("low"), v.literal("inactive"))),
    dateRange: v.optional(v.object({
      start: v.string(),
      end: v.string()
    })),
    limit: v.number(),
    offset: v.number()
  },
  handler: async (ctx, args) => {
    // Build query filters
    let usersQuery = ctx.db.query("users");

    // Apply role filter
    if (args.role) {
      usersQuery = usersQuery.filter(q => q.eq(q.field("role"), args.role));
    }

    // Apply date range filter
    if (args.dateRange) {
      usersQuery = usersQuery.filter(q => 
        q.and(
          q.gte(q.field("createdAt"), args.dateRange!.start),
          q.lte(q.field("createdAt"), args.dateRange!.end)
        )
      );
    }

    // Get users with pagination
    const allUsers = await usersQuery.collect();

    // Apply text search filter if provided
    let filteredUsers = allUsers;
    if (args.query) {
      const searchTerm = args.query.toLowerCase();
      filteredUsers = allUsers.filter(user => 
        user.email.toLowerCase().includes(searchTerm) ||
        user.name.toLowerCase().includes(searchTerm)
      );
    }

    // Apply activity level filter (simplified for now)
    if (args.activityLevel) {
      // This would need more complex logic based on actual activity data
      // For now, we'll just return all users
    }

    // Apply subscription status filter (simplified for now)
    if (args.subscriptionStatus) {
      // This would need to join with subscription data
      // For now, we'll just return all users
    }

    // Calculate pagination
    const total = filteredUsers.length;
    const paginatedUsers = filteredUsers.slice(args.offset, args.offset + args.limit);
    const hasMore = args.offset + args.limit < total;

    // Transform to search result format
    const users = paginatedUsers.map(user => ({
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      lastActivity: user.updatedAt, // Simplified - would need actual activity tracking
      subscriptionStatus: "active", // Simplified - would need actual subscription data
      riskScore: 0 // Would be calculated based on various factors
    }));

    return {
      users,
      total,
      hasMore
    };
  }
});

export const getUserBasicInfo = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    return {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      profileImage: user.profileImage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isActive: true // Simplified - would need actual status tracking
    };
  }
});

export const getUserSubscriptionInfo = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // This would query actual subscription data
    // For now, returning a simplified structure
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return null;
    }

    // Check if user has any active programs
    const userPrograms = await ctx.db
      .query("userPrograms")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();

    const hasActivePrograms = userPrograms.some(program => !program.isCompleted);

    return {
      status: hasActivePrograms ? "active" : "inactive" as const,
      tier: user.role === "trainer" ? "trainer" : "basic",
      startDate: userPrograms[0]?.startDate,
      endDate: undefined,
      autoRenew: false,
      paymentMethod: undefined
    };
  }
});

export const getUserActivityMetrics = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get workout sessions for activity metrics
    const workoutSessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();

    // Get user programs for engagement calculation
    const userPrograms = await ctx.db
      .query("userPrograms")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();

    // Calculate metrics
    const sessionCount = workoutSessions.length;
    const completedSessions = workoutSessions.filter(session => session.isCompleted);
    const totalDuration = completedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
    const averageSessionDuration = sessionCount > 0 ? totalDuration / sessionCount : 0;

    // Simple engagement score calculation
    const engagementScore = Math.min(sessionCount / 30, 1); // Based on sessions per month

    // Get last login (simplified - using last workout as proxy)
    const lastSession = workoutSessions.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    return {
      lastLogin: lastSession?.createdAt,
      sessionCount,
      averageSessionDuration,
      featureUsage: {
        workouts: sessionCount,
        programs: userPrograms.length
      },
      engagementScore,
      retentionCohort: "active" // Simplified
    };
  }
});

export const getUserSupportHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // This would query actual support ticket data
    // For now, returning empty array as support tickets aren't implemented yet
    return [];
  }
});

export const getUserModerationHistory = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // This would query moderation actions from a dedicated table
    // For now, returning empty array
    return [];
  }
});

export const getUserFinancialSummary = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get program purchases
    const purchases = await ctx.db
      .query("programPurchases")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();

    // Get coaching services
    const coachingServices = await ctx.db
      .query("coachingServices")
      .withIndex("by_client", q => q.eq("clientId", args.userId))
      .collect();

    // Calculate totals
    const totalSpent = purchases.reduce((sum, purchase) => sum + purchase.amount, 0) +
                     coachingServices.reduce((sum, service) => sum + service.price, 0);

    const refunds = purchases.filter(p => p.paymentStatus === "refunded");
    const totalRefunds = refunds.reduce((sum, refund) => sum + refund.amount, 0);

    const completedPurchases = purchases.filter(p => p.paymentStatus === "completed");
    const averageOrderValue = completedPurchases.length > 0 ? 
      completedPurchases.reduce((sum, p) => sum + p.amount, 0) / completedPurchases.length : 0;

    const lastPurchase = [...purchases, ...coachingServices]
      .sort((a, b) => new Date(b.purchaseDate || b.requestedAt).getTime() - 
                     new Date(a.purchaseDate || a.requestedAt).getTime())[0];

    return {
      totalSpent,
      totalRefunds,
      averageOrderValue,
      paymentMethods: ["stripe"], // Simplified
      lastPayment: lastPurchase?.purchaseDate || lastPurchase?.requestedAt,
      outstandingBalance: 0 // Simplified
    };
  }
});

export const getUserDeviceConnections = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // Get WHOOP connections
    const whoopConnections = await ctx.db
      .query("whoopConnections")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .collect();

    const connections = whoopConnections.map(conn => ({
      deviceType: "WHOOP",
      deviceId: conn.whoopUserId,
      connectedAt: conn.connectedAt,
      lastSync: conn.updatedAt,
      isActive: conn.isActive
    }));

    return connections;
  }
});

export const getUserActivityTimeline = query({
  args: { 
    userId: v.id("users"),
    limit: v.number()
  },
  handler: async (ctx, args) => {
    const timeline = [];

    // Get recent workout sessions
    const workoutSessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc")
      .take(20);

    for (const session of workoutSessions) {
      timeline.push({
        timestamp: session.createdAt,
        type: "workout",
        description: session.isCompleted ? "Completed workout session" : "Started workout session",
        details: {
          duration: session.duration,
          workoutId: session.workoutId
        }
      });
    }

    // Get program purchases
    const purchases = await ctx.db
      .query("programPurchases")
      .withIndex("by_user", q => q.eq("userId", args.userId))
      .order("desc")
      .take(10);

    for (const purchase of purchases) {
      timeline.push({
        timestamp: purchase.purchaseDate,
        type: "purchase",
        description: `Purchased training program`,
        details: {
          amount: purchase.amount,
          programId: purchase.programId
        }
      });
    }

    // Sort by timestamp and limit
    return timeline
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, args.limit);
  }
});

// ============================================================================
// User Management Actions
// ============================================================================

export const suspendUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
    suspendedBy: v.id("adminUsers"),
    suspensionEndDate: v.optional(v.string()),
    suspendedAt: v.string()
  },
  handler: async (ctx, args) => {
    // For now, we'll add a suspended flag to the user record
    // In a full implementation, this would be a separate suspension table
    await ctx.db.patch(args.userId, {
      updatedAt: args.suspendedAt
      // In a real implementation, we'd add suspension fields to the schema
    });

    return { success: true };
  }
});

export const activateUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      updatedAt: new Date().toISOString()
      // Remove suspension flags
    });

    return { success: true };
  }
});

export const terminateUser = mutation({
  args: {
    userId: v.id("users"),
    reason: v.string(),
    terminatedBy: v.id("adminUsers"),
    terminatedAt: v.string()
  },
  handler: async (ctx, args) => {
    // Mark user as terminated (in a real implementation, this would be a separate field)
    await ctx.db.patch(args.userId, {
      updatedAt: args.terminatedAt
      // Add termination fields
    });

    return { success: true };
  }
});

export const deleteUserData = mutation({
  args: {
    userId: v.id("users"),
    deletionType: v.union(v.literal("soft"), v.literal("hard")),
    deletedBy: v.id("adminUsers"),
    deletedAt: v.string()
  },
  handler: async (ctx, args) => {
    let deletedRecords = 0;

    if (args.deletionType === "hard") {
      // Delete all user-related data
      
      // Delete workout sessions
      const workoutSessions = await ctx.db
        .query("workoutSessions")
        .withIndex("by_user", q => q.eq("userId", args.userId))
        .collect();
      
      for (const session of workoutSessions) {
        await ctx.db.delete(session._id);
        deletedRecords++;
      }

      // Delete user programs
      const userPrograms = await ctx.db
        .query("userPrograms")
        .withIndex("by_user", q => q.eq("userId", args.userId))
        .collect();
      
      for (const program of userPrograms) {
        await ctx.db.delete(program._id);
        deletedRecords++;
      }

      // Delete fitness data
      const fitnessData = await ctx.db
        .query("fitnessData")
        .withIndex("by_user_and_type", q => q.eq("userId", args.userId))
        .collect();
      
      for (const data of fitnessData) {
        await ctx.db.delete(data._id);
        deletedRecords++;
      }

      // Delete device connections
      const whoopConnections = await ctx.db
        .query("whoopConnections")
        .withIndex("by_user", q => q.eq("userId", args.userId))
        .collect();
      
      for (const connection of whoopConnections) {
        await ctx.db.delete(connection._id);
        deletedRecords++;
      }

      // Finally delete the user
      await ctx.db.delete(args.userId);
      deletedRecords++;

    } else {
      // Soft delete - anonymize user data
      await ctx.db.patch(args.userId, {
        email: `deleted_user_${args.userId}@deleted.com`,
        name: "Deleted User",
        profileImage: undefined,
        updatedAt: args.deletedAt
      });
      deletedRecords = 1;
    }

    return {
      success: true,
      deletedRecords
    };
  }
});

export const sendUserMessage = mutation({
  args: {
    userId: v.id("users"),
    message: v.string(),
    sentBy: v.id("adminUsers")
  },
  handler: async (ctx, args) => {
    // This would send a message to the user
    // For now, we'll just return success
    // In a real implementation, this would create a message record or send an email
    
    return { success: true };
  }
});

// ============================================================================
// Impersonation Management
// ============================================================================

export const createImpersonationSession = mutation({
  args: {
    sessionId: v.string(),
    adminId: v.id("adminUsers"),
    userId: v.id("users"),
    reason: v.string(),
    startTime: v.string()
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would be stored in a dedicated impersonation table
    // For now, we'll just return the session data
    return {
      sessionId: args.sessionId,
      adminId: args.adminId,
      userId: args.userId,
      reason: args.reason,
      startTime: args.startTime
    };
  }
});

export const getImpersonationSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    // In a real implementation, this would query the impersonation table
    // For now, returning null as we don't have persistent storage for sessions
    return null;
  }
});

export const endImpersonationSession = mutation({
  args: {
    sessionId: v.string(),
    endTime: v.string()
  },
  handler: async (ctx, args) => {
    // In a real implementation, this would update the impersonation session
    return { success: true };
  }
});