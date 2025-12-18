
import React from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';

export const NewYearTheme: React.FC = () => {
  const { language } = useTranslation();

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-[#450a0a] via-[#7f1d1d] to-[#9a3412]">
       {/* Decorative Pattern Overlay */}
       <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/oriental-tiles.png')] mix-blend-overlay"></div>

       {/* Background Watermarks (Lanterns & Firecrackers) */}
       <div className="absolute top-[10%] left-[5%] text-[15rem] opacity-[0.05] rotate-12 select-none">
          🧨
       </div>
       <div className="absolute bottom-[10%] right-[5%] text-[15rem] opacity-[0.05] -rotate-12 select-none">
          🏮
       </div>
       <div className="absolute top-[40%] left-[20%] text-[10rem] opacity-[0.03] rotate-45 select-none">
          🧧
       </div>

       {/* "Happy New Year" Engraved Text */}
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center z-0 pointer-events-none">
          <h1 className="text-[12vw] font-display font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-500/20 to-amber-900/5 uppercase tracking-widest leading-none drop-shadow-sm select-none">
             {language === 'zh' ? (
                <>新年<br/>快乐</>
             ) : (
                <>Happy<br/>New Year</>
             )}
          </h1>
       </div>

       {/* Hanging Lanterns (Top) */}
       <div className="absolute top-0 left-[10%] text-6xl md:text-8xl select-none filter drop-shadow-2xl origin-top animate-[swing_6s_ease-in-out_infinite]">
          🏮
       </div>
       <div className="absolute top-0 left-[25%] text-4xl md:text-6xl select-none filter drop-shadow-xl origin-top opacity-90 animate-[swing_7s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}>
          🏮
       </div>
       <div className="absolute top-0 right-[10%] text-6xl md:text-8xl select-none filter drop-shadow-2xl origin-top animate-[swing_6s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}>
          🏮
       </div>
       <div className="absolute top-0 right-[25%] text-4xl md:text-6xl select-none filter drop-shadow-xl origin-top opacity-90 animate-[swing_7s_ease-in-out_infinite]" style={{ animationDelay: '3s' }}>
          🏮
       </div>

       {/* Hanging Firecrackers (Sides) */}
       <div className="absolute top-[15%] left-4 md:left-12 text-5xl md:text-7xl select-none rotate-12 opacity-90 filter drop-shadow-lg">
          🧨
       </div>
       <div className="absolute top-[15%] right-4 md:right-12 text-5xl md:text-7xl select-none -rotate-12 opacity-90 filter drop-shadow-lg">
          🧨
       </div>

       {/* Bottom Decoration - Floating Gold/Red Elements */}
       <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent"></div>
       <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-12 opacity-80">
          <span className="text-6xl animate-bounce" style={{ animationDuration: '3s' }}>🧧</span>
          <span className="text-6xl animate-bounce" style={{ animationDuration: '4s' }}>💰</span>
          <span className="text-6xl animate-bounce" style={{ animationDuration: '3.5s' }}>🧧</span>
       </div>
    </div>
  );
};
