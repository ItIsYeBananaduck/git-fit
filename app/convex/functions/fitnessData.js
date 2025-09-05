import { mutation, query } from "convex/server";
import { v } from "convex/values";

// Fitness data tracking functions
export const addFitnessData = mutation({
  args: {
    userId: v.id("users"),
    dataType: v.union(
      v.literal("steps"), 
      v.literal("heartRate"), 
      v.literal("sleep"), 
      v.literal("calories"),
      v.literal("distance"),
      v.literal("activeMinutes")
    ),
    value: v.number(),
    unit: v.string(),
    timestamp: v.string(),
    source: v.string(),
  },
  handler: async (ctx, args) => {
    const data = {
      ...args,
      createdAt: new Date().toISOString(),
    };
    const id = await ctx.db.insert("fitnessData", data);
    return { id, ...data };
  },
});

export const getFitnessData = query({
  args: {
    userId: v.id("users"),
    dataType: v.optional(v.union(
      v.literal("steps"), 
      v.literal("heartRate"), 
      v.literal("sleep"), 
      v.literal("calories"),
      v.literal("distance"),
      v.literal("activeMinutes")
    )),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("fitnessData")
      .withIndex("by_user_and_type", (q) => 
        args.dataType 
          ? q.eq("userId", args.userId).eq("dataType", args.dataType)
          : q.eq("userId", args.userId)
      );
    
    let data = await query.collect();
    
    // Filter by date range if provided
    if (args.startDate || args.endDate) {
      data = data.filter(item => {
        const itemDate = new Date(item.timestamp);
        if (args.startDate && itemDate < new Date(args.startDate)) return false;
        if (args.endDate && itemDate > new Date(args.endDate)) return false;
        return true;
      });
    }
    
    return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },
});

export const getLatestFitnessData = query({
  args: {
    userId: v.id("users"),
    dataType: v.union(
      v.literal("steps"), 
      v.literal("heartRate"), 
      v.literal("sleep"), 
      v.literal("calories"),
      v.literal("distance"),
      v.literal("activeMinutes")
    ),
  },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("fitnessData")
      .withIndex("by_user_and_type", (q) => 
        q.eq("userId", args.userId).eq("dataType", args.dataType)
      )
      .collect();
    
    return data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] || null;
  },
});

export const bulkAddFitnessData = mutation({
  args: {
    userId: v.id("users"),
    dataPoints: v.array(v.object({
      dataType: v.union(
        v.literal("steps"), 
        v.literal("heartRate"), 
        v.literal("sleep"), 
        v.literal("calories"),
        v.literal("distance"),
        v.literal("activeMinutes")
      ),
      value: v.number(),
      unit: v.string(),
      timestamp: v.string(),
      source: v.string(),
    })),
  },
  handler: async (ctx, args) => {
    const results = [];
    
    for (const dataPoint of args.dataPoints) {
      const data = {
        userId: args.userId,
        ...dataPoint,
        createdAt: new Date().toISOString(),
      };
      const id = await ctx.db.insert("fitnessData", data);
      results.push({ id, ...data });
    }
    
    return results;
  },
});