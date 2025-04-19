import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Force the correct APP_URL
process.env.APP_URL = 'http://192.168.1.3:8000';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
            detectTls: false,
            // Force the URL explicitly 
            url: 'http://192.168.1.3:8000',
        }),
        react(),
        tailwindcss(),
    ],
    server: {
        host: '192.168.1.3', // Changed from 0.0.0.0 to specific IP
        port: 5173,
        strictPort: true,
        https: false, // Never use HTTPS locally
        hmr: {
            host: '192.168.1.3',
            protocol: 'ws',
        },
        cors: {
            origin: '*', // Allow all origins
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            credentials: true,
        },
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept',
        },
    },
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
});
