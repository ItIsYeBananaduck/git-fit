declare module '../../convex/_generated/api.js' {
  export const api: Record<string, unknown>;
  export default api;
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONVEX_URL?: string;
  readonly PUBLIC_CONVEX_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}