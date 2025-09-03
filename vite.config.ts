import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // FIX: Replaced `__dirname` with the modern ESM equivalent using `import.meta.url` to correctly resolve the path for the '@' alias. `__dirname` is not available in ES modules.
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
