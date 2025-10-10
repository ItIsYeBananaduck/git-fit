// Minimal OAuth for playlist management only
// Simple implementation focused on adding songs to playlists

// Type declarations for MusicKit
declare global {
  interface Window {
    MusicKit: {
      configure: (config: Record<string, unknown>) => MusicKitInstance;
    };
  }
}

interface MusicKitInstance {
  isAuthorized: boolean;
  authorize: () => Promise<void>;
  unauthorize: () => void;
  api: {
    search: (query: string, options: Record<string, unknown>) => Promise<Record<string, unknown>>;
  };
}

export interface MusicPlatform {
  name: 'spotify' | 'apple_music';
  connected: boolean;
  canCreatePlaylists: boolean;
  canAddToPlaylists: boolean;
}

export interface PlaylistTrack {
  id: string;
  name: string;
  artist: string;
  uri?: string; // Platform-specific URI
  external_urls?: {
    spotify?: string;
    apple_music?: string;
  };
}

export class MinimalSpotifyAuth {
  private accessToken: string | null = null;

  constructor() {
    // Check for stored token
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('spotify_token');
    }
  }

  isConnected(): boolean {
    return !!this.accessToken;
  }

  getAuthUrl(): string {
    const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    const scopes = [
      'playlist-modify-public',
      'playlist-modify-private'
    ].join(' ');

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: scopes,
      redirect_uri: redirectUri,
      state: 'spotify'
    });

    return `https://accounts.spotify.com/authorize?${params}`;
  }

  async exchangeCode(code: string): Promise<void> {
    const response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, platform: 'spotify' })
    });

    if (!response.ok) throw new Error('Token exchange failed');
    
    const { access_token } = await response.json();
    this.accessToken = access_token;
    localStorage.setItem('spotify_token', access_token);
  }

  async createPlaylist(name: string, description: string): Promise<string> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const response = await fetch('https://api.spotify.com/v1/me/playlists', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        description,
        public: false
      })
    });

    if (!response.ok) throw new Error('Failed to create playlist');
    
    const playlist = await response.json();
    return playlist.id;
  }

  async addTracksToPlaylist(playlistId: string, trackUris: string[]): Promise<void> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        uris: trackUris
      })
    });

    if (!response.ok) throw new Error('Failed to add tracks');
  }

  async searchTrack(query: string): Promise<PlaylistTrack | null> {
    if (!this.accessToken) throw new Error('Not authenticated');

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=1`,
      {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) return null;
    
    const data = await response.json();
    const track = data.tracks.items[0];
    
    if (!track) return null;

    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown',
      uri: track.uri,
      external_urls: track.external_urls
    };
  }

  disconnect(): void {
    this.accessToken = null;
    localStorage.removeItem('spotify_token');
  }
}

// Simplified Apple Music (MusicKit JS)
export class MinimalAppleMusicAuth {
  private musicKit: MusicKitInstance | null = null;

  async initialize(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Load MusicKit JS
    if (!window.MusicKit) {
      await this.loadMusicKit();
    }

    this.musicKit = window.MusicKit.configure({
      developerToken: import.meta.env.VITE_APPLE_MUSIC_DEVELOPER_TOKEN,
      app: {
        name: 'GitFit',
        build: '1.0.0'
      }
    });
  }

  private async loadMusicKit(): Promise<void> {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }

  isConnected(): boolean {
    return this.musicKit?.isAuthorized || false;
  }

  async connect(): Promise<void> {
    if (!this.musicKit) await this.initialize();
    if (this.musicKit) {
      await this.musicKit.authorize();
    }
  }

  async searchTrack(query: string): Promise<PlaylistTrack | null> {
    if (!this.musicKit?.isAuthorized) return null;

    try {
      const results = await this.musicKit.api.search(query, { types: ['songs'], limit: 1 }) as unknown as {
        songs?: { data?: Array<{ id: string; attributes?: { name?: string; artistName?: string; url?: string } }> };
      };
      const song = results.songs?.data?.[0];
      
      if (!song) return null;

      return {
        id: song.id,
        name: song.attributes?.name || 'Unknown',
        artist: song.attributes?.artistName || 'Unknown',
        external_urls: {
          apple_music: song.attributes?.url
        }
      };
    } catch (error) {
      console.error('Apple Music search failed:', error);
      return null;
    }
  }

  disconnect(): void {
    this.musicKit?.unauthorize();
  }
}