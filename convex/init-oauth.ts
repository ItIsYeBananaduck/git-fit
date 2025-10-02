/**
 * OAuth Provider Initialization Script
 * 
 * This script initializes OAuth providers in the Convex database.
 * Run this manually after setting up OAuth credentials.
 */

import { initializeProviders } from "./functions/oauthProviders";

async function runInitialization() {
    console.log("🚀 Starting OAuth provider initialization...");
    
    try {
        // Mock context for standalone execution
        const mockCtx = {
            db: {
                query: (table) => ({
                    collect: () => Promise.resolve([]) // Return empty array to trigger initialization
                }),
                insert: (table, doc) => Promise.resolve(doc)
            }
        };
        
        const result = await initializeProviders.handler(mockCtx, {});
        console.log("✅ OAuth providers initialized successfully!");
        console.log("📊 Result:", result);
        
    } catch (error) {
        console.error("❌ Failed to initialize OAuth providers:", error);
    }
}

// Export for manual execution
export { runInitialization };