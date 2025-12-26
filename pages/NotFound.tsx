import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-[#0b0f17] z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      </div>

      <div className="relative z-10 max-w-md">
        <div className="relative inline-block">
          <h1 className="text-9xl font-display font-bold text-slate-200 dark:text-slate-800 mb-4 select-none tracking-widest">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
            <i className="fas fa-satellite-dish text-6xl text-primary-500 animate-pulse drop-shadow-xl"></i>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-4 mt-4">Signal Lost</h2>
        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed font-light">
          The coordinates you entered do not correspond to any known sector in this system.
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-widest text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 rounded-xl bg-primary-500 text-white font-bold uppercase tracking-widest text-xs hover:bg-primary-600 shadow-lg shadow-primary-500/20 transition-all"
          >
            Return Home
          </button>
        </div>
      </div>
    </div>
  );
};
