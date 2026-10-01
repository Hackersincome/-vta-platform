import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  appType: 'custom',
  server: {
    host: '0.0.0.0',
    strictPort: true,
  },
  build: {
    sourcemap: false,
    target: 'es2022',
  },
});
