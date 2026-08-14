import { resolve } from 'path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  input: {
    popup: resolve(import.meta.dirname, 'popup.html'),
    options: resolve(import.meta.dirname, 'options.html'),
  },
  plugins: [react()],
});
