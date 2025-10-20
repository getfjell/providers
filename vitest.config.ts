import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    testTimeout: 15000,
    hookTimeout: 10000,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'tests/**',
        'src/index.ts',
        '**/*.d.ts',
        'dist/**',
        'build.js',
        'docs/**',
        'coverage/**',
        'eslint.config.mjs',
        'vitest.config.ts',
      ],
      thresholds: {
        global: {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
  },
});
