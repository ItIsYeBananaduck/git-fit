<!--
OAuth Test Page - Use this to initialize OAuth providers
Visit: http://localhost:5173/oauth-test
-->

<script lang="ts">
    import OAuthInitializer from '$lib/components/OAuthInitializer.svelte';
</script>

<svelte:head>
    <title>OAuth Provider Setup - Git-Fit</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-8">OAuth Provider Setup</h1>
    
    <div class="max-w-4xl mx-auto">
        <div class="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <h2 class="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">Setup Instructions</h2>
            <ol class="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Ensure your OAuth credentials are configured in the <code>.env</code> file</li>
                <li>Click "Initialize OAuth Providers" to set up the database</li>
                <li>Verify that Spotify appears in the providers list</li>
                <li>Test the OAuth flow by connecting to Spotify</li>
            </ol>
        </div>
        
        <OAuthInitializer />
        
        <div class="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h3 class="text-lg font-semibold mb-2">Current Environment Status</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                    <strong>Spotify Client ID:</strong>
                    <span class="font-mono text-xs">{import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'Not Set'}</span>
                </div>
                <div>
                    <strong>Convex URL:</strong>
                    <span class="font-mono text-xs">{import.meta.env.VITE_CONVEX_URL || 'Not Set'}</span>
                </div>
            </div>
        </div>
    </div>
</div>