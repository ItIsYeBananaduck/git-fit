import { v } from "convex/values";

import { mutation, query } from "../_generated/server";
import { ConvexError } from "convex/values";

// Save medical screening mutation
export const saveMedicalScreening = mutation({
  args: {
    userId: v.id("users"),
    injuries: v.optional(v.array(v.string())),
    conditions: v.optional(v.array(v.string())),
    notes: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      medicalScreening: {
        injuries: args.injuries || [],
        conditions: args.conditions || [],
        notes: args.notes || ''
      }
    });
    return { success: true };
  }
});

// User management functions
export const createUser = mutation({
  args: {
    email: v.string(),
    name: v.string(),
    role: v.union(v.literal("client"), v.literal("trainer"), v.literal("admin")),
    profileImage: v.optional(v.string()),
    // Client-specific fields
    dateOfBirth: v.optional(v.string()),
    height: v.optional(v.number()),
    weight: v.optional(v.number()),
    fitnessLevel: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
    goals: v.optional(v.array(v.string())),
    // Trainer-specific fields
    certifications: v.optional(v.array(v.string())),
    specialties: v.optional(v.array(v.string())),
    bio: v.optional(v.string()),
    hourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = {
      ...args,
      passwordHash: "", // Will be set after hashing
      emailVerified: false,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isVerified: false,
      rating: 0,
      totalClients: 0,
    };
    const id = await ctx.db.insert("users", user);
    return { id, ...user };
  },
});

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const emailVal = args.email;
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailVal))
      .first();
  },
});

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

export const getTrainers = query({
  args: {
    specialty: v.optional(v.string()),
    verifiedOnly: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "trainer"));

    if (args.verifiedOnly) {
      query = query.filter((q) => q.eq(q.field("isVerified"), true));
    }

    const trainers = await query.collect();

    if (args.specialty) {
      return trainers.filter(trainer =>
        trainer.specialties?.includes(args.specialty!)
      );
    }

    return trainers;
  },
});

export const updateUserProfile = mutation({
  args: {
    userId: v.id("users"),
    updates: v.object({
      name: v.optional(v.string()),
      profileImage: v.optional(v.string()),
      height: v.optional(v.number()),
      weight: v.optional(v.number()),
      fitnessLevel: v.optional(v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("advanced"))),
      goals: v.optional(v.array(v.string())),
      bio: v.optional(v.string()),
      hourlyRate: v.optional(v.number()),
      specialties: v.optional(v.array(v.string())),
      certifications: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      ...args.updates,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Authentication helper functions using bcrypt
async function hashPassword(password: string) {
  const bcrypt = await import('bcryptjs');
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string) {
  const bcrypt = await import('bcryptjs');
  return await bcrypt.compare(password, hash);
}

function generateToken(length = 64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function isValidEmail(email: string) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPassword(password: string) {
  return password.length >= 8 &&
    /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(password);
}

// Authentication mutations
export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    rememberMe: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) {
      throw new ConvexError("Invalid email or password");
    }

    if (!user.isActive) {
      throw new ConvexError("Account is disabled. Please contact support.");
    }

    // Verify password
    const isValidPasswordCheck = await verifyPassword(args.password, user.passwordHash);
    if (!isValidPasswordCheck) {
      throw new ConvexError("Invalid email or password");
    }

    // Invalidate existing sessions for this user
    const existingSessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of existingSessions) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    // Create new session
    const sessionToken = generateToken();
    const now = new Date().toISOString();
    const sessionDuration = args.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
    const expiresAt = new Date(Date.now() + sessionDuration).toISOString();

    await ctx.db.insert("sessions", {
      userId: user._id,
      token: sessionToken,
      expiresAt,
      createdAt: now,
      lastActivity: now,
      isActive: true,
    });

    // Update last login
    await ctx.db.patch(user._id, {
      lastLogin: now,
      updatedAt: now,
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: {
        ...userWithoutPassword,
        lastLogin: now,
      },
      token: sessionToken,
    };
  },
});

export const register = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.string(),
    role: v.union(v.literal("client"), v.literal("trainer")),
    profile: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // Validate input
    if (!isValidEmail(args.email)) {
      throw new ConvexError("Invalid email address");
    }

    if (!isValidPassword(args.password)) {
      throw new ConvexError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
    }

    if (!args.name || args.name.trim().length < 2) {
      throw new ConvexError("Name must be at least 2 characters long");
    }

    const email = args.email.toLowerCase().trim();
    const name = args.name.trim();

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existingUser) {
      throw new ConvexError("An account with this email already exists");
    }

    // Hash password
    const passwordHash = await hashPassword(args.password);

    // Create user
    const now = new Date().toISOString();
    const userId = await ctx.db.insert("users", {
      email,
      name,
      role: args.role,
      passwordHash,
      emailVerified: false,
      isActive: true,
      createdAt: now,
      updatedAt: now,
      // Add profile fields based on role
      ...(args.role === "client" && {
        fitnessLevel: args.profile?.fitnessLevel || "beginner",
        goals: args.profile?.goals || [],
        height: args.profile?.height,
        weight: args.profile?.weight,
        dateOfBirth: args.profile?.dateOfBirth,
      }),
      ...(args.role === "trainer" && {
        bio: args.profile?.bio || "",
        specialties: args.profile?.specialties || [],
        certifications: args.profile?.certifications || [],
        hourlyRate: args.profile?.hourlyRate || 0,
        experience: args.profile?.experience || 0,
        isVerified: false,
        rating: 0,
        totalClients: 0,
      }),
      preferences: {
        units: args.profile?.preferences?.units || "metric",
        notifications: args.profile?.preferences?.notifications ?? true,
        dataSharing: args.profile?.preferences?.dataSharing ?? false,
        timezone: args.profile?.preferences?.timezone || "UTC",
      },
    });

    // Create session
    const sessionToken = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    await ctx.db.insert("sessions", {
      userId,
      token: sessionToken,
      expiresAt,
      createdAt: now,
      lastActivity: now,
      isActive: true,
    });

    // Get the created user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new ConvexError("Failed to create user");
    }

    // Remove password hash from response
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
      token: sessionToken,
    };
  },
});

