
import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { apiService } from '../../../services/api';
import { PeriodRecord, PeriodResponse } from '../../../types';
import { toast } from '../../Toast';
import { createPortal } from 'react-dom';

const toDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface PeriodTrackerWidgetProps {
  onRefresh?: () => void;
}

export const PeriodTrackerWidget: React.FC<PeriodTrackerWidgetProps> = ({ onRefresh }) => {
  const { t } = useTranslation();
  const [viewDate, setViewDate] = useState(new Date());
  const [data, setData] = useState<PeriodResponse | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [activeRecord, setActiveRecord] = useState<Partial<PeriodRecord>>({});

  // Fetch Data on mount
  const fetchData = async () => {
    try {
      const res = await apiService.getPeriodData();
      setData(res);
    } catch (e) {
      // Quiet fail if API not ready
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleDateClick = (day: number) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const dateStr = toDateStr(clickedDate);
    setSelectedDate(clickedDate);

    // Find existing record covering this date
    const record = data?.records.find(r => {
        if (!r.startDate) return false;
        const start = r.startDate.split('T')[0];
        if (r.endDate) {
            const end = r.endDate.split('T')[0];
            return dateStr >= start && dateStr <= end;
        }
        return dateStr === start;
    });

    if (record) {
       setActiveRecord({ ...record });
    } else {
       setActiveRecord({
          startDate: dateStr,
          flow: 'medium',
          symptoms: []
       });
    }
    setIsModalOpen(true);
  };

  const handleSaveRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRecord.startDate) return;
    
    try {
       await apiService.savePeriodRecord(activeRecord);
       toast.success(t.privateSpace.leisure.cycle.save + " Success");
       setIsModalOpen(false);
       fetchData(); // Refresh calendar
    } catch (e) {
       toast.error("Failed to save");
    }
  };

  const handleDeleteRecord = async () => {
     if (!activeRecord._id) return;
     if (!confirm("Delete this log?")) return;
     try {
        await apiService.deletePeriodRecord(activeRecord._id);
        toast.success("Deleted");
        setIsModalOpen(false);
        fetchData();
     } catch (e) {
        toast.error("Failed to delete");
     }
  };

  const getDayStatus = (year: number, month: number, day: number) => {
     if (!data) return null;
     const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
     
     // 1. Actual Period?
     const actual = data.records.find(r => {
        const start = r.startDate.split('T')[0];
        const end = r.endDate ? r.endDate.split('T')[0] : start; 
        let effectiveEnd = end;
        if (!r.endDate && r.duration) {
            const s = new Date(r.startDate);
            s.setDate(s.getDate() + r.duration - 1);
            effectiveEnd = toDateStr(s);
        }
        return dateStr >= start && dateStr <= effectiveEnd;
     });
     if (actual) return 'ACTUAL';

     // 2. Prediction?
     if (data.prediction) {
        const nextStart = data.prediction.nextPeriodStart.split('T')[0];
        const predictedEnd = new Date(data.prediction.nextPeriodStart);
        predictedEnd.setDate(predictedEnd.getDate() + (data.avgDuration || 5) - 1);
        const nextEnd = toDateStr(predictedEnd);
        
        if (dateStr >= nextStart && dateStr <= nextEnd) return 'PREDICTED';

        const ov = data.prediction.ovulationDate.split('T')[0];
        if (dateStr === ov) return 'OVULATION';

        const fertileStart = data.prediction.fertileWindow.start.split('T')[0];
        const fertileEnd = data.prediction.fertileWindow.end.split('T')[0];
        if (dateStr >= fertileStart && dateStr <= fertileEnd) return 'FERTILE';
     }
     return null;
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const cells = [];

    for (let i = 0; i < firstDay; i++) {
        cells.push(<div key={`pad-${i}`} className="h-8 md:h-10"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const status = getDayStatus(year, month, d);
        const isToday = toDateStr(new Date()) === `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        
        let cellClass = "bg-slate-50 text-slate-600 hover:bg-slate-100";
        let content = <span className="relative z-10">{d}</span>;

        if (status === 'ACTUAL') {
            cellClass = "bg-rose-500 text-white shadow-md shadow-rose-300 font-bold border border-rose-600";
        } else if (status === 'PREDICTED') {
            cellClass = "bg-rose-50 text-rose-500 border-2 border-rose-300 border-dashed font-medium";
        } else if (status === 'OVULATION') {
            cellClass = "bg-purple-500 text-white font-bold shadow-md shadow-purple-300 relative overflow-hidden";
            content = (
                <>
                  <span className="relative z-10">{d}</span>
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                     <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                </>
            );
        } else if (status === 'FERTILE') {
            cellClass = "bg-purple-100 text-purple-700 font-bold border border-purple-200";
        }

        if (isToday) {
            cellClass += " ring-2 ring-amber-400 font-extrabold";
        }

        cells.push(
            <button 
               key={d} 
               onClick={() => handleDateClick(d)}
               className={`h-8 md:h-10 rounded-full flex items-center justify-center text-xs transition-all ${cellClass}`}
            >
               {content}
            </button>
        );
    }
    return cells;
  };

  const daysUntil = useMemo(() => {
     if (!data?.prediction) return null;
     const today = new Date();
     const next = new Date(data.prediction.nextPeriodStart);
     const diff = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
     return diff;
  }, [data]);

  return (
    <div className="bg-white rounded-[2rem] p-6 border-4 border-pink-100 shadow-xl h-full flex flex-col relative overflow-hidden group">
       <div className="absolute -top-10 -right-10 w-40 h-40 bg-pink-50 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
       <div className="flex justify-between items-center mb-4 z-10">
          <div className="flex items-center gap-2 text-rose-500">
             <i className="fas fa-moon text-lg animate-pulse-slow"></i>
             <div>
                <h3 className="font-bold text-sm uppercase tracking-wider leading-none">{t.privateSpace.leisure.cycle.title}</h3>
                {daysUntil !== null && (
                   <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      {t.privateSpace.leisure.cycle.nextPeriod}: {t.privateSpace.leisure.cycle.inDays.replace('{days}', daysUntil.toString())}
                   </p>
                )}
             </div>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
             <button onClick={handlePrevMonth} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-white hover:text-rose-500 rounded-md transition-all"><i className="fas fa-chevron-left text-[10px]"></i></button>
             <span className="text-[10px] font-bold text-slate-600 px-2 flex items-center">
                {viewDate.toLocaleDateString(undefined, { month: 'short' })}
             </span>
             <button onClick={handleNextMonth} className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-white hover:text-rose-500 rounded-md transition-all"><i className="fas fa-chevron-right text-[10px]"></i></button>
          </div>
       </div>

       <div className="grid grid-cols-7 gap-1 flex-1 content-start z-10">
          {['S','M','T','W','T','F','S'].map((d,i) => (
             <div key={i} className="text-center text-[9px] font-bold text-slate-300 mb-1">{d}</div>
          ))}
          {renderCalendar()}
       </div>

       <div className="mt-4 pt-2 border-t border-slate-100 flex justify-center gap-3 text-[9px] text-slate-500 uppercase font-bold tracking-wider z-10 flex-wrap">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm border border-rose-600"></span> {t.privateSpace.leisure.cycle.legend.period}</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-50 border-2 border-rose-300 border-dashed"></span> {t.privateSpace.leisure.cycle.legend.predicted}</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-100 border border-purple-300 text-purple-700"></span> {t.privateSpace.leisure.cycle.legend.fertile}</div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 border border-purple-600"></span> {t.privateSpace.leisure.cycle.legend.ovulation}</div>
       </div>

       {isModalOpen && createPortal(
          <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col">
                <div className="p-5 border-b border-rose-100 bg-rose-50 flex justify-between items-center">
                   <h3 className="font-bold text-rose-600 text-lg flex items-center gap-2">
                      <i className="fas fa-calendar-plus"></i> {t.privateSpace.leisure.cycle.log}
                   </h3>
                   <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-white text-rose-400 hover:text-rose-600 flex items-center justify-center"><i className="fas fa-times"></i></button>
                </div>
                
                <form onSubmit={handleSaveRecord} className="p-6 space-y-5">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Start Date</label>
                         <input 
                           type="date" 
                           required
                           value={activeRecord.startDate || ''}
                           onChange={e => setActiveRecord({...activeRecord, startDate: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:border-rose-400 outline-none"
                         />
                      </div>
                      <div>
                         <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">End Date</label>
                         <input 
                           type="date" 
                           value={activeRecord.endDate || ''}
                           onChange={e => setActiveRecord({...activeRecord, endDate: e.target.value})}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:border-rose-400 outline-none"
                         />
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t.privateSpace.leisure.cycle.flow}</label>
                      <div className="flex bg-slate-50 p-1 rounded-xl">
                         {['light', 'medium', 'heavy'].map(f => (
                            <button
                               key={f}
                               type="button"
                               onClick={() => setActiveRecord({...activeRecord, flow: f as any})}
                               className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
                                  activeRecord.flow === f 
                                     ? 'bg-rose-500 text-white shadow-md' 
                                     : 'text-slate-400 hover:text-slate-600'
                               }`}
                            >
                               {t.privateSpace.leisure.cycle.flows[f as keyof typeof t.privateSpace.leisure.cycle.flows]}
                            </button>
                         ))}
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">{t.privateSpace.leisure.cycle.symptoms}</label>
                      <div className="flex flex-wrap gap-2">
                         {['cramps', 'headache', 'backpain', 'fatigue', 'bloating', 'acne', 'moody'].map(sym => {
                            const isSelected = activeRecord.symptoms?.includes(sym);
                            return (
                               <button
                                  key={sym}
                                  type="button"
                                  onClick={() => {
                                     const current = activeRecord.symptoms || [];
                                     const newSyms = isSelected ? current.filter(s => s !== sym) : [...current, sym];
                                     setActiveRecord({...activeRecord, symptoms: newSyms});
                                  }}
                                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                                     isSelected 
                                        ? 'bg-purple-100 border-purple-300 text-purple-600 font-bold' 
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-purple-200'
                                  }`}
                               >
                                  {t.privateSpace.leisure.cycle.symptomList[sym as keyof typeof t.privateSpace.leisure.cycle.symptomList]}
                               </button>
                            )
                         })}
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">{t.privateSpace.leisure.cycle.note}</label>
                      <textarea 
                         value={activeRecord.note || ''}
                         onChange={e => setActiveRecord({...activeRecord, note: e.target.value})}
                         className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:border-rose-400 outline-none resize-none h-20"
                         placeholder="..."
                      />
                   </div>

                   <div className="pt-2 flex gap-3">
                      {activeRecord._id && (
                         <button 
                           type="button" 
                           onClick={handleDeleteRecord}
                           className="px-4 py-3 bg-red-50 text-red-500 rounded-xl font-bold text-xs uppercase hover:bg-red-100"
                         >
                            <i className="fas fa-trash"></i>
                         </button>
                      )}
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold uppercase tracking-widest shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all"
                      >
                         {t.privateSpace.leisure.cycle.save}
                      </button>
                   </div>
                </form>
             </div>
          </div>,
          document.body
       )}
    </div>
  );
};
