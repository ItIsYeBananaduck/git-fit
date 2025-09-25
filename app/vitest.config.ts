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
      $utils: path.resolve(__dirname, 'src/lib/utils')
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest-setup-client.ts'],
    include: [
      'src/lib/training/__tests__/**/*.test.ts',
      'src/lib/services/__tests__/**/*.test.ts'
    ] // Ensure tests in __tests__ directories are included
  }
});