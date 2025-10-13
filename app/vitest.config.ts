import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: path.resolve(__dirname, '.env.local') });
}

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, 'src/lib'),
      $components: path.resolve(__dirname, 'src/lib/components'),
      $services: path.resolve(__dirname, 'src/lib/services'),
      $utils: path.resolve(__dirname, 'src/lib/utils'),
      $types: path.resolve(__dirname, 'src/lib/types'),
      '$convex/_generated': path.resolve(__dirname, 'convex/_generated'),
      'convex/testing': path.resolve(__dirname, 'tests/__mocks__/convex/testing.ts')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest-setup-client.ts'],
    include: [
      'src/lib/training/__tests__/**/*.test.ts',
      'src/lib/services/__tests__/**/*.test.ts',
      'src/lib/services/intensityScoring/__tests__/**/*.test.ts',
      'src/lib/utils/__tests__/**/*.test.ts',
      'src/lib/stores/__tests__/**/*.test.ts',
      'tests/contract/**/*.ts',
      'tests/integration/**/*.ts',
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