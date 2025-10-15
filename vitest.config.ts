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
      reporter: ['text', 'json', 'html'],
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
      ],
      // Coverage requirements - can be bypassed with BYPASS_COVERAGE_CHECK=true
      thresholds:
        process.env.BYPASS_COVERAGE_CHECK === 'true'
          ? {}
          : {
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
