
import React, { useMemo } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { FitnessRecord, User } from '../../../types';

interface FitnessCalendarProps {
  viewDate: Date;
  currentDate: Date;
  monthRecords: Map<string, FitnessRecord[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (day: number) => void;
  onOpenGallery: (dateStr: string, photos: string[]) => void;
  onShowSummary: (date: Date) => void;
}

export const FitnessCalendar: React.FC<FitnessCalendarProps> = ({
  viewDate,
  currentDate,
  monthRecords,
  onPrevMonth,
  onNextMonth,
  onDateClick,
  onOpenGallery,
  onShowSummary
}) => {
  const { t, language } = useTranslation();

  // --- HOLIDAY & SOLAR TERM UTILS ---
  const getSolarTermDate = (year: number, termIndex: number): number => {
    const C_VALUES = [
      5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37,
      7.108, 22.83, 7.5, 23.13, 7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94
    ];
    const y = year % 100;
    const day = Math.floor(y * 0.2422 + C_VALUES[termIndex]) - Math.floor(y / 4);
    return day;
  };

  const toLocalDateStr = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const CNY_DATES: Record<number, string> = {
    2024: '02-10', 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26',
    2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31',
    2034: '02-19', 2035: '02-08', 2036: '01-28', 2037: '02-15', 2038: '02-04',
    2039: '01-24', 2040: '02-12', 2041: '02-01', 2042: '01-22', 2043: '02-10',
    2044: '01-30', 2045: '02-17', 2046: '02-06', 2047: '01-26', 2048: '02-14',
    2049: '02-02', 2050: '01-23'
  };

  const getSpecialDayName = (year: number, month: number, day: number) => {
    const m = month + 1;
    const key = `${m}-${day}`;
    
    const dateKey = `${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if (CNY_DATES[year] === dateKey) {
        return language === 'zh' ? '春节' : 'Spring Festival';
    }

    const holidays = t.privateSpace.fitness.calendar.holidays as Record<string, string>;
    if (holidays[key]) return holidays[key];

    const termIndex1 = month * 2;
    const termIndex2 = month * 2 + 1;
    const date1 = getSolarTermDate(year, termIndex1);
    const date2 = getSolarTermDate(year, termIndex2);
    
    const terms = t.privateSpace.fitness.calendar.terms as string[];
    if (day === date1) return terms[termIndex1];
    if (day === date2) return terms[termIndex2];
    
    return null;
  };

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];
    
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`pad-${i}`} className="h-48 md:h-56 bg-white/20 rounded-xl border border-white/10"></div>);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
      const localDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const cellDate = new Date(year, month, d);
      const isSelected = toLocalDateStr(currentDate) === localDateStr;
      const isToday = toLocalDateStr(new Date()) === localDateStr;
      const dayRecords = monthRecords.get(localDateStr) || [];
      const holiday = getSpecialDayName(year, month, d);
      
      const dayPhotos = dayRecords.reduce((acc: string[], r) => [...acc, ...(r.photos || [])], []);
      const hasPhotos = dayPhotos.length > 0;
      const hasData = dayRecords.length > 0;

      cells.push(
        <button
          key={d}
          onClick={() => onDateClick(d)}
          className={`h-48 md:h-56 rounded-2xl flex flex-col p-3 relative transition-all duration-200 border text-left group overflow-hidden ${
            isSelected 
              ? 'bg-rose-500 text-white border-rose-500 shadow-xl scale-[1.02] z-20 ring-4 ring-rose-200' 
              : isToday
                ? 'bg-white border-rose-300 text-rose-600 shadow-md ring-2 ring-rose-100'
                : 'bg-white/80 hover:bg-white border-white text-slate-600 shadow-sm hover:shadow-md'
          }`}
        >
          <div className="flex justify-between items-start w-full mb-3 pb-2 border-b border-black/5 relative">
             <div className="flex flex-col">
                <span className={`text-lg md:text-xl font-bold font-display ${isSelected ? 'text-white' : 'text-slate-800'}`}>{d}</span>
                {holiday && (
                  <span className={`text-[10px] whitespace-nowrap font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                    holiday === '春节' || holiday === 'Spring Festival' || holiday === 'CNY'
                        ? 'bg-red-600 text-white shadow-sm'
                        : isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
                  }`}>
                    {holiday}
                  </span>
                )}
             </div>

             <div className="flex gap-2 items-start">
               {hasData && (
                  <div
                     onClick={(e) => { e.stopPropagation(); onShowSummary(cellDate); }}
                     className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'text-white/80 hover:bg-white/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                     title="View Summary"
                  >
                     <i className="fas fa-info-circle text-sm"></i>
                  </div>
               )}
               {hasPhotos && (
                  <div 
                     onClick={(e) => { e.stopPropagation(); onOpenGallery(localDateStr, dayPhotos); }}
                     className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'text-amber-300' : 'text-amber-500'} drop-shadow-md`}
                     title={t.privateSpace.fitness.photoWall.view}
                  >
                     <i className="fas fa-star text-sm animate-pulse"></i>
                  </div>
               )}
             </div>
          </div>

          <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto custom-scrollbar pr-1">
             {dayRecords.length > 0 ? (
                dayRecords.map((r, idx) => {
                   const u = r.user as User;
                   const avatarUrl = u?.photoURL;
                   const name = u?.displayName || 'U';
                   const isDone = r.workout?.isDone;
                   return (
                      <div key={idx} className={`flex items-start gap-3 p-2 rounded-xl transition-all ${isSelected ? 'bg-white/10' : 'bg-slate-50 border border-slate-100 hover:border-rose-200'}`}>
                         <div className="relative shrink-0">
                            <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${isDone ? 'border-emerald-400' : 'border-slate-200'} p-0.5 bg-white`}>
                               {avatarUrl ? <img src={avatarUrl} className="w-full h-full rounded-full object-cover"/> : <span className="flex items-center justify-center w-full h-full font-bold bg-slate-200 rounded-full text-[10px]">{name[0]}</span>}
                            </div>
                            {isDone && <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] border border-white"><i className="fas fa-check"></i></div>}
                         </div>
                         <div className="flex flex-col min-w-0 flex-1 gap-1">
                            <div className="flex flex-wrap gap-1">
                               {r.workout?.types && r.workout.types.length > 0 ? (
                                  r.workout.types.slice(0,2).map(typeKey => (
                                    <span key={typeKey} className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                       {t.privateSpace.fitness.workout.types[typeKey as keyof typeof t.privateSpace.fitness.workout.types] || typeKey}
                                    </span>
                                  ))
                               ) : <span className={`text-[9px] italic ${isSelected ? 'text-white/50' : 'text-slate-400'}`}>Rest</span>}
                            </div>
                            <div className={`flex items-center gap-2 text-[9px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                               {r.diet?.water && <span className="flex items-center gap-1"><i className="fas fa-tint text-[8px]"></i> {r.diet.water}</span>}
                               {r.body?.weight && <span className="flex items-center gap-1"><i className="fas fa-weight text-[8px]"></i> {r.body.weight}</span>}
                            </div>
                         </div>
                      </div>
                   );
                })
             ) : <div className={`mt-auto text-xs text-center w-full opacity-50 py-4 ${isSelected ? 'text-white' : 'text-slate-400'}`}>{t.privateSpace.fitness.calendar.noActivity}</div>}
          </div>
        </button>
      );
    }
    return cells;
  }, [viewDate, currentDate, monthRecords, t, language]);

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl border border-white/50">
       <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3">
             <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
                <i className="fas fa-calendar-alt text-xl"></i>
             </div>
             {viewDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
          </h2>
          <div className="flex gap-2">
             <button onClick={onPrevMonth} className="w-10 h-10 rounded-full bg-white hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm"><i className="fas fa-chevron-left"></i></button>
             <button onClick={onNextMonth} className="w-10 h-10 rounded-full bg-white hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm"><i className="fas fa-chevron-right"></i></button>
          </div>
       </div>
       
       <div className="grid grid-cols-7 gap-3 md:gap-4">
          {(t.privateSpace.fitness.calendar.weekdays as string[]).map((d,i) => (
             <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{d}</div>
          ))}
          {calendarCells}
       </div>
    </div>
  );
};
