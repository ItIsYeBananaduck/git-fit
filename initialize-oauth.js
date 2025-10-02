#!/usr/bin/env node

/**
 * Script to initialize OAuth providers in Convex database
 * Run this after setting up your OAuth credentials in .env
 */

// Since we can't easily load .env files without dependencies,
// let's manually set the CONVEX_URL from the known value
const CONVEX_URL = "https://steady-parakeet-843.convex.cloud";

async function initializeOAuthProviders() {
  console.log("🚀 Initializing OAuth providers...");
  console.log("📡 Convex URL:", CONVEX_URL);
  
  try {
    // Use fetch to call Convex HTTP API directly
    const response = await fetch(`${CONVEX_URL}/api/mutation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: 'oauthProviders:initializeProviders',
        args: {}
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log("✅ OAuth providers initialized successfully!");
    console.log("📊 Results:", result);
    
    // List all providers to verify
    const providersResponse = await fetch(`${CONVEX_URL}/api/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        function: 'oauthProviders:getAllProviders',
        args: {}
      })
    });
    
    if (providersResponse.ok) {
      const providers = await providersResponse.json();
      console.log("\n📋 Available OAuth providers:");
      providers.forEach(provider => {
        console.log(`  - ${provider.displayName} (${provider.name}): ${provider.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Failed to initialize OAuth providers:", error);
    process.exit(1);
  }
}

initializeOAuthProviders();