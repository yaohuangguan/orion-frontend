import { run } from 'react-snap';
import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import process from 'process';

const isVercel = process.env.VERCEL === '1';

(async () => {
  try {
    let executablePath;
    let launchArgs = [];

    if (isVercel) {
      console.log('☁️ Detected Vercel Environment. Loading @sparticuz/chromium...');
      const chromium = await import('@sparticuz/chromium').then((m) => m.default);
      executablePath = await chromium.executablePath();
      launchArgs = chromium.args;
    } else {
      console.log('💻 Detected Local Environment. Using Standard Puppeteer...');
      executablePath = puppeteer.executablePath();

      // Windows 路径兼容修复
      if (process.platform === 'win32') {
        executablePath = path.resolve(executablePath).split(path.sep).join('/');
      }

      launchArgs = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ];
    }

    console.log(`🚀 Final Executable Path: ${executablePath}`);

    // 运行 react-snap
    await run({
      puppeteerExecutablePath: executablePath,
      source: 'dist',
      destination: 'dist',
      include: ['/', '/blogs', '/404.html'], // 显式包含 404

      // 🔥 核心修复 1: 强制根路径
      publicPath: '/',

      // 🔥 核心修复 2: 彻底禁用所有 HTML/CSS 篡改功能
      // Vite 已经压缩得很好了，react-snap 再搞一次只会破坏 ESM 标签
      minifyCss: false,
      inlineCss: false, // 👈 最可能是它导致了 SyntaxError
      minifyHtml: false, // 先关掉，排查问题，Vite 已经压缩过 HTML 了

      // 🔥 核心修复 3: 禁用 Webpack 专用逻辑
      fixWebpackChunksIssue: false,
      asyncScriptTags: false, // Vite 默认就是 module defer，不要乱动

      // 🔥 核心修复 4: 忽略外部资源报错 (比如图片 404 不应该挂断构建)
      skipThirdPartyRequests: true,

      // Vercel 性能限制
      concurrency: 1,

      puppeteerArgs: [
        ...launchArgs,
        '--single-process',
        '--no-zygote',
        '--disable-web-security' // 允许跨域加载
      ],

      pageLoadTimeout: 60000
    });

    console.log('✅ Pre-rendering complete!');
  } catch (error) {
    console.error('⚠️ Pre-rendering failed, but continuing build...', error);
    // 保持 exit 0，确保即使 snap 失败，网站也能上线（虽然是未预渲染的版本）
    process.exit(0);
  }
})();
