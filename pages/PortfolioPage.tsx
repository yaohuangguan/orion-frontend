import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ProjectShowcase } from '../components/profile/ProjectShowcase';
import { ResumeDocument } from '../components/profile/ResumeDocument';
import { CANONICAL_RESUME_PDF_PATH } from '../components/profile/canonicalResume';
import { useTranslation } from '../i18n/LanguageContext';
import { User } from '../types';

interface PortfolioPageProps {
  currentUser?: User | null;
}
type PortfolioTab = 'RESUME' | 'PROJECTS';

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ currentUser }) => {
  const { t, language } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab: PortfolioTab = searchParams.get('tab') === 'projects' ? 'PROJECTS' : 'RESUME';
  const resumeRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({ contentRef: resumeRef, documentTitle: 'Sam_Yao_Resume' });

  const handleTabChange = (tab: PortfolioTab) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('tab', tab.toLowerCase());
      next.delete('demo');
      return next;
    });
  };

  const tabs = [
    {
      value: 'RESUME' as const,
      icon: 'fa-file-lines',
      label: t.portfolio.resume,
      hint: language === 'zh' ? '经历与能力' : 'Experience & craft'
    },
    {
      value: 'PROJECTS' as const,
      icon: 'fa-table-cells-large',
      label: t.portfolio.projects,
      hint: language === 'zh' ? '产品与实验' : 'Products & experiments'
    }
  ];

  return (
    <main
      className={`container relative z-10 mx-auto min-h-screen px-4 pb-24 pt-28 transition-all duration-500 sm:px-6 ${activeTab === 'PROJECTS' ? 'max-w-[1500px]' : 'max-w-6xl'}`}
    >
      <Helmet>
        <title>Orion Portfolio | Sam Yao</title>
        <meta
          name="description"
          content="Sam Yao's software engineering resume and selected full-stack, web and mobile products."
        />
      </Helmet>

      <header className="relative mb-8 overflow-hidden rounded-[2.25rem] border border-violet-100/80 bg-white/70 p-6 shadow-[0_28px_90px_-55px_rgba(76,29,149,.45)] backdrop-blur-2xl dark:border-amber-400/15 dark:bg-slate-950/65 dark:shadow-[0_28px_100px_-55px_rgba(0,0,0,.95)] md:p-9">
        <div className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full bg-violet-300/20 blur-3xl dark:bg-amber-400/10"></div>
        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-3 font-mono text-[10px] font-black uppercase tracking-[.32em] text-violet-600 dark:text-amber-400">
              Orion / Sam Yao
            </p>
            <h1 className="font-display text-4xl font-black tracking-[-.04em] text-slate-950 dark:text-white sm:text-6xl">
              {activeTab === 'RESUME'
                ? language === 'zh'
                  ? '工程履历'
                  : 'Engineering profile'
                : language === 'zh'
                  ? '作品档案'
                  : 'Selected work'}
            </h1>
            <p className="mt-3 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-400">
              {activeTab === 'RESUME'
                ? language === 'zh'
                  ? '五年以上全栈工程经验，从产品需求、架构设计一路负责到生产交付。'
                  : 'Five-plus years building and owning full-stack products, from product requirements and architecture through production delivery.'
                : language === 'zh'
                  ? '能打开、能体验、能看见技术取舍的真实产品。'
                  : 'Live products you can open, explore, and inspect beyond the screenshots.'}
            </p>
          </div>

          {activeTab === 'RESUME' && (
            <div className="flex flex-wrap gap-2">
              {currentUser && (
                <button
                  type="button"
                  onClick={() => handlePrint()}
                  className="rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-violet-500/20 transition hover:-translate-y-0.5 dark:bg-amber-400 dark:text-slate-950"
                >
                  <i className="fas fa-print mr-2"></i>Export PDF
                </button>
              )}
              <a
                href={CANONICAL_RESUME_PDF_PATH}
                download="Sam_Yao_CV_SE.pdf"
                className="rounded-xl border border-violet-100 bg-white/80 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-violet-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-amber-400/40"
              >
                <i className="fas fa-download mr-2 text-violet-500 dark:text-amber-400"></i>Latest
                CV
              </a>
            </div>
          )}
        </div>
      </header>

      <nav
        className="mb-9 grid grid-cols-2 gap-2 rounded-[1.4rem] border border-violet-100/80 bg-white/65 p-1.5 shadow-sm backdrop-blur-xl dark:border-amber-400/10 dark:bg-slate-950/60"
        aria-label="Portfolio sections"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => handleTabChange(tab.value)}
            aria-current={activeTab === tab.value ? 'page' : undefined}
            className={`group flex items-center justify-center gap-3 rounded-2xl px-4 py-3 text-left transition-all ${activeTab === tab.value ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20 dark:bg-amber-400 dark:text-slate-950 dark:shadow-amber-500/20' : 'text-slate-500 hover:bg-violet-50 hover:text-violet-700 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-amber-300'}`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${activeTab === tab.value ? 'bg-white/15' : 'bg-violet-100/70 dark:bg-slate-800'}`}
            >
              <i className={`fas ${tab.icon}`}></i>
            </span>
            <span>
              <strong className="block text-sm">{tab.label}</strong>
              <small className="hidden opacity-90 sm:block">{tab.hint}</small>
            </span>
          </button>
        ))}
      </nav>

      <div className="animate-slide-up">
        {activeTab === 'RESUME' ? (
          <ResumeDocument ref={resumeRef} currentUser={currentUser} />
        ) : (
          <ProjectShowcase currentUser={currentUser} />
        )}
      </div>
    </main>
  );
};
