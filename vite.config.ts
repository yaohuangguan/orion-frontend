import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    resolve: {
      alias: {
        // 🔥 修复 1：指向 src 目录，而不是根目录
        '@': path.resolve(__dirname, './src'),
      }
    },
    // 🔥 修复 2：显式注入 Dockerfile 里的 VITE_API_URL
    // 这样你的代码里无论是用 process.env.VITE_API_URL 还是 import.meta.env 都能读到了
    define: {
      'process.env': {
         VITE_API_URL: JSON.stringify(env.VITE_API_URL),
         API_KEY: JSON.stringify(env.GEMINI_API_KEY),
         GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY)
      }
    }
  };
});