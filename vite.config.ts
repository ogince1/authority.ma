import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          sitemap: ['./src/utils/sitemap.ts', './src/utils/sitemapScheduler.ts']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
