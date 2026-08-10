import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vite.dev/config/
export default defineConfig({
  input: {
    popup: resolve(import.meta.dirname, 'popup.html'),
    options: resolve(import.meta.dirname, 'options.html'),
  },
  plugins: [react()],
});
