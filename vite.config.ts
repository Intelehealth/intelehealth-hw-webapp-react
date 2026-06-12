import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Vite plugin that injects VITE_FIREBASE_* env variables into
 * public/firebase-messaging-sw.js at build time.
 * Replaces __VITE_FIREBASE_*__ placeholders with actual values.
 */
function firebaseSWEnvPlugin(): Plugin {
  let envVars: Record<string, string>;

  return {
    name: 'firebase-sw-env',
    configResolved(config) {
      const envFile = loadEnv(config.mode, config.envDir || process.cwd(), '');
      envVars = {
        VITE_FIREBASE_API_KEY:
          envFile.VITE_FIREBASE_API_KEY ||
          process.env.VITE_FIREBASE_API_KEY ||
          '',
        VITE_FIREBASE_AUTH_DOMAIN:
          envFile.VITE_FIREBASE_AUTH_DOMAIN ||
          process.env.VITE_FIREBASE_AUTH_DOMAIN ||
          '',
        VITE_FIREBASE_PROJECT_ID:
          envFile.VITE_FIREBASE_PROJECT_ID ||
          process.env.VITE_FIREBASE_PROJECT_ID ||
          '',
        VITE_FIREBASE_STORAGE_BUCKET:
          envFile.VITE_FIREBASE_STORAGE_BUCKET ||
          process.env.VITE_FIREBASE_STORAGE_BUCKET ||
          '',
        VITE_FIREBASE_MESSAGING_SENDER_ID:
          envFile.VITE_FIREBASE_MESSAGING_SENDER_ID ||
          process.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
          '',
        VITE_FIREBASE_APP_ID:
          envFile.VITE_FIREBASE_APP_ID ||
          process.env.VITE_FIREBASE_APP_ID ||
          '',
        VITE_FIREBASE_VAPID_KEY:
          envFile.VITE_FIREBASE_VAPID_KEY ||
          process.env.VITE_FIREBASE_VAPID_KEY ||
          '',
      };
    },
    // Dev: serve the SW file with placeholders replaced on-the-fly
    configureServer(server) {
      server.middlewares.use('/firebase-messaging-sw.js', (_req, res) => {
        const swPath = path.resolve('public/firebase-messaging-sw.js');
        let content = fs.readFileSync(swPath, 'utf-8');
        for (const [key, value] of Object.entries(envVars)) {
          content = content.replaceAll(`__${key}__`, value);
        }
        res.setHeader('Content-Type', 'application/javascript');
        res.end(content);
      });
    },
    // Build: replace placeholders in the output
    writeBundle(options) {
      const outDir = options.dir || 'dist';
      const swPath = path.resolve(outDir, 'firebase-messaging-sw.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf-8');
        for (const [key, value] of Object.entries(envVars)) {
          content = content.replaceAll(`__${key}__`, value);
        }
        fs.writeFileSync(swPath, content);
      }
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/' : '/hwwebapp/',
  plugins: [
    react(),
    tailwindcss(),
    firebaseSWEnvPlugin(),
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
    sourcemap: false, // Enable sourcemaps for debugging in production
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks - optimized for better caching and parallel loading
          // if (id.includes('node_modules')) {
          //   // React core (use path-based check to avoid matching react-router, react-redux, etc.)
          //   if (
          //     id.includes('/react/') ||
          //     id.includes('/react-dom/') ||
          //     id.includes('\\react\\') ||
          //     id.includes('\\react-dom\\')
          //   ) {
          //     return 'vendor-react';
          //   }
          //   // React Router (separate chunk for routing)
          //   if (id.includes('react-router')) {
          //     return 'vendor-router';
          //   }
          //   // Form libraries (grouped together as they're often used together)
          //   if (
          //     id.includes('react-hook-form') ||
          //     id.includes('@hookform/resolvers') ||
          //     id.includes('/yup/') ||
          //     id.includes('\\yup\\')
          //   ) {
          //     return 'vendor-forms';
          //   }
          //   // Redux (state management)
          //   if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
          //     return 'vendor-redux';
          //   }
          //   // Firebase (large SDK, separate chunk)
          //   if (id.includes('firebase')) {
          //     return 'vendor-firebase';
          //   }
          //   // Sentry (monitoring, separate chunk)
          //   if (id.includes('@sentry')) {
          //     return 'vendor-sentry';
          //   }
          //   // i18n (internationalization)
          //   if (id.includes('i18next') || id.includes('react-i18next')) {
          //     return 'vendor-i18n';
          //   }
          //   // Date picker (separate chunk for lazy loading)
          //   if (id.includes('react-datepicker')) {
          //     return 'vendor-datepicker';
          //   }
          //   // Image cropping library
          //   if (id.includes('react-easy-crop')) {
          //     return 'vendor-image-crop';
          //   }
          //   // Toast notifications (separate chunk)
          //   if (id.includes('react-toastify')) {
          //     return 'vendor-toastify';
          //   }
          //   // HTTP client and utilities
          //   if (id.includes('axios') || id.includes('js-cookie')) {
          //     return 'vendor-utils';
          //   }
          //   // Tailwind utilities (small, can be grouped)
          //   if (id.includes('tailwind-merge') || id.includes('clsx')) {
          //     return 'vendor-styles';
          //   }
          //   // All other node_modules
          //   return 'vendor-other';
          // }
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
    proxy:
      mode === 'development'
        ? {
            '/portal-api': {
              target: 'https://dev.intelehealth.org:3004',
              changeOrigin: true,
              secure: false,
              rewrite: path => path.replace(/^\/portal-api/, '/api'),
            },
          }
        : undefined,
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
      '@intelehealth/webrtc',
    ],
  },
  // Resolve configuration for better tree-shaking
  resolve: {
    // Ensure proper module resolution
    dedupe: ['react', 'react-dom'],
  },
}));
