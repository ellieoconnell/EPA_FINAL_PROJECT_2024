import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: resolve(__dirname, 'src/pages'),
  publicDir: resolve(__dirname, 'public'),
  plugins: [react()],
  server: {
    port: 8080,
  },
  build: {
    outDir: resolve(__dirname, './lib'),
    assetsDir: '',
    rollupOptions: {
      input: {
        home: resolve(__dirname, './src/pages/tablepage/index.html'),
        'put-question': resolve(__dirname, './src/pages/put-question/index.html')
      },
    },
  },
});