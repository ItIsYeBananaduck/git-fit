import { query } from './_generated/server';

export const test = query({
  args: {},
  handler: async (ctx, args) => {
    return { message: "Test function works!", timestamp: new Date().toISOString() };
  },
});

export const getOAuthProviders = query({
  args: {},
  handler: async (ctx, args) => {
    try {
      const providers = await ctx.db.query("oauthProviders").collect();
      return providers;
    } catch (error) {
      console.error("Error querying OAuth providers:", error);
      return [];
    }
  },
});

export const initializeProviders = query({
  args: {},
  handler: async (ctx, args) => {
    return { message: "Initialize function accessible", providersCount: 0 };
  },
});