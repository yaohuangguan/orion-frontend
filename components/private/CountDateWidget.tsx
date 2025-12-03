



import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

export type TabType = 'JOURNAL' | 'LEISURE' | 'GALLERY' | 'FITNESS';

interface CountDateWidgetProps {
  fromDate: string;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const CountDateWidget: React.FC<CountDateWidgetProps> = ({ fromDate, activeTab, onTabChange }) => {
  const [timeLeft, setTimeLeft] = useState({
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [showSurprise, setShowSurprise] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(fromDate).getTime();
      const now = new Date().getTime();
      const diff = now - start;

      // Logic for Years/Days
      const oneYear = 1000 * 60 * 60 * 24 * 365.25;
      const oneDay = 1000 * 60 * 60 * 24;
      const oneHour = 1000 * 60 * 60;
      const oneMinute = 1000 * 60;

      const years = Math.floor(diff / oneYear);
      const remainingTimeAfterYears = diff % oneYear;
      const days = Math.floor(remainingTimeAfterYears / oneDay);
      const remainingTimeAfterDays = remainingTimeAfterYears % oneDay;
      const hours = Math.floor(remainingTimeAfterDays / oneHour);
      const minutes = Math.floor((remainingTimeAfterDays % oneHour) / oneMinute);
      const seconds = Math.floor((remainingTimeAfterDays % oneMinute) / 1000);

      setTimeLeft({ years, days, hours, minutes, seconds });
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [fromDate]);

  const handleSurprise = () => {
    setShowSurprise(true);
    setTimeout(() => setShowSurprise(false), 3000);
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'JOURNAL': return 'fa-heart';
      case 'LEISURE': return 'fa-gamepad';
      case 'GALLERY': return 'fa-camera-retro';
      case 'FITNESS': return 'fa-dumbbell';
      default: return 'fa-star';
    }
  };

  return (
    <div className="w-full rounded-3xl bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 p-2 text-white shadow-lg shadow-pink-200 relative overflow-hidden group transition-all duration-300">
      {/* Decorative Elements */}
      <div className="absolute -top-6 -right-6 text-8xl text-white opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700">❤</div>
      <div className="absolute bottom-[-10px] left-10 text-6xl text-white opacity-10">❤</div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-2 md:px-6 py-2 gap-4">
        
        {/* Left: Together Counter */}
        <div className="flex items-center gap-4 shrink-0">
          <div 
             className="flex flex-col items-start cursor-pointer group/title"
             onClick={handleSurprise}
          >
             <span className="text-[10px] uppercase opacity-80 tracking-widest">{t.privateSpace.together}</span>
             <h3 className="text-lg md:text-xl font-bold font-display text-white transition-all">
                {showSurprise 
                  ? t.privateSpace.loveMsg 
                  : (
                    <span>
                      {timeLeft.years} <span className="text-sm font-normal opacity-80">{t.privateSpace.years}</span> 
                      &nbsp;{timeLeft.days} <span className="text-sm font-normal opacity-80">{t.privateSpace.days}</span>
                    </span>
                  )
                }
             </h3>
          </div>
          <div className="h-8 w-px bg-white/30 hidden sm:block"></div>
          <div className="hidden sm:flex items-baseline gap-2 font-mono text-sm opacity-90">
             <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
             <span>:</span>
             <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
             <span>:</span>
             <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
          </div>
        </div>

        {/* Center/Right: Navigation Tabs (Integrated) */}
        <div className="flex items-center bg-black/10 backdrop-blur-sm rounded-full p-1 overflow-x-auto max-w-full custom-scrollbar">
           {(['JOURNAL', 'GALLERY', 'LEISURE', 'FITNESS'] as TabType[]).map((tab) => {
             const isActive = activeTab === tab;
             return (
               <button
                 key={tab}
                 onClick={() => onTabChange(tab)}
                 className={`relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                   isActive 
                     ? 'bg-white text-rose-500 shadow-sm' 
                     : 'text-white/80 hover:bg-white/10 hover:text-white'
                 }`}
               >
                 <i className={`fas ${getTabIcon(tab)} text-[10px]`}></i>
                 <span className="hidden sm:inline">{t.privateSpace.tabs[tab.toLowerCase() as keyof typeof t.privateSpace.tabs]}</span>
               </button>
             );
           })}
        </div>
      </div>
    </div>
  );
};