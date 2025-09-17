import { query } from "../_generated/server";
import { v } from "convex/values";

// Query: Get marketplace programs with filters
export const getMarketplacePrograms = query({
  args: {
    search: v.optional(v.string()),
    category: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    maxPrice: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("programs");
    if (args.category) q = q.filter((row) => row.goal === args.category);
    if (args.difficulty) q = q.filter((row) => row.difficulty === args.difficulty);
    if (args.maxPrice) q = q.filter((row) => row.price <= args.maxPrice);
    if (args.search) {
      const search = args.search.toLowerCase();
      q = q.filter((row) =>
        row.title.toLowerCase().includes(search) ||
        row.description.toLowerCase().includes(search)
      );
    }
    let results = await q.collect();
    if (args.limit) results = results.slice(0, args.limit);
    return results;
  },
});

// Query: Get available trainers with filters
export const getAvailableTrainers = query({
  args: {
    search: v.optional(v.string()),
    specialty: v.optional(v.string()),
    maxHourlyRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("users").withIndex("by_role", (q) => q.eq("role", "trainer"));
    if (args.specialty) q = q.filter((row) => row.specialties && row.specialties.includes(args.specialty));
    if (args.maxHourlyRate) q = q.filter((row) => row.hourlyRate && row.hourlyRate <= args.maxHourlyRate);
    if (args.search) {
      const search = args.search.toLowerCase();
      q = q.filter((row) =>
        row.name.toLowerCase().includes(search) ||
        (row.bio && row.bio.toLowerCase().includes(search))
      );
    }
    return await q.collect();
  },
});
