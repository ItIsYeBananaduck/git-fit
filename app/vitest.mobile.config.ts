import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    name: 'mobile',
    include: ['src/**/*.mobile.test.{js,ts}', 'tests/mobile/**/*.test.{js,ts}'],
    environment: 'jsdom',
    setupFiles: ['./vitest-setup-mobile.ts'],
    globals: true,
    alias: {
      '@': '/src',
      '$lib': '/src/lib',
      '$app': '/node_modules/@sveltejs/kit/src/runtime/app'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'src/routes/**',
        '**/*.d.ts',
        'tests/**',
        'coverage/**'
      ]
    },
    browser: {
      enabled: false, // Will enable for mobile browser testing later
      name: 'chrome',
      provider: 'playwright'
    }
  },
  define: {
    __MOBILE_TEST__: true,
    __CAPACITOR_PLATFORM__: '"web"'
  }
});