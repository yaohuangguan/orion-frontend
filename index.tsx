import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './i18n/LanguageContext';
import { BrowserRouter } from 'react-router-dom';
import { inject } from '@vercel/analytics';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { HelmetProvider } from 'react-helmet-async';
import './styles/index.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

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

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, appContent);
} else {
  const root = createRoot(rootElement);
  root.render(appContent);
}
