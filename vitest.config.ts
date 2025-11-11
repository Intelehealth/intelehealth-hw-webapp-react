import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**', 'src/examples/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/test/**',
        '**/__tests__/**',
        '**/*.test.*',
        '**/*.spec.*',
        'src/examples/**',
        // Exclude entire types folder (pure type definition files with no runtime code)
        'src/types/**',
        'src/services/mindmap.ts',
        'src/services/openmrs.ts',
        'src/config/sentry.ts',
        'src/config/sentry-wrapper.tsx',
        'src/config/env.ts',
        'src/components/common/',
        'src/components/common/common-ui.component.tsx',
      ],
      // 100% coverage requirements
      thresholds: {
        global: {
          branches: 100,
          functions: 100,
          lines: 100,
          statements: 100,
        },
      },
      // Detailed coverage info
      all: true,
      include: ['src/**/*.{ts,tsx}'],
    },
    // Test timeout
    testTimeout: 10000,
    // Hook timeout
    hookTimeout: 10000,
  },
});
