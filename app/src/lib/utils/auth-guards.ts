// Authentication route guards

import { redirect } from '@sveltejs/kit';
import { authService } from '$lib/services/authService';
import type { User } from '$lib/types/auth';

/**
 * Require authentication for a route
 */
export function requireAuth(user: User | null, currentPath: string) {
  if (!user) {
    throw redirect(302, `/auth/login?redirect=${encodeURIComponent(currentPath)}`);
  }
  return user;
}

/**
 * Require specific role for a route
 */
export function requireRole(user: User | null, requiredRole: string | string[], currentPath: string) {
  const authenticatedUser = requireAuth(user, currentPath);
  
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  if (!allowedRoles.includes(authenticatedUser.role)) {
    throw redirect(302, '/unauthorized');
  }
  
  return authenticatedUser;
}

/**
 * Redirect if already authenticated (for auth pages)
 */
export function redirectIfAuthenticated(user: User | null, redirectTo: string = '/') {
  if (user) {
    throw redirect(302, redirectTo);
  }
}

/**
 * Check if user has admin access
 */
export function requireAdmin(user: User | null, currentPath: string) {
  return requireRole(user, 'admin', currentPath);
}

/**
 * Check if user is trainer
 */
export function requireTrainer(user: User | null, currentPath: string) {
  return requireRole(user, ['trainer', 'admin'], currentPath);
}

/**
 * Check if user is client
 */
export function requireClient(user: User | null, currentPath: string) {
  return requireRole(user, ['client', 'admin'], currentPath);
}