self.addEventListener('install', (event) => {
  console.log('👷 SW: Installing (No Cache Mode)...');
  // 强制立即接管，跳过等待
  self.skipWaiting();
});

// 2. 激活阶段：🔥 暴力清理所有旧缓存
// 这是为了挽救之前已经缓存了旧文件的用户，确保他们切到这个新版本时，旧缓存被彻底干掉
self.addEventListener('activate', (event) => {
  console.log('🚀 SW: Activating & Cleaning...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🧹 SW: Deleting old cache:', cacheName);
          return caches.delete(cacheName); // 见一个删一个，绝不留情
        })
      );
    })
    .then(() => self.clients.claim()) // 立即控制页面
  );
});

// 3. 拦截请求：🌐 纯网络模式 (Network Only)
self.addEventListener('fetch', (event) => {
  // 我们监听了 fetch 事件（这是 PWA 安装的必要条件之一），
  // 但我们不做任何复杂逻辑，直接把请求扔回给网络。
  // 如果断网了，就直接失败（浏览器默认行为）。
  event.respondWith(fetch(event.request));
});