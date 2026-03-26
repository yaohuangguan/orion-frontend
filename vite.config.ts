import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: '/',
    server: {
      port: 5173,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'https://bananaboom-api-242273127238.asia-east1.run.app/api',
          changeOrigin: true,
          secure: false,
          // 🔥 关键：把请求路径中的 '/api' 替换为空字符串
          rewrite: (path) => path.replace(/^\/api/, ''),
          configure: (proxy, options) => {
            proxy.on('proxyReq', (proxyReq, req, res) => {
              // 把 Origin 伪装成你的生产域名 (后端白名单里的域名)
              // 这样后端就以为是自己人发的请求，不会拦截了
              proxyReq.setHeader('Origin', 'https://www.ps6.space');
            });
          }
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    plugins: [
      react(),
      VitePWA({
        // 🔥 核心设置 1: 自动更新模式
        // 这相当于你手写代码里的 self.skipWaiting() + clients.claim()
        // 一旦发现新版本，SW 会自动更新并接管页面
        registerType: 'autoUpdate',

        // 🔥 核心设置 2: 静态资源预缓存
        // 这里告诉 SW：把 index.html 和核心 JS/CSS/Logo 给我锁死在硬盘里！
        // 下次打开绝不允许走网络！
        includeAssets: ['favicon.ico', 'ios-share-icon-192.png', 'logo.svg'],
        workbox: {
          // 匹配这些文件进行预缓存
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          globIgnores: ['**/remixicon-*.svg', '**/node_modules/**/*'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          // 甚至可以配置 API 请求的缓存策略（可选）
          runtimeCaching: [
            // ...
          ]
        },

        // PWA 安装信息
        manifest: {
          name: 'Orion | Engineering & Design | Sam Yao',
          short_name: 'Orion',
          start_url: '/',
          display: 'standalone',
          background_color: '#020617',
          theme_color: '#020617',
          orientation: 'portrait-primary',
          icons: [
            {
              src: '/ios-share-icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/ios-share-icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/logo.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ]
        }
      })
    ],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
              if (id.includes('highlight.js') || id.includes('leaflet')) return 'vendor-ui';
              return 'vendor';
            }
          }
        }
      }
    },
    define: {
      'process.env': {
        VITE_API_URL: JSON.stringify(env.VITE_API_URL)
      },
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(
        process.env.VERCEL_GIT_COMMIT_SHA || 'Dev-Mode'
      )
    }
  };
});
