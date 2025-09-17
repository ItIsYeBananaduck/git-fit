import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Upload a trainer certification file (PDF/image)
export const uploadTrainerCertification = mutation({
  args: {
    trainerId: v.id("trainers"),
    userId: v.id("users"),
    filename: v.string(),
    mimetype: v.string(),
    fileContent: v.string(), // base64-encoded
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const cert = {
      ...args,
      uploadedAt: now,
      status: "pending",
    };
    const id = await ctx.db.insert("trainerCertifications", cert);
    return { id };
  },
});
