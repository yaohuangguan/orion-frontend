import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ProjectShowcase } from '../components/profile/ProjectShowcase';
import { ResumeDocument } from '../components/profile/ResumeDocument';
import { useTranslation } from '../i18n/LanguageContext';
import { User } from '../types';

interface PortfolioPageProps {
  currentUser?: User | null;
}

type PortfolioTab = 'APPS' | 'RESUME';

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ currentUser }) => {
  const { language } = useTranslation();
  const [searchParams] = useSearchParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab: PortfolioTab =
    pathname.endsWith('/experience') || searchParams.get('tab') === 'resume' ? 'RESUME' : 'APPS';

  const handleTabChange = (tab: PortfolioTab) => {
    navigate(tab === 'RESUME' ? '/profile/experience' : '/profile');
  };

  return (
    <section
      className={`container relative z-10 mx-auto min-h-screen px-4 pb-24 pt-28 transition-all duration-500 sm:px-6 ${activeTab === 'APPS' ? 'max-w-[1500px]' : 'max-w-6xl'}`}
    >
      <Helmet>
        <title>{activeTab === 'APPS' ? 'Apps by Sam' : 'Experience | Sam Yao'}</title>
        <meta
          name="description"
          content="Selected full-stack, web and mobile products by Sam Yao, with a concise professional background."
        />
      </Helmet>

      <header className="relative mb-9 overflow-hidden rounded-[2.5rem] border border-primary-100/70 bg-white/72 px-6 py-7 shadow-[0_30px_100px_-65px_rgba(30,27,75,.6)] backdrop-blur-2xl dark:border-primary-400/15 dark:bg-slate-950/65 dark:shadow-[0_30px_100px_-58px_rgba(0,0,0,.95)] sm:px-9 sm:py-9">
        <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-primary-300/16 blur-3xl dark:bg-primary-400/10" />
        <div
          className="pointer-events-none absolute bottom-0 right-10 hidden h-24 w-40 opacity-30 sm:block"
          aria-hidden="true"
        >
          <span className="absolute bottom-8 right-0 h-px w-32 bg-gradient-to-l from-primary-500 to-transparent" />
          <span className="absolute bottom-4 right-12 h-px w-20 bg-gradient-to-l from-primary-400 to-transparent" />
          <span className="absolute bottom-6 right-6 h-2 w-2 rotate-45 border border-primary-500" />
        </div>

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-3 font-mono text-[10px] font-black uppercase tracking-[.3em] text-primary-600 dark:text-primary-400">
              <span className="h-px w-8 bg-primary-500" />
              {activeTab === 'APPS' ? 'Orion App Directory' : 'Background / Selected experience'}
            </div>
            <h1 className="font-display text-4xl font-black tracking-[-.045em] text-slate-950 dark:text-white sm:text-6xl">
              {activeTab === 'APPS'
                ? language === 'zh'
                  ? '我做的产品，欢迎直接体验。'
                  : 'Products made to be used.'
                : language === 'zh'
                  ? '经历与能力'
                  : 'Experience & craft'}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-400 sm:text-base">
              {activeTab === 'APPS'
                ? language === 'zh'
                  ? '从日常工具到完整系统，记录我把想法做成产品的过程。'
                  : 'A working collection of products you can open, try, and inspect beyond the screenshots.'
                : language === 'zh'
                  ? '关于我的工程经历、技能与教育背景。'
                  : 'A record of my engineering experience, skills, and education.'}
            </p>
          </div>

          <nav
            className="flex w-fit items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900/80"
            aria-label="Profile sections"
          >
            <button
              type="button"
              onClick={() => handleTabChange('APPS')}
              aria-current={activeTab === 'APPS' ? 'page' : undefined}
              className={`rounded-full px-5 py-2.5 text-xs font-bold transition-all ${activeTab === 'APPS' ? 'bg-primary-500 text-white shadow-md shadow-primary-500/20 dark:text-slate-950' : 'text-slate-600 hover:text-primary-600 dark:text-slate-400 dark:hover:text-primary-300'}`}
            >
              <i className="fas fa-table-cells-large mr-2" />
              {language === 'zh' ? 'Apps' : 'Apps'}
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('RESUME')}
              aria-current={activeTab === 'RESUME' ? 'page' : undefined}
              className={`rounded-full px-4 py-2.5 text-[11px] font-semibold transition-all ${activeTab === 'RESUME' ? 'bg-slate-900 text-white dark:bg-primary-500 dark:text-slate-950' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
            >
              {language === 'zh' ? '经历' : 'Experience'}
            </button>
          </nav>
        </div>
      </header>

      <div className="animate-slide-up">
        {activeTab === 'APPS' ? (
          <ProjectShowcase currentUser={currentUser} />
        ) : (
          <ResumeDocument currentUser={currentUser} />
        )}
      </div>
    </section>
  );
};
