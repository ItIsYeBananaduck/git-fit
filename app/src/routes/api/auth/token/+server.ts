import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export const POST = async ({ request }: RequestEvent) => {
  try {
    const { code, platform } = await request.json();
    
    if (!code || !platform) {
      return json({ error: 'Code and platform are required' }, { status: 400 });
    }

    if (platform === 'spotify') {
      return await handleSpotifyToken(code);
    }

    return json({ error: 'Unsupported platform' }, { status: 400 });

  } catch (error) {
    console.error('Token exchange error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};

async function handleSpotifyToken(code: string) {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = `${process.env.ORIGIN || 'http://localhost:5173'}/auth/callback`;

  if (!clientId || !clientSecret) {
    return json({ error: 'Spotify credentials not configured' }, { status: 500 });
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri
    })
  });

  if (!tokenResponse.ok) {
    const errorData = await tokenResponse.json();
    return json({ error: 'Failed to exchange code for token', details: errorData }, { status: 400 });
  }

  const tokenData = await tokenResponse.json();
  
  return json({
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token,
    expires_in: tokenData.expires_in
  });
}