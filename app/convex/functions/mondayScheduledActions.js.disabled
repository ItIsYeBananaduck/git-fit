import { internalAction, internalMutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Internal action to process Monday data for all users
 * This runs weekly on Monday to check if users need data processing
 */
export const processMondayDataForAllUsers = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Running Monday data processing trigger");
    
    // Get current week of year
    const now = new Date();
    const year = now.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const weekOfYear = Math.ceil(dayOfYear / 7);
    const currentWeek = `${year}-${weekOfYear.toString().padStart(2, '0')}`;

    // Get all active users
    const users = await ctx.runQuery("functions.users.getAllActiveUsers");
    
    let processedUsers = 0;
    let skippedUsers = 0;

    for (const user of users) {
      try {
        // Check if user already has Monday data for current week
        const existingData = await ctx.runQuery("functions.mondayWorkoutData.getMondayWorkoutData", {
          userId: user._id,
          weekOfYear: currentWeek,
          limit: 1,
        });

        if (existingData.length > 0) {
          skippedUsers++;
          continue; // User already processed this week
        }

        // Trigger processing for this user
        await ctx.runMutation("functions.mondayWorkoutData.triggerMondayProcessing", {
          userId: user._id,
          weekOfYear: currentWeek,
        });

        processedUsers++;
      } catch (error) {
        console.error(`Failed to process Monday data for user ${user._id}:`, error);
      }
    }

    console.log(`Monday processing complete: ${processedUsers} users processed, ${skippedUsers} users skipped`);
    
    return {
      processedUsers,
      skippedUsers,
      currentWeek,
      totalUsers: users.length,
    };
  },
});

/**
 * Internal mutation to trigger Monday processing for a specific user
 */
export const triggerMondayProcessing = internalMutation({
  args: {
    userId: v.id("users"),
    weekOfYear: v.string(),
  },
  handler: async (ctx, { userId, weekOfYear }) => {
    const now = new Date().toISOString();

    // This is a placeholder - in reality, the client-side service would do the processing
    // We just create a trigger record that the client can check for
    await ctx.db.insert("mondayProcessingTriggers", {
      userId,
      weekOfYear,
      triggered: true,
      createdAt: now,
      processed: false,
    });

    return { success: true, triggeredAt: now };
  },
});

/**
 * Internal action to clean up old Monday data (older than 6 months)
 */
export const cleanupOldMondayData = internalAction({
  args: {},
  handler: async (ctx) => {
    console.log("Running Monday data cleanup");

    // Calculate 6 months ago week
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const year = sixMonthsAgo.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const dayOfYear = Math.floor((sixMonthsAgo.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const weekOfYear = Math.ceil(dayOfYear / 7);
    const cutoffWeek = `${year}-${weekOfYear.toString().padStart(2, '0')}`;

    // Get old Monday data entries
    const oldData = await ctx.runQuery("functions.mondayWorkoutData.getOldMondayData", {
      cutoffWeek,
      limit: 1000, // Process in batches
    });

    let deletedCount = 0;

    for (const entry of oldData) {
      try {
        // Delete the entry
        await ctx.runMutation("functions.mondayWorkoutData.deleteOldMondayData", {
          entryId: entry._id,
        });
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete Monday data entry ${entry._id}:`, error);
      }
    }

    // Also clean up old processing triggers (older than 1 week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const oneWeekAgoISO = oneWeekAgo.toISOString();

    const oldTriggers = await ctx.runQuery("functions.mondayWorkoutData.getOldProcessingTriggers", {
      cutoffDate: oneWeekAgoISO,
      limit: 1000,
    });

    let deletedTriggers = 0;

    for (const trigger of oldTriggers) {
      try {
        await ctx.runMutation("functions.mondayWorkoutData.deleteOldProcessingTrigger", {
          triggerId: trigger._id,
        });
        deletedTriggers++;
      } catch (error) {
        console.error(`Failed to delete processing trigger ${trigger._id}:`, error);
      }
    }

    console.log(`Cleanup complete: deleted ${deletedCount} Monday data entries and ${deletedTriggers} processing triggers`);

    return {
      deletedMondayData: deletedCount,
      deletedTriggers,
      cutoffWeek,
      cutoffDate: oneWeekAgoISO,
    };
  },
});