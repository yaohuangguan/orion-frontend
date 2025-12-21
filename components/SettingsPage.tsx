
import React from 'react';
import { Theme, Language } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface SettingsPageProps {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  toggleLanguage: () => void;
}

// Using flagcdn for stable, high-quality flag assets
const getFlagUrl = (code: string) => `https://flagcdn.com/w40/${code}.png`;

const LANGUAGES: { code: Language; label: string; flags: string[] }[] = [
  { code: 'en', label: 'English', flags: ['us', 'gb'] },
  { code: 'zh', label: '简体中文', flags: ['cn'] },
  { code: 'zh-HK', label: '繁體中文', flags: ['hk'] },
  { code: 'fr', label: 'Français', flags: ['fr'] },
  { code: 'ja', label: '日本語', flags: ['jp'] },
  { code: 'ru', label: 'Русский', flags: ['ru'] },
  { code: 'de', label: 'Deutsch', flags: ['de'] },
  { code: 'es', label: 'Español', flags: ['es'] },
];

export const SettingsPage: React.FC<SettingsPageProps> = ({ theme, toggleTheme, language, toggleLanguage }) => {
  const { t, setLanguage } = useTranslation();
  const isDark = theme === Theme.DARK;

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-4xl animate-fade-in relative z-10">
      <div className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
        <h1 className="text-4xl font-display font-bold text-slate-900 dark:text-white mb-2">
          {t.settings.title}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          {t.settings.subtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Theme Setting */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg hover:border-amber-500/30 transition-colors group h-fit">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl">
              <i className="fas fa-palette"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.settings.theme}</h3>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={() => !isDark && toggleTheme()}
              disabled={isDark}
              className={`flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${isDark ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
              <i className="fas fa-moon text-2xl"></i>
              <span className="text-xs font-bold uppercase tracking-wider">{t.settings.dark}</span>
              {isDark && <i className="fas fa-check-circle text-amber-500 mt-1"></i>}
            </button>
            <button 
              onClick={() => isDark && toggleTheme()}
              disabled={!isDark}
              className={`flex-1 py-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${!isDark ? 'border-amber-500 bg-amber-500/10 text-amber-600' : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
            >
               <i className="fas fa-sun text-2xl"></i>
               <span className="text-xs font-bold uppercase tracking-wider">{t.settings.light}</span>
               {!isDark && <i className="fas fa-check-circle text-amber-600 mt-1"></i>}
            </button>
          </div>
        </div>

        {/* Language Setting - Expanded Grid for 8 languages */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-lg hover:border-amber-500/30 transition-colors group md:col-span-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl">
              <i className="fas fa-language"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t.settings.language}</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {LANGUAGES.map((lang) => (
              <button 
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`py-4 px-2 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${language === lang.code ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
              >
                <div className="flex -space-x-2">
                   {lang.flags.map(f => (
                      <img 
                        key={f}
                        src={getFlagUrl(f)} 
                        className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-slate-900 shadow-sm" 
                        alt={f}
                      />
                   ))}
                </div>
                <span className="text-sm font-bold text-center leading-tight mt-1">{lang.label}</span>
                {language === lang.code && <i className="fas fa-check-circle text-blue-500 text-xs mt-1"></i>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
