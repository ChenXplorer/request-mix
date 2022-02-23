import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  resolve: {
    alias: {
      'request-mix': path.resolve(__dirname, '../src/index.ts'),
    },
  },
  server: {
    port: 4000,
  },
  plugins: [vue(), vueJsx()],
});
