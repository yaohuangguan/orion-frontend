
import React, { useRef, useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { PageView, User } from '../types';

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
       <div className="absolute top-4 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-slate-400">N</div>
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs font-mono font-bold text-slate-400">S</div>
       <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">W</div>
       <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">E</div>

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

export const ResumeView: React.FC<ResumeViewProps> = ({ onNavigate, currentUser, onLoginRequest }) => {
  const { t } = useTranslation();

  const handleChatClick = () => {
    if (currentUser) {
      onNavigate(PageView.CHAT);
    } else {
      onLoginRequest();
    }
  };

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
           <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold"><i className="fas fa-map-marker-alt text-amber-500"></i> {t.resume.basedIn}</span>
           <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold"><i className="fas fa-code text-amber-500"></i> Full Stack</span>
           <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold"><i className="fas fa-chart-line text-amber-500"></i> Trader</span>
        </div>
      </div>

      {/* 2. Site Introduction / Features Grid (REDESIGNED BENTO GRID) */}
      <div className="mb-24 relative">
         {/* Section Header */}
         <div className="flex items-center gap-4 mb-10">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            <div className="px-4 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 backdrop-blur-sm">
               <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">{t.resume.siteIntro.title}</h2>
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
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.resume.siteIntro.journalTitle}</h3>
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
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.resume.siteIntro.profileTitle}</h3>
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
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{t.resume.siteIntro.chatTitle}</h3>
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
        </div>

        <div className="space-y-12 order-1 md:order-2 flex flex-col justify-center">
          <section>
             <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Contact</h2>
             <div className="flex flex-col gap-4">
                <a href="mailto:719919153@qq.com" className="group flex items-center gap-4 text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/30">
                   <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <i className="fas fa-envelope text-sm"></i>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Email</span>
                      <span className="text-sm font-mono font-bold">719919153@qq.com</span>
                   </div>
                </a>
                <a href="https://github.com/yaohuangguan" target="_blank" rel="noreferrer" className="group flex items-center gap-4 text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/30">
                   <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-white transition-colors">
                      <i className="fab fa-github text-sm"></i>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">GitHub</span>
                      <span className="text-sm font-mono font-bold">github.com/yaohuangguan</span>
                   </div>
                </a>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
};
