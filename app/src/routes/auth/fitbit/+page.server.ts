import { redirect } from '@sveltejs/kit';
import { exchangeFitbitCode } from '$lib/api/fitbit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, platform }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Fitbit OAuth error:', error);
    throw redirect(302, '/adaptive-training?error=fitbit_auth_failed');
  }

  // If no code, redirect back
  if (!code) {
    throw redirect(302, '/adaptive-training?error=fitbit_no_code');
  }

  // Get environment variables
  const FITBIT_CLIENT_ID = platform?.env?.FITBIT_CLIENT_ID || process.env.FITBIT_CLIENT_ID;
  const FITBIT_CLIENT_SECRET = platform?.env?.FITBIT_CLIENT_SECRET || process.env.FITBIT_CLIENT_SECRET;

  if (!FITBIT_CLIENT_ID || !FITBIT_CLIENT_SECRET) {
    console.error('Missing Fitbit OAuth credentials');
    throw redirect(302, '/adaptive-training?error=fitbit_config_missing');
  }

  try {
    // Exchange code for tokens
    const redirectUri = `${url.origin}/auth/fitbit`;
    const tokens = await exchangeFitbitCode(code, FITBIT_CLIENT_ID, FITBIT_CLIENT_SECRET, redirectUri);
    
    // Return tokens to be handled by the client
    return {
      success: true,
      tokens,
      redirectTo: '/adaptive-training?connected=fitbit'
    };
  } catch (error) {
    console.error('Error exchanging Fitbit code:', error);
    throw redirect(302, '/adaptive-training?error=fitbit_token_exchange_failed');
  }
};