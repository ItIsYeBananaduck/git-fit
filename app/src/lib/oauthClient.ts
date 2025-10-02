/**
 * Convex Client Configuration for OAuth
 * 
 * This file sets up the Convex client specifically for OAuth operations
 */

// Get Convex URL from environment
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL;

if (!CONVEX_URL) {
  console.error("Missing VITE_CONVEX_URL environment variable");
}

// OAuth-specific client methods using HTTP API
export const oauthClient = {
  async initializeProviders() {
    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'oauthProviders:initializeProviders',
          args: {}
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to initialize OAuth providers:", error);
      throw error;
    }
  },

  async getAllProviders() {
    try {
      const response = await fetch(`${CONVEX_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'oauthProviders:getOAuthProviders',
          args: {
            enabledOnly: false
          }
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
      }
      
      const providers = await response.json();
      return providers.providers || [];
    } catch (error) {
      console.error("Failed to get OAuth providers:", error);
      throw error;
    }
  },

  async initiateOAuthFlow(provider: string, scopes?: string[]) {
    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'oauthAuth:initiateOAuthFlow',
          args: {
            provider,
            scopes: scopes || []
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to initiate OAuth flow:", error);
      throw error;
    }
  },

  async revokeConnection(provider: string) {
    try {
      const response = await fetch(`${CONVEX_URL}/api/mutation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: 'oauthAuth:revokeConnection',
          args: {
            provider
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Failed to revoke OAuth connection:", error);
      throw error;
    }
  }
};

export default oauthClient;