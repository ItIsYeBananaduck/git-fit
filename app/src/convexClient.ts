// Convex client setup for audit services
import { ConvexHttpClient } from 'convex/browser';

// Create Convex client
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  console.warn('VITE_CONVEX_URL not found, Convex operations will fail');
}

export const convexClient = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null;