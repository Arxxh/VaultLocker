import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import path from 'path';

export default defineConfig({
  plugins: [react(), crx({ manifest })],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Agrega esta configuración del server
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      host: 'localhost',
      protocol: 'ws',
    },
    cors: true,
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: path.resolve(__dirname, 'src/background/index.js'),
        content: path.resolve(__dirname, 'src/content/content.js'),
        popup: path.resolve(__dirname, 'src/popup/index.html'),
        options: path.resolve(__dirname, 'src/options/index.html'),
        dashboard: path.resolve(__dirname, 'src/dashboard/index.html'),
      },
    },
  },
});
