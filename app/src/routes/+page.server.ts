// Server-side route protection for dashboard

import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/utils/auth-guards';

export const load: PageServerLoad = async ({ url, cookies }) => {
  // For now, we'll handle auth client-side since we're using Convex
  // In a full implementation, you'd validate the session server-side
  return {};
};