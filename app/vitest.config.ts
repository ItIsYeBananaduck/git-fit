import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '.env.local') });
}

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib'),
      $components: path.resolve(__dirname, './src/lib/components'),
      $services: path.resolve(__dirname, './src/lib/services'),
      $utils: path.resolve(__dirname, './src/lib/utils'),
      $types: path.resolve(__dirname, './src/lib/types'),
      '$convex/_generated': path.resolve(__dirname, './convex/_generated'),
      'convex/testing': path.resolve(__dirname, './tests/__mocks__/convex/testing.ts'),
      '$lib/convex/_generated/api': path.resolve(__dirname, './src/lib/convex/_generated/api'),
      '$app/environment': path.resolve(__dirname, './src/lib/test-mocks/app/environment.ts'),
  '@testing-library/svelte': path.resolve(__dirname, './src/test-shims/testing-library-svelte.cjs'),
      // Direct mappings for test runner (fixes import-analysis lookup issues)
      '$lib/stores/auth': path.resolve(__dirname, './src/lib/stores/auth.ts'),
      '$lib/convex/_generated/api.ts': path.resolve(__dirname, './src/lib/convex/_generated/api.ts')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, './vitest-setup-client.ts')],
    include: [
      'src/lib/training/__tests__/**/*.test.ts',
      'src/lib/services/__tests__/**/*.test.ts',
      'src/lib/services/intensityScoring/__tests__/**/*.test.ts',
      'src/lib/utils/__tests__/**/*.test.ts',
      'src/lib/stores/__tests__/**/*.test.ts',
  'app/tests/**/*.test.ts',
      'tests/contract/**/*.ts',
      'tests/integration/**/*.test.ts', // Adjusted to include only .test.ts files
      'tests/performance/**/*.ts',
      'tests/e2e/**/*.ts',
      'tests/unit/**/*.test.ts'
    ],
    testTimeout: 10000, // 10s timeout for health data tests
    coverage: {
      provider: 'v8',
      include: [
        'src/lib/services/intensityScoring/**/*.ts',
        'src/lib/utils/intensityCalculation.ts',
        'src/lib/stores/intensityScore.ts'
      ],
      exclude: [
        'src/lib/services/intensityScoring/__tests__/**',
        '**/*.test.ts',
        '**/*.spec.ts'
      ]
    },
    // Mock environment variables for testing
    env: {
      VITE_CONVEX_URL: 'https://test.convex.dev',
      VITE_TEST_MODE: 'true'
    }
  }
});