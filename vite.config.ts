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
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // Sentry
            if (id.includes('@sentry')) {
              return 'vendor-sentry';
            }
            // Firebase
            if (id.includes('firebase')) {
              return 'vendor-firebase';
            }
            // Country State City (large library)
            if (id.includes('country-state-city')) {
              return 'vendor-country-state-city';
            }
            // Date picker
            if (id.includes('react-datepicker')) {
              return 'vendor-datepicker';
            }
            // Toast notifications
            if (id.includes('react-toastify')) {
              return 'vendor-toastify';
            }
            // Redux
            if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
              return 'vendor-redux';
            }
            // i18n
            if (id.includes('i18next') || id.includes('react-i18next')) {
              return 'vendor-i18n';
            }
            // Other large dependencies
            if (
              id.includes('axios') ||
              id.includes('yup') ||
              id.includes('@hookform')
            ) {
              return 'vendor-utils';
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
    chunkSizeWarningLimit: 1000,
    // Ensure proper asset handling
    assetsInlineLimit: 4096, // 4kb
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
      '@sentry/react',
      '@sentry/tracing',
      'hoist-non-react-statics',
      'react-datepicker',
    ],
  },
}));
