<script lang="ts">
        import { Smartphone, Watch, Activity, Wifi, Bluetooth, Zap } from 'lucide-svelte';
        
        export let source: any;

        function getSourceIcon(name: string) {
                switch (name.toLowerCase()) {
                        case 'apple health': return { icon: Smartphone, color: 'text-gray-700', bg: 'bg-gray-100' };
                        case 'fitbit': return { icon: Watch, color: 'text-blue-600', bg: 'bg-blue-100' };
                        case 'garmin': return { icon: Activity, color: 'text-red-600', bg: 'bg-red-100' };
                        case 'google fit': return { icon: Activity, color: 'text-green-600', bg: 'bg-green-100' };
                        case 'whoop': return { icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100' };
                        default: return { icon: Bluetooth, color: 'text-purple-600', bg: 'bg-purple-100' };
                }
        }

        function handleConnect() {
                if (source.name.toLowerCase() === 'whoop') {
                        initiateWHOOPConnection();
                } else {
                        // Other integrations - trigger OAuth flow
                        console.log(`Connecting to ${source.name}...`);
                }
        }

        async function initiateWHOOPConnection() {
                try {
                        // Generate secure state for OAuth
                        const state = generateRandomString(16);
                        sessionStorage.setItem('whoop_oauth_state', state);
                        
                        // Get environment variables
                        const clientId = import.meta.env.VITE_WHOOP_CLIENT_ID || 'demo_client_id';
                        const redirectUri = `${window.location.origin}/auth/whoop`;
                        
                        // Build OAuth URL
                        const authUrl = new URL('https://api.prod.whoop.com/oauth/oauth2/auth');
                        authUrl.searchParams.append('response_type', 'code');
                        authUrl.searchParams.append('client_id', clientId);
                        authUrl.searchParams.append('redirect_uri', redirectUri);
                        authUrl.searchParams.append('scope', 'offline read:profile read:recovery read:sleep read:cycles read:workout read:body_measurement');
                        authUrl.searchParams.append('state', state);
                        
                        // Redirect to WHOOP OAuth
                        window.location.href = authUrl.toString();
                } catch (error) {
                        console.error('Failed to initiate WHOOP connection:', error);
                }
        }

        function generateRandomString(length: number): string {
                const array = new Uint8Array(length);
                crypto.getRandomValues(array);
                return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
        }

        function handleDisconnect() {
                // In real app, this would disconnect the service
                console.log(`Disconnecting from ${source.name}...`);
        }
</script>

<div class="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                        <div class="w-12 h-12 {getSourceIcon(source.name).bg} rounded-lg flex items-center justify-center mr-4">
                                <svelte:component this={getSourceIcon(source.name).icon} size={24} class={getSourceIcon(source.name).color} />
                        </div>
                        <div>
                                <h3 class="font-semibold text-gray-900">{source.name}</h3>
                                <div class="flex items-center mt-1">
                                        <div class="w-2 h-2 rounded-full {source.connected ? 'bg-green-500' : 'bg-gray-300'} mr-2"></div>
                                        <span class="text-sm text-gray-600">
                                                {source.connected ? 'Connected' : 'Not connected'}
                                        </span>
                                </div>
                        </div>
                </div>
        </div>

        {#if source.connected && source.lastSync}
                <div class="mb-4">
                        <div class="text-sm text-gray-600">Last sync:</div>
                        <div class="text-sm font-medium text-gray-900">
                                {new Date(source.lastSync).toLocaleString()}
                        </div>
                </div>
        {/if}

        <!-- Data Types -->
        <div class="mb-4">
                <div class="text-sm text-gray-600 mb-2">Data types:</div>
                <div class="flex flex-wrap gap-1">
                        {#each source.dataTypes as dataType}
                                <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                                        {dataType.replace('_', ' ')}
                                </span>
                        {/each}
                </div>
        </div>

        <!-- Action Button -->
        {#if source.connected}
                <div class="space-y-2">
                        <button 
                                class="w-full bg-green-100 text-green-800 py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
                        >
                                Sync Now
                        </button>
                        <button 
                                on:click={handleDisconnect}
                                class="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                        >
                                Disconnect
                        </button>
                </div>
        {:else}
                <button 
                        on:click={handleConnect}
                        class="w-full bg-primary text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                        Connect
                </button>
        {/if}
</div>