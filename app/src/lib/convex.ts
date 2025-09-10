// Convex client configuration
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL || process.env.PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  throw new Error("Missing CONVEX_URL environment variable");
}

export const convex = new ConvexHttpClient(CONVEX_URL);

// Export the API for use in mutations and queries
export { api } from "../../convex/_generated/api";