import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: { port: 5173 },
  // react-helmet-async ships CommonJS that Node ESM cannot import by name; bundle it into the SSR build.
  ssr: { noExternal: ['react-helmet-async'] },
  build: { target: 'es2020', cssCodeSplit: true },
});
