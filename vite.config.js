import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isProduction = command === 'build';

  return {
    plugins: [react()],
    root: resolve(__dirname, './src'),
    publicDir: resolve(__dirname, './public'),
    base: './',
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: resolve(__dirname, './dist'),
      emptyOutDir: true,
      rollupOptions: {
        input: {
          main: resolve(__dirname, isProduction ? './src/index.prod.html' : './src/index.html'),
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});