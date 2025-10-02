// Simple test script to initialize OAuth providers
// This runs in the Node.js environment with Convex

import { ConvexHttpClient } from "convex/browser";

const client = new ConvexHttpClient("https://steady-parakeet-843.convex.cloud");

async function main() {
    try {
        console.log("🔍 Checking existing providers...");
        
        // Try to get existing providers first
        const providers = await client.query("oauthProviders:getAllProviders", {});
        console.log("📋 Current providers:", providers.length);
        
        if (providers.length === 0) {
            console.log("🚀 Initializing providers...");
            const result = await client.mutation("oauthProviders:initializeProviders", {});
            console.log("✅ Initialization result:", result);
        } else {
            console.log("✅ Providers already exist:");
            providers.forEach(p => console.log(`  - ${p.displayName}: ${p.isEnabled ? 'Enabled' : 'Disabled'}`));
        }
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main();