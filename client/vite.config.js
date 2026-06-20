import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/',
  server: {
    allowedHosts: ['.trycloudflare.com']
  },
  plugins: [react()]
});
