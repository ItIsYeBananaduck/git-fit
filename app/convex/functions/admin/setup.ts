// Admin Setup Convex Functions

import { v } from "convex/values";
import { mutation } from "../../_generated/server";

// Mutation to create the first super admin (bypasses normal validation)
export const createFirstSuperAdmin = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    passwordHash: v.string(),
    createdAt: v.string(),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if any admin users already exist
    const existingAdmins = await ctx.db.query("adminUsers").collect();
    if (existingAdmins.length > 0) {
      throw new Error("Admin system is already initialized");
    }

    // Create the first super admin with all permissions
    const adminId = await ctx.db.insert("adminUsers", {
      email: args.email,
      name: args.name,
      role: "super_admin",
      permissions: ["*"], // Super admin gets wildcard permission
      passwordHash: args.passwordHash,
      mfaSecret: undefined,
      mfaEnabled: false,
      isActive: true,
      lastLogin: undefined,
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      createdAt: args.createdAt,
      createdBy: adminId, // Self-created
      updatedAt: args.updatedAt,
      ipWhitelist: undefined,
      sessionTimeout: undefined,
    });

    // Update the createdBy field to reference itself
    await ctx.db.patch(adminId, {
      createdBy: adminId,
    });

    return adminId;
  },
});

// Mutation to reset admin system (development only)
export const resetAdminSystem = mutation({
  args: {},
  handler: async (ctx, args) => {
    // Delete all admin-related data
    const adminUsers = await ctx.db.query("adminUsers").collect();
    for (const admin of adminUsers) {
      await ctx.db.delete(admin._id);
    }

    const adminSessions = await ctx.db.query("adminSessions").collect();
    for (const session of adminSessions) {
      await ctx.db.delete(session._id);
    }

    const auditLogs = await ctx.db.query("auditLogs").collect();
    for (const log of auditLogs) {
      await ctx.db.delete(log._id);
    }

    const moderationQueue = await ctx.db.query("moderationQueue").collect();
    for (const item of moderationQueue) {
      await ctx.db.delete(item._id);
    }

    const adminPermissions = await ctx.db.query("adminPermissions").collect();
    for (const permission of adminPermissions) {
      await ctx.db.delete(permission._id);
    }

    const adminRoles = await ctx.db.query("adminRoles").collect();
    for (const role of adminRoles) {
      await ctx.db.delete(role._id);
    }

    return { message: "Admin system reset successfully" };
  },
});

// Mutation to seed sample data for development
export const seedSampleData = mutation({
  args: {},
  handler: async (ctx, args) => {
    // Create sample moderation queue items
    const sampleModerationItems = [
      {
        itemType: "custom_exercise" as const,
        itemId: "sample_exercise_1",
        reportedBy: undefined,
        reportReason: undefined,
        priority: "medium" as const,
        status: "pending" as const,
        assignedTo: undefined,
        content: {
          name: "Custom Push-up Variation",
          description: "A new push-up variation created by user",
          instructions: ["Start in plank position", "Lower body", "Push up"]
        },
        flags: ["needs_review"],
        reviewNotes: undefined,
        decision: undefined,
        decisionReason: undefined,
        createdAt: new Date().toISOString(),
        assignedAt: undefined,
        reviewedAt: undefined,
        escalatedAt: undefined,
        autoFlagged: false,
        confidenceScore: undefined,
      },
      {
        itemType: "trainer_message" as const,
        itemId: "sample_message_1",
        reportedBy: undefined,
        reportReason: "inappropriate_content",
        priority: "high" as const,
        status: "pending" as const,
        assignedTo: undefined,
        content: {
          message: "Sample trainer message that needs review",
          sender: "trainer_123",
          recipient: "client_456"
        },
        flags: ["inappropriate_language", "spam"],
        reviewNotes: undefined,
        decision: undefined,
        decisionReason: undefined,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        assignedAt: undefined,
        reviewedAt: undefined,
        escalatedAt: undefined,
        autoFlagged: true,
        confidenceScore: 0.85,
      }
    ];

    for (const item of sampleModerationItems) {
      await ctx.db.insert("moderationQueue", item);
    }

    return { 
      message: "Sample data seeded successfully",
      itemsCreated: sampleModerationItems.length
    };
  },
});