import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
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
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
        },
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, isProduction ? './src/index.prod.html' : './src/index.html'),
        },
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            vendor: ['electron-is-dev'],
          },
        },
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      hmr: {
        overlay: true,
      },
      watch: {
        usePolling: true,
        interval: 1000,
      },
    },
    preview: {
      port: 5174,
      strictPort: true,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProduction ? 'production' : 'development'),
    },
  };
});
