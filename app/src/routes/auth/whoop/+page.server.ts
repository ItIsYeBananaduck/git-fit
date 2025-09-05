import { redirect } from '@sveltejs/kit';
import { WHOOPClient } from '$lib/api/whoop';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, platform }) => {
  // Get environment variables
  const WHOOP_CLIENT_ID = platform?.env?.WHOOP_CLIENT_ID || process.env.WHOOP_CLIENT_ID;
  const WHOOP_CLIENT_SECRET = platform?.env?.WHOOP_CLIENT_SECRET || process.env.WHOOP_CLIENT_SECRET;
  
  if (!WHOOP_CLIENT_ID || !WHOOP_CLIENT_SECRET) {
    throw new Error('WHOOP API credentials not configured');
  }

  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get('state');

  // Handle OAuth error
  if (error) {
    return {
      success: false,
      error: `WHOOP authorization failed: ${error}`
    };
  }

  // Handle OAuth callback
  if (code && state) {
    try {
      const redirectUri = `${url.origin}/auth/whoop`;
      const whoopClient = new WHOOPClient(WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET, redirectUri);
      
      // Exchange code for tokens
      const tokens = await whoopClient.exchangeCodeForTokens(code);
      
      // Get user profile
      const user = await whoopClient.getUserProfile(tokens.access_token);
      
      return {
        success: true,
        user,
        tokens,
        message: 'WHOOP connected successfully!'
      };
      
    } catch (err) {
      return {
        success: false,
        error: `Failed to connect WHOOP: ${err instanceof Error ? err.message : 'Unknown error'}`
      };
    }
  }

  // No code parameter - this is not a callback
  return {
    success: false,
    error: 'Invalid WHOOP authorization request'
  };
};