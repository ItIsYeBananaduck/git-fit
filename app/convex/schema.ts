import { defineSchema, defineTable} from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  trainingPrograms: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    createdAt: v.string(),
  }),
});
