<script lang="ts">
  import { writable } from 'svelte/store';
  import { MinimalSpotifyAuth, MinimalAppleMusicAuth } from '../lib/minimalMusicAuth';
  
  // Simple music recommendations with playlist creation
  
  interface WorkoutRecommendation {
    _id: string;
    workoutType: string;
    targetIntensity: number;
    duration: number;
    tracks: Array<{
      id: string;
      name: string;
      artist: string;
      energy: number;
      tempo: number;
      recommendationScore: number;
      reasoning: string;
    }>;
    algorithm: string;
    confidence: number;
    fallbackUsed: boolean;
  }

  // State
  const recommendations = writable<WorkoutRecommendation[]>([]);
  const isLoading = writable(false);
  const error = writable<string | null>(null);
  const isCreatingPlaylist = writable(false);

  // Music platform instances
  const spotify = new MinimalSpotifyAuth();
  const appleMusic = new MinimalAppleMusicAuth();

  // Workout parameters
  let workoutType = 'cardio';
  let duration = 30;
  let intensity = 0.7;

  async function generateRecommendations() {
    try {
      isLoading.set(true);
      error.set(null);

      const params = new URLSearchParams({
        workoutType,
        duration: duration.toString(),
        intensity: intensity.toString(),
        limit: '10'
      });

      const response = await fetch(`/api/music/recommendations?${params}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate recommendations');
      }

      const data = await response.json();
      recommendations.set(data.recommendations || []);
    } catch (err) {
      error.set('Failed to generate music recommendations');
      console.error(err);
    } finally {
      isLoading.set(false);
    }
  }

  async function connectSpotify() {
    window.location.href = spotify.getAuthUrl();
  }

  async function connectAppleMusic() {
    try {
      await appleMusic.connect();
    } catch (err) {
      error.set('Failed to connect to Apple Music');
      console.error(err);
    }
  }

  async function createPlaylistOnSpotify(rec: WorkoutRecommendation) {
    if (!spotify.isConnected()) {
      error.set('Please connect to Spotify first');
      return;
    }

    try {
      isCreatingPlaylist.set(true);
      
      const playlistName = `GitFit ${rec.workoutType.charAt(0).toUpperCase() + rec.workoutType.slice(1)} - ${rec.duration}min`;
      const description = `AI-generated ${rec.workoutType} playlist for ${rec.duration} minutes at ${Math.round(rec.targetIntensity * 100)}% intensity`;
      
      const playlistId = await spotify.createPlaylist(playlistName, description);
      
      // Search for tracks and add them
      const trackUris: string[] = [];
      for (const track of rec.tracks) {
        const searchQuery = `${track.name} ${track.artist}`;
        const foundTrack = await spotify.searchTrack(searchQuery);
        if (foundTrack?.uri) {
          trackUris.push(foundTrack.uri);
        }
      }
      
      if (trackUris.length > 0) {
        await spotify.addTracksToPlaylist(playlistId, trackUris);
        alert(`Created Spotify playlist "${playlistName}" with ${trackUris.length} tracks!`);
      } else {
        alert('Created playlist but no tracks were found on Spotify');
      }
    } catch (err) {
      error.set('Failed to create Spotify playlist');
      console.error(err);
    } finally {
      isCreatingPlaylist.set(false);
    }
  }

  // Auto-generate on component mount
  import { onMount } from 'svelte';
  onMount(() => {
    generateRecommendations();
  });
</script>

<div class="bg-white p-6 rounded-lg shadow-md max-w-2xl">
  <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
    🎵 AI Workout Music
  </h2>

  <!-- Music Platform Connections -->
  <div class="mb-6 p-4 bg-gray-50 rounded-lg">
    <h3 class="font-semibold mb-3">Connect Music Services</h3>
    <div class="flex gap-3">
      {#if spotify.isConnected()}
        <div class="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-800 rounded">
          ✓ Spotify Connected
          <button 
            on:click={() => spotify.disconnect()}
            class="text-xs text-green-600 hover:text-green-800"
          >
            Disconnect
          </button>
        </div>
      {:else}
        <button
          on:click={connectSpotify}
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Connect Spotify
        </button>
      {/if}

      {#if appleMusic.isConnected()}
        <div class="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-800 rounded">
          ✓ Apple Music Connected
          <button 
            on:click={() => appleMusic.disconnect()}
            class="text-xs text-blue-600 hover:text-blue-800"
          >
            Disconnect
          </button>
        </div>
      {:else}
        <button
          on:click={connectAppleMusic}
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Connect Apple Music
        </button>
      {/if}
    </div>
  </div>

  <!-- Workout Configuration -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
    <div>
      <label for="workoutType" class="block text-sm font-medium mb-1">Workout Type</label>
      <select 
        id="workoutType" 
        bind:value={workoutType}
        class="w-full px-3 py-2 border rounded-md"
      >
        <option value="cardio">Cardio</option>
        <option value="strength">Strength Training</option>
        <option value="yoga">Yoga</option>
        <option value="hiit">HIIT</option>
        <option value="stretching">Stretching</option>
      </select>
    </div>

    <div>
      <label for="duration" class="block text-sm font-medium mb-1">Duration (min)</label>
      <input 
        type="number" 
        id="duration"
        bind:value={duration}
        min="10" 
        max="120" 
        class="w-full px-3 py-2 border rounded-md"
      />
    </div>

    <div>
      <label for="intensity" class="block text-sm font-medium mb-1">Intensity</label>
      <select 
        id="intensity" 
        bind:value={intensity}
        class="w-full px-3 py-2 border rounded-md"
      >
        <option value={0.3}>Low</option>
        <option value={0.5}>Medium</option>
        <option value={0.7}>High</option>
        <option value={0.9}>Maximum</option>
      </select>
    </div>
  </div>

  <button
    on:click={generateRecommendations}
    disabled={$isLoading}
    class="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
  >
    {$isLoading ? 'Generating...' : 'Generate New Playlist'}
  </button>

  <!-- Results -->
  {#if $error}
    <div class="text-red-600 text-center py-4">
      {$error}
    </div>
  {:else if $isLoading}
    <div class="text-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
      <p class="text-gray-600">AI is analyzing your workout needs...</p>
    </div>
  {:else if $recommendations.length === 0}
    <div class="text-center py-8 text-gray-600">
      No recommendations yet. Click "Generate New Playlist" to start!
    </div>
  {:else}
    {#each $recommendations as rec}
      <div class="border rounded-lg p-4 mb-4">
        <div class="flex justify-between items-start mb-3">
          <div>
            <h3 class="font-semibold capitalize">{rec.workoutType} Playlist</h3>
            <p class="text-sm text-gray-600">
              {rec.duration} min • Intensity: {Math.round(rec.targetIntensity * 100)}%
            </p>
            {#if rec.fallbackUsed}
              <span class="inline-block px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">
                AI Fallback Mode
              </span>
            {/if}
          </div>
          <div class="text-right">
            <div class="text-sm text-gray-500">Confidence</div>
            <div class="font-semibold">{Math.round(rec.confidence * 100)}%</div>
          </div>
        </div>

        <div class="space-y-2">
          {#each rec.tracks as track, i}
            <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div class="flex-1">
                <div class="font-medium text-sm">{track.name}</div>
                <div class="text-xs text-gray-600">{track.artist}</div>
              </div>
              <div class="text-right text-xs text-gray-500">
                <div>Energy: {Math.round(track.energy * 100)}%</div>
                <div>{track.tempo} BPM</div>
              </div>
              <div class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                {Math.round(track.recommendationScore * 100)}%
              </div>
            </div>
          {/each}
        </div>

        <div class="mt-3 text-xs text-gray-500">
          Algorithm: {rec.algorithm}
        </div>

        <!-- Playlist Creation -->
        {#if spotify.isConnected() || appleMusic.isConnected()}
          <div class="mt-4 pt-3 border-t border-gray-200">
            <p class="text-sm text-gray-600 mb-2">Create playlist:</p>
            <div class="flex gap-2">
              {#if spotify.isConnected()}
                <button
                  on:click={() => createPlaylistOnSpotify(rec)}
                  disabled={$isCreatingPlaylist}
                  class="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                >
                  {$isCreatingPlaylist ? 'Creating...' : 'Add to Spotify'}
                </button>
              {/if}
              {#if appleMusic.isConnected()}
                <button
                  class="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add to Apple Music
                </button>
              {/if}
            </div>
          </div>
        {:else}
          <div class="mt-4 pt-3 border-t border-gray-200">
            <p class="text-xs text-gray-500">Connect a music service to create playlists</p>
          </div>
        {/if}
      </div>
    {/each}
  {/if}
</div>