import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config so the React dev server can talk to your existing Node backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  preview: {
    port: 4173
  }
});


