/**
 * OAuth Service Layer Integration - External API Wrappers
 * 
 * Implements service layer for OAuth provider integrations:
 * - Spotify Web API wrapper with rate limiting
 * - Apple Music API wrapper with authentication
 * - YouTube Music API wrapper with error handling
 * - Unified service interface for music streaming APIs
 */

import { ConvexError } from 'convex/values';

// ====================================================================================
// SERVICE INTERFACES
// ====================================================================================

interface MusicProvider {
  id: string;
  name: string;
  baseUrl: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  country: string;
  followers?: number;
  images?: Array<{ url: string; width: number; height: number }>;
}

interface Track {
  id: string;
  name: string;
  artists: Array<{ id: string; name: string }>;
  album: { id: string; name: string; images: Array<{ url: string; width: number; height: number }> };
  duration_ms: number;
  explicit: boolean;
  popularity: number;
  preview_url?: string;
  external_urls: Record<string, string>;
  audioFeatures?: AudioFeatures;
}

interface Artist {
  id: string;
  name: string;
  genres: string[];
  popularity: number;
  followers: number;
  images: Array<{ url: string; width: number; height: number }>;
  external_urls: Record<string, string>;
}

interface AudioFeatures {
  energy: number;
  valence: number;
  danceability: number;
  tempo: number;
  acousticness: number;
  instrumentalness: number;
  liveness: number;
  loudness: number;
  speechiness: number;
  key: number;
  mode: number;
  time_signature: number;
}

interface Playlist {
  id: string;
  name: string;
  description: string;
  images: Array<{ url: string; width: number; height: number }>;
  tracks: {
    total: number;
    items: Array<{ track: Track; added_at: string }>;
  };
  public: boolean;
  collaborative: boolean;
  owner: { id: string; display_name: string };
}

// ====================================================================================
// RATE LIMITING UTILITIES
// ====================================================================================

class RateLimiter {
  private requests: Map<string, Array<number>> = new Map();
  private limits: Map<string, { rpm: number; rph: number }> = new Map();

  constructor() {
    this.limits.set('spotify', { rpm: 100, rph: 1000 });
    this.limits.set('apple_music', { rpm: 200, rph: 10000 });
    this.limits.set('youtube_music', { rpm: 1000, rph: 50000 });
  }

  async checkLimit(providerId: string): Promise<boolean> {
    const now = Date.now();
    const limits = this.limits.get(providerId);
    if (!limits) return true;

    const requests = this.requests.get(providerId) || [];
    
    // Remove old requests (older than 1 hour)
    const validRequests = requests.filter(time => now - time < 3600000);
    
    // Check RPM limit
    const recentRequests = validRequests.filter(time => now - time < 60000);
    if (recentRequests.length >= limits.rpm) {
      return false;
    }
    
    // Check RPH limit
    if (validRequests.length >= limits.rph) {
      return false;
    }
    
    return true;
  }

  async recordRequest(providerId: string): Promise<void> {
    const now = Date.now();
    const requests = this.requests.get(providerId) || [];
    requests.push(now);
    
    // Keep only last hour of requests
    const validRequests = requests.filter(time => now - time < 3600000);
    this.requests.set(providerId, validRequests);
  }

  async getWaitTime(providerId: string): Promise<number> {
    const now = Date.now();
    const limits = this.limits.get(providerId);
    if (!limits) return 0;

    const requests = this.requests.get(providerId) || [];
    const recentRequests = requests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= limits.rpm) {
      const oldestRequest = Math.min(...recentRequests);
      return Math.max(0, 60000 - (now - oldestRequest));
    }
    
    return 0;
  }
}

const rateLimiter = new RateLimiter();

// ====================================================================================
// BASE SERVICE CLASS
// ====================================================================================

abstract class MusicServiceBase {
  protected provider: MusicProvider;
  protected accessToken: string;

  constructor(provider: MusicProvider, accessToken: string) {
    this.provider = provider;
    this.accessToken = accessToken;
  }

  protected async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Check rate limits
    const canMakeRequest = await rateLimiter.checkLimit(this.provider.id);
    if (!canMakeRequest) {
      const waitTime = await rateLimiter.getWaitTime(this.provider.id);
      throw new ConvexError({
        message: `Rate limit exceeded for ${this.provider.name}. Try again in ${Math.ceil(waitTime / 1000)} seconds`,
        code: 'RATE_LIMITED',
        details: { providerId: this.provider.id, waitTime }
      });
    }

