import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Accepts a file upload (CSV, Excel, or Google Sheets export as CSV)
// Stores the raw file and returns a fileId for further processing
export const uploadProgramFile = mutation({
  args: {
    file: v.string(), // base64-encoded file content
    filename: v.string(),
    mimetype: v.string(),
    trainerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Store the file in Convex storage (or external if needed)
    // For now, just store as a document in a new table
    const now = new Date().toISOString();
    const fileDoc = {
      trainerId: args.trainerId,
      filename: args.filename,
      mimetype: args.mimetype,
      fileContent: args.file, // base64 string
      uploadedAt: now,
      status: "uploaded", // or "parsed", "error"
    };
    const id = await ctx.db.insert("programFiles", fileDoc);
    return { fileId: id };
  },
});
