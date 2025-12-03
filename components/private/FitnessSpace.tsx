import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiService } from '../../services/api';
import { FitnessRecord, User } from '../../types';
import { toast } from '../Toast';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, CartesianGrid } from 'recharts';

type FitnessTab = 'WORKOUT' | 'STATUS' | 'DIET' | 'PHOTOS';

const MY_EMAIL = 'yaob@miamioh.edu';
const PARTNER_EMAIL = 'cft_cool@hotmail.com';

// --- DATE HELPERS (Local Time) ---
const toLocalDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// --- HOLIDAY & SOLAR TERM UTILS ---
const getSpecialDay = (month: number, day: number) => {
  const m = month + 1;
  const key = `${m}-${day}`;
  
  const holidays: Record<string, string> = {
    '1-1': '元旦', '2-14': '情人节', '3-8': '妇女节', '3-12': '植树节',
    '4-1': '愚人节', '5-1': '劳动节', '5-4': '青年节', '6-1': '儿童节',
    '7-1': '建党节', '8-1': '建军节', '9-10': '教师节', '10-1': '国庆节',
    '12-24': '平安夜', '12-25': '圣诞节'
  };

  const solarTerms: Record<string, string> = {
    '2-4': '立春', '2-19': '雨水', '3-6': '惊蛰', '3-21': '春分',
    '4-5': '清明', '4-20': '谷雨', '5-6': '立夏', '5-21': '小满',
    '6-6': '芒种', '6-21': '夏至', '7-7': '小暑', '7-23': '大暑',
    '8-8': '立秋', '8-23': '处暑', '9-8': '白露', '9-23': '秋分',
    '10-8': '寒露', '10-23': '霜降', '11-7': '立冬', '11-22': '小雪',
    '12-7': '大雪', '12-22': '冬至', '1-6': '小寒', '1-20': '大寒'
  };

  return holidays[key] || solarTerms[key] || null;
};

