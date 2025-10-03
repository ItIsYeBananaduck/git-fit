# Music Platform Integration Setup

## Environment Variables

Add these to your `.env` files:

### Frontend (.env)

```bash
VITE_SPOTIFY_CLIENT_ID=your_spotify_client_id
VITE_APPLE_MUSIC_DEVELOPER_TOKEN=your_apple_music_developer_token
```

### Backend (.env.local)

```bash
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
ORIGIN=http://localhost:5173
```

## Spotify Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://localhost:5173/auth/callback`
4. Copy Client ID and Client Secret
5. Set scopes: `playlist-modify-public`, `playlist-modify-private`

## Apple Music Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create MusicKit identifier
3. Generate developer token
4. Add to environment variables

## Features

✅ **AI Music Recommendations** - No auth required  
✅ **Spotify Playlist Creation** - Minimal OAuth  
✅ **Apple Music Integration** - MusicKit JS  
✅ **Simple Setup** - No complex provider management

Users can:

- Get AI workout music recommendations
- Connect Spotify/Apple Music (optional)
- Create playlists from AI recommendations
- Workout without any music service connection
