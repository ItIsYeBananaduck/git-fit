// Admin Authentication Convex Functions

import { v } from "convex/values";
import { mutation, query } from "../../_generated/server";
import { ConvexError } from "convex/values";

// Query to get admin user by email
export const getAdminByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const admin = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    return admin;
  },
});

// Query to get admin user by ID
export const getAdminById = query({
  args: { adminId: v.id("adminUsers") },
  handler: async (ctx, args) => {
    const admin = await ctx.db.get(args.adminId);
    return admin;
  },
});

// Query to get admin session by token
export const getAdminSession = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();
    
    return session;
  },
});

// Mutation to create admin user
export const createAdminUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(
      v.literal("super_admin"),
      v.literal("platform_admin"),
      v.literal("user_support"),
      v.literal("content_moderator"),
      v.literal("financial_admin"),
      v.literal("analytics_viewer")
    ),
    permissions: v.array(v.string()),
    passwordHash: v.string(),
    mfaSecret: v.optional(v.string()),
    mfaEnabled: v.boolean(),
    isActive: v.boolean(),
    createdBy: v.id("adminUsers"),
    createdAt: v.string(),
    updatedAt: v.string(),
    failedLoginAttempts: v.number(),
    ipWhitelist: v.optional(v.array(v.string())),
    sessionTimeout: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if email already exists
    const existingAdmin = await ctx.db
      .query("adminUsers")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existingAdmin) {
      throw new ConvexError("Admin user with this email already exists");
    }

    // Create admin user
    const adminId = await ctx.db.insert("adminUsers", {
      email: args.email,
      name: args.name,
      role: args.role,
      permissions: args.permissions,
      passwordHash: args.passwordHash,
      mfaSecret: args.mfaSecret,
      mfaEnabled: args.mfaEnabled,
      isActive: args.isActive,
      lastLogin: undefined,
      failedLoginAttempts: args.failedLoginAttempts,
      lockedUntil: undefined,
      createdAt: args.createdAt,
      createdBy: args.createdBy,
      updatedAt: args.updatedAt,
      ipWhitelist: args.ipWhitelist,
      sessionTimeout: args.sessionTimeout,
    });

    return await ctx.db.get(adminId);
  },
});

// Mutation to create admin session
export const createAdminSession = mutation({
  args: {
    adminId: v.id("adminUsers"),
    sessionToken: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    expiresAt: v.string(),
  },
  handler: async (ctx, args) => {
    const sessionId = await ctx.db.insert("adminSessions", {
      adminId: args.adminId,
      sessionToken: args.sessionToken,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
      createdAt: new Date().toISOString(),
      expiresAt: args.expiresAt,
      lastActivity: new Date().toISOString(),
      isActive: true,
      revokedAt: undefined,
      revokedReason: undefined,
    });

    return await ctx.db.get(sessionId);
  },
});

// Mutation to update admin login success
export const updateAdminLoginSuccess = mutation({
  args: {
    adminId: v.id("adminUsers"),
    lastLogin: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      lastLogin: args.lastLogin,
      failedLoginAttempts: 0,
      lockedUntil: undefined,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Mutation to update failed login attempts
export const updateFailedLoginAttempts = mutation({
  args: {
    adminId: v.id("adminUsers"),
    failedLoginAttempts: v.number(),
    lockedUntil: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      failedLoginAttempts: args.failedLoginAttempts,
      lockedUntil: args.lockedUntil,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Mutation to revoke admin session
export const revokeAdminSession = mutation({
  args: {
    sessionId: v.id("adminSessions"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      isActive: false,
      revokedAt: new Date().toISOString(),
      revokedReason: args.reason,
    });
  },
});

// Mutation to revoke admin session by token
export const revokeAdminSessionByToken = mutation({
  args: {
    sessionToken: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("sessionToken", args.sessionToken))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        isActive: false,
        revokedAt: new Date().toISOString(),
        revokedReason: args.reason,
      });
    }
  },
});

// Mutation to revoke all admin sessions
export const revokeAllAdminSessions = mutation({
  args: {
    adminId: v.id("adminUsers"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("adminSessions")
      .withIndex("by_admin", (q) => q.eq("adminId", args.adminId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, {
        isActive: false,
        revokedAt: new Date().toISOString(),
        revokedReason: args.reason,
      });
    }
  },
});

// Mutation to update session activity
export const updateSessionActivity = mutation({
  args: {
    sessionId: v.id("adminSessions"),
    lastActivity: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.sessionId, {
      lastActivity: args.lastActivity,
    });
  },
});

// Mutation to update admin permissions
export const updateAdminPermissions = mutation({
  args: {
    adminId: v.id("adminUsers"),
    permissions: v.array(v.string()),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      permissions: args.permissions,
      updatedAt: args.updatedAt,
    });
  },
});

// Mutation to deactivate admin user
export const deactivateAdminUser = mutation({
  args: {
    adminId: v.id("adminUsers"),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      isActive: false,
      updatedAt: args.updatedAt,
    });
  },
});

// Mutation to store MFA secret
export const storeMFASecret = mutation({
  args: {
    adminId: v.id("adminUsers"),
    mfaSecret: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      mfaSecret: args.mfaSecret,
      updatedAt: new Date().toISOString(),
    });
  },
});

// Mutation to enable MFA
export const enableMFA = mutation({
  args: {
    adminId: v.id("adminUsers"),
    updatedAt: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.adminId, {
      mfaEnabled: true,
      updatedAt: args.updatedAt,
    });
  },
});

// Query to get all admin users (for management)
export const getAllAdminUsers = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    const admins = await ctx.db
      .query("adminUsers")
      .order("desc")
      .paginate({ numItems: limit, cursor: null });

    return admins;
  },
});

// Query to get admin users by role
export const getAdminUsersByRole = query({
  args: { 
    role: v.union(
      v.literal("super_admin"),
      v.literal("platform_admin"),
      v.literal("user_support"),
      v.literal("content_moderator"),
      v.literal("financial_admin"),
      v.literal("analytics_viewer")
    )
  },
  handler: async (ctx, args) => {
    const admins = await ctx.db
      .query("adminUsers")
      .withIndex("by_role", (q) => q.eq("role", args.role))
      .collect();

    return admins;
  },
});

// Query to get active admin sessions
export const getActiveAdminSessions = query({
  args: {
    adminId: v.optional(v.id("adminUsers")),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("adminSessions")
      .withIndex("by_active", (q) => q.eq("isActive", true));

    if (args.adminId) {
      const sessions = await query.collect();
      return sessions.filter(session => session.adminId === args.adminId);
    }

    return await query.collect();
  },
});

// Mutation to create first super admin (used by setup)
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
      throw new ConvexError("Admin system is already initialized");
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