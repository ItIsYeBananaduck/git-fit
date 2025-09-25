import { user } from '../stores/auth.js';
import { get } from 'svelte/store';

/**
 * Get the current user's ID
 * @returns Promise<string> - User ID if authenticated, empty string if not
 */
export async function getUserId(): Promise<string> {
    const currentUser = get(user);
    return currentUser?._id || '';
}

/**
 * Re-export auth utilities
 */
export { user, isAuthenticated, authStore, getAuthUser } from '../stores/auth.js';