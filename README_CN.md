# Orion System | 工程与设计

![Orion Banner](public/logo.svg)

![React](https://img.shields.io/badge/React-v19-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-v6-purple?logo=vite)
![pnpm](https://img.shields.io/badge/Manager-pnpm-orange?logo=pnpm)
![PWA](https://img.shields.io/badge/PWA-Offline_Ready-success?logo=pwa)

> **Navigate your Value. (探索你的价值坐标)**

Orion 是一个现代化、高性能的 **个人知识管理 (PKM)** 与 **数字花园** 系统。它融合了面向公众的作品集与博客（“舰桥”），以及一个精密加密的私人仪表盘（“舰长室”），用于深度管理个人数据、健康指标及 AI 交互。

项目遵循 **原子化设计 (Atomic Design)** 原则，基于 **React 19** 构建，并采用 **pnpm** 进行现代化的依赖管理。

## 🌟 核心功能 (Key Features)

### 1. 公共扇区 (The Bridge / 舰桥)

- **交互式主视觉:** 动态 3D 风格 CSS 动画与系统状态指示器。
- **传输日志 (博客):** 支持 Markdown 的日志系统，包含标签、搜索及嵌套评论功能。支持嵌入 iFrame 与富媒体。
- **作品集与简历:** 双模展示（文档简历 / 项目卡片），支持中英双语切换。

### 2. 舰长室 (Captain's Cabin / 私有空间)

受 JWT 鉴权与 RBAC（基于角色的访问控制）保护的加密区域。

#### 🧠 第二大脑 (AI Core)

- **上下文感知对话:** RAG 风格交互，AI 可读取你的日志、健身记录及项目数据。
- **多模态输入:** 支持拖拽图片分析与文本处理。
- **会话管理:** 持久化的聊天记录与侧边栏导航。

#### 🏃 体能舱 (Fitness Space)

- **全方位追踪:** 记录体重、BMI、睡眠、情绪及饮水量。
- **训练日志:** 追踪运动类型（跑步、力量、HIIT 等）、持续时间及训练笔记。
- **照片墙:** 基于月历的体态进度照片库。
- **数据分析:** 使用 Recharts 可视化体重趋势与活动统计。

#### 🧘 休闲与实用工具

- **AI 智慧厨房:**
  - **主厨转盘:** 随机餐点决策器（支持健康/多样化滤镜）。
  - **智能计划:** 基于健身目标（减脂/增肌）AI 生成备餐计划。
- **月相周期:** 生理周期追踪与预测。
- **海盗领主:** 自研逻辑解谜游戏（滑动/网格策略）。

#### 🗺️ 足迹与画廊

- **星图:** 双视图旅行记录（ECharts 中国地图 / Leaflet 全球地图）。
- **胶囊画廊:** 软木板 UI 风格，支持照片卡片的自由拖拽与旋转。

## 🛠 技术栈与工程化

### 核心架构

- **框架:** React 19
- **构建工具:** Vite
- **语言:** TypeScript
- **包管理器:** **pnpm** (Strict mode)

### 基础设施与质量保证

- **Linting:** ESLint v9 (Flat Config)
- **Formatting:** Prettier
- **Git Hooks:** Husky + Lint-staged (自动化提交前检查)
- **CI/CD:** 自动化的 Service Worker 版本控制

### 关键库

- **样式:** Tailwind CSS, FontAwesome
- **可视化:** Recharts, ECharts, Leaflet
- **实时通信:** Socket.io-client

## 🚀 快速开始 (Getting Started)

### 环境要求

- **Node.js**: v22.0.0 或更高
- **pnpm**: v9+ (推荐使用 Corepack 启用)

### 安装步骤

1. **克隆与设置**

   ```bash
   git clone [https://github.com/yourusername/orion.git](https://github.com/yourusername/orion.git)
   cd orion

   # 通过 Node Corepack 启用 pnpm
   corepack enable
   corepack prepare pnpm@latest --activate
   ```

````

2. **安装依赖**
```bash
pnpm install

````

3. **环境配置**
   在根目录创建 `.env` 文件：

```properties
VITE_API_URL=http://localhost:5000/api
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name

```

4. **启动开发服务器**

```bash
pnpm dev

```

## 🤖 自动化与 PWA

本项目使用 **Husky** 强制执行代码质量检查，并实现了 PWA 版本的自动化管理。

### Service Worker 策略

- **入口 (HTML):** 网络优先 (Network First) —— 防止版本死锁，确保用户总是访问最新页面。
- **资源 (JS/CSS):** 缓存优先 (Cache First) —— 利用哈希文件名特性，极大提升加载速度。
- **API:** 仅网络 (Network Only)。

### 自动版本递增 (Auto-Bumping)

每次执行 `git commit` 时，`pre-commit` 钩子会自动触发：

1. 运行 `scripts/bump-sw.js`，将当前时间戳注入 `sw.js` 的缓存版本号。
2. 运行 `ESLint` 和 `Prettier` 修复代码风格。
3. 将更新后的 Service Worker 自动添加回本次提交。

## 🎨 主题系统

系统内置动态 **Cosmic/Scenic** 主题引擎：

- **Light Mode:** "Milky" —— 暖色调、纸质纹理与风景。
- **Dark Mode:** "Cosmic" —— 深空主题，带有动态星空背景。
- **节日模式:** 特定日期自动触发（如圣诞节雪花、春节灯笼）。

## 📄 License

[MIT](https://www.google.com/search?q=LICENSE)
