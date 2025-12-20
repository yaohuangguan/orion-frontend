
import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { apiService } from '../services/api';
import { toast } from './Toast';
import { createPortal } from 'react-dom';

interface AccessRestrictedProps {
  permission: string;
  onSuccess?: () => void;
  className?: string;
}

export const AccessRestricted: React.FC<AccessRestrictedProps> = ({ permission, onSuccess, className }) => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setIsSubmitting(true);
    try {
      // Force request for 'admin' role when access is restricted, as per requirements
      // We append the missing permission to the reason for context for the admin reviewing it
      const detailedReason = `[Missing Permission: ${permission}] ${reason}`;
      await apiService.submitRoleRequest('admin', detailedReason);
      
      setIsModalOpen(false);
      if (onSuccess) onSuccess();
    } catch (e) {
      console.error(e);
      // Toast handled by service
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className={`flex flex-col items-center justify-center p-12 text-center h-full min-h-[300px] bg-slate-100/50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 ${className}`}>
        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mb-6 shadow-inner">
           <i className="fas fa-lock text-3xl text-slate-400 dark:text-slate-500"></i>
        </div>
        <h3 className="text-2xl font-display font-bold text-slate-700 dark:text-slate-300 mb-2">
           {t.access.restricted}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
           {t.access.message}
        </p>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-8 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl font-bold uppercase tracking-widest hover:bg-slate-900 dark:hover:bg-slate-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
        >
           Request Admin Access
        </button>
      </div>

      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800 relative">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                 <i className="fas fa-times text-lg"></i>
              </button>

              <div className="text-center mb-6">
                 <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-4">
                    <i className="fas fa-user-shield text-xl"></i>
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">Request Admin Role</h3>
                 <p className="text-sm text-slate-500 mt-2">Access to this area requires elevated privileges.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">Requesting Access For</label>
                    <div className="px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm font-mono text-slate-600 dark:text-slate-300 break-all border border-slate-200 dark:border-slate-700">
                       Admin Role (via {permission})
                    </div>
                 </div>

                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-500 dark:text-slate-400 mb-2">{t.system.requests.reason}</label>
                    <textarea 
                       value={reason}
                       onChange={(e) => setReason(e.target.value)}
                       placeholder={t.access.reasonPlaceholder}
                       className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl p-4 outline-none focus:ring-2 focus:ring-amber-500/50 resize-none h-32 text-slate-800 dark:text-slate-200"
                       required
                    />
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm uppercase hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                       {t.access.cancel}
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting || !reason.trim()}
                      className="flex-1 py-3 rounded-xl bg-amber-500 text-white font-bold text-sm uppercase shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                       {isSubmitting && <i className="fas fa-circle-notch fa-spin"></i>}
                       {t.access.submit}
                    </button>
                 </div>
              </form>
           </div>
        </div>,
        document.body
      )}
    </>
  );
};
