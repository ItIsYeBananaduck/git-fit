import { defineMutation, defineQuery } from "convex/server";
import fetch from "node-fetch";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Exchange Whoop Code
export const exchangeWhoopCode = defineMutation(async (_, { code }) => {
  const response = await fetch("https://api.whoop.com/oauth/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: process.env.VITE_WHOOP_CLIENT_ID,
      client_secret: process.env.VITE_WHOOP_CLIENT_SECRET,
      redirect_uri: process.env.VITE_WHOOP_REDIRECT_URI,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to exchange code for token");
  }

  return await response.json();
});

// Store WHOOP user connection data
export const storeWHOOPConnection = mutation({
  args: {
    userId: v.id("users"),
    whoopUserId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.number(),
    scope: v.string(),
    connectedAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("whoopConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        whoopUserId: args.whoopUserId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresIn: args.expiresIn,
        scope: args.scope,
        connectedAt: args.connectedAt,
        updatedAt: new Date().toISOString(),
      });
      return existing._id;
    } else {
      const connectionId = await ctx.db.insert("whoopConnections", {
        ...args,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
      });
      return connectionId;
    }
  },
});

// Get WHOOP connection for user
export const getWHOOPConnection = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("whoopConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Update WHOOP tokens (for refresh)
export const updateWHOOPTokens = mutation({
  args: {
    userId: v.id("users"),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresIn: v.number(),
  },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("whoopConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!connection) {
      throw new Error("WHOOP connection not found");
    }

    await ctx.db.patch(connection._id, {
      accessToken: args.accessToken,
      refreshToken: args.refreshToken,
      expiresIn: args.expiresIn,
      updatedAt: new Date().toISOString(),
    });

    return connection._id;
  },
});

// Disconnect WHOOP
export const disconnectWHOOP = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("whoopConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (connection) {
      await ctx.db.patch(connection._id, {
        isActive: false,
        disconnectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

// Store WHOOP data points
export const storeWHOOPData = mutation({
  args: {
    userId: v.id("users"),
    dataPoints: v.array(v.object({
      dataType: v.union(
        v.literal("strain"),
        v.literal("recovery"),
        v.literal("hrv"),
        v.literal("heartRate"),
        v.literal("sleep"),
        v.literal("calories")
      ),
      value: v.number(),
      unit: v.string(),
      timestamp: v.string(),
      rawData: v.optional(v.string()), // Store full WHOOP response as JSON
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const dataPoint of args.dataPoints) {
      const data = {
        userId: args.userId,
        ...dataPoint,
        source: "whoop",
        createdAt: new Date().toISOString(),
      };
      
      // Check for duplicate data points
      const existing = await ctx.db
        .query("fitnessData")
        .withIndex("by_user_and_date", (q) => 
          q.eq("userId", args.userId).eq("timestamp", dataPoint.timestamp)
        )
        .filter((q) => 
          q.and(
            q.eq(q.field("dataType"), dataPoint.dataType),
            q.eq(q.field("source"), "whoop")
          )
        )
        .first();
      
      if (!existing) {
        const id = await ctx.db.insert("fitnessData", data);
        results.push({ id, ...data });
      }
    }
    
    return results;
  },
});

// Get recent WHOOP sync status
export const getWHOOPSyncStatus = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const connection = await ctx.db
      .query("whoopConnections")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!connection || !connection.isActive) {
      return { connected: false, lastSync: null };
    }

    // Get most recent WHOOP data
    const recentData = await ctx.db
      .query("fitnessData")
      .withIndex("by_user_and_date", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("source"), "whoop"))
      .order("desc")
      .take(1);

    const lastSync = recentData.length > 0 ? recentData[0].createdAt : connection.connectedAt;

    return {
      connected: true,
      lastSync,
      whoopUserId: connection.whoopUserId,
      scope: connection.scope,
    };
  },
});
