import { mutation, query, action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v, ConvexError } from "convex/values";
import { Id } from "../_generated/dataModel";

// Update AI coaching context with latest strain and performance data
export const updateContext = mutation({
  args: {
    currentStrainStatus: v.union(v.literal("green"), v.literal("yellow"), v.literal("red")),
    intensityScoreId: v.optional(v.id("intensityScores")),
    voiceEnabled: v.boolean(),
    hasEarbuds: v.boolean(),
    voiceIntensity: v.number(),
    isZenMode: v.boolean(),
    workoutPhase: v.union(v.literal("warmup"), v.literal("working_sets"), v.literal("cooldown"))
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get or create coaching context
    let context = await ctx.db
      .query("aiCoachingContext")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!context) {
      // Create new context with default settings
      const contextId = await ctx.db.insert("aiCoachingContext", {
        userId: user._id,
        coachPersonality: user.coachPreference?.coachType || "alice",
        currentStrainStatus: args.currentStrainStatus,
        calibrationPhase: "week1",
        voiceEnabled: args.voiceEnabled,
        hasEarbuds: args.hasEarbuds,
        voiceIntensity: args.voiceIntensity,
        isZenMode: args.isZenMode,
        lastCoachingMessage: "",
        updatedAt: Date.now()
      });
      
      context = await ctx.db.get(contextId);
    } else {
      // Update existing context
      await ctx.db.patch(context._id, {
        currentStrainStatus: args.currentStrainStatus,
        voiceEnabled: args.voiceEnabled,
        hasEarbuds: args.hasEarbuds,
        voiceIntensity: args.voiceIntensity,
        isZenMode: args.isZenMode,
        updatedAt: Date.now()
      });
    }

    // Generate coaching message based on strain status and phase
    let coachingMessage = "";
    let voiceMessage: string | undefined;
    let intensityAdjustment;

    if (args.currentStrainStatus === "red") {
      coachingMessage = "Your strain is high. Consider reducing intensity or extending rest periods.";
      intensityAdjustment = {
        suggestedRestExtension: 30,
        shouldReduceIntensity: true,
        reasonCode: "high_strain"
      };
      
      if (args.voiceEnabled && args.workoutPhase === "working_sets") {
        voiceMessage = context!.coachPersonality === "alice" 
          ? "Take your time, listen to your body right now."
          : "Let's dial it back a notch, champ. Quality over quantity.";
      }
    } else if (args.currentStrainStatus === "yellow") {
      coachingMessage = "You're in the optimal training zone. Maintain this intensity.";
      
      if (args.voiceEnabled && args.workoutPhase === "working_sets") {
        voiceMessage = context!.coachPersonality === "alice" 
          ? "Perfect zone! You're doing great."
          : "This is your sweet spot. Keep pushing!";
      }
    } else {
      coachingMessage = "Low strain detected. You can push harder if you're feeling good.";
      
      if (args.voiceEnabled && args.workoutPhase === "working_sets") {
        voiceMessage = context!.coachPersonality === "alice" 
          ? "You've got more in the tank if you're ready."
          : "Time to level up! Show me what you've got.";
      }
    }

    // Update last coaching message
    await ctx.db.patch(context!._id, {
      lastCoachingMessage: coachingMessage
    });

    return {
      coachingMessage,
      voiceMessage,
      intensityAdjustment
    };
  }
});

// Get current voice coaching status and settings
export const getVoiceStatus = query({
  args: {},
  handler: async (ctx) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Get coaching context
    const context = await ctx.db
      .query("aiCoachingContext")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (!context) {
      // Return default settings
      return {
        voiceEnabled: false,
        hasEarbuds: false,
        coachPersonality: user.coachPreference?.coachType || "alice",
        voiceIntensity: 50,
        isZenMode: false,
        estimatedBatteryImpact: 0
      };
    }

    // Calculate estimated battery impact based on usage
    const batteryImpact = context.voiceEnabled 
      ? Math.round(context.voiceIntensity * 0.3) // Rough estimate: 30% impact at max intensity
      : 0;

    return {
      voiceEnabled: context.voiceEnabled,
      hasEarbuds: context.hasEarbuds,
      coachPersonality: context.coachPersonality,
      voiceIntensity: context.voiceIntensity,
      isZenMode: context.isZenMode,
      lastVoiceMessage: context.lastCoachingMessage,
      estimatedBatteryImpact: batteryImpact
    };
  }
});

// Watch coaching context changes in real-time
export const watchContext = query({
  args: {
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Use provided userId or current user
    const targetUserId = args.userId || user._id;

    // Only allow accessing own context unless admin/trainer
    if (targetUserId !== user._id && user.role !== "admin") {
      throw new ConvexError("Access denied");
    }

    // Get coaching context
    const context = await ctx.db
      .query("aiCoachingContext")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .first();

    return context;
  }
});

// Generate AI voice coaching message (calls external AI service)
export const generateVoiceMessage = action({
  args: {
    coachPersonality: v.union(v.literal("alice"), v.literal("aiden")),
    message: v.string(),
    voiceIntensity: v.number(),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // Validate authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    // In a real implementation, this would call an external AI voice service
    // For now, return a mock response
    const baseUrl = "https://api.example-voice-service.com";
    
    try {
      // Mock external API call
      // const response = await fetch(`${baseUrl}/generate-voice`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     text: args.message,
      //     voice: args.coachPersonality,
      //     intensity: args.voiceIntensity
      //   })
      // });
      
      // For development, return mock data
      const mockAudioUrl = `${baseUrl}/audio/mock-${Date.now()}.mp3`;
      const duration = Math.max(2, Math.min(10, args.message.length * 0.1)); // Estimate duration
      
      return {
        audioUrl: mockAudioUrl,
        duration,
        expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes from now
      };
      
    } catch (error) {
      throw new ConvexError("Failed to generate voice message");
    }
  }
});

// Reset coaching data (for testing or user request)
export const resetCoachingData = mutation({
  args: {
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    // Get current user
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError("Not authenticated");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new ConvexError("User not found");
    }

    // Use provided userId or current user
    const targetUserId = args.userId || user._id;

    // Only allow resetting own context unless admin
    if (targetUserId !== user._id && user.role !== "admin") {
      throw new ConvexError("Access denied");
    }

    // Find existing context
    const context = await ctx.db
      .query("aiCoachingContext")
      .withIndex("by_user", (q) => q.eq("userId", targetUserId))
      .first();

    if (context) {
      // Reset context to defaults
      await ctx.db.patch(context._id, {
        currentStrainStatus: "green",
        calibrationPhase: "week1",
        voiceEnabled: false,
        hasEarbuds: false,
        voiceIntensity: 50,
        isZenMode: false,
        lastCoachingMessage: "",
        updatedAt: Date.now()
      });
    }

    return { success: true };
  }
});