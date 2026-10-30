import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@learnquest/game-core': path.resolve(__dirname, '../../packages/game-core/src/index.js'),
      '@learnquest/shared': path.resolve(__dirname, '../../packages/shared/src/index.js'),
      '@learnquest/contracts-client': path.resolve(__dirname, '../../packages/contracts-client/src/index.js')
    }
  },
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    watch: {
      // WSL/Windows-mounted drives do not emit inotify events reliably.
      usePolling: true,
      interval: 100,
      ignored: ['**/node_modules/**', '**/dist/**']
    },
    hmr: {
      overlay: true
    }
  },
  optimizeDeps: {
    force: false
  }
});
