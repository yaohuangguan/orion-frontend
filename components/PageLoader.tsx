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
    <div className="fixed inset-0 z-[50] flex flex-col items-center justify-center bg-slate-50/60 dark:bg-slate-950/60 backdrop-blur-2xl animate-fade-in">
      <div className="relative mb-12">
        {/* 外围发光环 */}
        <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>

        {/* Logo 容器 */}
        <div className="relative w-20 h-20 flex items-center justify-center">
          <img
            src="/logo.svg"
            alt="Orion"
            className="w-14 h-14 animate-[spin_12s_linear_infinite]"
          />

          {/* 扫描线效果 */}
          <div className="absolute inset-0 border border-primary-500/20 rounded-2xl animate-[ping_3s_ease-in-out_infinite]"></div>
          <div className="absolute inset-2 border border-primary-500/5 rounded-xl"></div>
        </div>
      </div>

      <div className="flex flex-col items-center max-w-xs w-full px-8">
        <div className="w-full h-[1px] bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-6">
          <div className="h-full bg-gradient-to-r from-transparent via-primary-500 to-transparent animate-[loader-slide_2s_infinite_ease-in-out] w-1/2 relative"></div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span className="text-primary-600 dark:text-primary-400 font-mono text-[9px] uppercase tracking-[0.4em] font-bold opacity-80">
            System Initializing
          </span>
          <p className="text-slate-400 dark:text-slate-500 font-mono text-[8px] uppercase tracking-widest text-center h-4 transition-all duration-700">
            {LOADING_STEPS[step]}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes loader-slide {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};
