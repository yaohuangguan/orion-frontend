
import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface HeroProps {
  onCtaClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCtaClick }) => {
  const { t } = useTranslation();

  return (
    <section className="relative pt-40 pb-24 md:pt-60 md:pb-48 overflow-hidden min-h-[90vh] flex items-center justify-center">
      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl">
        
        {/* HUD-style Status Badge - Gold Theme */}
        <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full border border-amber-500/20 bg-slate-900/5 dark:bg-black/40 backdrop-blur-md mb-12 animate-fade-in group cursor-default shadow-[0_0_15px_rgba(245,158,11,0.1)]">
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </div>
          <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-500/80 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
            {t.hero.status}
          </span>
        </div>

        {/* Main Title - Always on the road */}
        <h1 className="font-display font-bold text-6xl md:text-8xl lg:text-9xl tracking-tighter text-slate-900 dark:text-white mb-10 leading-[0.9] animate-slide-up drop-shadow-2xl">
          <span className="block text-slate-900 dark:text-slate-100">{t.hero.title1}</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-amber-200 dark:via-amber-500 dark:to-amber-700 animate-gradient-x pb-2">
            {t.hero.title2}
          </span>
        </h1>

        <div className="w-24 h-1 bg-amber-500/50 mx-auto mb-10 rounded-full blur-[1px]"></div>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-14 max-w-2xl mx-auto leading-relaxed animate-slide-up font-light tracking-wide" style={{ animationDelay: '0.1s' }}>
          {t.hero.introPrefix}
          <strong className="text-slate-900 dark:text-white font-semibold relative inline-block mx-1">
            {t.hero.introName}
            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-amber-500/50"></span>
          </strong>
          {t.hero.introSuffix}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button 
            onClick={onCtaClick}
            className="group relative w-full sm:w-auto px-10 py-5 bg-amber-500 text-black font-bold text-sm uppercase tracking-[0.15em] transition-all hover:bg-amber-400 hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] clip-path-polygon"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t.hero.ctaPrimary} <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </span>
          </button>
          
          <button 
            onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
            className="w-full sm:w-auto px-10 py-5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm uppercase tracking-[0.15em] hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:border-amber-500/30 transition-all backdrop-blur-sm"
          >
            {t.hero.ctaSecondary}
          </button>
        </div>
      </div>
    </section>
  );
};
