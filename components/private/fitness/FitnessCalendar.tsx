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
  const [filterMode, setFilterMode] = React.useState<'workout' | 'supplements' | 'water'>(
    'workout'
  );

  // --- HOLIDAY & SOLAR TERM UTILS ---
  const getSolarTermDate = (year: number, termIndex: number): number => {
    const C_VALUES = [
      5.4055, 20.12, 3.87, 18.73, 5.63, 20.646, 4.81, 20.1, 5.52, 21.04, 5.678, 21.37, 7.108, 22.83,
      7.5, 23.13, 7.646, 23.042, 8.318, 23.438, 7.438, 22.36, 7.18, 21.94
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
    2024: '02-10',
    2025: '01-29',
    2026: '02-17',
    2027: '02-06',
    2028: '01-26',
    2029: '02-13',
    2030: '02-03',
    2031: '01-23',
    2032: '02-11',
    2033: '01-31',
    2034: '02-19',
    2035: '02-08',
    2036: '01-28',
    2037: '02-15',
    2038: '02-04',
    2039: '01-24',
    2040: '02-12',
    2041: '02-01',
    2042: '01-22',
    2043: '02-10',
    2044: '01-30',
    2045: '02-17',
    2046: '02-06',
    2047: '01-26',
    2048: '02-14',
    2049: '02-02',
    2050: '01-23'
  };

  const getSpecialDayName = (year: number, month: number, day: number) => {
    const m = month + 1;
    const key = `${m}-${day}`;

    const dateKey = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
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
      cells.push(
        <div
          key={`pad-${i}`}
          className="h-24 md:h-56 bg-white/20 rounded-xl border border-white/10 hidden md:block"
        ></div>
      );
      // Empty placeholder for mobile grid to keep alignment
      cells.push(<div key={`pad-m-${i}`} className="aspect-square bg-transparent md:hidden"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const localDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
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
          className={`
            relative flex flex-col transition-all duration-200 border text-left group overflow-hidden
            md:h-56 md:rounded-2xl md:p-3
            aspect-square md:aspect-auto rounded-xl p-1.5 
            ${
              isSelected
                ? 'bg-rose-500 text-white border-rose-500 shadow-xl scale-[1.02] z-20 ring-2 md:ring-4 ring-rose-200'
                : isToday
                  ? 'bg-white border-rose-300 text-rose-600 shadow-md ring-1 md:ring-2 ring-rose-100'
                  : 'bg-white/80 hover:bg-white border-white text-slate-600 shadow-sm hover:shadow-md'
            }`}
        >
          {/* Header Row */}
          <div className="flex justify-between items-start w-full md:mb-3 md:pb-2 md:border-b md:border-black/5 relative h-full md:h-auto">
            <div className="flex flex-col items-center md:items-start w-full md:w-auto">
              <span
                className={`text-sm md:text-xl font-bold font-display ${isSelected ? 'text-white' : 'text-slate-800'}`}
              >
                {d}
              </span>
              {holiday && (
                <span
                  className={`text-[8px] md:text-[10px] whitespace-nowrap font-bold px-1 py-0.5 md:px-1.5 md:py-0.5 rounded-full mt-0.5 md:mt-1 truncate max-w-full text-center ${
                    holiday === '春节' || holiday === 'Spring Festival' || holiday === 'CNY'
                      ? 'bg-red-600 text-white shadow-sm'
                      : isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-100 text-rose-600'
                  }`}
                >
                  {holiday}
                </span>
              )}

              {/* Mobile Indicators */}
              <div className="flex md:hidden gap-1 flex-wrap justify-center mt-auto w-full pb-1">
                {hasData && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-rose-400'}`}
                  ></div>
                )}
                {hasPhotos && (
                  <div
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-yellow-300' : 'bg-amber-400'}`}
                  ></div>
                )}
              </div>
            </div>

            {/* Desktop Indicators */}
            <div className="hidden md:flex gap-2 items-start">
              {/* Contextual Icons based on Filter Mode */}
              {filterMode === 'supplements' &&
                dayRecords.some((r) => r.supplements?.protein || r.supplements?.vitamins) && (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected ? 'text-emerald-200' : 'text-emerald-500'}`}
                    title="Supplements Taken"
                  >
                    <i className="fas fa-pills text-sm"></i>
                  </div>
                )}

              {hasData && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onShowSummary(cellDate);
                  }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'text-white/80 hover:bg-white/20' : 'text-slate-400 hover:text-rose-500 hover:bg-rose-50'}`}
                  title="View Summary"
                >
                  <i className="fas fa-info-circle text-sm"></i>
                </div>
              )}
              {hasPhotos && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenGallery(localDateStr, dayPhotos);
                  }}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${isSelected ? 'text-amber-300' : 'text-amber-500'} drop-shadow-md`}
                  title={t.privateSpace.fitness.photoWall.view}
                >
                  <i className="fas fa-star text-sm animate-pulse"></i>
                </div>
              )}
            </div>
          </div>

          {/* Desktop Content List */}
          <div className="hidden md:flex flex-col gap-2 w-full flex-1 overflow-y-auto custom-scrollbar pr-1">
            {dayRecords.length > 0 ? (
              dayRecords.map((r, idx) => {
                const u = r.user as User;
                const avatarUrl = u?.photoURL;
                const name = u?.displayName || 'U';

                // --- CONTENT AGGREGATION ---
                // Use fixed content but dynamic highlighting
                const isDone = r.workout?.isDone;
                const workoutDuration = r.workout?.duration; // mins
                const hasSupplements = r.supplements?.protein || r.supplements?.vitamins;
                const water = r.diet?.water || 0;
                const weight = r.body?.weight;

                // Highlighting Logic
                let isHighlighed = false;
                let accentColor = 'border-slate-200';
                let statusIcon = null;

                if (filterMode === 'workout') {
                  isHighlighed = !!isDone;
                  accentColor = isDone ? 'border-emerald-400' : 'border-slate-200';
                  if (isDone)
                    statusIcon = (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] border border-white">
                        <i className="fas fa-check"></i>
                      </div>
                    );
                } else if (filterMode === 'supplements') {
                  isHighlighed = !!hasSupplements;
                  accentColor = hasSupplements ? 'border-emerald-400' : 'border-slate-200';
                  if (hasSupplements)
                    statusIcon = (
                      <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] border border-white">
                        <i className="fas fa-check"></i>
                      </div>
                    );
                } else if (filterMode === 'water') {
                  isHighlighed = water > 0;
                  const isTargetMet = water >= 1000;
                  accentColor = isTargetMet
                    ? 'border-blue-400'
                    : water > 0
                      ? 'border-red-400'
                      : 'border-slate-200';
                  if (isHighlighed) {
                    statusIcon = isTargetMet ? (
                      <div className="absolute -bottom-1 -right-1 bg-blue-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] border border-white">
                        <i className="fas fa-check"></i>
                      </div>
                    ) : (
                      <div className="absolute -bottom-1 -right-1 bg-red-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] border border-white">
                        <i className="fas fa-exclamation"></i>
                      </div>
                    );
                  }
                }

                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-2 rounded-xl transition-all ${isSelected ? 'bg-white/10' : 'bg-slate-50 border border-slate-100 hover:border-rose-200'}`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`w-8 h-8 rounded-full overflow-hidden border-2 ${accentColor} p-0.5 bg-white`}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex items-center justify-center w-full h-full font-bold bg-slate-200 rounded-full text-[10px]">
                            {name[0]}
                          </span>
                        )}
                      </div>
                      {statusIcon}
                    </div>

                    {/* UNIFIED CONTENT DISPLAY */}
                    <div className="flex flex-col min-w-0 flex-1 gap-1.5">
                      {/* Workout Line */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isDone ? (
                          <>
                            {workoutDuration && (
                              <span
                                className={`text-[9px] font-bold ${isSelected ? 'text-white' : 'text-slate-700'}`}
                              >
                                {workoutDuration}m
                              </span>
                            )}
                            {r.workout?.types &&
                              r.workout.types.length > 0 &&
                              r.workout.types.slice(0, 2).map((typeKey) => (
                                <span
                                  key={typeKey}
                                  className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-600'}`}
                                >
                                  {t.privateSpace.fitness.workout.types[
                                    typeKey as keyof typeof t.privateSpace.fitness.workout.types
                                  ] || typeKey}
                                </span>
                              ))}
                          </>
                        ) : (
                          <span
                            className={`text-[9px] italic ${isSelected ? 'text-white/50' : 'text-slate-400'}`}
                          >
                            Rest
                          </span>
                        )}
                      </div>

                      {/* Stats Line: Water | Weight | Supplements */}
                      <div
                        className={`flex items-center gap-2 text-[9px] font-mono flex-wrap ${isSelected ? 'text-white/80' : 'text-slate-500'}`}
                      >
                        {/* Water */}
                        {water > 0 && (
                          <span
                            className={`flex items-center gap-1 ${filterMode === 'water' && water < 1000 ? 'text-red-400 font-bold' : ''}`}
                          >
                            <i className="fas fa-tint text-[8px]"></i> {water}ml
                          </span>
                        )}

                        {/* Weight */}
                        {weight && (
                          <span className="flex items-center gap-1">
                            <i className="fas fa-weight text-[8px]"></i> {weight}kg
                          </span>
                        )}

                        {/* Supplements */}
                        {hasSupplements && (
                          <div className="flex items-center gap-1">
                            {r.supplements?.protein && (
                              <i
                                className="fas fa-prescription-bottle text-[8px] text-emerald-500"
                                title="Protein"
                              ></i>
                            )}
                            {r.supplements?.vitamins && (
                              <i
                                className="fas fa-capsules text-[8px] text-orange-400"
                                title="Vitamins"
                              ></i>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div
                className={`mt-auto text-xs text-center w-full opacity-50 py-4 ${isSelected ? 'text-white' : 'text-slate-400'}`}
              >
                {t.privateSpace.fitness.calendar.noActivity}
              </div>
            )}
          </div>
        </button>
      );
    }
    return cells;
  }, [viewDate, currentDate, monthRecords, t, language, filterMode]);

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-4 md:p-6 shadow-xl border border-white/50">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <h2 className="text-xl md:text-2xl font-display font-bold text-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
            <i className="fas fa-calendar-alt text-lg md:text-xl"></i>
          </div>
          {viewDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
        </h2>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* Filter Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl flex">
            <button
              onClick={() => setFilterMode('workout')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'workout' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.privateSpace.fitness.calendar.viewMode.workout}
            </button>
            <button
              onClick={() => setFilterMode('supplements')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'supplements' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.privateSpace.fitness.calendar.viewMode.supplements}
            </button>
            <button
              onClick={() => setFilterMode('water')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterMode === 'water' ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t.privateSpace.fitness.calendar.viewMode.water}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onPrevMonth}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              onClick={onNextMonth}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm"
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {(t.privateSpace.fitness.calendar.weekdays as string[]).map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 md:mb-2"
          >
            {d}
          </div>
        ))}
        {calendarCells}
      </div>
    </div>
  );
};
