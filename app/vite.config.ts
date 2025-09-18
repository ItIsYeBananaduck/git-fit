
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
        plugins: [sveltekit()],
        server: {
                host: '0.0.0.0',
                port: 3000,
                strictPort: true,
                allowedHosts: true
        },
        resolve: {
                alias: {
                        $lib: path.resolve(__dirname, 'src/lib'),
                        $components: path.resolve(__dirname, 'src/lib/components'),
                        $services: path.resolve(__dirname, 'src/lib/services'),
                        $utils: path.resolve(__dirname, 'src/lib/utils'),
                        '$lib/convex': path.resolve(__dirname, 'convex')
                }
        },
        test: {
                expect: { requireAssertions: true },
                projects: [
                        {
                                extends: './vite.config.ts',
                                test: {
                                        name: 'client',
                                        environment: 'browser',
                                        browser: {
                                                enabled: true,
                                                provider: 'playwright',
                                                instances: [{ browser: 'chromium' }]
                                        },
                                        include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
                                        exclude: ['src/lib/server/**'],
                                        setupFiles: ['./vitest-setup-client.ts']
                                }
                        },
                        {
                                extends: './vite.config.ts',
                                test: {
                                        name: 'server',
                                        environment: 'node',
                                        include: ['src/**/*.{test,spec}.{js,ts}'],
                                        exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
                                        setupFiles: ['./vitest-setup-client.ts']
                                }
                        }
                ]
        }
});
