import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FIX: Replace process.cwd() with __dirname for Vite/ESM compatibility and to fix type errors.
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
