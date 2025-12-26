import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import process from 'process';

// 模拟 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

// 1. 静态页面
const STATIC_ROUTES = ['/', '/blogs', '/profile', '/footprints', '/captain-cabin', '/404'];

// 2. API 地址
const API_BASE_URL =
  process.env.VITE_API_URL || 'https://bananaboom-api-242273127238.asia-east1.run.app/api';

const isVercel = process.env.VERCEL === '1';

// --- 核心修复：与前端完全一致的 Slug 生成逻辑 ---
function slugify(text) {
  if (!text) return 'post'; // 前端逻辑：为空时返回 'post'
  return (
    text
      .toString()
      // 匹配所有非字母(Unicode Letter)和非数字(Unicode Number)的字符，替换为横杠
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      // 去掉头尾的横杠
      .replace(/^-+|-+$/g, '')
      // 转小写
      .toLowerCase() || 'post'
  );
}

// --- 辅助函数：启动本地预览服务器 ---
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting preview server...');
    const server = spawn('npm', ['run', 'preview', '--', '--port', '4173'], {
      stdio: 'inherit',
      shell: true,
      detached: false
    });
    setTimeout(() => {
      resolve(server);
    }, 3000);
  });
}

// --- 核心函数：动态获取博客详情页路由 ---
async function fetchPostRoutes() {
  console.log(`🌍 Fetching posts from API: ${API_BASE_URL}...`);
  try {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) throw new Error(`API responded with ${response.status}`);

    const posts = await response.json();

    // 生成与前端一致的路由: /blogs/cleanTitle-id
    const routes = posts.map((post) => {
      const id = post._id || post.id;
      // 前端用的是 blog.name，API 返回的字段可能是 name 或 title
      const rawTitle = post.name || post.title || '';

      const cleanTitle = slugify(rawTitle);

      return `/blogs/${cleanTitle}-${id}`;
    });

    console.log(`📚 Found ${routes.length} posts to prerender.`);
    return routes;
  } catch (error) {
    console.error('⚠️ Failed to fetch posts:', error.message);
    return [];
  }
}

(async () => {
  let serverProcess;
  let browser;

  try {
    const [_, dynamicRoutes] = await Promise.all([startServer(), fetchPostRoutes()]);

    const ALL_ROUTES = [...STATIC_ROUTES, ...dynamicRoutes];

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
      args: [...launchArgs, '--single-process', '--no-zygote']
    });

    console.log(`🎯 Total pages to snap: ${ALL_ROUTES.length}`);

    for (const route of ALL_ROUTES) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // 使用 encodeURI 处理中文路径访问
      const url = `http://localhost:4173${encodeURI(route)}`;

      console.log(`📸 Snapping [${ALL_ROUTES.indexOf(route) + 1}/${ALL_ROUTES.length}]: ${route}`);

      try {
        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        // 针对详情页等待内容加载
        if (route.includes('/blogs/') || route === '/profile') {
          try {
            await page.waitForSelector('main', { timeout: 5000 });
          } catch (e) {
            /* empty */
          }
        }

        const html = await page.content();

        let filePath;
        if (route === '/404') {
          filePath = path.join(DIST_DIR, '404.html');
        } else {
          // 解码中文路径用于保存文件
          const decodedRoute = decodeURIComponent(route);
          const routePath = decodedRoute.startsWith('/') ? decodedRoute.slice(1) : decodedRoute;
          const dir = path.join(DIST_DIR, routePath);

          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          filePath = path.join(dir, 'index.html');
        }

        fs.writeFileSync(filePath, html);
      } catch (e) {
        console.error(`❌ Error snapping ${route}:`, e.message);
      } finally {
        await page.close();
      }
    }

    console.log('🎉 All pages prerendered successfully!');
  } catch (error) {
    console.error('⚠️ Prerender script global error:', error);
  } finally {
    if (browser) await browser.close();
    if (serverProcess) {
      console.log('🛑 Killing preview server...');
      serverProcess.kill();
    }
    process.exit(0);
  }
})();
