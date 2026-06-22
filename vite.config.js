import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { resolve } from 'path'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                jadwal: resolve(__dirname, 'jadwal.html'),
                scheduler: resolve(__dirname, 'smart-workout-scheduler.html'),
            },
        },
    },
})
