import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

// Query: List all pending trainer certifications
export const listPendingCertifications = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("trainerCertifications")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

// Mutation: Approve or reject a trainer certification
export const reviewTrainerCertification = mutation({
  args: {
    certificationId: v.id("trainerCertifications"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    adminId: v.id("adminUsers"),
    reviewNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { certificationId, status, adminId, reviewNotes } = args;
    const now = new Date().toISOString();
    await ctx.db.patch(certificationId, {
      status,
      reviewedBy: adminId,
      reviewedAt: now,
      reviewNotes,
    });
    // If approved, update the trainer's certificationVerified flag
    if (status === "approved") {
      const cert = await ctx.db.get(certificationId);
      if (cert && cert.trainerId) {
        const trainer = await ctx.db.get(cert.trainerId);
        if (trainer) {
          await ctx.db.patch(trainer._id, { certificationVerified: true });
        }
      }
    }
    return { success: true };
  },
});
