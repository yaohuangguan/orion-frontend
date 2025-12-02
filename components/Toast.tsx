import React, { useState, useEffect } from 'react';

export const toast = {
  success: (msg: string) => window.dispatchEvent(new CustomEvent('sys_toast', { detail: { type: 'success', msg } })),
  error: (msg: string) => window.dispatchEvent(new CustomEvent('sys_toast', { detail: { type: 'error', msg } })),
  info: (msg: string) => window.dispatchEvent(new CustomEvent('sys_toast', { detail: { type: 'info', msg } })),
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<{id: number, type: string, msg: string}[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, ...detail }]);
      
      // Auto dismiss
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 4000);
    };
    
    window.addEventListener('sys_toast', handler);
    return () => window.removeEventListener('sys_toast', handler);
  }, []);

  return (
    <div className="fixed top-24 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div 
          key={t.id} 
          className={`pointer-events-auto min-w-[300px] max-w-sm px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-xl animate-fade-in flex items-center gap-4 transition-all hover:scale-105 ${
            t.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white shadow-emerald-500/20' :
            t.type === 'error' ? 'bg-rose-500/90 border-rose-400 text-white shadow-rose-500/20' :
            'bg-slate-800/90 border-slate-600 text-slate-100 shadow-slate-900/20'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            t.type === 'success' ? 'bg-emerald-400/20' : 
            t.type === 'error' ? 'bg-rose-400/20' : 
            'bg-slate-700'
          }`}>
            <i className={`fas ${
              t.type === 'success' ? 'fa-check' : 
              t.type === 'error' ? 'fa-bomb' : 
              'fa-info'
            } text-sm`}></i>
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">
              {t.type === 'error' ? 'System Error' : t.type === 'success' ? 'Success' : 'Notice'}
            </p>
            <p className="text-sm font-medium leading-tight">{t.msg}</p>
          </div>
        </div>
      ))}
    </div>
  );
};