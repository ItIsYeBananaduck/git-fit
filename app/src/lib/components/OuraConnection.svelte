<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { ouraState, ouraActions } from '$lib/stores/oura';
  import { ouraDataService } from '$lib/services/ouraDataService';
  import { getOuraAuthUrl } from '$lib/api/oura';
  
  let isLoading = false;
  let connectionError = '';
  let showDetails = false;

  // Environment variables (would normally come from server-side config)
  const OURA_CLIENT_ID = 'your-oura-client-id'; // This should come from environment
  
  onMount(() => {
    // Check for connection success/error from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    
    if (connected === 'oura') {
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
      'oura_auth_failed': 'Authentication failed. Please try again.',
      'oura_no_code': 'No authorization code received.',
      'oura_config_missing': 'Oura integration is not properly configured.',
      'oura_token_exchange_failed': 'Failed to exchange authorization code for access token.',
      'oura_connection_failed': 'Failed to connect to Oura Ring.'
    };
    
    return errorMessages[error] || 'An unknown error occurred.';
  }

  async function connectOura() {
    isLoading = true;
    connectionError = '';
    
    try {
      const redirectUri = `${window.location.origin}/auth/oura`;
      const authUrl = getOuraAuthUrl(OURA_CLIENT_ID, redirectUri, 'connect');
      
      // Redirect to Oura OAuth
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error initiating Oura connection:', error);
      connectionError = 'Failed to initiate connection process.';
      isLoading = false;
    }
  }

  function disconnectOura() {
    ouraActions.disconnect();
  }

  async function testConnection() {
    isLoading = true;
    
    try {
      const data = await ouraDataService.fetchLatestData();
      if (data) {
        alert('✅ Connection successful! Latest data retrieved.');
      } else {
        connectionError = 'Failed to fetch data from Oura Ring.';
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
</script>

<div class="bg-white rounded-xl border border-gray-200 shadow-sm">
  <!-- Header -->
  <div class="p-6 border-b border-gray-100">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <div class="w-5 h-5 border-2 border-purple-600 rounded-full"></div>
        </div>
        <div>
          <h3 class="text-lg font-semibold text-gray-900">Oura Ring</h3>
          <p class="text-sm text-gray-500">Sleep, recovery, and HRV tracking</p>
        </div>
      </div>
      
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2">
          <div class={`w-2 h-2 rounded-full ${
            $ouraState.isConnected ? 'bg-green-500' : 'bg-gray-300'
          }`}></div>
          <span class={`text-sm font-medium ${
            $ouraState.isConnected ? 'text-green-700' : 'text-gray-500'
          }`}>
            {$ouraState.isConnected ? 'Connected' : 'Disconnected'}
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
    {#if $ouraState.isConnected}
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
              <p class="text-sm font-medium text-green-900">Successfully connected to Oura Ring</p>
              <p class="text-xs text-green-700">Last sync: {formatDate($ouraState.lastSync)}</p>
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
              on:click={disconnectOura}
              class="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>

        <!-- Data Quality Indicators -->
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-3 bg-purple-50 rounded-lg">
            <div class="text-lg font-semibold text-purple-900">Sleep</div>
            <div class="text-xs text-purple-600">Quality & Stages</div>
          </div>
          <div class="text-center p-3 bg-blue-50 rounded-lg">
            <div class="text-lg font-semibold text-blue-900">Recovery</div>
            <div class="text-xs text-blue-600">Daily Readiness</div>
          </div>
          <div class="text-center p-3 bg-green-50 rounded-lg">
            <div class="text-lg font-semibold text-green-900">HRV</div>
            <div class="text-xs text-green-600">Heart Variability</div>
          </div>
        </div>
      </div>
    {:else}
      <!-- Disconnected State -->
      <div class="space-y-4">
        <div class="text-center py-8">
          <div class="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <div class="w-8 h-8 border-2 border-purple-600 rounded-full"></div>
          </div>
          <h4 class="text-lg font-medium text-gray-900 mb-2">Connect your Oura Ring</h4>
          <p class="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Access detailed sleep analysis, recovery metrics, and heart rate variability to optimize your training.
          </p>
          
          <button
            on:click={connectOura}
            disabled={isLoading}
            class="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {#if isLoading}
              <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Connecting...
            {:else}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path>
              </svg>
              Connect Oura Ring
            {/if}
          </button>
        </div>

        <!-- Benefits -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div>
              <h5 class="font-medium text-gray-900">Detailed Sleep Analysis</h5>
              <p class="text-sm text-gray-600">Deep, REM, and light sleep tracking with efficiency metrics</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <div>
              <h5 class="font-medium text-gray-900">Recovery Scoring</h5>
              <p class="text-sm text-gray-600">Daily readiness score based on multiple biometric factors</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div>
              <h5 class="font-medium text-gray-900">HRV Monitoring</h5>
              <p class="text-sm text-gray-600">Heart rate variability for stress and recovery insights</p>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707"></path>
              </svg>
            </div>
            <div>
              <h5 class="font-medium text-gray-900">Temperature Tracking</h5>
              <p class="text-sm text-gray-600">Body temperature trends for health monitoring</p>
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
          <span class="ml-2 font-medium {$ouraState.isConnected ? 'text-green-700' : 'text-gray-900'}">
            {$ouraState.isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div>
          <span class="text-gray-600">Last Sync:</span>
          <span class="ml-2 font-medium text-gray-900">{formatDate($ouraState.lastSync)}</span>
        </div>
        
        {#if $ouraState.error}
          <div class="col-span-2">
            <span class="text-gray-600">Last Error:</span>
            <span class="ml-2 text-red-600">{$ouraState.error}</span>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>