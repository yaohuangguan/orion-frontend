import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import process from 'process';

// 模拟 __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

// 🔥 配置并发数 (Vercel 建议 3-5，太高会内存溢出)
const CONCURRENCY_LIMIT = 5;

// 1. 静态页面路由
const STATIC_ROUTES = ['/', '/blogs', '/profile', '/footprints', '/404'];

// 2. API 地址
const API_BASE_URL =
  process.env.VITE_API_URL || 'https://bananaboom-api-242273127238.asia-east1.run.app/api';

const isVercel = process.env.VERCEL === '1';

// --- Slug 处理 (精准匹配你的前端逻辑) ---
function slugify(text) {
  if (!text) return 'post';
  return (
    text
      .toString()
      // 匹配所有非字母和非数字的字符，替换为横杠 (支持中文)
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      // 去掉头尾的横杠
      .replace(/^-+|-+$/g, '')
      // 转小写
      .toLowerCase() || 'post'
  );
}

// --- 启动预览服务器 ---
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Starting preview server...');
    const server = spawn('npm', ['run', 'preview', '--', '--port', '4173'], {
      stdio: 'inherit',
      shell: true,
      detached: false
    });
    // 等待 3 秒确保服务启动
    setTimeout(() => {
      resolve(server);
    }, 3000);
  });
}

// --- 获取动态路由 (精准匹配 data 结构) ---
async function fetchPostRoutes() {
  console.log(`🌍 Fetching posts from API: ${API_BASE_URL}/posts...`);
  try {
    const response = await fetch(`${API_BASE_URL}/posts`);
    if (!response.ok) throw new Error(`API responded with ${response.status}`);

    const json = await response.json();

    // 🔥 直接读取 json.data，不再猜测
    const posts = json.data;

    if (!Array.isArray(posts)) {
      console.error('⚠️ Expected "data" to be an array but got:', typeof posts);
      return [];
    }

    // 🔥 直接读取 _id 和 name
    const routes = posts.map((post) => {
      const id = post._id;
      const cleanTitle = slugify(post.name);
      return `/blogs/${cleanTitle}-${id}`;
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
        req.continue(); // 暂时放行，如果觉得慢可以改成 req.abort()
      } else {
        req.continue();
      }
    });

    await page.setViewport({ width: 1280, height: 800 });

    // 访问页面 (处理中文路径编码)
    const url = `http://localhost:4173${encodeURI(route)}`;

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

    const html = await page.content();

    // 计算保存路径
    let filePath;
    if (route === '/404') {
      filePath = path.join(DIST_DIR, '404.html');
    } else {
      // 解码中文路径: /blogs/有志者... -> dist/blogs/有志者.../index.html
      const decodedRoute = decodeURIComponent(route);
      const routePath = decodedRoute.startsWith('/') ? decodedRoute.slice(1) : decodedRoute;
      const dir = path.join(DIST_DIR, routePath);

      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      filePath = path.join(dir, 'index.html');
    }

    fs.writeFileSync(filePath, html);
    console.log(`✅ [${index + 1}/${total}] Saved: ${decodeURIComponent(route)}`);
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
    const [_, dynamicRoutes] = await Promise.all([startServer(), fetchPostRoutes()]);

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
      args: [...launchArgs, '--single-process', '--no-zygote']
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
    if (browser) await browser.close();
    if (serverProcess) {
      console.log('🛑 Killing preview server...');
      serverProcess.kill();
    }
    process.exit(0);
  }
})();
