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
          branches: 75,
          functions: 89,
          lines: 89,
          statements: 89,
        },
      },
    },
    environment: 'jsdom',
  },
});
