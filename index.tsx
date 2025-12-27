import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';
import { BrowserRouter } from 'react-router-dom';
import { inject } from '@vercel/analytics';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { HelmetProvider } from 'react-helmet-async';
import './styles/index.css';

// Initialize Vercel Web Analytics
inject();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const appContent = (
  <HelmetProvider>
    <BrowserRouter>
      <LanguageProvider>
        <App />
        <SpeedInsights />
      </LanguageProvider>
    </BrowserRouter>
  </HelmetProvider>
);

// 渲染后的处理函数：移除原生启动屏
const onRenderComplete = () => {
  // 给一小段延迟，确保 React 已经把 DOM 刷到屏幕上
  setTimeout(() => {
    document.body.classList.add('app-ready');
  }, 100);
};

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, appContent);
  onRenderComplete();
} else {
  const root = createRoot(rootElement);
  root.render(appContent);
  // 对于 createRoot，render 是异步的，但在现代浏览器中直接调用紧接其后的逻辑通常没问题
  // 或者可以在 App 的 useEffect 中处理。这里采用简单有效的 Body Class 方案。
  onRenderComplete();
}
