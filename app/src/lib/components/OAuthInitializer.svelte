/**
 * OAuth Provider Initialization Component
 * 
 * Use this component to initialize OAuth providers from the web interface
 */

<script lang="ts">
    import { oauthClient } from '$lib/oauthClient';
    
    let isInitializing = false;
    let initResult: any = null;
    let error: string | null = null;
    let providers: any[] = [];
    
    async function loadProviders() {
        try {
            providers = await oauthClient.getAllProviders();
        } catch (err: any) {
            console.error('Failed to load providers:', err);
            error = err.message || 'Failed to load providers';
        }
    }
    
    async function initializeProviders() {
        isInitializing = true;
        error = null;
        initResult = null;
        
        try {
            console.log('🚀 Initializing OAuth providers...');
            
            const result = await oauthClient.initializeProviders();
            initResult = result;
            console.log('✅ OAuth providers initialized successfully!', result);
            
            // Reload providers list
            await loadProviders();
            
        } catch (err: any) {
            error = err.message || 'Failed to initialize OAuth providers';
            console.error('❌ Initialization failed:', err);
        } finally {
            isInitializing = false;
        }
    }
    
    // Load providers on component mount
    loadProviders();
</script>

<div class="oauth-init-panel p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-4">OAuth Provider Initialization</h2>
    
    <!-- Current Providers -->
    <div class="mb-6">
        <h3 class="text-lg font-semibold mb-2">Current Providers ({providers.length})</h3>
        {#if providers.length > 0}
            <ul class="space-y-2">
                {#each providers as provider}
                    <li class="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-700 rounded">
                        <span class="font-medium">{provider.displayName}</span>
                        <span class="text-sm {provider.isEnabled ? 'text-green-600' : 'text-red-600'}">
                            {provider.isEnabled ? '✅ Enabled' : '❌ Disabled'}
                        </span>
                    </li>
                {/each}
            </ul>
        {:else}
            <p class="text-gray-500">No OAuth providers configured</p>
        {/if}
    </div>
    
    <!-- Initialize Button -->
    <div class="mb-4">
        <button 
            on:click={initializeProviders}
            disabled={isInitializing}
            class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded font-medium"
        >
            {isInitializing ? '🔄 Initializing...' : '🚀 Initialize OAuth Providers'}
        </button>
    </div>
    
    <!-- Result Display -->
    {#if error}
        <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
        </div>
    {/if}
    
    {#if initResult}
        <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <strong>Success:</strong> {initResult.message || 'OAuth providers initialized successfully!'}
            {#if initResult.providers}
                <details class="mt-2">
                    <summary class="cursor-pointer">View Details</summary>
                    <pre class="mt-2 text-xs overflow-auto">{JSON.stringify(initResult, null, 2)}</pre>
                </details>
            {/if}
        </div>
    {/if}
    
    <!-- Refresh Button -->
    <button 
        on:click={loadProviders}
        class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-medium"
    >
        🔄 Refresh Providers List
    </button>
</div>

<style>
    .oauth-init-panel {
        max-width: 600px;
        margin: 2rem auto;
    }
</style>