    // Record request
    await rateLimiter.recordRequest(this.provider.id);

    const url = `${this.provider.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        throw new ConvexError({
          message: `${this.provider.name} API error: ${response.status} ${response.statusText}`,
          code: 'API_ERROR',
          details: {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
            endpoint: endpoint,
          }
        });
      }

      return await response.json();
    } catch (error) {
      if (error instanceof ConvexError) {
        throw error;
      }
      
      console.error(`API request failed for ${this.provider.name}:`, error);
      throw new ConvexError({
        message: `Failed to make request to ${this.provider.name}`,
        code: 'REQUEST_FAILED',
        details: {
          endpoint: endpoint,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      });
    }
  }

  // Abstract methods that each service must implement
  abstract getUserProfile(): Promise<UserProfile>;
  abstract getTopTracks(timeRange?: string, limit?: number): Promise<Track[]>;
  abstract getTopArtists(timeRange?: string, limit?: number): Promise<Artist[]>;
  abstract getRecentTracks(limit?: number): Promise<Track[]>;
  abstract getAudioFeatures(trackIds: string[]): Promise<AudioFeatures[]>;
  abstract getUserPlaylists(limit?: number): Promise<Playlist[]>;
}

// ====================================================================================
// SPOTIFY SERVICE
// ====================================================================================

export class SpotifyService extends MusicServiceBase {
  constructor(accessToken: string) {
    const provider: MusicProvider = {
      id: 'spotify',
      name: 'Spotify',
      baseUrl: 'https://api.spotify.com/v1',
      rateLimit: { requestsPerMinute: 100, requestsPerHour: 1000 }
    };
    super(provider, accessToken);
  }

  async getUserProfile(): Promise<UserProfile> {
    const data = await this.makeRequest<any>('/me');
    return {
      id: data.id,
      displayName: data.display_name,
      email: data.email,
      country: data.country,
      followers: data.followers?.total,
      images: data.images || [],
    };
  }

  async getTopTracks(timeRange: string = 'medium_term', limit: number = 50): Promise<Track[]> {
    const data = await this.makeRequest<any>(`/me/top/tracks?time_range=${timeRange}&limit=${limit}`);
    return data.items.map(this.mapSpotifyTrack.bind(this));
  }

  async getTopArtists(timeRange: string = 'medium_term', limit: number = 50): Promise<Artist[]> {
    const data = await this.makeRequest<any>(`/me/top/artists?time_range=${timeRange}&limit=${limit}`);
    return data.items.map(this.mapSpotifyArtist.bind(this));
  }

  async getRecentTracks(limit: number = 50): Promise<Track[]> {
    const data = await this.makeRequest<any>(`/me/player/recently-played?limit=${limit}`);
    return data.items.map((item: any) => this.mapSpotifyTrack(item.track));
  }

  async getAudioFeatures(trackIds: string[]): Promise<AudioFeatures[]> {
    if (trackIds.length === 0) return [];
    
    const ids = trackIds.join(',');
    const data = await this.makeRequest<any>(`/audio-features?ids=${ids}`);
    return data.audio_features.filter((features: any) => features !== null);
  }

  async getUserPlaylists(limit: number = 50): Promise<Playlist[]> {
    const data = await this.makeRequest<any>(`/me/playlists?limit=${limit}`);
    return await Promise.all(
      data.items.map(async (playlist: any) => {
        const detailedPlaylist = await this.makeRequest<any>(`/playlists/${playlist.id}`);
        return this.mapSpotifyPlaylist(detailedPlaylist);
      })
    );
  }

  async searchTracks(query: string, limit: number = 20): Promise<Track[]> {
    const encodedQuery = encodeURIComponent(query);
    const data = await this.makeRequest<any>(`/search?q=${encodedQuery}&type=track&limit=${limit}`);
    return data.tracks.items.map(this.mapSpotifyTrack.bind(this));
  }

  async getRecommendations(options: {
    seedTracks?: string[];
    seedArtists?: string[];
    seedGenres?: string[];
    targetEnergy?: number;
    targetTempo?: number;
    targetValence?: number;
    limit?: number;
  }): Promise<Track[]> {
    const params = new URLSearchParams();
    
    if (options.seedTracks) params.append('seed_tracks', options.seedTracks.join(','));
    if (options.seedArtists) params.append('seed_artists', options.seedArtists.join(','));
    if (options.seedGenres) params.append('seed_genres', options.seedGenres.join(','));
    if (options.targetEnergy) params.append('target_energy', options.targetEnergy.toString());
    if (options.targetTempo) params.append('target_tempo', options.targetTempo.toString());
    if (options.targetValence) params.append('target_valence', options.targetValence.toString());
    params.append('limit', (options.limit || 20).toString());

    const data = await this.makeRequest<any>(`/recommendations?${params.toString()}`);
    return data.tracks.map(this.mapSpotifyTrack.bind(this));
  }

  private mapSpotifyTrack(track: any): Track {
    return {
      id: track.id,
      name: track.name,
      artists: track.artists.map((artist: any) => ({
        id: artist.id,
        name: artist.name,
      })),
      album: {
        id: track.album.id,
        name: track.album.name,
        images: track.album.images || [],
      },
      duration_ms: track.duration_ms,
      explicit: track.explicit,
      popularity: track.popularity,
      preview_url: track.preview_url,
      external_urls: track.external_urls,
    };
  }

  private mapSpotifyArtist(artist: any): Artist {
    return {
      id: artist.id,
      name: artist.name,
      genres: artist.genres || [],
      popularity: artist.popularity,
      followers: artist.followers?.total || 0,
      images: artist.images || [],
      external_urls: artist.external_urls,
    };
  }

  private mapSpotifyPlaylist(playlist: any): Playlist {
    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description || '',
      images: playlist.images || [],
      tracks: {
        total: playlist.tracks.total,
        items: playlist.tracks.items?.map((item: any) => ({
          track: this.mapSpotifyTrack(item.track),
          added_at: item.added_at,
        })) || [],
      },
      public: playlist.public,
      collaborative: playlist.collaborative,
      owner: {
        id: playlist.owner.id,
        display_name: playlist.owner.display_name,
      },
    };
  }
}

// ====================================================================================
// APPLE MUSIC SERVICE
// ====================================================================================

export class AppleMusicService extends MusicServiceBase {
  constructor(accessToken: string) {
    const provider: MusicProvider = {
      id: 'apple_music',
      name: 'Apple Music',
      baseUrl: 'https://api.music.apple.com/v1',
      rateLimit: { requestsPerMinute: 200, requestsPerHour: 10000 }
    };
    super(provider, accessToken);
  }

  async getUserProfile(): Promise<UserProfile> {
    // Apple Music has limited user profile access
    // This is a simplified implementation
    return {
      id: 'apple_music_user',
      displayName: 'Apple Music User',
      country: 'US',
    };
  }

  async getTopTracks(timeRange: string = 'medium_term', limit: number = 50): Promise<Track[]> {
    // Apple Music doesn't have direct "top tracks" endpoint
    // This would require implementing heavy rotation or recently played as proxy
    const data = await this.makeRequest<any>('/me/recent/played/tracks');
    return data.data?.map(this.mapAppleTrack.bind(this)) || [];
  }

  async getTopArtists(timeRange: string = 'medium_term', limit: number = 50): Promise<Artist[]> {
    // Similar limitation - would need to derive from listening history
    return [];
  }

  async getRecentTracks(limit: number = 50): Promise<Track[]> {
    const data = await this.makeRequest<any>(`/me/recent/played/tracks?limit=${limit}`);
    return data.data?.map(this.mapAppleTrack.bind(this)) || [];
  }

  async getAudioFeatures(trackIds: string[]): Promise<AudioFeatures[]> {
    // Apple Music doesn't provide detailed audio features like Spotify
    // Would need to use a different service or return estimated values
    return [];
  }

  async getUserPlaylists(limit: number = 50): Promise<Playlist[]> {
    const data = await this.makeRequest<any>(`/me/library/playlists?limit=${limit}`);
    return data.data?.map(this.mapApplePlaylist.bind(this)) || [];
  }

  async searchTracks(query: string, limit: number = 20): Promise<Track[]> {
    const encodedQuery = encodeURIComponent(query);
    const data = await this.makeRequest<any>(`/catalog/us/search?term=${encodedQuery}&types=songs&limit=${limit}`);
    return data.results?.songs?.data?.map(this.mapAppleTrack.bind(this)) || [];
  }

  private mapAppleTrack(track: any): Track {
    return {
      id: track.id,
      name: track.attributes.name,
      artists: [{
        id: track.attributes.artistName,
        name: track.attributes.artistName,
      }],
      album: {
        id: track.attributes.albumName,
        name: track.attributes.albumName,
        images: track.attributes.artwork ? [{
          url: track.attributes.artwork.url,
          width: track.attributes.artwork.width,
          height: track.attributes.artwork.height,
        }] : [],
      },
      duration_ms: track.attributes.durationInMillis,
      explicit: track.attributes.contentRating === 'explicit',
      popularity: 0, // Apple doesn't provide popularity scores
      preview_url: track.attributes.previews?.[0]?.url,
      external_urls: {
        apple_music: track.attributes.url,
      },
    };
  }

  private mapApplePlaylist(playlist: any): Playlist {
    return {
      id: playlist.id,
      name: playlist.attributes.name,
      description: playlist.attributes.description?.standard || '',
      images: playlist.attributes.artwork ? [{
        url: playlist.attributes.artwork.url,
        width: playlist.attributes.artwork.width,
        height: playlist.attributes.artwork.height,
      }] : [],
      tracks: {
        total: playlist.attributes.trackCount || 0,
        items: [],
      },
      public: !playlist.attributes.isPrivate,
      collaborative: false,
      owner: {
        id: 'apple_music',
        display_name: 'Apple Music',
      },
    };
  }
}

// ====================================================================================
// YOUTUBE MUSIC SERVICE
// ====================================================================================

export class YouTubeMusicService extends MusicServiceBase {
  constructor(accessToken: string) {
    const provider: MusicProvider = {
      id: 'youtube_music',
      name: 'YouTube Music',
      baseUrl: 'https://www.googleapis.com/youtube/v3',
      rateLimit: { requestsPerMinute: 1000, requestsPerHour: 50000 }
    };
    super(provider, accessToken);
  }

  async getUserProfile(): Promise<UserProfile> {
    const data = await this.makeRequest<any>('/channels?part=snippet&mine=true');
    const channel = data.items?.[0];
    
    return {
      id: channel?.id || 'youtube_user',
      displayName: channel?.snippet?.title || 'YouTube Music User',
      country: channel?.snippet?.country || 'US',
      images: channel?.snippet?.thumbnails ? [channel.snippet.thumbnails.default] : [],
    };
  }

  async getTopTracks(timeRange: string = 'medium_term', limit: number = 50): Promise<Track[]> {
    // YouTube Music uses playlists and search for music discovery
    // This is a simplified implementation
    const data = await this.makeRequest<any>(`/search?part=snippet&type=video&videoCategoryId=10&maxResults=${limit}&order=relevance`);
    return data.items?.map(this.mapYouTubeTrack.bind(this)) || [];
  }

  async getTopArtists(timeRange: string = 'medium_term', limit: number = 50): Promise<Artist[]> {
    const data = await this.makeRequest<any>(`/search?part=snippet&type=channel&maxResults=${limit}&order=relevance`);
    return data.items?.map(this.mapYouTubeArtist.bind(this)) || [];
  }

  async getRecentTracks(limit: number = 50): Promise<Track[]> {
    // Would need to access watch history - simplified implementation
    return [];
  }

  async getAudioFeatures(trackIds: string[]): Promise<AudioFeatures[]> {
    // YouTube doesn't provide audio features directly
    return [];
  }

  async getUserPlaylists(limit: number = 50): Promise<Playlist[]> {
    const data = await this.makeRequest<any>(`/playlists?part=snippet&mine=true&maxResults=${limit}`);
    return data.items?.map(this.mapYouTubePlaylist.bind(this)) || [];
  }

  async searchTracks(query: string, limit: number = 20): Promise<Track[]> {
    const encodedQuery = encodeURIComponent(query);
    const data = await this.makeRequest<any>(`/search?part=snippet&type=video&videoCategoryId=10&q=${encodedQuery}&maxResults=${limit}`);
    return data.items?.map(this.mapYouTubeTrack.bind(this)) || [];
  }

  private mapYouTubeTrack(video: any): Track {
    return {
      id: video.id.videoId || video.id,
      name: video.snippet.title,
      artists: [{
        id: video.snippet.channelId,
        name: video.snippet.channelTitle,
      }],
      album: {
        id: video.snippet.channelId,
        name: video.snippet.channelTitle,
        images: video.snippet.thumbnails ? [video.snippet.thumbnails.default] : [],
      },
      duration_ms: 0, // Would need additional API call to get duration
      explicit: false,
      popularity: 0,
      preview_url: undefined,
      external_urls: {
        youtube: `https://www.youtube.com/watch?v=${video.id.videoId || video.id}`,
      },
    };
  }

  private mapYouTubeArtist(channel: any): Artist {
    return {
      id: channel.id.channelId || channel.id,
      name: channel.snippet.title,
      genres: [],
      popularity: 0,
      followers: 0,
      images: channel.snippet.thumbnails ? [channel.snippet.thumbnails.default] : [],
      external_urls: {
        youtube: `https://www.youtube.com/channel/${channel.id.channelId || channel.id}`,
      },
    };
  }

  private mapYouTubePlaylist(playlist: any): Playlist {
    return {
      id: playlist.id,
      name: playlist.snippet.title,
      description: playlist.snippet.description,
      images: playlist.snippet.thumbnails ? [playlist.snippet.thumbnails.default] : [],
      tracks: {
        total: 0,
        items: [],
      },
      public: playlist.snippet.privacyStatus === 'public',
      collaborative: false,
      owner: {
        id: playlist.snippet.channelId,
        display_name: playlist.snippet.channelTitle,
      },
    };
  }
}

