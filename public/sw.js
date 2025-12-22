const CACHE_NAME = 'orion-v1766399634310'; // 🔥 升级一下版本号，强迫浏览器更新缓存
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.svg',
  '/ios-share-icon-192.png', // ✅ 关键：缓存主屏幕图标
];

// 1. 安装阶段：预缓存关键静态资源
self.addEventListener('install', (event) => {
  console.log('👷 SW: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 SW: Caching App Shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // 🔥 强制立即接管，不用等下次刷新
  );
});

// 2. 拦截请求：Cache First 策略 (API 除外)
self.addEventListener('fetch', (event) => {
  // 🛡️ 过滤：如果是 API 请求，直接走网络，绝不查缓存
  if (event.request.url.includes('/api/')) {
    return; 
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 命中缓存：直接返回
        if (response) {
          return response;
        }
        // 未命中：去网络拉取
        return fetch(event.request);
      })
  );
});

// 3. 激活阶段：清理旧版本缓存
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('🧹 SW: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // 🔥 立即控制所有页面
  );
});