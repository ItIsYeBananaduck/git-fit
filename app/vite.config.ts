import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import path from 'path';

export default defineConfig({
    plugins: [sveltekit()],
    envDir: '../',
    optimizeDeps: {
        include: ['animejs', '@testing-library/svelte', '@testing-library/jest-dom']
    },
    ssr: {
        noExternal: ['animejs']
    },
    server: {
        host: '0.0.0.0',
        port: 3000,
        strictPort: true,
        allowedHosts: true,
        fs: {
            allow: [
                '/workspaces/git-fit/app/convex',
                '/workspaces/git-fit/convex',
                '.'
            ]
        }
    },
    resolve: {
        alias: {
            $lib: path.resolve(__dirname, 'src/lib'),
            $components: path.resolve(__dirname, 'src/lib/components'),
            $services: path.resolve(__dirname, 'src/lib/services'),
            $utils: path.resolve(__dirname, 'src/lib/utils')
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
                    include: ['tests/mobile/components/**/*.test.ts'],
                    exclude: ['src/lib/server/**'],
                    setupFiles: ['./vitest-setup-client.ts']
                }
            },
            {
                extends: './vite.config.ts',
                test: {
                    name: 'server',
                    environment: 'node',
                    include: ['src/**/*.{test,spec}.{js,ts}', 'tests/integration/**/*.ts'],
                    exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
                    setupFiles: ['./vitest-setup-client.ts']
                }
            }
        ]
    }
});
