import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  clearScreen: false,
  resolve: {
    alias: {
      'vue-request-wrapper': path.resolve(__dirname, '../src/index.ts'),
    },
  },
  server: {
    port: 4000,
  },
  plugins: [vue(), vueJsx()],
});
