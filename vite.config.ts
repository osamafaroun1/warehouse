import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';

const host = process.env.TAURI_DEV_HOST;

const BASE_SERVER_DEV = 'http://10.10.151.171:3004';

// API endpoints (production and development)
const API_PATH = '/api';
const DEV_API_URL = `${BASE_SERVER_DEV}${API_PATH}`;

// https://vite.dev/config/
export default defineConfig(async () => ({
    plugins: [tailwindcss(), solid()],

    // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
    //
    // 1. prevent Vite from obscuring rust errors
    clearScreen: false,
    // 2. tauri expects a fixed port, fail if that port is not available
    server: {
        port: 1420,
        strictPort: true,
        host: host || false,
        hmr: host
            ? {
                protocol: 'ws',
                host,
                port: 1421,
            }
            : undefined,
        watch: {
            // 3. tell Vite to ignore watching `src-tauri`
            ignored: ['**/src-tauri/**', '**/server/**'],
        },
    },
    define: {
        // Expose the baseURL as a global variable
        API_BASE_URL: JSON.stringify(`${BASE_SERVER_DEV}${API_PATH}`),
        SERVER_BASE_URL: JSON.stringify(`${BASE_SERVER_DEV}`),
    },
}));
