
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false); // State for Reset Password Mode
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [secretKey, setSecretKey] = useState(''); // New Secret Key Field

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsLoading(false);
      setPassword('');
      setPasswordConfirm('');
      setSecretKey('');
    }
  }, [isOpen, isRegister, isReset]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isReset) {
         // Reset Password Flow
         await apiService.resetPasswordBySecret(email, password, secretKey);
         // After reset, switch to login
         setIsReset(false);
         setSecretKey('');
         setPassword('');
         // Success message handled by api toast or we can set error/success state
      } else if (isRegister) {
        if (password !== passwordConfirm) {
           throw new Error(t.login.passwordMismatch);
        }
        await apiService.register(name, email, password, passwordConfirm);
        const user = await apiService.getCurrentUser();
        onLoginSuccess(user);
        onClose();
      } else {
        await apiService.login(email, password);
        const user = await apiService.getCurrentUser();
        onLoginSuccess(user);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.login.error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRegister = () => {
    setIsRegister(!isRegister);
    setIsReset(false);
    setError('');
  };

  const toggleReset = () => {
    setIsReset(!isReset);
    setIsRegister(false);
    setError('');
  };

  // Determine Title & Subtitle based on mode
  let title = t.login.welcome;
  let subtitle = t.login.subtitle;
  if (isRegister) {
    title = t.login.welcomeRegister;
    subtitle = t.login.subtitleRegister;
  } else if (isReset) {
    title = t.login.welcomeReset;
    subtitle = t.login.subtitleReset;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal Card - Adaptive Light/Dark Theme */}
      <div className="relative bg-white dark:bg-[#050914] border border-slate-200 dark:border-primary-500/30 rounded-3xl w-full max-w-md p-8 animate-fade-in shadow-2xl dark:shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden transition-colors duration-300">
        
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[50px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-600/10 rounded-full blur-[50px] pointer-events-none"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 transition-colors z-10"
        >
          <i className="fas fa-times"></i>
        </button>
        
        <div className="mb-8 text-center relative z-10">
          <div className="inline-block mb-4 p-3 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-400">
             <i className={`fas ${isReset ? 'fa-key' : 'fa-fingerprint'} text-xl`}></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-primary-50 font-display tracking-wide">
            {title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-mono">
            {subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-sm rounded-xl text-center font-mono">
              <i className="fas fa-exclamation-triangle mr-2"></i>{error}
            </div>
          )}
          
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">{t.login.name}</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono text-sm"
                placeholder="Ident: John Doe"
                required={isRegister}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">{t.login.email}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono text-sm"
              placeholder="link@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
              {isReset ? t.login.newPassword : t.login.password}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">{t.login.confirmPassword}</label>
              <input 
                type="password" 
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono text-sm"
                placeholder="••••••••"
                required={isRegister}
              />
            </div>
          )}

          {isReset && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">{t.login.secretKey}</label>
              <input 
                type="password" 
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0f1e] border border-red-200 dark:border-red-900/50 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono text-sm"
                placeholder="Secret Protocol Key"
                required={isReset}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-primary-500 dark:bg-primary-500 text-white dark:text-black rounded-xl font-bold uppercase tracking-widest hover:bg-primary-600 dark:hover:bg-primary-400 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading 
              ? <i className="fas fa-circle-notch fa-spin"></i> 
              : (isReset ? t.login.reset : (isRegister ? t.login.register : t.login.signin))
            }
          </button>
        </form>
        
        <div className="mt-8 flex flex-col items-center gap-3 relative z-10 border-t border-slate-100 dark:border-white/5 pt-4 text-xs font-medium uppercase tracking-wider">
          {!isReset && (
            <button 
              onClick={toggleRegister}
              className="text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {isRegister ? t.login.toLogin : t.login.toRegister}
            </button>
          )}

          {!isRegister && (
            <button 
              onClick={toggleReset}
              className="text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              {isReset ? t.login.backToLogin : t.login.forgotPassword}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
