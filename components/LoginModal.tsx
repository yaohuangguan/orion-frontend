
import React, { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import PhoneInput from 'react-phone-input-2';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

type LoginMethod = 'email' | 'mobile';

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false); 
  
  // Login Tab State
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // Stores raw phone with country code from PhoneInput
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [secretKey, setSecretKey] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  // Location / IP State
  const [defaultCountry, setDefaultCountry] = useState('cn');
  const [isChinaMainland, setIsChinaMainland] = useState(false);

  const { t } = useTranslation();

  // Detect basic location via Timezone on mount
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      // Heuristic: If timezone is Asia/Shanghai or similar, likely in China
      if (tz === 'Asia/Shanghai' || tz === 'Asia/Urumqi' || tz === 'Asia/Chongqing' || tz === 'Asia/Harbin') {
        setDefaultCountry('cn');
        setIsChinaMainland(true);
      } else {
        setDefaultCountry('us'); // Default fallback
        setIsChinaMainland(false);
      }
    } catch (e) {
      // Fallback
      setDefaultCountry('cn');
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setError('');
      setValidationErrors({});
      setIsLoading(false);
      setPassword('');
      setPasswordConfirm('');
      setSecretKey('');
      // Keep name/email/phone potentially to avoid re-typing if they closed accidentally, 
      // or clear them if strict security preferred. Let's clear for safety.
      if (!isRegister) {
         setPhone('');
         setEmail('');
      }
    }
  }, [isOpen, isRegister, isReset]);

  if (!isOpen) return null;

  const validate = () => {
    const errors: Record<string, string> = {};
    
    if (isRegister) {
      if (!name.trim()) errors.name = t.login.name + " is required";
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) errors.email = t.login.email + " is required";
      else if (!emailRegex.test(email)) errors.email = "Invalid email format";

      const pwdRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
      if (!password) errors.password = "Password is required";
      else if (!pwdRegex.test(password)) errors.password = "Min 8 chars, letter & number required";

      if (password !== passwordConfirm) errors.passwordConfirm = t.login.passwordMismatch;

      // Phone Validation Logic for Register
      if (isChinaMainland) {
         // Mandatory if in China
         if (!phone || phone.length < 5) { // Basic check
             errors.phone = "Phone number is required in your region";
         }
      } 
      // If provided (optional elsewhere), check basic length
      if (phone && phone.length < 5) {
         errors.phone = "Invalid phone number";
      }

    } else if (!isReset) {
      // Login Mode
      if (loginMethod === 'email') {
         if (!email.trim()) errors.email = t.login.email + " is required";
      } else {
         if (!phone || phone.length < 5) errors.phone = "Phone number is required";
      }
      
      if (!password) errors.password = "Password is required";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const vErrors = validate();
    if (Object.keys(vErrors).length > 0) {
        setValidationErrors(vErrors);
        return;
    }
    setValidationErrors({});
    setIsLoading(true);

    try {
      if (isReset) {
         await apiService.resetPasswordBySecret(email, password, secretKey);
         setIsReset(false);
         setSecretKey('');
         setPassword('');
      } else if (isRegister) {
        // Register: Email IS mandatory. Phone is optional (unless China).
        // Format phone: PhoneInput returns pure numbers usually or formatted. 
        // We want E.164-ish but usually backend just wants string.
        // react-phone-input-2 usually returns "86138..." (no +). We prepend + for standard.
        const formattedPhone = phone ? `+${phone}` : undefined;
        
        await apiService.register(name, email, password, passwordConfirm, formattedPhone);
        const user = await apiService.getCurrentUser();
        onLoginSuccess(user);
        onClose();
      } else {
        // Login: Determine account identifier based on method
        let accountIdentifier = '';
        if (loginMethod === 'email') {
            accountIdentifier = email;
        } else {
            accountIdentifier = `+${phone}`;
        }

        // We send 'email' field to backend as it handles both email/phone login on same endpoint usually
        await apiService.login(accountIdentifier, password);
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
    setValidationErrors({});
  };

  const toggleReset = () => {
    setIsReset(!isReset);
    setIsRegister(false);
    setError('');
    setValidationErrors({});
  };

  let title = t.login.welcome;
  let subtitle = t.login.subtitle;
  if (isRegister) {
    title = t.login.welcomeRegister;
    subtitle = t.login.subtitleRegister;
  } else if (isReset) {
    title = t.login.welcomeReset;
    subtitle = t.login.subtitleReset;
  }

  // Common Required Asterisk
  const RequiredStar = () => <span className="text-red-500 ml-1">*</span>;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className="relative bg-white dark:bg-[#050914] border border-slate-200 dark:border-primary-500/30 rounded-3xl w-full max-w-md p-8 animate-fade-in shadow-2xl dark:shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-visible transition-colors duration-300">
        
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 mix-blend-overlay pointer-events-none rounded-3xl"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 transition-colors z-20"
        >
          <i className="fas fa-times"></i>
        </button>
        
        {/* Header */}
        <div className="mb-6 text-center relative z-10">
          <div className="inline-block mb-3 p-3 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-400">
             <i className={`fas ${isReset ? 'fa-key' : 'fa-fingerprint'} text-xl`}></i>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-primary-50 font-display tracking-wide">
            {title}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-mono">
            {subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-300 text-sm rounded-xl text-center font-mono">
              <i className="fas fa-exclamation-triangle mr-2"></i>{error}
            </div>
          )}

          {/* Login Tabs - Only show in Login Mode */}
          {!isRegister && !isReset && (
             <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6">
                <button
                   type="button"
                   onClick={() => setLoginMethod('email')}
                   className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${loginMethod === 'email' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600'}`}
                >
                   <i className="fas fa-envelope mr-2"></i> Email
                   {loginMethod === 'email' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 dark:bg-primary-400 rounded-t-full"></span>}
                </button>
                <button
                   type="button"
                   onClick={() => setLoginMethod('mobile')}
                   className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-all relative ${loginMethod === 'mobile' ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 hover:text-slate-600'}`}
                >
                   <i className="fas fa-mobile-alt mr-2"></i> Mobile
                   {loginMethod === 'mobile' && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-500 dark:bg-primary-400 rounded-t-full"></span>}
                </button>
             </div>
          )}
          
          {/* Register Name Field */}
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
                {t.login.name} <RequiredStar />
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono text-sm"
                placeholder="Ident: John Doe"
              />
              {validationErrors.name && <p className="text-red-500 text-[10px] mt-1 pl-1 font-bold">{validationErrors.name}</p>}
            </div>
          )}

          {/* Email Input */}
          {(isRegister || isReset || (loginMethod === 'email')) && (
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
                    {t.login.email} <RequiredStar />
                </label>
                <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono text-sm"
                placeholder="link@example.com"
                />
                {validationErrors.email && <p className="text-red-500 text-[10px] mt-1 pl-1 font-bold">{validationErrors.email}</p>}
            </div>
          )}

          {/* Phone Input (Register or Login-via-Mobile) */}
          {(isRegister || (!isReset && loginMethod === 'mobile')) && (
            <div>
               <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
                  {t.login.phone} 
                  {(loginMethod === 'mobile' || (isRegister && isChinaMainland)) && <RequiredStar />}
                  {isRegister && !isChinaMainland && <span className="opacity-50 font-normal lowercase ml-1">(optional)</span>}
               </label>
               <PhoneInput
                  country={defaultCountry}
                  value={phone}
                  onChange={phone => setPhone(phone)}
                  enableSearch={true}
                  disableSearchIcon={true}
                  inputClass="!w-full !h-[50px] !text-sm !font-mono !bg-slate-50 dark:!bg-[#0a0f1e] !border-slate-200 dark:!border-slate-800 focus:!border-primary-500 !text-slate-900 dark:!text-white !rounded-xl placeholder:!text-slate-400 dark:placeholder:!text-slate-600 transition-all !pl-[48px]"
                  buttonClass="!bg-transparent !border-0 !border-r !border-slate-200 dark:!border-slate-800 !rounded-l-xl"
                  dropdownClass="!bg-white dark:!bg-slate-900 !text-slate-800 dark:!text-slate-200 !border-slate-200 dark:!border-slate-700 !shadow-xl !rounded-lg !mt-1"
                  searchClass="!bg-white dark:!bg-slate-900 !text-slate-800 dark:!text-white !p-2"
               />
               {validationErrors.phone && <p className="text-red-500 text-[10px] mt-1 pl-1 font-bold">{validationErrors.phone}</p>}
            </div>
          )}

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
              {isReset ? t.login.newPassword : t.login.password} <RequiredStar />
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono text-sm"
              placeholder="••••••••"
            />
            {validationErrors.password && <p className="text-red-500 text-[10px] mt-1 pl-1 font-bold">{validationErrors.password}</p>}
          </div>
          
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
                {t.login.confirmPassword} <RequiredStar />
              </label>
              <input 
                type="password" 
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#0a0f1e] border border-slate-200 dark:border-slate-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 font-mono text-sm"
                placeholder="••••••••"
              />
              {validationErrors.passwordConfirm && <p className="text-red-500 text-[10px] mt-1 pl-1 font-bold">{validationErrors.passwordConfirm}</p>}
            </div>
          )}

          {isReset && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 pl-1">
                {t.login.secretKey} <RequiredStar />
              </label>
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
