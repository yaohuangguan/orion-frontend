import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import process from 'process';

// 模拟 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

// 🔥 配置并发数 (Vercel 建议 3-5)
const CONCURRENCY_LIMIT = 5;

// 1. 静态页面路由
const STATIC_ROUTES = ['/', '/blogs', '/profile', '/footprints', '/404'];

// 2. API 地址
const API_BASE_URL =
  'https://api.samyao.me/api';

const isVercel = process.env.VERCEL === '1';

// --- 启动预览服务器 ---
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting preview server...');
    const viteEntry = path.resolve(__dirname, '../node_modules/vite/bin/vite.js');
    const server = spawn(process.execPath, [viteEntry, 'preview', '--port', '4173'], {
      stdio: 'inherit',
      shell: false,
      detached: false
    });
    server.once('error', reject);
    // 等待 3 秒确保服务启动
    setTimeout(() => {
      resolve(server);
    }, 3000);
  });
}

// --- 获取动态路由 (纯 ID 模式) ---
async function fetchPostRoutes() {
  console.log(`🌍 Fetching posts from API: ${API_BASE_URL}/posts...`);
  try {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) throw new Error(`API responded with ${response.status}`);

    const json = await response.json();

    // 兼容 data 结构
    // 有些 API 返回 { data: [] }, 有些直接返回 []
    const posts = Array.isArray(json) ? json : json.data || [];

    if (!Array.isArray(posts)) {
      console.error('⚠️ Expected posts to be an array but got:', typeof posts);
      return [];
    }

    // 🔥🔥🔥 核心修改：只使用 ID，不再拼接中文标题 🔥🔥🔥
    // 这样能确保 URL 简短且无特殊字符，避免 Vercel 500 错误
    const routes = posts.map((post) => {
      const id = post._id || post.id;
      return `/blogs/${id}`;
    });

    console.log(`📚 Found ${routes.length} posts to prerender.`);
    return routes;
  } catch (error) {
    console.error('⚠️ Failed to fetch posts:', error.message);
    return [];
  }
}

// --- 单个页面处理任务 ---
async function snapPage(browser, route, index, total) {
  let page = null;
  try {
    page = await browser.newPage();

    // 拦截不必要的资源以加速 (图片、字体)
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const resourceType = req.resourceType();
      if (['image', 'font'].includes(resourceType)) {
        req.continue();
      } else {
        req.continue();
      }
    });

    await page.setViewport({ width: 1280, height: 800 });

    // 访问页面 (纯 ID 路径不需要复杂编码)
    const url = `http://localhost:4173${route}`;

    // 放宽超时时间
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });

    // 针对博客详情页和 Profile，等待主内容加载
    if (route.includes('/blogs/') || route === '/profile') {
      try {
        await page.waitForSelector('main', { timeout: 5000 });
      } catch (e) {
        /* empty */
      }
    }

    // Stamp the snapshot with the route it was rendered for.
    // The client uses this to avoid hydrating stale/wrong-route HTML.
    await page.evaluate((renderedRoute) => {
      const root = document.getElementById('root');
      if (root) root.setAttribute('data-prerender-path', renderedRoute);
    }, route);

    const html = await page.content();

    // 计算保存路径
    let filePath;
    if (route === '/404') {
      filePath = path.join(DIST_DIR, '404.html');
    } else {
      // 路由: /blogs/694b... -> 目录: dist/blogs/694b.../index.html
      // 移除开头的 /
      const routePath = route.startsWith('/') ? route.slice(1) : route;
      const dir = path.join(DIST_DIR, routePath);

      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      filePath = path.join(dir, 'index.html');
    }

    fs.writeFileSync(filePath, html);
    console.log(`✅ [${index + 1}/${total}] Saved: ${route}`);
  } catch (e) {
    console.error(`❌ [${index + 1}/${total}] Error: ${route} - ${e.message}`);
  } finally {
    if (page) await page.close(); // 必须关闭 Tab 释放内存
  }
}

// --- 主流程 ---
(async () => {
  let serverProcess;
  let browser;

  try {
    // 1. 并行：启动服务 + 抓取接口
    const [previewProcess, dynamicRoutes] = await Promise.all([startServer(), fetchPostRoutes()]);
    serverProcess = previewProcess;

    const ALL_ROUTES = [...STATIC_ROUTES, ...dynamicRoutes];
    const total = ALL_ROUTES.length;

    console.log(`🎯 Total pages to snap: ${total} | Concurrency: ${CONCURRENCY_LIMIT}`);

    // 2. 启动浏览器
    let executablePath;
    let launchArgs = [];
    if (isVercel) {
      console.log('☁️ Detected Vercel. Loading @sparticuz/chromium...');
      const chromium = await import('@sparticuz/chromium').then((m) => m.default);
      executablePath = await chromium.executablePath();
      launchArgs = chromium.args;
    } else {
      console.log('💻 Local run. Using Puppeteer...');
      executablePath = puppeteer.executablePath();
      launchArgs = ['--no-sandbox', '--disable-setuid-sandbox'];
    }

    browser = await puppeteer.launch({
      executablePath,
      headless: 'new',
      args: launchArgs
    });

    // 3. 并发控制队列
    const executing = [];
    const results = [];

    for (let i = 0; i < total; i++) {
      const route = ALL_ROUTES[i];
      const p = snapPage(browser, route, i, total);
      results.push(p);

      if (CONCURRENCY_LIMIT <= total) {
        const e = p.then(() => executing.splice(executing.indexOf(e), 1));
        executing.push(e);
        if (executing.length >= CONCURRENCY_LIMIT) {
          await Promise.race(executing);
        }
      }
    }

    await Promise.all(results);
    console.log('🎉 All pages prerendered successfully!');
  } catch (error) {
    console.error('⚠️ Prerender script global error:', error);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.warn('⚠️ Browser was already closed:', error.message);
      }
    }
    if (serverProcess) {
      console.log('🛑 Killing preview server...');
      serverProcess.kill();
    }
    process.exit(0);
  }
})();
