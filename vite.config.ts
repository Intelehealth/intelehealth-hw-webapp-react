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
    sourcemap: true, // Enable sourcemaps for debugging in production
    rollupOptions: {
      output: {
        // manualChunks: {
        //   vendor: ['react', 'react-dom'],
        //   sentry: ['@sentry/react', '@sentry/tracing'],
        // },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core vendor
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }

            // Sentry (heavy, load once)
            if (id.includes('@sentry')) {
              return 'sentry';
            }
            if (id.includes('react-datepicker')) return 'datepicker';
            if (id.includes('date-fns')) return 'date-fns';
            if (id.includes('firebase')) return 'firebase';
            if (id.includes('react-toastify')) return 'toast';
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
