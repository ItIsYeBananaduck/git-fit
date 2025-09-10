<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { fitbitState, fitbitActions } from '$lib/stores/fitbit';
  import { fitbitDataService } from '$lib/services/fitbitDataService';
  import { getFitbitAuthUrl } from '$lib/api/fitbit';
  
  let isLoading = false;
  let connectionError = '';
  let showDetails = false;

  // Environment variables (would normally come from server-side config)
  const FITBIT_CLIENT_ID = 'your-fitbit-client-id'; // This should come from environment
  
  onMount(() => {
    // Check for connection success/error from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (connected === 'fitbit') {
      // Successfully connected, remove URL params
      const url = new URL(window.location.href);
      url.searchParams.delete('connected');
      window.history.replaceState({}, '', url.toString());
    } else if (error) {
      connectionError = getErrorMessage(error);
      // Clean URL
      const url = new URL(window.location.href);
      url.searchParams.delete('error');
      window.history.replaceState({}, '', url.toString());
    }
  });
  
  function getErrorMessage(error: string): string {
    const errorMessages: Record<string, string> = {
      'fitbit_auth_failed': 'Authentication failed. Please try again.',
      'fitbit_no_code': 'No authorization code received.',
      'fitbit_config_missing': 'Fitbit integration is not properly configured.',
      'fitbit_token_exchange_failed': 'Failed to exchange authorization code for access token.',
      'fitbit_connection_failed': 'Failed to connect to Fitbit.'
    };
    
    return errorMessages[error] || 'An unknown error occurred.';
  }

  async function connectFitbit() {
    isLoading = true;
    connectionError = '';
    
    try {
      const redirectUri = `${window.location.origin}/auth/fitbit`;
      const scopes = ['activity', 'heartrate', 'sleep', 'profile'];
      const authUrl = getFitbitAuthUrl(FITBIT_CLIENT_ID, redirectUri, scopes, 'connect');
      
      // Redirect to Fitbit OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Fitbit connection:', error);
      connectionError = 'Failed to initiate connection process.';
      isLoading = false;
    }
  }

  function disconnectFitbit() {
    fitbitActions.disconnect();
  }

  async function testConnection() {
    isLoading = true;
    
    try {
      const data = await fitbitDataService.fetchLatestData();
      if (data) {
        alert('✅ Connection successful! Latest data retrieved.');
      } else {
        connectionError = 'Failed to fetch data from Fitbit.';
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      connectionError = 'Connection test failed.';
    }
    
    isLoading = false;
  }

  function formatDate(date: Date | null): string {
    if (!date) return 'Never';
    return date.toLocaleString();
  }

  function getScopeDisplay(scopes: string[]): string {
    const scopeNames: Record<string, string> = {
      'activity': 'Activity',
      'heartrate': 'Heart Rate',
      'sleep': 'Sleep',
      'profile': 'Profile',
      'weight': 'Weight',
      'nutrition': 'Nutrition'
    };
    
    return scopes.map(scope => scopeNames[scope] || scope).join(', ');
  }
</script>

<div class="bg-white rounded-xl border border-gray-200 shadow-sm">
  <!-- Header -->
  <div class="p-6 border-b border-gray-100">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <svg class="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Fitbit</h3>
          <p class="text-sm text-gray-500">Activity, heart rate, and sleep tracking</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2">
          <div class={`w-2 h-2 rounded-full ${
            $fitbitState.isConnected ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <span class={`text-sm font-medium ${
            $fitbitState.isConnected ? 'text-green-700' : 'text-gray-500'
          }`}>
            {$fitbitState.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <button
          on:click={() => showDetails = !showDetails}
          class="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label={showDetails ? 'Hide details' : 'Show details'}
        >
          <svg class={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="p-6">
    {#if $fitbitState.isConnected}
      <!-- Connected State -->
      <div class="space-y-4">
        <div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <div>
              <p class="text-sm font-medium text-green-900">Successfully connected to Fitbit</p>
              <p class="text-xs text-green-700">Last sync: {formatDate($fitbitState.lastSync)}</p>
              {#if $fitbitState.scopes.length > 0}
                <p class="text-xs text-green-600 mt-1">Access: {getScopeDisplay($fitbitState.scopes)}</p>
              {/if}
            </div>
          </div>
          
          <div class="flex gap-2">
            <button
              on:click={testConnection}
              disabled={isLoading}
              class="px-3 py-1.5 bg-green-100 text-green-700 text-xs font-medium rounded-md hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Testing...' : 'Test'}
            </button>
            
            <button
              on:click={disconnectFitbit}
              class="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        <!-- Data Quality Indicators -->
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <div class="text-lg font-semibold text-blue-900">Activity</div>
            <div class="text-xs text-blue-600">Steps & Calories</div>
          </div>
          <div class="text-center p-3 bg-red-50 rounded-lg">
            <div class="text-lg font-semibold text-red-900">Heart Rate</div>
            <div class="text-xs text-red-600">Zones & Resting</div>
          </div>
          <div class="text-center p-3 bg-purple-50 rounded-lg">
            <div class="text-lg font-semibold text-purple-900">Sleep</div>
            <div class="text-xs text-purple-600">Stages & Efficiency</div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Disconnected State -->
      <div class="space-y-4">
        <div class="text-center py-8">
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <h4 class="text-lg font-medium text-gray-900 mb-2">Connect your Fitbit</h4>
          <p class="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Access comprehensive activity tracking, heart rate zones, and detailed sleep analysis to optimize your training.
          </p>
          
          <button
            on:click={connectFitbit}
            disabled={isLoading}
            class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Connecting...
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              Connect Fitbit
            {/if}
          </button>
        </div>

        <!-- Benefits -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div>
              <h5 class="font-medium text-gray-900">Activity Tracking</h5>
              <p class="text-sm text-gray-600">Steps, distance, calories, and active minutes</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <div>
              <h5 class="font-medium text-gray-900">Heart Rate Zones</h5>
              <p class="text-sm text-gray-600">Fat burn, cardio, and peak heart rate tracking</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
              </svg>
            </div>
            <div>
              <h5 class="font-medium text-gray-900">Sleep Analysis</h5>
              <p class="text-sm text-gray-600">Sleep stages, efficiency, and duration tracking</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <h5 class="font-medium text-gray-900">HRV Insights</h5>
              <p class="text-sm text-gray-600">Heart rate variability for recovery analysis</p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Error Display -->
    {#if connectionError}
      <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <h5 class="text-sm font-medium text-red-900">Connection Error</h5>
            <p class="text-sm text-red-700 mt-1">{connectionError}</p>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Detailed Information -->
  {#if showDetails}
    <div class="border-t border-gray-100 p-6 bg-gray-50">
      <h4 class="text-sm font-medium text-gray-900 mb-4">Connection Details</h4>
      
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Status:</span>
          <span class="ml-2 font-medium {$fitbitState.isConnected ? 'text-green-700' : 'text-gray-900'}">
            {$fitbitState.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div>
          <span class="text-gray-600">Last Sync:</span>
          <span class="ml-2 font-medium text-gray-900">{formatDate($fitbitState.lastSync)}</span>
        </div>
        
        {#if $fitbitState.userId}
          <div>
            <span class="text-gray-600">User ID:</span>
            <span class="ml-2 font-mono text-xs text-gray-900">{$fitbitState.userId}</span>
          </div>
        {/if}
        
        {#if $fitbitState.scopes.length > 0}
          <div>
            <span class="text-gray-600">Permissions:</span>
            <span class="ml-2 font-medium text-gray-900">{getScopeDisplay($fitbitState.scopes)}</span>
          </div>
        {/if}
        
        {#if $fitbitState.error}
          <div class="col-span-2">
            <span class="text-gray-600">Last Error:</span>
            <span class="ml-2 text-red-600">{$fitbitState.error}</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>