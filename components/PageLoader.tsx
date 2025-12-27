import React, { useState, useEffect } from 'react';

const LOADING_STEPS = [
  'Calibrating star charts...',
  'Initializing neural link...',
  'Fetching encrypted logs...',
  'Establishing quantum connection...',
  'Syncing digital twin data...',
  'Optimizing bridge interface...'
];

export const PageLoader: React.FC = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[50] flex flex-col items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-xl animate-fade-in">
      <div className="relative mb-12">
        {/* 外围发光环 */}
        <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl animate-pulse"></div>

        {/* Logo 容器 */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <img
            src="/logo.svg"
            alt="Orion"
            className="w-16 h-16 animate-[spin_10s_linear_infinite]"
          />

          {/* 扫描线效果 */}
          <div className="absolute inset-0 border-2 border-primary-500/30 rounded-3xl animate-[ping_3s_ease-in-out_infinite]"></div>
          <div className="absolute inset-2 border border-primary-500/10 rounded-2xl"></div>
        </div>
      </div>

      <div className="flex flex-col items-center max-w-xs w-full px-6">
        <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6 shadow-inner">
          <div className="h-full bg-gradient-to-r from-primary-400 to-primary-600 animate-[loader-slide_2s_infinite_ease-in-out] rounded-full shadow-[0_0_10px_rgba(var(--color-primary-500),0.5)]"></div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-primary-600 dark:text-primary-400 font-mono text-[10px] uppercase tracking-[0.4em] font-bold animate-pulse">
            System Loading
          </span>
          <p className="text-slate-400 dark:text-slate-500 font-mono text-[9px] uppercase tracking-widest text-center h-4 transition-all duration-500">
            {LOADING_STEPS[step]}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loader-slide {
          0% { width: 0%; left: 0%; }
          50% { width: 40%; left: 30%; }
          100% { width: 0%; left: 100%; }
        }
      `}</style>
    </div>
  );
};
