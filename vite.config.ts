import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const isElectronBuild = process.env.ELECTRON_BUILD === '1';
  return {
    plugins: [
      react(),
      tailwindcss(),
      ...(isElectronBuild ? [] : [VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        devOptions: {
          enabled: false
        },
        includeAssets: ['robots.txt', 'sitemap.xml'],
        workbox: {
          maximumFileSizeToCacheInBytes: 30 * 1024 * 1024, // 30MB
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        },
        manifest: {
          name: 'Mosca Tee',
          short_name: 'Mosca Tee',
          description: 'Editor criativo do Mosca Tee',
          lang: 'pt-BR',
          start_url: '/',
          scope: '/',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          icons: [
            {
              src: 'https://moscatee.com/assets/img/icon-mosca-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: 'https://moscatee.com/assets/img/icon-mosca-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })])
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY || ""),
      'process.env.VITE_PEXELS_KEY': JSON.stringify(env.VITE_PEXELS_KEY || ""),
      'process.env.VITE_GOOGLE_FONTS_KEY': JSON.stringify(env.VITE_GOOGLE_FONTS_KEY || ""),
    },
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1500,
      modulePreload: isElectronBuild ? false : true,
      cssCodeSplit: !isElectronBuild,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR === 'true' ? false : {
        overlay: false,
      },
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
