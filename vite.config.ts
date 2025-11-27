import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue(),
      vueJsx(),
      ...(mode === 'development' ? [vueDevTools()] : []),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },
    build: {
      // Optimize for Cloudflare Pages deployment
      target: 'esnext',
      // Generate source maps based on environment
      sourcemap: env.VITE_GENERATE_SOURCEMAP === 'true',
      // Optimize bundle size
      minify: 'esbuild',
      // Increase chunk size warning limit for modern apps (in KB)
      chunkSizeWarningLimit: 1500,
      // Optimize chunk splitting for better caching
      rollupOptions: {
        output: {
          // Better chunk naming for cache invalidation
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
              return 'assets/images/[name]-[hash][extname]'
            }
            if (/\.(css)$/.test(name ?? '')) {
              return 'assets/css/[name]-[hash][extname]'
            }
            if (/\.(woff|woff2|eot|ttf|otf)$/.test(name ?? '')) {
              return 'assets/fonts/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          },
          manualChunks: (id) => {
            // Vendor chunk for core Vue dependencies
            if (id.includes('node_modules/vue') || id.includes('node_modules/vue-router') || id.includes('node_modules/pinia')) {
              return 'vendor'
            }
            // RichTextEditor chunk for Tiptap and related heavy dependencies
            if (id.includes('@tiptap') || id.includes('prosemirror')) {
              return 'RichTextEditor'
            }
            // UI chunk for icon libraries and UI utilities
            if (id.includes('lucide-vue-next') || id.includes('dompurify')) {
              return 'ui'
            }
            // Auth chunk for authentication-related code
            if (id.includes('vue3-google-login')) {
              return 'auth'
            }
            // Styles chunk for CSS frameworks
            if (id.includes('tailwindcss')) {
              return 'styles'
            }
            // Event tabs chunk for tab components (dynamically imported)
            if (id.includes('/components/Event') && (
              id.includes('Tab.vue') ||
              id.includes('Section.vue')
            )) {
              return 'event-tabs'
            }
            // Showcase chunk for showcase-related components
            if (id.includes('/components/showcase/') || id.includes('/composables/showcase/')) {
              return 'EventShowcaseRefactored'
            }
          }
        }
      },
      // Optimize CSS
      cssCodeSplit: true,
      // Optimize for Cloudflare Pages
      assetsInlineLimit: 4096, // Inline small assets as base64
    },
    // CSS configuration
    css: {
      // PostCSS configuration will be loaded from postcss.config.js
      devSourcemap: mode === 'development',
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'lucide-vue-next', 'dompurify'],
      exclude: ['vue-demi']
    },
    // Development server configuration
    server: {
      port: 5173,
      strictPort: true,
      host: true,
    },
    // Preview server configuration (for local testing)
    preview: {
      port: 4173,
      strictPort: true,
      host: true,
    },
    // Define global constants
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
    },
  }
})
