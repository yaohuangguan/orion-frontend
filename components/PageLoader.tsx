
import React from 'react';

export const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4"></div>
    <p className="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Asset...</p>
  </div>
);
