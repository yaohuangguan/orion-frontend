import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue?: string) => void;
  title?: string;
  // New props for custom confirmation logic
  confirmKeyword?: string;
  isSecret?: boolean;
  message?: string;
  buttonText?: string;
  requireInput?: boolean;
  zIndexClass?: string;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmKeyword,
  isSecret = false,
  message,
  buttonText,
  requireInput = true,
  zIndexClass = 'z-[100]'
}) => {
  const [inputValue, setInputValue] = useState('');
  const { t, language } = useTranslation();

  // Dynamic keyword based on language (default), or use provided keyword
  const DEFAULT_KEYWORD = language === 'zh' ? '确认' : 'confirm';
  const TARGET_KEYWORD = confirmKeyword || DEFAULT_KEYWORD;

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    // If it is a secret (private deletion), we trust the user input and let backend handle validation
    // Otherwise, we strictly enforce the keyword match (e.g. typing "confirm")
    if (isSecret) {
      if (inputValue.trim().length > 0) {
        onConfirm(inputValue);
      }
    } else if (requireInput) {
      if (inputValue === TARGET_KEYWORD) {
        onConfirm();
      }
    } else {
      // Simple confirmation without input
      onConfirm();
    }
  };

  const isButtonDisabled = isSecret
    ? inputValue.trim().length === 0
    : requireInput
      ? inputValue !== TARGET_KEYWORD
      : false;

  return (
    <div className={`fixed inset-0 flex items-center justify-center p-4 ${zIndexClass}`}>
      {/* Dark backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-[#050914] border border-slate-200 dark:border-red-500/30 rounded-2xl w-full max-w-sm p-6 animate-fade-in shadow-2xl dark:shadow-[0_0_30px_rgba(239,68,68,0.2)] overflow-hidden transition-colors duration-300">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none"></div>

        <div className="relative z-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10 text-red-500 mb-4 border border-red-100 dark:border-red-500/20">
            <i className="fas fa-exclamation-triangle"></i>
          </div>

          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            {title || t.delete.confirmTitle}
          </h3>

          {message ? (
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 whitespace-pre-line">
              {message}
            </p>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              {t.delete.confirmMessage} <br />
              {requireInput && (
                <span className="font-mono font-bold text-red-500 dark:text-red-400 select-all bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded mt-1 inline-block">
                  {TARGET_KEYWORD}
                </span>
              )}
            </p>
          )}

          {/* Conditional Input */}
          {(requireInput || isSecret) && (
            <input
              type={isSecret ? 'password' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white text-center focus:border-red-500 focus:ring-1 focus:ring-red-500/50 outline-none mb-6 placeholder-slate-400 dark:placeholder-slate-600 font-mono transition-colors"
              placeholder={
                isSecret ? (language === 'zh' ? '输入密钥' : 'Enter Secret Key') : TARGET_KEYWORD
              }
              autoFocus
            />
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg font-medium transition-colors text-sm"
            >
              {t.comments.cancel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={isButtonDisabled}
              className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20"
            >
              {buttonText || t.delete.button}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
