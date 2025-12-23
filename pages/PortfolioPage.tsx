import React, { useState } from 'react';
import { ProjectShowcase } from '../components/profile/ProjectShowcase';
import { ResumeDocument } from '../components/profile/ResumeDocument';
import { useTranslation } from '../i18n/LanguageContext';
import { User } from '../types';

interface PortfolioPageProps {
  currentUser?: User | null;
}

export const PortfolioPage: React.FC<PortfolioPageProps> = ({ currentUser }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'PROJECTS' | 'RESUME'>('PROJECTS');

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-6xl animate-fade-in relative z-10 min-h-screen">
      {/* Page Header */}
      <div className="text-center mb-16">
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
            onClick={() => setActiveTab('RESUME')}
            className={`px-8 py-3 rounded-full text-sm font-bold uppercase tracking-widest transition-all duration-300 ${
              activeTab === 'RESUME'
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.portfolio.resume}
          </button>
          <button
            onClick={() => setActiveTab('PROJECTS')}
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
        {activeTab === 'RESUME' && <ResumeDocument currentUser={currentUser} />}
        {activeTab === 'PROJECTS' && <ProjectShowcase currentUser={currentUser} />}
      </div>
    </div>
  );
};