// ====================================================================================
// SERVICE FACTORY
// ====================================================================================

export class MusicServiceFactory {
  static createService(providerId: string, accessToken: string): MusicServiceBase {
    switch (providerId) {
      case 'spotify':
        return new SpotifyService(accessToken);
      case 'apple_music':
        return new AppleMusicService(accessToken);
      case 'youtube_music':
        return new YouTubeMusicService(accessToken);
      default:
        throw new ConvexError({
          message: `Unsupported music provider: ${providerId}`,
          code: 'UNSUPPORTED_PROVIDER'
        });
    }
  }

  static getSupportedProviders(): string[] {
    return ['spotify', 'apple_music', 'youtube_music'];
  }

  static getProviderInfo(providerId: string): MusicProvider | null {
    const providers = {
      spotify: {
        id: 'spotify',
        name: 'Spotify',
        baseUrl: 'https://api.spotify.com/v1',
        rateLimit: { requestsPerMinute: 100, requestsPerHour: 1000 }
      },
      apple_music: {
        id: 'apple_music',
        name: 'Apple Music',
        baseUrl: 'https://api.music.apple.com/v1',
        rateLimit: { requestsPerMinute: 200, requestsPerHour: 10000 }
      },
      youtube_music: {
        id: 'youtube_music',
        name: 'YouTube Music',
        baseUrl: 'https://www.googleapis.com/youtube/v3',
        rateLimit: { requestsPerMinute: 1000, requestsPerHour: 50000 }
      },
    };

    return providers[providerId as keyof typeof providers] || null;
  }
}

