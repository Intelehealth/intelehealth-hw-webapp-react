import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
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
        manualChunks: {
          vendor: ['react', 'react-dom'],
          sentry: ['@sentry/react', '@sentry/tracing'],
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

  // Explicitly inject environment variables at build time
  // This ensures import.meta.env.VITE_* are replaced with values from process.env
  define: {
    'import.meta.env.VITE_APP_ENV': JSON.stringify(process.env.VITE_APP_ENV),
    'import.meta.env.VITE_DEBUG_MODE': JSON.stringify(process.env.VITE_DEBUG_MODE),
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.VITE_APP_VERSION),
    'import.meta.env.VITE_APP_NAME': JSON.stringify(process.env.VITE_APP_NAME),
    'import.meta.env.VITE_AUTH_GATEWAY_API_URL': JSON.stringify(
      process.env.VITE_AUTH_GATEWAY_API_URL
    ),
    'import.meta.env.VITE_OPENMRS_API_URL': JSON.stringify(
      process.env.VITE_OPENMRS_API_URL
    ),
    'import.meta.env.VITE_PORTAL_API_URL': JSON.stringify(
      process.env.VITE_PORTAL_API_URL
    ),
    'import.meta.env.VITE_API_TIMEOUT': JSON.stringify(process.env.VITE_API_TIMEOUT),
  },

  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom'],
    exclude: ['@sentry/react', '@sentry/tracing'],
  },
}));
