import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  input: {
    background: resolve(import.meta.dirname, 'src/background/index.ts'),
    content: resolve(import.meta.dirname, 'src/content/index.ts'),
    youtube: resolve(import.meta.dirname, 'src/content/youtube/index.ts'),
    options: resolve(import.meta.dirname, 'options.html'),
    popup: resolve(import.meta.dirname, 'popup.html'),
  },
  plugins: [react()],
});