// ====================================================================================
// UTILITY FUNCTIONS
// ====================================================================================

export function validateTrackData(track: Track): boolean {
  return !!(
    track.id &&
    track.name &&
    track.artists?.length > 0 &&
    track.album?.name
  );
}

export function normalizeGenres(genres: string[]): string[] {
  const genreMap: Record<string, string> = {
    'hip hop': 'hip-hop',
    'r&b': 'rnb',
    'country music': 'country',
    'electronic dance music': 'edm',
  };

  return genres.map(genre => {
    const normalized = genre.toLowerCase().trim();
    return genreMap[normalized] || normalized;
  });
}

export function calculateTrackSimilarity(track1: Track, track2: Track): number {
  let similarity = 0;

  // Artist similarity (40% weight)
  const track1Artists = new Set(track1.artists.map(a => a.name.toLowerCase()));
  const track2Artists = new Set(track2.artists.map(a => a.name.toLowerCase()));
  const commonArtists = new Set([...track1Artists].filter(a => track2Artists.has(a)));
  const artistSimilarity = commonArtists.size / Math.max(track1Artists.size, track2Artists.size);
  similarity += artistSimilarity * 0.4;

  // Audio features similarity (40% weight)
  if (track1.audioFeatures && track2.audioFeatures) {
    const features1 = track1.audioFeatures;
    const features2 = track2.audioFeatures;
    
    const energyDiff = Math.abs(features1.energy - features2.energy);
    const valenceDiff = Math.abs(features1.valence - features2.valence);
    const tempoDiff = Math.abs(features1.tempo - features2.tempo) / 200; // Normalize tempo
    
    const featureSimilarity = 1 - (energyDiff + valenceDiff + tempoDiff) / 3;
    similarity += featureSimilarity * 0.4;
  }

  // Popularity similarity (20% weight)
  const popularityDiff = Math.abs(track1.popularity - track2.popularity) / 100;
  const popularitySimilarity = 1 - popularityDiff;
  similarity += popularitySimilarity * 0.2;

  return Math.max(0, Math.min(1, similarity));
}

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}