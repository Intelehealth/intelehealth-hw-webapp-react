import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/' : '/hwwebapp/',
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer for production builds
    mode === 'analyze' &&
      visualizer({
        filename: 'dist/stats.html',
        open: true,
        gzipSize: true,
        brotliSize: true,
      }),
  ].filter(Boolean),

  // Build optimizations
  build: {
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          // Vendor chunks - optimized for better caching and parallel loading
          if (id.includes('node_modules')) {
            // React core (use path-based check to avoid matching react-router, react-redux, etc.)
            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('\\react\\') ||
              id.includes('\\react-dom\\')
            ) {
              return 'vendor-react';
            }
            // React Router (separate chunk for routing)
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Form libraries (grouped together as they're often used together)
            if (
              id.includes('react-hook-form') ||
              id.includes('@hookform/resolvers') ||
              id.includes('/yup/') ||
              id.includes('\\yup\\')
            ) {
              return 'vendor-forms';
            }
            // Redux (state management)
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'vendor-redux';
            }
            // Firebase (large SDK, separate chunk)
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Sentry (monitoring, separate chunk)
            if (id.includes('@sentry')) {
              return 'vendor-sentry';
            }
            // i18n (internationalization)
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            // Date picker (separate chunk for lazy loading)
            if (id.includes('react-datepicker')) {
              return 'vendor-datepicker';
            }
            // Image cropping library
            if (id.includes('react-easy-crop')) {
              return 'vendor-image-crop';
            }
            // Toast notifications (separate chunk)
            if (id.includes('react-toastify')) {
              return 'vendor-toastify';
            }
            // HTTP client and utilities
            if (id.includes('axios') || id.includes('js-cookie')) {
              return 'vendor-utils';
            }
            // Tailwind utilities (small, can be grouped)
            if (id.includes('tailwind-merge') || id.includes('clsx')) {
              return 'vendor-styles';
            }
            // All other node_modules
            return 'vendor-other';
          }
        },
        // Optimize asset file naming for nginx MIME type handling
        assetFileNames: assetInfo => {
          if (!assetInfo.name) return `assets/[name]-[hash][extname]`;
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(ext)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (/woff2?|ttf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        },
        // Ensure JS files have .js extension for proper MIME type detection
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    chunkSizeWarningLimit: 1000, // Warn if chunks exceed 1000kb
    // Ensure proper asset handling
    assetsInlineLimit: 4096, // 4kb - inline small assets
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize chunk size
    reportCompressedSize: true,
  },

  // Development optimizations
  server: {
    port: 3000,
    host: true,
    open: true,
  },

  // CSS optimizations
  css: {
    devSourcemap: false,
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@sentry/react',
      '@sentry/tracing',
      'hoist-non-react-statics',
      'react-datepicker',
      'axios',
      'react-hook-form',
      '@hookform/resolvers',
      'yup',
    ],
  },
  // Resolve configuration for better tree-shaking
  resolve: {
    // Ensure proper module resolution
    dedupe: ['react', 'react-dom'],
  },
}));