export const validateSession = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const token = args.token;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (!session || !session.isActive) {
      return { valid: false };
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      return { valid: false, reason: "expired" };
    }

    // Get user
    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      return { valid: false, reason: "user_inactive" };
    }

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      valid: true,
      user: userWithoutPassword,
    };
  },
});

// Separate mutation to update session activity
export const updateSessionActivity = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const token = args.token;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .first();

    if (session && session.isActive) {
      await ctx.db.patch(session._id, {
        lastActivity: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

export const requestPasswordReset = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Check if user exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    // Always return success to prevent email enumeration
    if (!user) {
      return { success: true };
    }

    // Invalidate existing reset tokens
    const existingTokens = await ctx.db
      .query("passwordResets")
      .withIndex("by_email", (q) => q.eq("email", email))
      .filter((q) => q.eq(q.field("used"), false))
      .collect();

    for (const token of existingTokens) {
      await ctx.db.patch(token._id, { used: true });
    }

    // Create new reset token
    const resetToken = generateToken(48);
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await ctx.db.insert("passwordResets", {
      email,
      token: resetToken,
      expiresAt,
      used: false,
      createdAt: now,
    });

    // Send password reset email
    try {
      // In development, log the reset link for testing
      if (process.env.NODE_ENV === 'development') {
        const resetUrl = `${process.env.PUBLIC_APP_URL || 'http://localhost:5173'}/auth/reset-password/${resetToken}`;
        console.log(`🔐 Password reset link for ${email}:`);
        console.log(`   ${resetUrl}`);
        console.log(`   Token expires in 1 hour`);
      }

      // TODO: Integrate with actual email service
      // Example integration would go here:
      /*
      const emailService = new EmailService();
      await emailService.sendPasswordResetEmail(email, resetToken, user.name);
      */

    } catch (error) {
      console.error('Failed to send password reset email:', error);
      // Don't fail the request if email sending fails
    }

    return {
      success: true,
      // In development, return the token for testing
      ...(process.env.NODE_ENV === 'development' && { token: resetToken })
    };
  },
});

// Validate password reset token
export const validatePasswordResetToken = query({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    // Find reset token
    const resetToken = await ctx.db
      .query("passwordResets")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken || resetToken.used) {
      return {
        valid: false,
        reason: "invalid_token",
        message: "Invalid or expired reset token"
      };
    }

    // Check if token is expired
    if (new Date(resetToken.expiresAt) < new Date()) {
      return {
        valid: false,
        reason: "expired",
        message: "Reset token has expired"
      };
    }

    // Find user to ensure they still exist
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", resetToken.email))
      .first();

    if (!user) {
      return {
        valid: false,
        reason: "user_not_found",
        message: "User not found"
      };
    }

    return {
      valid: true,
      email: resetToken.email,
      expiresAt: resetToken.expiresAt
    };
  },
});

export const resetPassword = mutation({
  args: {
    token: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidPassword(args.newPassword)) {
      throw new ConvexError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
    }

    // Find reset token
    const resetToken = await ctx.db
      .query("passwordResets")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!resetToken || resetToken.used) {
      throw new ConvexError("Invalid or expired reset token");
    }

    // Check if token is expired
    if (new Date(resetToken.expiresAt) < new Date()) {
      // Mark expired token as used
      await ctx.db.patch(resetToken._id, { used: true });
      throw new ConvexError("Reset token has expired");
    }

    // Find user
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", resetToken.email))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Hash new password
    const passwordHash = await hashPassword(args.newPassword);

    // Update user password
    await ctx.db.patch(user._id, {
      passwordHash,
      updatedAt: new Date().toISOString(),
    });

    // Mark token as used
    await ctx.db.patch(resetToken._id, { used: true });

    // Invalidate all user sessions for security
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    return { success: true };
  },
});

// Session management functions
export const logout = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (session) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    return { success: true };
  },
});

