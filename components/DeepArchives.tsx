import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';

interface DeepArchivesProps {
  onBack: () => void;
}

export const DeepArchives: React.FC<DeepArchivesProps> = ({ onBack }) => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-5xl animate-fade-in relative z-10">
      <button
        onClick={onBack}
        className="group mb-12 flex items-center text-sm font-bold text-slate-500 hover:text-amber-600 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur flex items-center justify-center mr-3 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/20 transition-colors shadow-sm border border-slate-200 dark:border-slate-700">
          <i className="fas fa-arrow-left text-xs transition-transform group-hover:-translate-x-1"></i>
        </div>
        Return to Bridge
      </button>

      <div className="mb-20">
        <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 mb-8 border border-slate-200 dark:border-slate-700 shadow-lg">
          <i className="fas fa-archive text-4xl text-slate-700 dark:text-slate-300"></i>
        </div>
        <h1 className="text-5xl md:text-6xl font-display font-bold text-slate-900 dark:text-white mb-6">
          Deep Archives
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 font-light max-w-2xl leading-relaxed">
          Classified mission logs and operational history. Accessing secure data...
        </p>
      </div>

      <div className="space-y-12 relative border-l-2 border-slate-200 dark:border-slate-800 ml-4 md:ml-10 pl-8 md:pl-16 pb-20">
        {t.resume.jobs.map((job, idx) => (
          <div key={idx} className="relative group">
            {/* Timeline Node */}
            <span
              className={`absolute -left-[41px] md:-left-[73px] top-0 w-5 h-5 md:w-6 md:h-6 rounded-full border-4 border-white dark:border-slate-950 shadow-lg transition-transform group-hover:scale-125 z-10 ${job.color}`}
            ></span>

            {/* Content Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl hover:shadow-2xl hover:border-amber-500/30 transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{job.company}</h3>
                <span
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white ${job.color} bg-opacity-90 shadow-md w-fit`}
                >
                  {job.role}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                {job.description}
              </p>

              <div className="mt-6 flex items-center gap-4 opacity-50 text-sm font-mono text-slate-500">
                <span>
                  <i className="fas fa-database mr-2"></i>Mission Log #{4000 - idx * 100}
                </span>
                <span>
                  <i className="fas fa-check-circle mr-2"></i>Complete
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* End Node */}
        <div className="absolute -left-[9px] md:-left-[9px] bottom-0 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-700"></div>
      </div>
    </div>
  );
};
