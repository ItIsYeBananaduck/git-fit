// Simple in-memory rate limiter for SvelteKit endpoints
// For production, use Redis or a managed solution

const RATE_LIMIT = 10; // max requests
const WINDOW_MS = 60 * 1000; // per minute

const ipHits: Record<string, { count: number; last: number }> = {};

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  if (!ipHits[ip] || now - ipHits[ip].last > WINDOW_MS) {
    ipHits[ip] = { count: 1, last: now };
    return false;
  }
  ipHits[ip].count++;
  ipHits[ip].last = now;
  if (ipHits[ip].count > RATE_LIMIT) {
    return true;
  }
  return false;
}
