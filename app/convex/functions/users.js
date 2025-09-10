import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

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
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
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
        trainer.specialties?.includes(args.specialty)
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