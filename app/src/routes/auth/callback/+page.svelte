<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { MinimalSpotifyAuth } from '../../../lib/minimalMusicAuth';

  let status = 'processing';
  let message = 'Processing authentication...';

  onMount(async () => {
    try {
      const code = $page.url.searchParams.get('code');
      const state = $page.url.searchParams.get('state');
      const error = $page.url.searchParams.get('error');

      if (error) {
        status = 'error';
        message = `Authentication failed: ${error}`;
        return;
      }

      if (!code) {
        status = 'error';
        message = 'No authorization code received';
        return;
      }

      // Handle different platforms based on state
      if (state === 'spotify') {
        const spotify = new MinimalSpotifyAuth();
        await spotify.exchangeCode(code);
        
        status = 'success';
        message = 'Successfully connected to Spotify!';
      } else {
        status = 'error';
        message = 'Unknown authentication platform';
        return;
      }
      
      // Redirect back to main app after 2 seconds
      setTimeout(() => {
        goto('/', { replaceState: true });
      }, 2000);

    } catch (err) {
      status = 'error';
      message = 'Failed to complete authentication';
      console.error('Auth callback error:', err);
    }
  });
</script>

<svelte:head>
  <title>Music Authentication</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-gray-50">
  <div class="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
    {#if status === 'processing'}
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Connecting Music Service</h2>
      <p class="text-gray-600">{message}</p>
    {:else if status === 'success'}
      <div class="text-green-500 mb-4">
        <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Success!</h2>
      <p class="text-gray-600 mb-4">{message}</p>
      <p class="text-sm text-gray-500">You can now add AI recommendations to your playlists!</p>
    {:else}
      <div class="text-red-500 mb-4">
        <svg class="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </div>
      <h2 class="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
      <p class="text-gray-600 mb-4">{message}</p>
      <button
        on:click={() => goto('/')}
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Back to App
      </button>
    {/if}
  </div>
</div>