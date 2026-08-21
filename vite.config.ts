import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isAdmin = process.env.BUILD_TARGET === 'admin';

  return {
    build: {
      outDir: isAdmin ? 'dist-admin' : 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: isAdmin ? path.resolve(__dirname, 'admin.html') : path.resolve(__dirname, 'index.html'),
      }
    },
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GOOGLE_MAPS_PLATFORM_KEY': JSON.stringify(env.GOOGLE_MAPS_PLATFORM_KEY || env.VITE_GOOGLE_MAPS_PLATFORM_KEY || ''),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      exclude: [],
    },
    server: {
      headers: {
        "Cross-Origin-Opener-Policy": "same-origin-allow-popups"
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: ['**/assets/**', '**/dist/**', '**/dist-admin/**', '**/functions/**', '**/node_modules/**'],
      },
    },
    // Exclude pre-built asset files from Vite's crawl/scan in dev mode
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif', '**/*.svg', '**/*.webp', '**/*.mp4', '**/*.webm'],
  };
});
