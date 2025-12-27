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

// 隐藏 Splash Screen 的逻辑现在由 App.tsx 根据 Auth 状态和最小时间控制

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, appContent);
} else {
  const root = createRoot(rootElement);
  root.render(appContent);
}
