// Convex Auth integration for Svelte
import { ConvexClient } from "convex/browser";
import { writable } from "svelte/store";

// User type
type User = {
  _id: string;
  email?: string;
  name?: string;
} | null;

// Create Convex client for auth
const convex = new ConvexClient(import.meta.env.VITE_CONVEX_URL!);

// Auth state store
export const authState = writable<{
  user: User;
  isLoading: boolean;
}>({
  user: null,
  isLoading: true,
});

// Auth actions
export const authActions = {
  async signIn(provider: string, credentials: FormData | Record<string, string>) {
    try {
      const email = credentials instanceof FormData ? credentials.get("email") : credentials.email;
      const flow = credentials instanceof FormData ? credentials.get("flow") : credentials.flow;
      
      console.log("Sign in attempt:", { email, flow });
      return { signingIn: true };
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  },

  async signOut() {
    try {
      authState.update(state => ({ ...state, user: null }));
    } catch (error) {
      console.error("Sign out error:", error);
      throw error;
    }
  }
};

// Export Convex client
export { convex };