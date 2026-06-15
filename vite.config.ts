import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      // Defer SW registration to not block initial render
      injectRegister: 'script-defer',
      includeAssets: ["favicon.png", "favicon.webp", "robots.txt", "*.svg", "*.png", "*.webp"],
      manifest: {
        name: "Taif Children's Hospital",
        short_name: "TCH",
        description: "Taif Children's Hospital Healthcare System",
        theme_color: "#2f9acb",
        background_color: "#d1f3f8",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Cache strategies for different asset types
        runtimeCaching: [
          {
            // Always fetch favicon fresh (some browsers default to /favicon.ico)
            urlPattern: /\/favicon\.ico$/i,
            handler: "NetworkOnly",
          },
          {
            // Cache Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-stylesheets",
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Cache Google Fonts webfont files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts-webfonts",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            // Cache images
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
        // Precache essential assets
        globPatterns: ["**/*.{js,css,html,png,svg,webp,woff2}"],
        // Clean up old caches
        cleanupOutdatedCaches: true,
        // Skip waiting for new service worker activation
        skipWaiting: true,
        clientsClaim: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React - always needed
          'react-core': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          // UI libs - lazy loaded with pages
          'ui-dialogs': ['@radix-ui/react-dialog', '@radix-ui/react-alert-dialog'],
          'ui-menus': ['@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-tooltip'],
          'ui-forms': ['@radix-ui/react-checkbox', '@radix-ui/react-label', '@radix-ui/react-select', '@radix-ui/react-switch'],
          // Heavy libs - only loaded when needed
          'query': ['@tanstack/react-query'],
          'charts': ['recharts'],
          'forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'markdown': ['react-markdown', 'remark-gfm'],
          'dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          'pdf': ['jspdf'],
        },
      },
    },
    // Enable minification optimizations
    minify: 'esbuild',
    // Generate smaller chunks
    chunkSizeWarningLimit: 500,
    // CSS optimizations
    cssMinify: true,
    cssCodeSplit: true,
  },
}));
