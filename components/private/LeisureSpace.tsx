
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { PeriodTrackerWidget } from './leisure/PeriodTrackerWidget';
import { AIChef } from './leisure/AIChef';
import { PirateLordsGame } from './leisure/PirateLordsGame';

export const LeisureSpace: React.FC = () => {
  const { t } = useTranslation();
  const [leftWidth, setLeftWidth] = useState(50); 
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isXl, setIsXl] = useState(false);
  
  // Screen Size Detection
  useEffect(() => {
    const checkSize = () => setIsXl(window.innerWidth >= 1280);
    checkSize();
    window.addEventListener('resize', checkSize);
    return () => window.removeEventListener('resize', checkSize);
  }, []);

  // Resizing Logic
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      let newPercent = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      newPercent = Math.max(30, Math.min(70, newPercent));
      setLeftWidth(newPercent);
    };

    const handleUp = () => {
      setIsDragging(false);
      document.body.style.cursor = 'default';
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      document.body.style.cursor = 'col-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging]);

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  return (
    <div 
      ref={containerRef} 
      className={`flex flex-col xl:flex-row gap-6 xl:gap-0 h-full lg:overflow-hidden min-h-[600px] overflow-y-auto ${isDragging ? 'select-none cursor-col-resize' : ''}`}
    >
      
      {/* LEFT COLUMN: Mahjong Soul Iframe */}
      <div 
         className="h-[600px] xl:h-full bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-700 shadow-2xl relative order-1 shrink-0"
         style={{ width: isXl ? `${leftWidth}%` : '100%' }}
      >
         {isDragging && <div className="absolute inset-0 z-50 bg-transparent"></div>}

         <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse"></div>
            {t.privateSpace.leisure.mahjong}
         </div>
         <iframe 
           src="https://game.maj-soul.com/" 
           className="w-full h-full border-0"
           allowFullScreen
           title="Mahjong Soul"
         />
      </div>

      {/* RESIZER HANDLE (Desktop Only) */}
      <div 
         className="hidden xl:flex w-6 bg-transparent hover:bg-slate-800/50 cursor-col-resize items-center justify-center z-20 order-2 shrink-0 transition-colors group -ml-3 -mr-3 relative mx-2"
         onMouseDown={startDrag}
         style={{ width: '24px' }}
      >
         <div className="w-1.5 h-16 bg-slate-700 rounded-full group-hover:bg-amber-500 transition-colors shadow-lg"></div>
         
         <div className="absolute bottom-1/2 translate-y-1/2 left-8 bg-slate-800 text-slate-200 text-[10px] px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-slate-700 pointer-events-none z-50 font-bold uppercase tracking-wider">
            <i className="fas fa-arrows-alt-h mr-1"></i> Drag to Resize
         </div>
      </div>

      {/* RIGHT COLUMN: Scrollable Tools */}
      <div 
        className="flex flex-col gap-6 h-full overflow-y-auto custom-scrollbar xl:pl-2 pb-20 order-3 flex-1 min-w-0"
      >
         {/* Top Row: AI Chef & Period Tracker */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* AI Chef Replacement */}
            <div className="h-[480px]">
               <AIChef />
            </div>

            {/* Period Tracker */}
            <div className="h-[480px]">
               <PeriodTrackerWidget />
            </div>
         </div>

         {/* Bottom: Full Width Pirate Lords */}
         <div className="w-full">
            <PirateLordsGame />
         </div>

      </div>
    </div>
  );
};
