import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Hệ Thống Quản Lý Thức Ăn Nhanh',
        short_name: 'FastFood Manager',
        description: 'Hệ thống quản lý cửa hàng thức ăn nhanh - Fast Food Management System',
        theme_color: '#ff6b35',
        background_color: '#ffffff',
        display: 'browser', // Hiển thị như web bình thường, không cài app
        orientation: 'any', // Cho phép xoay màn hình tự do
        scope: '/',
        start_url: '/'
        // Comment out icons until icon files are created
        // icons: [
        //   {
        //     src: '/icon-192x192.png',
        //     sizes: '192x192',
        //     type: 'image/png'
        //   },
        //   {
        //     src: '/icon-512x512.png',
        //     sizes: '512x512',
        //     type: 'image/png'
        //   },
        //   {
        //     src: '/icon-512x512.png',
        //     sizes: '512x512',
        //     type: 'image/png',
        //     purpose: 'any maskable'
        //   }
        // ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            // Support both localhost and production API URLs
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://localhost:7141',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
