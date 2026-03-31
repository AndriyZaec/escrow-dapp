import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@generated': path.resolve(__dirname, './src/generated'),
    },
  },
  define: { global: 'globalThis' },
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@solana') || id.includes('node_modules/@solana-program')) {
            return 'vendor-solana';
          }
          if (id.includes('node_modules/@supabase')) {
            return 'vendor-supabase';
          }
        },
      },
    },
  },
});
