# --- 阶段一：构建 (Build) ---
    FROM node:20-alpine as builder

    WORKDIR /app
    
    # 1. 复制依赖描述文件
    COPY package.json yarn.lock* ./
    
    # 2. 安装依赖
    RUN yarn install
    
    # 3. 复制所有源代码
    COPY . .
    
    # 🔥🔥🔥 关键点：写入后端地址 🔥🔥🔥
    # Vite 在构建时就会把这个变量写死在 JS 代码里，所以必须在这里定义
    # 替换成你 Cloud Run 后端的真实 URL (不要带最后的斜杠)
    ENV VITE_API_URL=https://bananaboom-api-242273127238.asia-east1.run.app
    
    # 4. 执行构建 (生成 dist 文件夹)
    RUN yarn run build
    
    # --- 阶段二：运行 (Serve) ---
    FROM nginx:alpine
    
    # 5. 把构建好的 dist 文件夹复制到 Nginx 目录
    # (如果你是 Create-React-App，请把 dist 改成 build)
    COPY --from=builder /app/dist /usr/share/nginx/html
    
    # 6. 把我们写的 nginx.conf 复制进去
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    # 7. 暴露 80 端口
    EXPOSE 80
    
    # 8. 启动 Nginx
    CMD ["nginx", "-g", "daemon off;"]