export const FitnessSpace: React.FC = () => {
  const { t } = useTranslation();
  
  // Date State
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  // Calendar View State
  const [viewDate, setViewDate] = useState<Date>(new Date());
  
  // Data State: Map dateStr -> List of records (supporting multiple users per day)
  const [monthRecords, setMonthRecords] = useState<Map<string, FitnessRecord[]>>(new Map());

  // User Target State
  const [targetUser, setTargetUser] = useState<'me' | 'partner'>('me');

  // Tab State
  const [activeTab, setActiveTab] = useState<FitnessTab>('WORKOUT');
  
  // Form Data State (Active Record)
  const [record, setRecord] = useState<FitnessRecord>({});
  
  // Stats Data
  const [stats, setStats] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Photo Lightbox State
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // --- CALENDAR LOGIC ---
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setCurrentDate(newDate);
  };

  // Fetch Month Data for Calendar Indicators (Gets ALL users)
  useEffect(() => {
    const fetchMonthData = async () => {
      const start = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
      const end = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);
      
      try {
        const records = await apiService.getFitnessRecords(toLocalDateStr(start), toLocalDateStr(end));
        const map = new Map<string, FitnessRecord[]>();
        records.forEach(r => {
          if (r.dateStr) {
             const existing = map.get(r.dateStr) || [];
             existing.push(r);
             map.set(r.dateStr, existing);
          }
        });
        setMonthRecords(map);
      } catch (e) {
        console.error("Failed to load month data", e);
      }
    };
    fetchMonthData();
  }, [viewDate, isSaving]);

  // Update Form Data when Date or User changes
  useEffect(() => {
    const dateStr = toLocalDateStr(currentDate);
    const dayRecords = monthRecords.get(dateStr) || [];
    
    // Find record by Email match
    // 'me' -> MY_EMAIL, 'partner' -> PARTNER_EMAIL
    const targetEmail = targetUser === 'me' ? MY_EMAIL : PARTNER_EMAIL;

    const foundRecord = dayRecords.find(r => {
        const u = r.user as User;
        return u?.email === targetEmail;
    });

    setRecord(foundRecord || {});
  }, [currentDate, monthRecords, targetUser]);

  // Load Stats (Filtered by Target User)
  useEffect(() => {
    const loadStats = async () => {
      try {
        const email = targetUser === 'me' ? MY_EMAIL : PARTNER_EMAIL;
        const data = await apiService.getFitnessStats(30, email);
        const chartData = data.dates.map((dateStr, index) => ({
          date: dateStr.substring(5), // MM-DD
          weight: data.weights[index],
          duration: data.durations[index]
        }));
        setStats(chartData);
      } catch (e) {
        console.error("Failed to load stats", e);
      }
    };
    loadStats();
  }, [isSaving, targetUser]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        ...record,
        date: toLocalDateStr(currentDate),
        // Explicitly send email for BOTH users to ensure avatar association
        targetUserEmail: targetUser === 'me' ? MY_EMAIL : PARTNER_EMAIL
      };
      await apiService.submitFitnessRecord(payload as any);
      toast.success(t.privateSpace.fitness.saved);
    } catch (e) {
      console.error("Failed to save", e);
      toast.error("Failed to save record");
    } finally {
      setIsSaving(false);
    }
  };

  // Field Updaters
  const updateWorkout = (field: string, value: any) => {
    setRecord(prev => ({ ...prev, workout: { ...prev.workout, isDone: prev.workout?.isDone ?? false, [field]: value } }));
  };
  const updateStatus = (field: string, value: any) => {
    setRecord(prev => ({ ...prev, status: { ...prev.status, [field]: value } }));
  };
  const updateBody = (field: string, value: any) => {
    setRecord(prev => ({ ...prev, body: { ...prev.body, [field]: value } }));
  };
  const updateDiet = (field: string, value: any) => {
    setRecord(prev => ({ ...prev, diet: { ...prev.diet, [field]: value } }));
  };

  const toggleWorkoutType = (type: string) => {
    const currentTypes = record.workout?.types || [];
    const newTypes = currentTypes.includes(type) 
      ? currentTypes.filter(t => t !== type)
      : [...currentTypes, type];
    updateWorkout('types', newTypes);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await apiService.uploadImage(file);
      setRecord(prev => ({ ...prev, photos: [...(prev.photos || []), url] }));
      toast.success("Photo uploaded");
    } catch (e) {
      toast.error("Photo upload failed");
    }
  };

  const getWorkoutIcon = (type: string) => {
    switch (type) {
      case 'run': return 'fa-running';
      case 'swim': return 'fa-swimmer';
      case 'lift': return 'fa-dumbbell';
      case 'yoga': return 'fa-spa';
      case 'hiit': return 'fa-heartbeat';
      case 'trip': return 'fa-plane';
      case 'hike': return 'fa-hiking';
      case 'movie': return 'fa-film';
      case 'love': return 'fa-heart';
      default: return 'fa-fire';
    }
  };

  const getMoodEmoji = (mood?: string) => {
    switch (mood) {
      case 'happy': return '😊';
      case 'neutral': return '😐';
      case 'bad': return '😫';
      default: return '';
    }
  };

  // Calendar Grid Generation
  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const cells = [];
    // Padding
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`pad-${i}`} className="h-48 md:h-56 bg-white/20 rounded-xl border border-white/10"></div>);
    }
    // Days
    for (let d = 1; d <= daysInMonth; d++) {
      const localDateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      
      const isSelected = toLocalDateStr(currentDate) === localDateStr;
      const isToday = toLocalDateStr(new Date()) === localDateStr;
      const dayRecords = monthRecords.get(localDateStr) || [];
      const holiday = getSpecialDay(month, d);

      cells.push(
        <button
          key={d}
          onClick={() => handleDateClick(d)}
          className={`h-48 md:h-56 rounded-2xl flex flex-col p-3 relative transition-all duration-200 border text-left group overflow-hidden ${
            isSelected 
              ? 'bg-rose-500 text-white border-rose-500 shadow-xl scale-[1.02] z-20 ring-4 ring-rose-200' 
              : isToday
                ? 'bg-white border-rose-300 text-rose-600 shadow-md ring-2 ring-rose-100'
                : 'bg-white/80 hover:bg-white border-white text-slate-600 shadow-sm hover:shadow-md'
          }`}
        >
          {/* Header Row: Date & Holiday */}
          <div className="flex justify-between items-start w-full mb-3 pb-2 border-b border-black/5">
             <span className={`text-lg md:text-xl font-bold font-display ${isSelected ? 'text-white' : 'text-slate-800'}`}>{d}</span>
             {holiday && (
               <span className={`text-[10px] scale-90 origin-top-right whitespace-nowrap font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'}`}>
                 {holiday}
               </span>
             )}
          </div>

          {/* Body: Workout Data List (Scrollable if many) */}
          <div className="flex flex-col gap-2 w-full flex-1 overflow-y-auto custom-scrollbar pr-1">
             {dayRecords.length > 0 ? (
                dayRecords.map((r, idx) => {
                   const u = r.user as User;
                   const avatarUrl = u?.photoURL;
                   const name = u?.displayName || 'U';
                   const isDone = r.workout?.isDone;
                   
                   return (
                      <div key={idx} className={`flex items-start gap-3 p-2 rounded-xl transition-all ${isSelected ? 'bg-white/10' : 'bg-slate-50 border border-slate-100 hover:border-rose-200'}`}>
                         
                         {/* Avatar with Status Ring */}
                         <div className="relative shrink-0">
                            <div className={`w-8 h-8 rounded-full overflow-hidden border-2 ${isDone ? 'border-emerald-400' : 'border-slate-200'} p-0.5 bg-white`}>
                               {avatarUrl ? <img src={avatarUrl} className="w-full h-full rounded-full object-cover"/> : <span className="flex items-center justify-center w-full h-full font-bold bg-slate-200 rounded-full text-[10px]">{name[0]}</span>}
                            </div>
                            {isDone && (
                               <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[8px] border border-white">
                                  <i className="fas fa-check"></i>
                               </div>
                            )}
                         </div>

                         {/* Details Column */}
                         <div className="flex flex-col min-w-0 flex-1 gap-1">
                            {/* Workout Types (Translated) */}
                            <div className="flex flex-wrap gap-1">
                               {r.workout?.types && r.workout.types.length > 0 ? (
                                  r.workout.types.slice(0,2).map(typeKey => {
                                     // Get translation for calendar card
                                     const label = t.privateSpace.fitness.workout.types[typeKey as keyof typeof t.privateSpace.fitness.workout.types] || typeKey;
                                     return (
                                       <span key={typeKey} className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${isSelected ? 'bg-black/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                                          {label}
                                       </span>
                                     );
                                  })
                               ) : (
                                  <span className={`text-[9px] italic ${isSelected ? 'text-white/50' : 'text-slate-400'}`}>Rest</span>
                               )}
                            </div>
                            
                            {/* Metrics Row */}
                            <div className={`flex items-center gap-2 text-[9px] font-mono mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                               {r.diet?.water && (
                                  <span className="flex items-center gap-1"><i className="fas fa-tint text-[8px]"></i> {r.diet.water}</span>
                               )}
                               {r.body?.weight && (
                                  <span className="flex items-center gap-1"><i className="fas fa-weight text-[8px]"></i> {r.body.weight}</span>
                               )}
                            </div>
                         </div>
                      </div>
                   );
                })
             ) : (
                <div className={`mt-auto text-xs text-center w-full opacity-50 py-4 ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                   No activity
                </div>
             )}
          </div>
        </button>
      );
    }
    return cells;
  }, [viewDate, currentDate, monthRecords, t]); // Added t to dependency to refresh on lang change

  return (
    <div className="flex flex-col gap-6 text-slate-900">
      
      {/* 0. Lightbox Overlay */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedPhoto(null)}
        >
           <button 
             onClick={() => setSelectedPhoto(null)} 
             className="absolute top-4 right-4 text-white text-3xl hover:text-rose-500 transition-colors"
           >
             <i className="fas fa-times"></i>
           </button>
           <img 
             src={selectedPhoto} 
             className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
             onClick={(e) => e.stopPropagation()} 
             alt="Full View"
           />
        </div>
      )}

      {/* 1. TOP: Calendar Board */}
      <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-xl border border-white/50">
         <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-display font-bold text-slate-800 flex items-center gap-3">
               <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-500 shadow-inner">
                  <i className="fas fa-calendar-alt text-xl"></i>
               </div>
               {viewDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
            </h2>
            <div className="flex gap-2">
               <button onClick={handlePrevMonth} className="w-10 h-10 rounded-full bg-white hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center text-slate-500 border border-slate-200 hover:border-rose-200 shadow-sm"><i className="fas fa-chevron-left"></i></button>
               <button onClick={handleNextMonth} className="w-10 h-10 rounded-full bg-white hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center text-slate-500 border border-slate-200 hover:border-rose-200 shadow-sm"><i className="fas fa-chevron-right"></i></button>
            </div>
         </div>
         
         <div className="grid grid-cols-7 gap-3 md:gap-4">
            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d,i) => (
               <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{d}</div>
            ))}
            {calendarCells}
         </div>
      </div>

      {/* 2. MIDDLE: Chart (Stats) & User Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-72">
         {/* Stats Chart */}
         <div className="md:col-span-2 bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50 flex flex-col h-72 md:h-auto">
            <div className="flex justify-between items-center mb-4">
               <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-chart-area text-rose-400"></i> {targetUser === 'me' ? "Sam's Progress" : "Jennifer's Progress"}
               </h3>
            </div>
            <div className="flex-1 w-full min-h-0">
               <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={stats}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                     <XAxis dataKey="date" tick={{fontSize: 9}} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                     <YAxis yAxisId="left" domain={['auto', 'auto']} tick={{fontSize: 9}} tickLine={false} axisLine={false} hide />
                     <YAxis yAxisId="right" orientation="right" tick={{fontSize: 9}} tickLine={false} axisLine={false} hide />
                     <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} />
                     <Bar yAxisId="right" dataKey="duration" fill="#fbcfe8" radius={[4, 4, 0, 0]} barSize={12} />
                     <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#f43f5e" strokeWidth={3} dot={{r: 3, fill: '#f43f5e'}} activeDot={{r: 5}} />
                  </ComposedChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Target User Switcher */}
         <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 shadow-xl shadow-rose-200 flex flex-col justify-center text-white h-72 md:h-auto relative overflow-hidden">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-6 text-center z-10">Active Profile</h3>
            
            <div className="flex flex-col gap-4 z-10">
               <button 
                  onClick={() => setTargetUser('me')}
                  className={`flex items-center gap-4 p-3 rounded-2xl transition-all border-2 ${targetUser === 'me' ? 'bg-white text-rose-600 border-white shadow-lg' : 'bg-transparent border-white/20 hover:bg-white/10'}`}
               >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold overflow-hidden border-2 ${targetUser === 'me' ? 'border-rose-100' : 'border-white/30'}`}>
                     {/* Static Avatar for Sam or Initials */}
                     <img src={`https://ui-avatars.com/api/?name=Sam&background=f43f5e&color=fff`} className="w-full h-full object-cover" alt="Sam" />
                  </div>
                  <div className="flex flex-col text-left">
                     <span className="font-bold text-lg leading-none">Sam</span>
                     <span className="text-[10px] opacity-70 font-mono">yaob@...</span>
                  </div>
                  {targetUser === 'me' && <i className="fas fa-check-circle ml-auto text-xl animate-pulse"></i>}
               </button>

               <button 
                  onClick={() => setTargetUser('partner')}
                  className={`flex items-center gap-4 p-3 rounded-2xl transition-all border-2 ${targetUser === 'partner' ? 'bg-white text-rose-600 border-white shadow-lg' : 'bg-transparent border-white/20 hover:bg-white/10'}`}
               >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold overflow-hidden border-2 ${targetUser === 'partner' ? 'border-rose-100' : 'border-white/30'}`}>
                     <img src={`https://ui-avatars.com/api/?name=Jennifer&background=f43f5e&color=fff`} className="w-full h-full object-cover" alt="Jennifer" />
                  </div>
                  <div className="flex flex-col text-left">
                     <span className="font-bold text-lg leading-none">Jennifer</span>
                     <span className="text-[10px] opacity-70 font-mono">cft_cool@...</span>
                  </div>
                  {targetUser === 'partner' && <i className="fas fa-check-circle ml-auto text-xl animate-pulse"></i>}
               </button>
            </div>
         </div>
      </div>

      {/* 3. BOTTOM: Input Form */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden flex flex-col lg:flex-row min-h-[400px]">
         
         {/* Tabs Sidebar */}
         <div className="lg:w-48 bg-rose-50/50 border-b lg:border-b-0 lg:border-r border-rose-100 flex lg:flex-col overflow-x-auto lg:overflow-visible">
            {(['WORKOUT', 'STATUS', 'DIET', 'PHOTOS'] as FitnessTab[]).map(tab => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 lg:flex-none py-4 px-6 text-left text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                     activeTab === tab 
                        ? 'text-rose-600 bg-white border-l-0 lg:border-l-4 border-rose-500 shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600 hover:bg-rose-50'
                  }`}
               >
                  {t.privateSpace.fitness.tabs[tab.toLowerCase() as keyof typeof t.privateSpace.fitness.tabs]}
               </button>
            ))}
         </div>

         {/* Form Area */}
         <div className="flex-1 p-6 relative">
            <div className="absolute top-4 right-4 flex items-center gap-3">
               <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Logging for:</span>
               <div className="flex items-center gap-2 bg-rose-500 text-white px-3 py-1 rounded-full shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px]"><i className="fas fa-user"></i></div>
                  <span className="text-xs font-bold">{targetUser === 'me' ? 'Sam' : 'Jennifer'}</span>
               </div>
               <span className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {currentDate.toLocaleDateString()}
               </span>
            </div>

            {activeTab === 'WORKOUT' && (
               <div className="space-y-6 animate-fade-in max-w-2xl mt-8">
                  {/* Is Done Toggle */}
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <span className="font-bold text-slate-700">{t.privateSpace.fitness.workout.isDone}</span>
                     <button 
                        onClick={() => updateWorkout('isDone', !record.workout?.isDone)}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${record.workout?.isDone ? 'bg-emerald-400' : 'bg-slate-200'}`}
                     >
                        <div className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${record.workout?.isDone ? 'translate-x-6' : ''}`}></div>
                     </button>
                  </div>

                  {/* Duration Slider */}
                  <div>
                     <div className="flex justify-between mb-2">
                        <label className="text-xs font-bold uppercase text-slate-400">{t.privateSpace.fitness.workout.duration}</label>
                        <span className="text-sm font-mono font-bold text-rose-500">{record.workout?.duration || 0} min</span>
                     </div>
                     <input 
                        type="range" min="0" max="180" step="5"
                        value={record.workout?.duration || 0}
                        onChange={(e) => updateWorkout('duration', Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"
                     />
                  </div>

                  {/* Types Pills */}
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-400 mb-3">{t.privateSpace.fitness.workout.type}</label>
                     <div className="flex flex-wrap gap-2">
                        {['run', 'swim', 'lift', 'yoga', 'hiit', 'trip', 'hike', 'movie', 'love', 'other'].map(type => {
                           const isSelected = record.workout?.types?.includes(type);
                           return (
                              <button
                                 key={type}
                                 onClick={() => toggleWorkoutType(type)}
                                 className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all flex items-center gap-2 ${
                                    isSelected 
                                       ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200' 
                                       : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'
                                 }`}
                              >
                                 <i className={`fas ${getWorkoutIcon(type)}`}></i>
                                 {t.privateSpace.fitness.workout.types[type as keyof typeof t.privateSpace.fitness.workout.types]}
                              </button>
                           );
                        })}
                     </div>
                  </div>

                  {/* Note */}
                  <textarea 
                     value={record.workout?.note || ''}
                     onChange={(e) => updateWorkout('note', e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all resize-none h-24"
                     placeholder={t.privateSpace.fitness.workout.notes}
                  />
               </div>
            )}

            {activeTab === 'STATUS' && (
               <div className="space-y-8 animate-fade-in max-w-xl mt-8">
                  {/* Weight */}
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl shrink-0"><i className="fas fa-weight"></i></div>
                     <div className="flex-1">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.privateSpace.fitness.status.weight}</label>
                        <input 
                           type="number" step="0.1"
                           value={record.body?.weight || ''}
                           onChange={(e) => updateBody('weight', Number(e.target.value))}
                           className="w-full text-3xl font-bold text-slate-800 bg-transparent border-b-2 border-slate-100 focus:border-blue-400 outline-none pb-1 font-mono placeholder-slate-200"
                           placeholder="0.0"
                        />
                     </div>
                  </div>

                  {/* Sleep */}
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl shrink-0"><i className="fas fa-moon"></i></div>
                     <div className="flex-1">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.privateSpace.fitness.status.sleep}</label>
                        <input 
                           type="number" step="0.5"
                           value={record.status?.sleepHours || ''}
                           onChange={(e) => updateStatus('sleepHours', Number(e.target.value))}
                           className="w-full text-3xl font-bold text-slate-800 bg-transparent border-b-2 border-slate-100 focus:border-indigo-400 outline-none pb-1 font-mono placeholder-slate-200"
                           placeholder="0"
                        />
                     </div>
                  </div>

                  {/* Mood */}
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-400 mb-4">{t.privateSpace.fitness.status.mood}</label>
                     <div className="flex gap-4">
                        {['happy', 'neutral', 'bad'].map(m => (
                           <button 
                              key={m}
                              onClick={() => updateStatus('mood', m)}
                              className={`flex-1 py-3 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${
                                 record.status?.mood === m 
                                    ? m === 'happy' ? 'border-amber-400 bg-amber-50 text-amber-600' : m === 'neutral' ? 'border-slate-400 bg-slate-50 text-slate-600' : 'border-rose-400 bg-rose-50 text-rose-600'
                                    : 'border-slate-100 text-slate-400 hover:bg-slate-50'
                              }`}
                           >
                              <i className={`fas ${m === 'happy' ? 'fa-smile' : m === 'neutral' ? 'fa-meh' : 'fa-frown'} text-xl`}></i>
                              <span className="text-xs font-bold uppercase">{t.privateSpace.fitness.status.moods[m as keyof typeof t.privateSpace.fitness.status.moods]}</span>
                           </button>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'DIET' && (
               <div className="space-y-6 animate-fade-in h-full flex flex-col mt-8">
                  {/* Water */}
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                     <div className="w-10 h-10 rounded-full bg-white text-blue-500 flex items-center justify-center shadow-sm">
                        <i className="fas fa-tint"></i>
                     </div>
                     <div className="flex-1">
                        <label className="text-xs font-bold text-blue-400 uppercase">{t.privateSpace.fitness.diet.water}</label>
                        <input 
                           type="number" step="50"
                           value={record.diet?.water || ''}
                           onChange={(e) => updateDiet('water', Number(e.target.value))}
                           className="w-full bg-transparent font-mono text-xl font-bold text-blue-800 outline-none placeholder-blue-200"
                           placeholder="0"
                        />
                     </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col min-h-[250px]">
                     <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.privateSpace.fitness.diet.content}</label>
                     <textarea 
                        value={record.diet?.content || ''}
                        onChange={(e) => updateDiet('content', e.target.value)}
                        className="flex-1 w-full bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-sm leading-relaxed text-slate-700 outline-none focus:border-amber-300 resize-none min-h-[200px]"
                        placeholder={t.privateSpace.fitness.diet.contentPlaceholder}
                     />
                  </div>
               </div>
            )}

            {activeTab === 'PHOTOS' && (
               <div className="h-full flex flex-col animate-fade-in mt-8">
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto mb-4 custom-scrollbar content-start">
                     {(!record.photos || record.photos.length === 0) && (
                        <div className="col-span-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl h-48">
                           <i className="fas fa-camera text-2xl mb-2"></i>
                           <span className="text-xs">{t.privateSpace.fitness.photos.empty}</span>
                        </div>
                     )}
                     {record.photos?.map((url, idx) => (
                        <div 
                           key={idx} 
                           className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-md cursor-pointer hover:shadow-lg transition-all"
                           onClick={() => setSelectedPhoto(url)}
                        >
                           <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Fitness Check" />
                           <button 
                              onClick={(e) => {
                                 e.stopPropagation();
                                 const newPhotos = [...(record.photos || [])];
                                 newPhotos.splice(idx, 1);
                                 setRecord(prev => ({...prev, photos: newPhotos}));
                              }}
                              className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                           >
                              <i className="fas fa-times text-xs"></i>
                           </button>
                        </div>
                     ))}
                  </div>
                  
                  <label className="w-full py-3 bg-rose-50 border border-rose-200 text-rose-500 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-2 transition-colors shrink-0">
                     <i className="fas fa-upload"></i>
                     {t.privateSpace.fitness.photos.upload}
                     <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                  </label>
               </div>
            )}

            {/* Save Button Floating */}
            <button 
               onClick={handleSave}
               disabled={isSaving}
               className="absolute bottom-6 right-6 w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-xl shadow-rose-500/30 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:scale-100 z-10"
            >
               {isSaving ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-save text-xl"></i>}
            </button>
         </div>
      </div>
    </div>
  );
};