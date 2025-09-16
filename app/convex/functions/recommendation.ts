
import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Recommend a training split based on user goals and available data.
 * This is a placeholder logic. Replace with more advanced AI/ML as needed.
 */
export const recommendTrainingSplit = query({
    args: {
        userId: v.id("users"),
        goal: v.optional(v.string()), // e.g. "hypertrophy", "strength", "endurance"
        experience: v.optional(v.string()), // e.g. "beginner", "intermediate", "advanced"
        availableDays: v.optional(v.number()), // e.g. 3, 4, 5, 6
    },
    handler: async (ctx, args) => {
        // Fetch user data if needed
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("User not found");

        // Example logic: simple rules-based recommendation

        const goal = (args.goal || user.goals?.[0] || "hypertrophy") as "hypertrophy" | "strength" | "endurance";
        const experience = (args.experience || user.fitnessLevel || "beginner") as "beginner" | "intermediate" | "advanced";
        const availableDays = args.availableDays || 3;

        // Example splits
        const splits: Record<"hypertrophy" | "strength" | "endurance", Record<"beginner" | "intermediate" | "advanced", Array<{ name: string; days: number; description: string }>>> = {
            hypertrophy: {
                beginner: [
                    { name: "Full Body 3x", days: 3, description: "Full body workouts 3x/week" },
                    { name: "Upper/Lower", days: 4, description: "Upper/Lower split 4x/week" }
                ],
                intermediate: [
                    { name: "Push/Pull/Legs", days: 6, description: "PPL split 6x/week" },
                    { name: "Upper/Lower", days: 4, description: "Upper/Lower split 4x/week" }
                ],
                advanced: [
                    { name: "Body Part Split", days: 5, description: "Bro split 5x/week" },
                    { name: "Push/Pull/Legs", days: 6, description: "PPL split 6x/week" }
                ]
            },
            strength: {
                beginner: [
                    { name: "Full Body 3x", days: 3, description: "Full body strength 3x/week" }
                ],
                intermediate: [
                    { name: "Upper/Lower", days: 4, description: "Strength upper/lower 4x/week" }
                ],
                advanced: [
                    { name: "Push/Pull/Legs", days: 6, description: "Strength PPL 6x/week" }
                ]
            },
            endurance: {
                beginner: [
                    { name: "Full Body Circuit", days: 3, description: "Circuit training 3x/week" }
                ],
                intermediate: [
                    { name: "Full Body Circuit", days: 4, description: "Circuit training 4x/week" }
                ],
                advanced: [
                    { name: "Hybrid Split", days: 5, description: "Hybrid strength/endurance 5x/week" }
                ]
            }
        };

        // Pick best match
        const options = splits[goal][experience] || splits.hypertrophy.beginner;
        // Filter by available days
        const filtered = options.filter((opt: { days: number }) => opt.days <= availableDays);
        const recommended = filtered.length > 0 ? filtered : options;

        return { recommended, allOptions: options };
    }
});
