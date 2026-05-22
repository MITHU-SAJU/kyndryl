import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(), 
    // mkcert(), // Commented out to run plain HTTP for easy localtunnel mapping
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon-96x96.png', 'apple-touch-icon.png', 'icons.svg'],
      manifest: {
        name: '60-Second CIO Challenge',
        short_name: 'CIO Challenge',
        description: 'Kyndryl 60-Second CIO Challenge Quiz',
        theme_color: '#111111',
        background_color: '#111111',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        rollupFormat: 'iife'
      }
    })
  ],
  server: {
    https: false, // Disabled for HTTP tunneling compatibility
    allowedHosts: true // Allow any tunnel hostname (like localtunnel, ngrok) to connect
  }
})

