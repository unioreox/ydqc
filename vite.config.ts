import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import VueDevTools from 'vite-plugin-vue-devtools'

import { resolve, join } from 'path';
import { writeFileSync, mkdirSync } from 'fs';

// https://vitejs.dev/config/
// 每次构建时写入构建时间
function buildTimePlugin() {
    let outDir = '';
    let root = '';

    return {
        name: 'build-time',
        configResolved(config: { root: string; build: { outDir: string; }; }) {
            root = config.root;
            outDir = resolve(root, config.build.outDir);
        },
        closeBundle() {
            const buildTime = new Date(Date.now()).toISOString();
            const outputPath = join(outDir, 'build-time.json');
            mkdirSync(outDir, { recursive: true });
            writeFileSync(outputPath, JSON.stringify({ time: buildTime }));
            console.log('Write build time to:', outputPath);
        }
    };
}

export default defineConfig({
    plugins: [
        vue(),
        VueDevTools(),
        buildTimePlugin(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        host: '0.0.0.0',
        proxy: {
            '/api': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                rewrite: path => path.replace("/api/v1", "")
            },
            '/uploads': {
                target: 'http://localhost:8080',
                changeOrigin: true,
            },
        }
    }
})
