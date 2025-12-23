import React from 'react';
// 1. 引入 hydrateRoot 和 createRoot
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';
import { BrowserRouter } from 'react-router-dom';
import { inject } from '@vercel/analytics';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { HelmetProvider } from 'react-helmet-async';

// Initialize Vercel Web Analytics
inject();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

// 2. 将原本的 JSX 结构提取出来，避免重复写两遍
const appContent = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <LanguageProvider>
          <App />
          <SpeedInsights />
        </LanguageProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);

// 3. 核心逻辑：检测 root 节点内是否有内容
// 如果有子节点 (hasChildNodes)，说明 react-snap 已经生成了静态 HTML，我们使用 "hydrateRoot" 来激活它（绑定事件，但不重新渲染 DOM）。
// 如果没有子节点，说明是普通的客户端渲染（或开发环境），我们使用 "createRoot" 进行全新渲染。
if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, appContent);
} else {
  const root = createRoot(rootElement);
  root.render(appContent);
}
