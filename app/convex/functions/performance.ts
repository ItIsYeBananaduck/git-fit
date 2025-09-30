import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Map UI categories to numeric RPE targets (1-10 scale)
function rpeFromCategory(cat: "easy" | "moderate" | "hard"): number {
  switch (cat) {
    case "easy":
      return 6.5; // ~3-4 RIR
    case "moderate":
      return 8; // ~2 RIR
    case "hard":
      return 9.5; // ~0-1 RIR
  }
}

export const logSetRPE = mutation({
  args: {
    sessionId: v.id("workoutSessions"),
    exerciseId: v.id("exercises"),
    setIndex: v.number(), // 0-based index for the set
    category: v.union(v.literal("easy"), v.literal("moderate"), v.literal("hard")),
  },
  handler: async (ctx, args) => {
    // Try to find the performance doc for this session/exercise
    const perf = await ctx.db
      .query("exercisePerformance")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => q.eq(q.field("exerciseId"), args.exerciseId))
      .first();

    const rpeValue = rpeFromCategory(args.category);

    if (!perf) {
      // Create new doc with minimal fields
      const rpePerSet: number[] = [];
      rpePerSet[args.setIndex] = rpeValue;
      await ctx.db.insert("exercisePerformance", {
        sessionId: args.sessionId,
        exerciseId: args.exerciseId,
        actualSets: Math.max(1, args.setIndex + 1),
        actualReps: [],
        actualWeight: [],
        rpePerSet,
        difficulty: args.category,
        createdAt: new Date().toISOString(),
      });
      return { ok: true as const, created: true };
    }

    const rpePerSet = Array.isArray(perf.rpePerSet) ? [...perf.rpePerSet] : [];
    // Ensure array is long enough
    while (rpePerSet.length <= args.setIndex) rpePerSet.push(NaN);
    rpePerSet[args.setIndex] = rpeValue;

    const update: any = { rpePerSet };
    // Optionally update difficulty to the most recent category
    update.difficulty = args.category;
    // Optionally bump actualSets if needed
    if (typeof perf.actualSets === "number" && perf.actualSets < args.setIndex + 1) {
      update.actualSets = args.setIndex + 1;
    }

    await ctx.db.patch(perf._id, update);
    return { ok: true as const, updated: true };
  },
});
