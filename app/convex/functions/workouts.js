import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Workout and exercise management functions
export const createWorkout = mutation({
  args: {
    programId: v.id("trainingPrograms"),
    name: v.string(),
    description: v.string(),
    dayNumber: v.number(),
    weekNumber: v.number(),
    estimatedDuration: v.number(),
    targetMuscleGroups: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const workout = {
      ...args,
      createdAt: new Date().toISOString(),
    };
    const id = await ctx.db.insert("workouts", workout);
    return { id, ...workout };
  },
});

export const getWorkoutsByProgram = query({
  args: { programId: v.id("trainingPrograms") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("workouts")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();
  },
});

export const createExercise = mutation({
  args: {
    workoutId: v.id("workouts"),
    name: v.string(),
    description: v.string(),
    sets: v.number(),
    reps: v.optional(v.string()),
    weight: v.optional(v.number()),
    duration: v.optional(v.number()),
    restTime: v.optional(v.number()),
    order: v.number(),
    instructions: v.string(),
    videoUrl: v.optional(v.string()),
    muscleGroups: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const exercise = args;
    const id = await ctx.db.insert("exercises", exercise);
    return { id, ...exercise };
  },
});

export const getExercisesByWorkout = query({
  args: { workoutId: v.id("workouts") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("exercises")
      .withIndex("by_workout_and_order", (q) => q.eq("workoutId", args.workoutId))
      .collect();
  },
});

// User program management
export const purchaseProgram = mutation({
  args: {
    userId: v.id("users"),
    programId: v.id("trainingPrograms"),
  },
  handler: async (ctx, args) => {
    // Check if user already has this program
    const existing = await ctx.db
      .query("userPrograms")
      .withIndex("by_user_and_program", (q) => 
        q.eq("userId", args.userId).eq("programId", args.programId)
      )
      .first();
    
    if (existing) {
      throw new Error("User already has this program");
    }
    
    const userProgram = {
      ...args,
      startDate: new Date().toISOString(),
      currentDay: 1,
      currentWeek: 1,
      isCompleted: false,
      progress: 0,
      purchaseDate: new Date().toISOString(),
    };
    
    const id = await ctx.db.insert("userPrograms", userProgram);
    
    // Update program purchase count
    const program = await ctx.db.get(args.programId);
    if (program) {
      await ctx.db.patch(args.programId, {
        totalPurchases: (program.totalPurchases || 0) + 1,
      });
    }
    
    return { id, ...userProgram };
  },
});

export const getUserPrograms = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("userPrograms")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Workout session tracking
export const startWorkoutSession = mutation({
  args: {
    userId: v.id("users"),
    workoutId: v.id("workouts"),
    userProgramId: v.id("userPrograms"),
  },
  handler: async (ctx, args) => {
    const session = {
      ...args,
      startTime: new Date().toISOString(),
      isCompleted: false,
      createdAt: new Date().toISOString(),
    };
    const id = await ctx.db.insert("workoutSessions", session);
    return { id, ...session };
  },
});

export const completeWorkoutSession = mutation({
  args: {
    sessionId: v.id("workoutSessions"),
    duration: v.optional(v.number()),
    notes: v.optional(v.string()),
    averageHeartRate: v.optional(v.number()),
    maxHeartRate: v.optional(v.number()),
    caloriesBurned: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { sessionId, ...updates } = args;
    
    await ctx.db.patch(sessionId, {
      ...updates,
      endTime: new Date().toISOString(),
      isCompleted: true,
    });
    
    return { success: true };
  },
});

export const getUserWorkoutSessions = query({
  args: { 
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("workoutSessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    
    const sorted = sessions.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
    
    return args.limit ? sorted.slice(0, args.limit) : sorted;
  },
});