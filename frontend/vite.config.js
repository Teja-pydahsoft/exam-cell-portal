import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
            manifest: {
                name: 'Pydah Academic Portal V2',
                short_name: 'Pydah V2',
                description: 'Advanced Academic Management System for Pydah Group',
                theme_color: '#3D4127',
                background_color: '#f8faf9',
                display: 'standalone',
                orientation: 'portrait',
                icons: [
                    // Ensure you actually create these icons or the PWA won't validate correctly
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
            workbox: {
                // Generate a service worker that caches assets and API responses
                runtimeCaching: [
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/api/dashboard/stats'),
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-stats-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 5 // Cache stats for 5 minutes
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
                        handler: 'NetworkFirst', // Use Fresh data if possible, fallback to cache
                        options: {
                            cacheName: 'api-general-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 // 1 hour
                            },
                            networkTimeoutSeconds: 5
                        }
                    }
                ]
            }
        })
    ],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true
            }
        }
    }
})