export const refreshSession = mutation({
  args: {
    token: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (!session || !session.isActive) {
      throw new ConvexError("Invalid session");
    }

    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      await ctx.db.patch(session._id, { isActive: false });
      throw new ConvexError("Session expired");
    }

    // Get user to ensure they're still active
    const user = await ctx.db.get(session.userId);
    if (!user || !user.isActive) {
      await ctx.db.patch(session._id, { isActive: false });
      throw new ConvexError("User account is inactive");
    }

    // Generate new token
    const newToken = generateToken();
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Update session with new token and expiry
    await ctx.db.patch(session._id, {
      token: newToken,
      expiresAt,
      lastActivity: now,
    });

    // Remove password hash from user response
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      success: true,
      token: newToken,
      user: userWithoutPassword,
    };
  },
});

export const getUserSessions = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return sessions.map(session => ({
      _id: session._id,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      expiresAt: session.expiresAt,
      ipAddress: session.ipAddress,
      userAgent: session.userAgent,
    }));
  },
});

export const revokeSession = mutation({
  args: {
    sessionId: v.id("sessions"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);

    if (!session || session.userId !== args.userId) {
      throw new ConvexError("Session not found or unauthorized");
    }

    await ctx.db.patch(args.sessionId, { isActive: false });

    return { success: true };
  },
});

export const revokeAllSessions = mutation({
  args: {
    userId: v.id("users"),
    exceptToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = args.userId;
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of sessions) {
      // Skip the current session if exceptToken is provided
      if (args.exceptToken && session.token === args.exceptToken) {
        continue;
      }
      await ctx.db.patch(session._id, { isActive: false });
    }

    return { success: true };
  },
});

// Session cleanup function (should be called periodically)
export const cleanupExpiredSessions = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();

    const expiredSessions = await ctx.db
      .query("sessions")
      .withIndex("by_expires", (q) => q.lt("expiresAt", now))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    let cleanedCount = 0;
    for (const session of expiredSessions) {
      await ctx.db.patch(session._id, { isActive: false });
      cleanedCount++;
    }

    return {
      success: true,
      cleanedSessions: cleanedCount
    };
  },
});

// Password reset token cleanup function (should be called periodically)
export const cleanupExpiredPasswordResets = mutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date().toISOString();

    const expiredTokens = await ctx.db
      .query("passwordResets")
      .filter((q) =>
        q.and(
          q.lt(q.field("expiresAt"), now),
          q.eq(q.field("used"), false)
        )
      )
      .collect();

    let cleanedCount = 0;
    for (const token of expiredTokens) {
      await ctx.db.patch(token._id, { used: true });
      cleanedCount++;
    }

    return {
      success: true,
      cleanedTokens: cleanedCount
    };
  },
});

// Password change function
export const changePassword = mutation({
  args: {
    userId: v.id("users"),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    if (!isValidPassword(args.newPassword)) {
      throw new ConvexError("Password must be at least 8 characters with uppercase, lowercase, number, and special character");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Verify current password
    const isValidCurrentPassword = await verifyPassword(args.currentPassword, user.passwordHash);
    if (!isValidCurrentPassword) {
      throw new ConvexError("Current password is incorrect");
    }

    // Hash new password
    const passwordHash = await hashPassword(args.newPassword);

    // Update password
    await ctx.db.patch(args.userId, {
      passwordHash,
      updatedAt: new Date().toISOString(),
    });

    // Invalidate all sessions except current one (if provided)
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    for (const session of sessions) {
      await ctx.db.patch(session._id, { isActive: false });
    }

    return { success: true };
  },
});

export const updateSmartSetNudgeSettings = mutation({
  args: {
    userId: v.id("users"),
    smartSetNudges: v.optional(v.boolean()),
    smartSetNudgesActive: v.optional(v.boolean()),
    connectedWearable: v.optional(v.union(
      v.literal("whoop"),
      v.literal("apple_watch"),
      v.literal("samsung_watch"),
      v.literal("fitbit"),
      v.literal("polar")
    )),
  },
  handler: async (ctx, args) => {
    const updates: Record<string, any> = {};
    if ("smartSetNudges" in args) updates.smartSetNudges = args.smartSetNudges;
    if ("connectedWearable" in args) {
      updates.connectedWearable = args.connectedWearable;
      // Auto-manage smartSetNudgesActive based on device support
      const supportedDevices = ["whoop", "apple_watch", "samsung_watch"];
      if (args.connectedWearable && supportedDevices.includes(args.connectedWearable)) {
        updates.smartSetNudgesActive = true;
      } else {
        updates.smartSetNudgesActive = false;
      }
    } else if ("smartSetNudgesActive" in args) {
      // Only allow manual override if device is not specified in this call
      updates.smartSetNudgesActive = args.smartSetNudgesActive;
    }
    updates.updatedAt = new Date().toISOString();
    await ctx.db.patch(args.userId, updates);
    return { success: true };
  }
});

// Set coach preference mutation
export const setCoachPreference = mutation({
  args: {
    userId: v.id("users"),
    coachType: v.union(v.literal("alice"), v.literal("aiden")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new ConvexError("User not found");

    await ctx.db.patch(args.userId, {
      coachPreference: {
        coachType: args.coachType,
        selectedAt: new Date().toISOString(),
      },
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// Get coach preference query
export const getCoachPreference = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    return user.coachPreference || null;
  },
});