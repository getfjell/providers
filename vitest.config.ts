import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  server: {
    port: 3000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    include: [
      'tests/**/*.test.ts',
      'tests/**/*.spec.ts',
      'tests/**/*.test.tsx',
      'tests/**/*.spec.tsx',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        'src/index.ts',
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
