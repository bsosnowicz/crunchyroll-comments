import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest }),
  ],
  // Wyłącz automatyczne wstrzykiwanie CSS do <head> — korzystamy z Shadow DOM
  build: {
    rollupOptions: {
      output: {
        // Zachowaj czytelną strukturę outputu
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
  },
});
