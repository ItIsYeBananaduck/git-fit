// OAuth Provider Initialization Test
// Run this in the browser console when the app is running

async function initializeOAuthProviders() {
    console.log("🚀 Initializing OAuth providers...");
    
    try {
        // Import the convex client from the global scope
        const convex = window.convex || globalThis.convex;
        
        if (!convex) {
            console.error("❌ Convex client not found. Make sure the app is running.");
            return;
        }
        
        // Check existing providers
        const existingProviders = await convex.query("oauthProviders:getAllProviders", {});
        console.log("📋 Existing providers:", existingProviders.length);
        
        if (existingProviders.length > 0) {
            console.log("✅ Providers already initialized:");
            existingProviders.forEach(p => {
                console.log(`  - ${p.displayName}: ${p.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
            });
            return existingProviders;
        }
        
        // Initialize providers
        const result = await convex.mutation("oauthProviders:initializeProviders", {});
        console.log("✅ OAuth providers initialized successfully!");
        console.log("📊 Result:", result);
        
        return result;
        
    } catch (error) {
        console.error("❌ Failed to initialize OAuth providers:", error);
        throw error;
    }
}

// Call the function
initializeOAuthProviders();