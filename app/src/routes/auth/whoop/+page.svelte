<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { whoopActions } from '$lib/stores/whoop';
  import { storeWHOOPTokens } from '$lib/api/whoop';
  import type { PageData } from './$types';

  export let data: PageData;

  let processing = true;
  let message = '';
  let isError = false;

  onMount(() => {
    if (data.success && data.user && data.tokens) {
      // Store tokens and update state
      const userId = data.user.user_id.toString();
      storeWHOOPTokens(userId, data.tokens);
      whoopActions.setConnected(data.user, data.tokens);
      
      message = data.message || 'WHOOP connected successfully!';
      isError = false;
      
      // Redirect to fitness data page after success
      setTimeout(() => {
        goto('/fitness-data');
      }, 2000);
      
    } else if (data.error) {
      whoopActions.setError(data.error);
      message = data.error;
      isError = true;
    }
    
    processing = false;
  });
</script>

<svelte:head>
  <title>WHOOP Authentication - GitFit</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <div class="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {#if processing}
          <div class="animate-spin w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full"></div>
        {:else if isError}
          <svg class="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        {:else}
          <svg class="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        {/if}
      </div>
      
      <h2 class="text-3xl font-bold text-gray-900 mb-2">
        {processing ? 'Connecting WHOOP...' : (isError ? 'Connection Failed' : 'WHOOP Connected!')}
      </h2>
      
      {#if message}
        <p class="text-sm {isError ? 'text-red-600' : 'text-gray-600'} mb-6">
          {message}
        </p>
      {/if}
    </div>

    {#if processing}
      <div class="text-center">
        <p class="text-gray-600 text-sm">
          Please wait while we set up your WHOOP integration...
        </p>
      </div>
    {:else if !isError}
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex">
          <svg class="w-5 h-5 text-green-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <div>
            <h3 class="text-sm font-medium text-green-800">Success!</h3>
            <p class="text-sm text-green-700 mt-1">
              Your WHOOP device is now connected. We'll start syncing your strain, recovery, and sleep data.
            </p>
          </div>
        </div>
      </div>
      
      <div class="text-center">
        <p class="text-sm text-gray-500">Redirecting you to your fitness data...</p>
      </div>
    {:else}
      <div class="space-y-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex">
            <svg class="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <div>
              <h3 class="text-sm font-medium text-red-800">Connection Failed</h3>
              <p class="text-sm text-red-700 mt-1">
                We couldn't connect your WHOOP device. Please try again.
              </p>
            </div>
          </div>
        </div>
        
        <div class="text-center">
          <a 
            href="/fitness-data"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Try Again
          </a>
        </div>
      </div>
    {/if}
  </div>
</div>