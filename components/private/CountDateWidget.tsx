
import React, { useEffect, useState } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';

export type TabType = 'SECOND_BRAIN' | 'JOURNAL' | 'LEISURE' | 'GALLERY' | 'FITNESS';

interface CountDateWidgetProps {
  fromDate: string;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  holidayType: 'CHRISTMAS' | 'CNY' | null;
  effectsEnabled: boolean;
  onToggleEffects: () => void;
  hasAccess?: boolean; // New Prop for Permission
}

export const CountDateWidget: React.FC<CountDateWidgetProps> = ({ 
  fromDate, 
  activeTab, 
  onTabChange,
  holidayType,
  effectsEnabled,
  onToggleEffects,
  hasAccess = false
}) => {
  const [timeLeft, setTimeLeft] = useState({
    years: 0,
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // For non-VIP: Just show current time
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showSurprise, setShowSurprise] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      setCurrentTime(now);

      if (hasAccess) {
        const start = new Date(fromDate).getTime();
        const diff = now.getTime() - start;

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
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);
    return () => clearInterval(timer);
  }, [fromDate, hasAccess]);

  const handleSurprise = () => {
    setShowSurprise(true);
    setTimeout(() => setShowSurprise(false), 3000);
  };

  const getTabIcon = (tab: TabType) => {
    switch (tab) {
      case 'SECOND_BRAIN': return 'fa-brain';
      case 'JOURNAL': return 'fa-heart';
      case 'LEISURE': return 'fa-gamepad';
      case 'GALLERY': return 'fa-camera-retro';
      case 'FITNESS': return 'fa-dumbbell';
      default: return 'fa-star';
    }
  };

  // --- Dynamic Styling Logic ---
  let containerClass = "w-full rounded-3xl p-2 text-white shadow-lg relative overflow-hidden group transition-all duration-500 ";
  let tabActiveClass = "bg-white text-rose-500 shadow-sm";
  let holidayLabel = "";

  if (holidayType === 'CHRISTMAS') {
      // Elegant Deep Red / Velvet Look
      containerClass += "bg-gradient-to-r from-[#7f1d1d] to-[#991b1b] border-2 border-[#b91c1c] shadow-red-900/50";
      tabActiveClass = "bg-[#fef2f2] text-[#991b1b] shadow-sm font-serif";
      holidayLabel = "Merry Christmas";
  } else if (holidayType === 'CNY') {
      // High-Class China Red & Gold
      containerClass += "bg-gradient-to-r from-[#7f1d1d] via-[#b91c1c] to-[#9a3412] shadow-amber-900/50 border-2 border-[#b45309]";
      tabActiveClass = "bg-[#fffbeb] text-[#9a3412] shadow-sm font-bold border border-amber-200";
      holidayLabel = "Happy New Year";
  } else {
      // Default Pink
      containerClass += "bg-gradient-to-r from-pink-400 via-rose-400 to-pink-400 shadow-pink-200";
  }

  return (
    <div className={containerClass}>
      
      {/* Decorative Text for Holidays */}
      {holidayLabel && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[3rem] md:text-[5rem] opacity-10 font-display font-black pointer-events-none whitespace-nowrap z-0 uppercase tracking-widest text-white mix-blend-overlay select-none">
           {holidayLabel}
        </div>
      )}

      {/* Decorative Icon (Top Right) */}
      <div className="absolute -top-6 -right-6 text-8xl text-white opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-700 z-0">
        {holidayType === 'CHRISTMAS' ? '🎄' : holidayType === 'CNY' ? '🧧' : '❤'}
      </div>
      
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-between px-2 md:px-6 py-2 gap-4">
        
        {/* Left: Together Counter or Clock */}
        <div className="flex items-center gap-4 shrink-0">
          {hasAccess ? (
            <div 
               className="flex flex-col items-start cursor-pointer group/title"
               onClick={handleSurprise}
            >
               <span className="text-[10px] uppercase opacity-80 tracking-widest flex items-center gap-2">
                  {t.privateSpace.together} 
                  {holidayLabel && <span className="bg-white/20 px-1.5 rounded text-[8px] font-bold shadow-sm">{holidayLabel}</span>}
               </span>
               <h3 className="text-lg md:text-xl font-bold font-display text-white transition-all shadow-black/5 drop-shadow-md">
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
          ) : (
            <div className="flex flex-col items-start">
               <span className="text-[10px] uppercase opacity-80 tracking-widest">
                  System Time
               </span>
               <h3 className="text-lg md:text-xl font-bold font-mono text-white transition-all">
                  {currentTime.toLocaleTimeString()}
               </h3>
            </div>
          )}

          {hasAccess && (
            <>
              <div className="h-8 w-px bg-white/30 hidden sm:block"></div>
              <div className="hidden sm:flex items-baseline gap-2 font-mono text-sm opacity-90 text-shadow-sm">
                 <span>{timeLeft.hours.toString().padStart(2, '0')}h</span>
                 <span>:</span>
                 <span>{timeLeft.minutes.toString().padStart(2, '0')}m</span>
                 <span>:</span>
                 <span>{timeLeft.seconds.toString().padStart(2, '0')}s</span>
              </div>
            </>
          )}
        </div>

        {/* Center/Right: Navigation Tabs (Integrated) */}
        <div className="flex items-center gap-3">
            <div className="flex items-center bg-black/10 backdrop-blur-sm rounded-full p-1 overflow-x-auto max-w-full custom-scrollbar">
            {(['SECOND_BRAIN', 'JOURNAL', 'GALLERY', 'LEISURE', 'FITNESS'] as TabType[]).map((tab) => {
                const isActive = activeTab === tab;
                return (
                <button
                    key={tab}
                    onClick={() => onTabChange(tab)}
                    className={`relative px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                    isActive 
                        ? tabActiveClass
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                >
                    <i className={`fas ${getTabIcon(tab)} text-[10px]`}></i>
                    <span className="hidden sm:inline">{t.privateSpace.tabs[tab === 'SECOND_BRAIN' ? 'secondBrain' : tab.toLowerCase() as keyof typeof t.privateSpace.tabs]}</span>
                </button>
                );
            })}
            </div>

            {/* Holiday Toggle Button - Always Visible */}
            <button 
                onClick={onToggleEffects}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    holidayType 
                      ? 'bg-white text-amber-600 shadow-inner hover:scale-110 active:scale-95' 
                      : 'bg-black/20 text-white/50 hover:bg-black/30'
                }`}
                title="Toggle Theme"
            >
               <i className={`fas ${holidayType === 'CHRISTMAS' ? 'fa-tree' : holidayType === 'CNY' ? 'fa-dragon' : 'fa-magic'}`}></i>
            </button>
        </div>
      </div>
    </div>
  );
};
