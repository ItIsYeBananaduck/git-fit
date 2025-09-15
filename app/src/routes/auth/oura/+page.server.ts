import { redirect } from '@sveltejs/kit';
import { exchangeOuraCode } from '$lib/api/oura';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, platform }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  // Handle OAuth errors
  if (error) {
    console.error('Oura OAuth error:', error);
    throw redirect(302, '/adaptive-training?error=oura_auth_failed');
  }

  // If no code, redirect back
  if (!code) {
    throw redirect(302, '/adaptive-training?error=oura_no_code');
  }

  // Get environment variables
  const OURA_CLIENT_ID = process.env.OURA_CLIENT_ID;
  const OURA_CLIENT_SECRET = process.env.OURA_CLIENT_SECRET;

  if (!OURA_CLIENT_ID || !OURA_CLIENT_SECRET) {
    console.error('Missing Oura OAuth credentials');
    throw redirect(302, '/adaptive-training?error=oura_config_missing');
  }

  try {
    // Exchange code for tokens
    const redirectUri = `${url.origin}/auth/oura`;
    const tokens = await exchangeOuraCode(code, OURA_CLIENT_ID, OURA_CLIENT_SECRET, redirectUri);
    
    // Return tokens to be handled by the client
    return {
      success: true,
      tokens,
      redirectTo: '/adaptive-training?connected=oura'
    };
  } catch (error) {
    console.error('Error exchanging Oura code:', error);
    throw redirect(302, '/adaptive-training?error=oura_token_exchange_failed');
  }
};