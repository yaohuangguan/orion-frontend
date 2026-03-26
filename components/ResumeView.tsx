import React, { useRef, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { PageView, User } from '../types';
import { createPortal } from 'react-dom';

// --- Star Compass Component ---
const StarCompass = () => {
  const [rotation, setRotation] = useState(0);
  const compassRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!compassRef.current) return;
    const rect = compassRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate angle in radians
    const radians = Math.atan2(e.clientX - centerX, -(e.clientY - centerY));
    // Convert to degrees
    const degree = radians * (180 / Math.PI);
    setRotation(degree);
  };

  return (
    <div
      ref={compassRef}
      onMouseMove={handleMouseMove}
      className="relative w-64 h-64 md:w-80 md:h-80 mx-auto group cursor-crosshair"
    >
      {/* Outer Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-800 opacity-50 group-hover:opacity-100 transition-opacity"></div>
      <div className="absolute inset-2 rounded-full border border-dashed border-amber-500/30 group-hover:border-amber-500/60 transition-colors animate-[spin_60s_linear_infinite]"></div>

      {/* Labels */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-slate-400">
        N
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-slate-400">
        S
      </div>
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
        W
      </div>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
        E
      </div>

      {/* Rotating Needle Container */}
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-100 ease-out"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {/* Needle */}
        <div className="relative w-8 h-full">
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[60px] border-b-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[60px] border-t-slate-300 dark:border-t-slate-700"></div>
          {/* Center Cap */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-slate-900 dark:bg-white rounded-full border-2 border-amber-500 z-10"></div>
        </div>
      </div>

      {/* Hover Label */}
      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-mono text-amber-500 uppercase tracking-widest whitespace-nowrap">
        Interstellar Compass
      </div>
    </div>
  );
};

interface ResumeViewProps {
  onNavigate: (page: PageView) => void;
  currentUser: User | null;
  onLoginRequest: () => void;
}

export const ResumeView: React.FC<ResumeViewProps> = ({
  onNavigate,
  currentUser,
  onLoginRequest
}) => {
  const { t } = useTranslation();
  const [showSpecs, setShowSpecs] = useState(false);

  const handleChatClick = () => {
    if (currentUser) {
      onNavigate(PageView.CHAT);
    } else {
      onLoginRequest();
    }
  };

  const sections = t.resume.websiteIntro.sections as any;

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-5xl animate-fade-in relative z-10">
      {/* 1. Header & Identity */}
      <div className="mb-20 text-center">
        <div className="inline-block p-4 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 mb-8 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
          <i className="fas fa-user-astronaut text-4xl text-white"></i>
        </div>
        <h1 className="text-6xl md:text-7xl font-display font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
          Sam <span className="text-amber-500">Yao</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-light max-w-3xl mx-auto leading-relaxed mb-4">
          {t.resume.bio}
        </p>
        <p className="text-sm font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-3xl mx-auto">
          {t.resume.credentials}
        </p>

        <div className="flex justify-center gap-6 mt-8 text-slate-400">
          <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
            <i className="fas fa-map-marker-alt text-amber-500"></i> {t.resume.basedIn}
          </span>
          <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
            <i className="fas fa-code text-amber-500"></i> Full Stack
          </span>
          <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
            <i className="fas fa-chart-line text-amber-500"></i> Trader
          </span>
        </div>
      </div>

      {/* 2. Site Introduction / Features Grid (REDESIGNED BENTO GRID) */}
      <div className="mb-24 relative">
        {/* Section Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
          <div className="px-4 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm">
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {t.resume.siteIntro.title}
            </h2>
          </div>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CARD 1: JOURNAL (Large) */}
          <div
            onClick={() => onNavigate(PageView.BLOG)}
            className="md:col-span-1 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <i className="fas fa-book-open text-9xl text-amber-500"></i>
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shadow-lg shadow-amber-500/20 mb-6">
                <i className="fas fa-pen-nib"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t.resume.siteIntro.journalTitle}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                {t.resume.siteIntro.journalDesc}
              </p>
              <div className="mt-auto flex items-center text-amber-600 dark:text-amber-400 font-bold text-sm uppercase tracking-wider group-hover:gap-2 transition-all">
                <span>Read Logs</span> <i className="fas fa-arrow-right ml-2"></i>
              </div>
            </div>
          </div>

          {/* CARD 2: PROFILE/RESUME PAGE LINK (Center Feature) - Updated to new PageView.RESUME */}
          <div
            onClick={() => onNavigate(PageView.RESUME)}
            className="md:col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute bottom-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <i className="fas fa-archive text-9xl text-blue-500"></i>
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-xl shadow-lg shadow-blue-500/20 mb-6">
                <i className="fas fa-history"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t.resume.siteIntro.profileTitle}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                {t.resume.siteIntro.profileDesc}
              </p>
              <div className="mt-auto flex items-center text-blue-600 dark:text-blue-400 font-bold text-sm uppercase tracking-wider group-hover:gap-2 transition-all">
                <span>Access Archives</span> <i className="fas fa-arrow-right ml-2"></i>
              </div>
            </div>
          </div>

          {/* CARD 3: STAR COMM (Compact) */}
          <div
            onClick={handleChatClick}
            className="md:col-span-1 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-900 dark:to-slate-800 rounded-[2rem] p-8 border border-slate-200 dark:border-slate-700/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 group-hover:opacity-10 transition-opacity">
              <i className="fas fa-satellite-dish text-[12rem] text-purple-500"></i>
            </div>
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-14 h-14 rounded-2xl bg-purple-500 text-white flex items-center justify-center text-xl shadow-lg shadow-purple-500/20 mb-6">
                <i className="fas fa-comments"></i>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                {t.resume.siteIntro.chatTitle}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-8">
                {t.resume.siteIntro.chatDesc}
              </p>
              <div className="mt-auto flex items-center text-purple-600 dark:text-purple-400 font-bold text-sm uppercase tracking-wider group-hover:gap-2 transition-all">
                <span>Initialize Link</span> <i className="fas fa-arrow-right ml-2"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Replaced Section: Star Compass & Contact */}
      <div className="grid md:grid-cols-2 gap-12 border-t border-slate-200 dark:border-slate-800 pt-20">
        <div className="flex flex-col items-center justify-center order-2 md:order-1">
          <StarCompass />

          {/* Orion Explanation */}
          <div className="mt-12 text-center max-w-md mx-auto bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-3xl p-8 border border-amber-500/10 shadow-xl">
            <div className="mb-4">
              <h3 className="text-3xl font-display font-bold text-slate-900 dark:text-white uppercase tracking-widest inline-block border-b-2 border-amber-500 pb-1">
                Orion
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-2">/əˈraɪən/</p>
            </div>

            <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 font-light leading-relaxed">
              <p>
                <strong className="text-amber-600 dark:text-amber-500">Or</strong>{' '}
                {t.resume.orion.etymology1} +{' '}
                <strong className="text-amber-600 dark:text-amber-500">Orion</strong>{' '}
                {t.resume.orion.etymology2}
              </p>
              <p className="opacity-90">{t.resume.orion.description}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-900 dark:text-white">
                {t.resume.orion.slogan}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-12 order-1 md:order-2 flex flex-col justify-center">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              Contact
            </h2>
            <div className="flex flex-col gap-4">
              <a
                href="mailto:moviegoer24@gmail.com"
                className="group flex items-center gap-4 text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/30"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <i className="fas fa-envelope text-sm"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Email
                  </span>
                  <span className="text-sm font-mono font-bold">moviegoer24@gmail.com</span>
                </div>
              </a>
              <a
                href="https://github.com/yaohuangguan"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/30"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                  <i className="fab fa-github text-sm"></i>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    GitHub
                  </span>
                  <span className="text-sm font-mono font-bold">github.com/yaohuangguan</span>
                </div>
              </a>
            </div>
          </section>

          {/* New Website Introduction Section */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">
              {t.resume.websiteIntro.title}
            </h2>
            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-base text-slate-600 dark:text-slate-300 leading-relaxed font-light mb-6">
                {t.resume.websiteIntro.description}
              </p>
              <button
                onClick={() => setShowSpecs(true)}
                className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500 dark:hover:border-amber-500 transition-all flex items-center gap-2 group"
              >
                <i className="fas fa-sitemap group-hover:animate-pulse"></i>
                {t.resume.websiteIntro.viewSpecs}
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* System Specs Modal */}
      {showSpecs &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#0f172a] w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setShowSpecs(false)}
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 flex items-center justify-center transition-colors z-20"
              >
                <i className="fas fa-times text-lg"></i>
              </button>

              <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
                  {t.resume.websiteIntro.modalTitle}
                </h2>
                <p className="text-sm text-slate-500 font-mono mt-2 uppercase tracking-wider">
                  Architecture & Capabilities
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-white dark:bg-[#0f172a]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Public Sector */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center text-xl shadow-sm">
                        <i className="fas fa-globe"></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                          {sections.public.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {sections.public.desc}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {sections.public.features.map((feat: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                        >
                          <i className="fas fa-check text-blue-500 mt-1"></i>
                          <span dangerouslySetInnerHTML={{ __html: feat }} />
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Private Space */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center text-xl shadow-sm">
                        <i className="fas fa-user-secret"></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                          {sections.private.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {sections.private.desc}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {sections.private.features.map((feat: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                        >
                          <i className="fas fa-lock text-rose-500 mt-1"></i>
                          <span dangerouslySetInnerHTML={{ __html: feat }} />
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Admin */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center text-xl shadow-sm">
                        <i className="fas fa-cogs"></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                          {sections.admin.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {sections.admin.desc}
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {sections.admin.features.map((feat: string, i: number) => (
                        <li
                          key={i}
                          className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300"
                        >
                          <i className="fas fa-shield-alt text-slate-500 mt-1"></i>
                          <span dangerouslySetInnerHTML={{ __html: feat }} />
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center text-xl shadow-sm">
                        <i className="fas fa-layer-group"></i>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                          {sections.stack.title}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Core Technologies
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {sections.stack.list.map((tech: string, i: number) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
