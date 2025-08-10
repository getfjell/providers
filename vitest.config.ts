import { defineConfig } from 'vitest/config';

export default defineConfig({
  server: {
    port: 3000
  },
  test: {
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'tests/**/*.test.tsx',
      'tests/**/*.spec.tsx',
    ],
    setupFiles: ['./vitest.setup.ts'],
    pool: 'forks', // Use forked processes to isolate memory
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork to reduce memory overhead
      }
    },
    testTimeout: 15000, // 15 second timeout
    hookTimeout: 10000, // 10 second hook timeout
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'src/index.ts',
        '**/*.d.ts',
        'dist/**',
        'eslint.config.mjs',
        'vite.config.ts',
        'vitest.config.ts',
        'build.js',
        'docs/**',
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
    environment: 'jsdom',
  },
});
