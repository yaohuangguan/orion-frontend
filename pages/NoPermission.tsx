import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AccessRestricted } from '../components/AccessRestricted';

export const NoPermission: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-slate-50 dark:bg-[#0b0f17]">
      <div className="max-w-lg w-full relative z-10 pt-20">
        <AccessRestricted
          permission="CLASSIFIED_SECTOR"
          className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl shadow-2xl border-red-200 dark:border-red-900/30"
        />
        <div className="mt-8">
          <button
            onClick={() => navigate('/')}
            className="text-slate-500 hover:text-primary-500 transition-colors text-sm font-mono uppercase tracking-widest flex items-center justify-center gap-2 mx-auto"
          >
            <i className="fas fa-home"></i> Return to Bridge
          </button>
        </div>
      </div>
    </div>
  );
};
