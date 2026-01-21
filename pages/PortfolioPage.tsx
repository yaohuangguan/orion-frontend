import React, { useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useSearchParams } from 'react-router-dom';
import { ProjectShowcase } from '../components/profile/ProjectShowcase';
import { ResumeDocument } from '../components/profile/ResumeDocument';
import { useTranslation } from '../i18n/LanguageContext';
import { User } from '../types';
import { Helmet } from 'react-helmet-async';

interface PortfolioPageProps {
  currentUser?: User | null;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ currentUser }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Derived state from URL, default to 'RESUME' (About Me)
  const activeTabRaw = searchParams.get('tab');
  const activeTab = activeTabRaw === 'projects' ? 'PROJECTS' : 'RESUME';

  const handleTabChange = (tab: 'PROJECTS' | 'RESUME') => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('tab', tab.toLowerCase());
      // Clean up demo param when switching tabs to avoid confusion
      newParams.delete('demo');
      return newParams;
    });
  };

  const resumeRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: resumeRef,
    documentTitle: `Resume - ${currentUser?.displayName || 'Profile'}`
  });

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-6xl animate-fade-in relative z-10 min-h-screen">
      <Helmet>
        <title>Orion App Store | Sam's Engineering Portfolio | 工程项目与作品集</title>
        <meta
          name="description"
          content="A curated collection of Sam's engineering projects and professional history. Sam的个人工程项目展示与职业履历归档。"
        />
      </Helmet>

      {/* Page Header */}
      <div className="text-center mb-16 relative">
        {activeTab === 'RESUME' && currentUser?.role === 'super_admin' && (
          <button
            onClick={() => handlePrint()}
            className="hidden md:flex absolute top-0 right-0 items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full font-bold text-sm hover:opacity-90 transition-opacity shadow-lg"
          >
            <i className="fas fa-file-pdf"></i>
            <span>Export PDF</span>
          </button>
        )}
        <h1 className="text-5xl md:text-7xl font-display font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
          {t.portfolio.title}
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl mx-auto">
          {t.portfolio.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center mb-16">
        <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-1.5 rounded-full border border-slate-200 dark:border-slate-800 inline-flex shadow-sm">
          <button
            onClick={() => handleTabChange('RESUME')}
            className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'RESUME'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.portfolio.resume}
          </button>
          <button
            onClick={() => handleTabChange('PROJECTS')}
            className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'PROJECTS'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.portfolio.projects}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="animate-slide-up">
        {activeTab === 'RESUME' && <ResumeDocument ref={resumeRef} currentUser={currentUser} />}
        {activeTab === 'PROJECTS' && <ProjectShowcase currentUser={currentUser} />}
      </div>
    </div>
  );
};
