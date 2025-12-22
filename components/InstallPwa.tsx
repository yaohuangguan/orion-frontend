
import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { useLocation } from 'react-router-dom';

export const InstallPwa: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Logic: Only check if NOT already installed
    // 1. Check if already in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    if (isStandalone) return;

    // 2. iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);

    if (isIosDevice) {
      setIsIOS(true);
      // Only show on Home Page for iOS to be less intrusive, or simply show it once session
      // For this requirement, we show if it's not standalone
      setIsVisible(true);
      return;
    }

    // 3. Android/Desktop Interception
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Only render on Home Page as requested
  if (location.pathname !== '/' || !isVisible) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);

    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[100] md:bottom-6 md:left-auto md:right-6 md:w-96 animate-slide-up">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 transition-colors duration-300">
        
        {/* Left: Icon & Text */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-tr from-primary-400 to-primary-600 shadow-lg flex items-center justify-center p-0.5">
             <img src="/logo.svg" alt="App Icon" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-slate-900 dark:text-white text-sm truncate">{t.pwa.title}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{t.pwa.desc}</span>
          </div>
        </div>

        {/* Right: Action */}
        <div className="shrink-0">
            {isIOS ? (
            <div className="text-[10px] text-slate-500 dark:text-slate-400 text-right leading-tight">
                <span dangerouslySetInnerHTML={{ __html: t.pwa.ios }}></span>
            </div>
            ) : (
            <button 
                onClick={handleInstallClick}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg hover:shadow-primary-500/30 active:scale-95 whitespace-nowrap"
            >
                {t.pwa.install}
            </button>
            )}
        </div>
        
        {/* Close Button */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute -top-2 -left-2 bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300 rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-500 hover:text-white transition-colors shadow-sm"
        >
          <i className="fas fa-times"></i>
        </button>
      </div>
    </div>
  );
};
