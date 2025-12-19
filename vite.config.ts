import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd(), "");

  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
      // 🔥🔥🔥 核心：反向代理配置 🔥🔥🔥
      proxy: {
        // 当你访问 '/api' 开头的路径时，Vite 会帮你转发给后端
        "/api": {
          target: "http://localhost:5000", // 本地后端的地址
          changeOrigin: true, // 允许跨域（修改 Host 头）
          secure: false, // 如果是 https 且证书无效，设为 false

          // 可选：如果你的后端路由本身不带 /api，需要把 /api 重写掉
          // rewrite: (path) => path.replace(/^\/api/, '')
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        // 🔥 修复 1：指向 src 目录，而不是根目录
        "@": path.resolve(__dirname, "./src"),
      },
    },
    // 🔥 修复 2：显式注入 Dockerfile 里的 VITE_API_URL
    // 这样你的代码里无论是用 process.env.VITE_API_URL 还是 import.meta.env 都能读到了
    define: {
      "process.env": {
        VITE_API_URL: JSON.stringify(env.VITE_API_URL),
        API_KEY: JSON.stringify(env.GEMINI_API_KEY),
        GEMINI_API_KEY: JSON.stringify(env.GEMINI_API_KEY),
      },
      // 意思是：当代码里出现 import.meta.env.VITE_APP_VERSION 时，
      // 在打包构建阶段，把它替换成 Vercel 提供的 GIT COMMIT SHA。
      // JSON.stringify 是必须的，因为 define 做的是文本替换。
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(
        process.env.VERCEL_GIT_COMMIT_SHA || "Dev-Mode"
      ),
    },
  };
});
