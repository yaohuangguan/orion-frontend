
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiService } from '../../services/api';
import { FitnessRecord, User } from '../../types';
import { toast } from '../Toast';
import { Line, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ComposedChart, CartesianGrid, Area, ReferenceLine } from 'recharts';
import { createPortal } from 'react-dom';

type FitnessTab = 'WORKOUT' | 'STATUS' | 'DIET' | 'PHOTOS';
type MetricType = 'WEIGHT' | 'DURATION' | 'WATER' | 'SLEEP';

// Priority Users to Pin
const PRIORITY_EMAILS = ['yaob@miamioh.edu', 'cft_cool@hotmail.com'];

// --- DATE HELPERS (Local Time) ---
const toLocalDateStr = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// --- CHINESE NEW YEAR LOOKUP TABLE (2024 - 2050) ---
// Key: Year (int), Value: 'MM-DD' string of the date
const CNY_DATES: Record<number, string> = {
  2024: '02-10', 2025: '01-29', 2026: '02-17', 2027: '02-06', 2028: '01-26',
  2029: '02-13', 2030: '02-03', 2031: '01-23', 2032: '02-11', 2033: '01-31',
  2034: '02-19', 2035: '02-08', 2036: '01-28', 2037: '02-15', 2038: '02-04',
  2039: '01-24', 2040: '02-12', 2041: '02-01', 2042: '01-22', 2043: '02-10',
  2044: '01-30', 2045: '02-17', 2046: '02-06', 2047: '01-26', 2048: '02-14',
  2049: '02-02', 2050: '01-23'
};

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

const CHART_CONFIG = {
  WEIGHT: { color: '#f43f5e', fill: '#fecdd3', unit: 'kg', name: 'Weight' },
  DURATION: { color: '#a855f7', fill: '#e9d5ff', unit: 'min', name: 'Workout' },
  WATER: { color: '#3b82f6', fill: '#bfdbfe', unit: 'ml', name: 'Water' },
  SLEEP: { color: '#6366f1', fill: '#c7d2fe', unit: 'hr', name: 'Sleep' },
};

export const FitnessSpace: React.FC = () => {
  const { t, language } = useTranslation();
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [monthRecords, setMonthRecords] = useState<Map<string, FitnessRecord[]>>(new Map());
  const [userList, setUserList] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [activeTab, setActiveTab] = useState<FitnessTab>('WORKOUT');
  const [activeMetric, setActiveMetric] = useState<MetricType>('WEIGHT');
  const [record, setRecord] = useState<FitnessRecord>({});
  const [stats, setStats] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Photo Wall State
  const [isPhotoWallOpen, setIsPhotoWallOpen] = useState(false);

  // State for viewing all photos of a specific day
  const [dayPhotosData, setDayPhotosData] = useState<{ date: string, photos: string[] } | null>(null);

  // Helper function to get special day name (Holiday or Solar Term)
  const getSpecialDayName = (year: number, month: number, day: number) => {
    const m = month + 1;
    const key = `${m}-${day}`;
    
    // 1. Check Chinese New Year (Dynamic based on year)
    const dateKey = `${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    if (CNY_DATES[year] === dateKey) {
        return language === 'zh' ? '春节' : 'Spring Festival';
    }

    // 2. Check Standard Holidays
    const holidays = t.privateSpace.fitness.calendar.holidays as Record<string, string>;
    if (holidays[key]) return holidays[key];

    // 3. Check Solar Terms
    const termIndex1 = month * 2;
    const termIndex2 = month * 2 + 1;
    const date1 = getSolarTermDate(year, termIndex1);
    const date2 = getSolarTermDate(year, termIndex2);
    
    // Access translated terms array safely
    const terms = t.privateSpace.fitness.calendar.terms as string[];
    if (day === date1) return terms[termIndex1];
    if (day === date2) return terms[termIndex2];
    
    return null;
  };

  const fetchUsers = async (page: number) => {
    if (isLoadingUsers) return;
    setIsLoadingUsers(true);
    try {
      const { data, pagination } = await apiService.getUsers(page, 20, '', 'vip', 'desc');
      setUserList(prev => {
        const all = page === 1 ? data : [...prev, ...data];
        return Array.from(new Map(all.map(u => [u._id, u])).values());
      });
      setHasMoreUsers(pagination.hasNextPage);
      if (page === 1 && data.length > 0 && !selectedUser) {
         const priority = data.find(u => PRIORITY_EMAILS.includes(u.email));
         setSelectedUser(priority || data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => { fetchUsers(1); }, []);

  const handleLoadMoreUsers = () => {
    if (hasMoreUsers && !isLoadingUsers) {
      const next = userPage + 1;
      setUserPage(next);
      fetchUsers(next);
    }
  };

  const displayUserList = useMemo(() => {
    const list = [...userList];
    list.sort((a, b) => {
       const emailA = (a.email || "").toLowerCase();
       const emailB = (b.email || "").toLowerCase();
       const isAPriority = PRIORITY_EMAILS.includes(emailA);
       const isBPriority = PRIORITY_EMAILS.includes(emailB);
       if (isAPriority && !isBPriority) return -1;
       if (!isBPriority && isAPriority) return 1;
       if (isAPriority && isBPriority) return PRIORITY_EMAILS.indexOf(emailA) - PRIORITY_EMAILS.indexOf(emailB);
       if (a.vip && !b.vip) return -1;
       if (!a.vip && b.vip) return 1;
       return 0;
    });
    return list;
  }, [userList]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setCurrentDate(newDate);
  };

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
        console.error(e);
      }
    };
    fetchMonthData();
  }, [viewDate, isSaving]);

  useEffect(() => {
    if (!selectedUser) return;
    const dateStr = toLocalDateStr(currentDate);
    const dayRecords = monthRecords.get(dateStr) || [];
    const foundRecord = dayRecords.find(r => (r.user as User)?.email === selectedUser.email);
    setRecord(foundRecord || {});
  }, [currentDate, monthRecords, selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;
    const loadStats = async () => {
      try {
        const data = await apiService.getFitnessStats(30, selectedUser.email);
        const chartData = data.dates.map((dateStr, index) => ({
          date: dateStr.substring(5),
          weight: data.weights[index],
          duration: data.durations[index],
          water: data.water[index],
          sleep: data.sleep[index]
        }));
        setStats(chartData);
      } catch (e) {
        console.error(e);
      }
    };
    loadStats();
  }, [isSaving, selectedUser]);

  const handleSave = async () => {
    if (!selectedUser) {
        toast.error("Please select a user profile.");
        return;
    }
    setIsSaving(true);
    try {
      const payload = { ...record, date: toLocalDateStr(currentDate), targetUserEmail: selectedUser.email };
      await apiService.submitFitnessRecord(payload as any);
      toast.success(t.privateSpace.fitness.saved);
    } catch (e) {
      toast.error("Failed to save record");
    } finally {
      setIsSaving(false);
    }
  };

  const updateWorkout = (field: string, value: any) => setRecord(prev => ({ ...prev, workout: { ...prev.workout, isDone: prev.workout?.isDone ?? false, [field]: value } }));
  const updateStatus = (field: string, value: any) => setRecord(prev => ({ ...prev, status: { ...prev.status, [field]: value } }));
  const updateBody = (field: string, value: any) => setRecord(prev => ({ ...prev, body: { ...prev.body, [field]: value } }));
  const updateDiet = (field: string, value: any) => setRecord(prev => ({ ...prev, diet: { ...prev.diet, [field]: value } }));

  const toggleWorkoutType = (type: string) => {
    const currentTypes = record.workout?.types || [];
    const newTypes = currentTypes.includes(type) ? currentTypes.filter(t => t !== type) : [...currentTypes, type];
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

  const handleOpenDayGallery = (e: React.MouseEvent, dateStr: string, photos: string[]) => {
     e.stopPropagation();
     setDayPhotosData({ date: dateStr, photos });
  };

  // --- Photo Wall Logic ---
  const allMonthPhotos = useMemo(() => {
    const flattened: { url: string; record: FitnessRecord; user: User }[] = [];
    
    // Iterate through all days in monthRecords
    monthRecords.forEach((records) => {
      records.forEach(r => {
        // Filter by selected user to show relevant photos
        if (selectedUser && (r.user as User)?.email !== selectedUser.email) return;

        if (r.photos && r.photos.length > 0) {
          r.photos.forEach(url => {
            flattened.push({
              url,
              record: r,
              user: r.user as User
            });
          });
        }
      });
    });

    // Sort by Date Descending
    return flattened.sort((a, b) => new Date(b.record.dateStr || '').getTime() - new Date(a.record.dateStr || '').getTime());
  }, [monthRecords, selectedUser]);

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
      const isSelected = toLocalDateStr(currentDate) === localDateStr;
      const isToday = toLocalDateStr(new Date()) === localDateStr;
      const dayRecords = monthRecords.get(localDateStr) || [];
      const holiday = getSpecialDayName(year, month, d);
      
      const dayPhotos = dayRecords.reduce((acc: string[], r) => [...acc, ...(r.photos || [])], []);
      const hasPhotos = dayPhotos.length > 0;

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

             {hasPhotos && (
                <div 
                   onClick={(e) => handleOpenDayGallery(e, localDateStr, dayPhotos)}
                   className={`w-8 h-8 rounded-full flex items-center justify-center transition-all transform hover:scale-125 cursor-pointer ${isSelected ? 'text-amber-300' : 'text-amber-500'} drop-shadow-md`}
                   title={t.privateSpace.fitness.photoWall.view}
                >
                   <i className="fas fa-star text-lg animate-pulse"></i>
                </div>
             )}
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
    <div className="flex flex-col gap-6 text-slate-900">
      
      {/* Lightbox Overlay - Increased Z-index to 2200 to be top-most */}
      {selectedPhoto && createPortal(
        <div className="fixed inset-0 z-[2200] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedPhoto(null)}>
           <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 text-white text-3xl hover:text-rose-500 transition-colors"><i className="fas fa-times"></i></button>
           <img src={selectedPhoto} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} alt="Full View"/>
        </div>,
        document.body
      )}

      {/* DAY PHOTOS MODAL (GALLERY) */}
      {dayPhotosData && createPortal(
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-rose-50/30">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner"><i className="fas fa-star"></i></div>
                     <div>
                        <h3 className="text-xl font-display font-bold text-slate-800">{t.privateSpace.fitness.photoWall.title}</h3>
                        <p className="text-xs font-mono text-rose-400 font-bold uppercase">{dayPhotosData.date}</p>
                     </div>
                  </div>
                  <button onClick={() => setDayPhotosData(null)} className="w-10 h-10 rounded-full bg-slate-50 text-slate-500 hover:text-rose-500 flex items-center justify-center transition-colors shadow-sm"><i className="fas fa-times"></i></button>
               </div>
               
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                     {dayPhotosData.photos.map((url, i) => (
                        <div 
                           key={i} 
                           className="aspect-square rounded-2xl overflow-hidden shadow-lg border border-white cursor-pointer group hover:ring-4 ring-rose-400 transition-all"
                           onClick={() => setSelectedPhoto(url)}
                        >
                           <img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-110" loading="lazy" alt="Workout"/>
                        </div>
                     ))}
                  </div>
               </div>
               
               <div className="p-4 text-center border-t border-slate-100 text-[10px] text-slate-400 font-mono uppercase tracking-widest">
                  Tap to view
               </div>
            </div>
         </div>,
         document.body
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
               <button onClick={handlePrevMonth} className="w-10 h-10 rounded-full bg-white hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm"><i className="fas fa-chevron-left"></i></button>
               <button onClick={handleNextMonth} className="w-10 h-10 rounded-full bg-white hover:bg-rose-100 hover:text-rose-500 transition-colors flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm"><i className="fas fa-chevron-right"></i></button>
            </div>
         </div>
         
         <div className="grid grid-cols-7 gap-3 md:gap-4">
            {(t.privateSpace.fitness.calendar.weekdays as string[]).map((d,i) => (
               <div key={i} className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{d}</div>
            ))}
            {calendarCells}
         </div>
      </div>

      {/* 1.5 NEW MODULE: Collapsible Photo Wall */}
      <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden transition-all">
         <button 
            onClick={() => setIsPhotoWallOpen(!isPhotoWallOpen)}
            className="w-full p-4 flex justify-between items-center bg-gradient-to-r from-rose-50 to-white hover:bg-rose-100/50 transition-colors"
         >
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shadow-sm border border-rose-200">
                  <i className="fas fa-images"></i>
               </div>
               <div className="text-left">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t.privateSpace.fitness.photoWall.title}</h3>
                  <p className="text-[10px] text-rose-400 font-mono">
                     {t.privateSpace.fitness.photoWall.captured.replace('{n}', allMonthPhotos.length.toString())}
                  </p>
               </div>
            </div>
            <div className={`w-8 h-8 rounded-full bg-white border border-rose-100 flex items-center justify-center text-slate-400 transition-transform duration-300 ${isPhotoWallOpen ? 'rotate-180 text-rose-500' : ''}`}>
               <i className="fas fa-chevron-down"></i>
            </div>
         </button>

         {isPhotoWallOpen && (
            <div className="p-6 bg-slate-50/50 animate-slide-up">
               {allMonthPhotos.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl">
                     <i className="fas fa-camera-retro text-2xl opacity-50"></i>
                     <span className="text-xs uppercase tracking-widest">{t.privateSpace.fitness.photoWall.empty}</span>
                  </div>
               ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                     {allMonthPhotos.map((item, idx) => (
                        <div 
                           key={`${item.record._id}-${idx}`}
                           className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white"
                           onClick={() => setSelectedPhoto(item.url)}
                        >
                           <img src={item.url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" alt="Moment"/>
                           
                           {/* Data Overlay */}
                           <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end">
                              <div className="text-[10px] font-mono text-white/80 mb-1">{item.record.dateStr}</div>
                              
                              <div className="flex flex-wrap gap-2 text-xs font-bold">
                                 {item.record.body?.weight && (
                                    <span className="flex items-center gap-1"><i className="fas fa-weight text-[10px] text-rose-400"></i> {item.record.body.weight}kg</span>
                                 )}
                                 {item.record.workout?.duration && (
                                    <span className="flex items-center gap-1"><i className="fas fa-stopwatch text-[10px] text-amber-400"></i> {item.record.workout.duration}m</span>
                                 )}
                              </div>
                              {item.record.workout?.types && item.record.workout.types.length > 0 && (
                                 <div className="mt-1 flex flex-wrap gap-1">
                                    {item.record.workout.types.slice(0,2).map(t => (
                                       <span key={t} className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] uppercase backdrop-blur-sm">
                                          {t}
                                       </span>
                                    ))}
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )}
      </div>

      {/* 2. MIDDLE: Chart (Stats) & User Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="md:col-span-2 bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl border border-white/50 flex flex-col h-[24rem]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 shrink-0">
               <h3 className="text-sm font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                  <i className="fas fa-chart-area text-rose-400"></i> {selectedUser ? t.privateSpace.fitness.stats.userProgress.replace('{name}', selectedUser.displayName) : t.privateSpace.fitness.stats.progress}
               </h3>
               <div className="flex flex-wrap gap-2 bg-slate-100/50 p-1 rounded-xl">
                  {Object.keys(CHART_CONFIG).map((metric) => {
                     const m = metric as MetricType;
                     const config = CHART_CONFIG[m];
                     const isActive = activeMetric === m;
                     return (
                        <button
                           key={m}
                           onClick={() => setActiveMetric(m)}
                           className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                              isActive ? 'bg-white shadow-sm scale-105' : 'bg-transparent border-transparent text-slate-400 hover:text-slate-600'
                           }`}
                           style={{ color: isActive ? config.color : undefined, borderColor: isActive ? config.color : 'transparent' }}
                        >
                           {config.name}
                        </button>
                     )
                  })}
               </div>
            </div>
            <div className="flex-1 w-full min-h-0 relative">
               {stats.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                     <ComposedChart data={stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                           <linearGradient id={`color-${activeMetric}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={CHART_CONFIG[activeMetric].color} stopOpacity={0.2}/>
                              <stop offset="95%" stopColor={CHART_CONFIG[activeMetric].color} stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={30} />
                        <YAxis domain={['auto', 'auto']} tick={{fontSize: 10, fill: '#94a3b8'}} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} formatter={(value: any) => [`${value} ${CHART_CONFIG[activeMetric].unit}`, CHART_CONFIG[activeMetric].name]} labelStyle={{ color: '#64748b', fontSize: '12px', marginBottom: '4px' }}/>
                        {activeMetric === 'WEIGHT' && <Line type="monotone" dataKey="weight" stroke={CHART_CONFIG.WEIGHT.color} strokeWidth={3} dot={{r: 3, fill: CHART_CONFIG.WEIGHT.color, strokeWidth: 0}} activeDot={{r: 6}} connectNulls={true}/>}
                        {activeMetric === 'DURATION' && <Bar dataKey="duration" fill={CHART_CONFIG.DURATION.color} radius={[4, 4, 0, 0]} barSize={16}/>}
                        {activeMetric === 'WATER' && <Area type="monotone" dataKey="water" stroke={CHART_CONFIG.WATER.color} fill={`url(#color-${activeMetric})`} strokeWidth={3} connectNulls={true}/>}
                        {activeMetric === 'SLEEP' && <Area type="step" dataKey="sleep" stroke={CHART_CONFIG.SLEEP.color} fill={`url(#color-${activeMetric})`} strokeWidth={3} connectNulls={true}/>}
                     </ComposedChart>
                  </ResponsiveContainer>
               ) : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300"><i className="fas fa-chart-line text-4xl mb-2 opacity-50"></i><p className="text-xs font-mono uppercase tracking-widest">{t.privateSpace.fitness.stats.noData}</p></div>}
            </div>
         </div>

         <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 shadow-xl shadow-rose-200 flex flex-col text-white h-[24rem] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-80 mb-4 text-center z-10 shrink-0">{t.privateSpace.fitness.stats.activeProfile}</h3>
            <div className="flex-1 overflow-y-auto custom-scrollbar z-10 space-y-3 pr-1">
               {displayUserList.map(user => {
                  const isActive = selectedUser?._id === user._id;
                  return (
                     <button key={user._id} onClick={() => setSelectedUser(user)} className={`w-full flex items-center gap-3 p-2 rounded-2xl transition-all border-2 ${isActive ? 'bg-white text-rose-600 border-white shadow-lg' : 'bg-transparent border-white/20 hover:bg-white/10'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden border-2 shrink-0 ${isActive ? 'border-rose-100' : 'border-white/30'}`}><img src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=f43f5e&color=fff`} className="w-full h-full object-cover" alt={user.displayName}/></div>
                        <div className="flex flex-col text-left min-w-0 flex-1"><span className="font-bold text-sm leading-none truncate flex items-center gap-1">{user.displayName} {user.vip && <i className="fas fa-star text-[8px] text-yellow-300"></i>}</span><span className="text-[9px] opacity-70 font-mono truncate">{user.email}</span></div>
                        {isActive && <i className="fas fa-check-circle text-lg animate-pulse shrink-0"></i>}
                     </button>
                  )
               })}
               {hasMoreUsers && <button onClick={handleLoadMoreUsers} className="w-full py-2 text-[10px] font-bold uppercase border border-white/20 rounded-xl hover:bg-white/10 transition-colors">{isLoadingUsers ? t.privateSpace.fitness.stats.loading : t.privateSpace.fitness.stats.loadMore}</button>}
            </div>
         </div>
      </div>

      {/* 3. BOTTOM: Input Form */}
      <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden flex flex-col lg:flex-row min-h-[400px]">
         <div className="lg:w-48 bg-rose-50/50 border-b lg:border-b-0 lg:border-r border-rose-100 flex lg:flex-col overflow-x-auto lg:overflow-visible">
            {(['WORKOUT', 'STATUS', 'DIET', 'PHOTOS'] as FitnessTab[]).map(tab => (
               <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 lg:flex-none py-4 px-6 text-left text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'text-rose-600 bg-white border-l-0 lg:border-l-4 border-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-rose-50'}`}>
                  {t.privateSpace.fitness.tabs[tab.toLowerCase() as keyof typeof t.privateSpace.fitness.tabs]}
               </button>
            ))}
         </div>
         <div className="flex-1 p-6 relative">
            <div className="absolute top-4 right-4 flex items-center gap-3">
               <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">{t.privateSpace.fitness.input.loggingFor}</span>
               <div className="flex items-center gap-2 bg-rose-500 text-white px-3 py-1 rounded-full shadow-sm">
                  <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px]"><i className="fas fa-user"></i></div>
                  <span className="text-xs font-bold truncate max-w-[100px]">{selectedUser?.displayName || t.privateSpace.fitness.input.selectUser}</span>
               </div>
               <span className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                  {currentDate.toLocaleDateString()}
               </span>
            </div>
            {activeTab === 'WORKOUT' && (
               <div className="space-y-6 animate-fade-in max-w-2xl mt-8">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                     <span className="font-bold text-slate-700">{t.privateSpace.fitness.workout.isDone}</span>
                     <button onClick={() => updateWorkout('isDone', !record.workout?.isDone)} className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ${record.workout?.isDone ? 'bg-emerald-400' : 'bg-slate-200'}`}><div className={`w-6 h-6 rounded-full bg-white shadow-sm transform transition-transform duration-300 ${record.workout?.isDone ? 'translate-x-6' : ''}`}></div></button>
                  </div>
                  <div>
                     <div className="flex justify-between mb-2"><label className="text-xs font-bold uppercase text-slate-400">{t.privateSpace.fitness.workout.duration}</label><span className="text-sm font-mono font-bold text-rose-500">{record.workout?.duration || 0} min</span></div>
                     <input type="range" min="0" max="180" step="5" value={record.workout?.duration || 0} onChange={(e) => updateWorkout('duration', Number(e.target.value))} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-500"/>
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-400 mb-3">{t.privateSpace.fitness.workout.type}</label>
                     <div className="flex flex-wrap gap-2">
                        {['run', 'swim', 'lift', 'yoga', 'hiit', 'trip', 'hike', 'movie', 'love', 'other'].map(type => {
                           const isSelected = record.workout?.types?.includes(type);
                           return (
                              <button key={type} onClick={() => toggleWorkoutType(type)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase border transition-all flex items-center gap-2 ${isSelected ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200' : 'bg-white text-slate-500 border-slate-200 hover:border-rose-300'}`}>
                                 <i className={`fas ${getWorkoutIcon(type)}`}></i>{t.privateSpace.fitness.workout.types[type as keyof typeof t.privateSpace.fitness.workout.types]}
                              </button>
                           );
                        })}
                     </div>
                  </div>
                  <textarea value={record.workout?.note || ''} onChange={(e) => updateWorkout('note', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm outline-none focus:border-rose-400 focus:ring-1 focus:ring-rose-200 transition-all resize-none h-24 text-slate-700" placeholder={t.privateSpace.fitness.workout.notes}/>
               </div>
            )}
            {activeTab === 'STATUS' && (
               <div className="space-y-8 animate-fade-in max-w-xl mt-8">
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center text-xl shrink-0"><i className="fas fa-weight"></i></div>
                     <div className="flex-1"><label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.privateSpace.fitness.status.weight}</label><input type="number" step="0.1" value={record.body?.weight || ''} onChange={(e) => updateBody('weight', Number(e.target.value))} className="w-full text-3xl font-bold text-slate-800 bg-transparent border-b-2 border-slate-100 focus:border-blue-400 outline-none pb-1 font-mono placeholder-slate-200" placeholder="0.0"/></div>
                  </div>
                  <div className="flex items-center gap-6">
                     <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-500 flex items-center justify-center text-xl shrink-0"><i className="fas fa-moon"></i></div>
                     <div className="flex-1"><label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.privateSpace.fitness.status.sleep}</label><input type="number" step="0.5" value={record.status?.sleepHours || ''} onChange={(e) => updateStatus('sleepHours', Number(e.target.value))} className="w-full text-3xl font-bold text-slate-800 bg-transparent border-b-2 border-slate-100 focus:border-indigo-400 outline-none pb-1 font-mono placeholder-slate-200" placeholder="0"/></div>
                  </div>
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-400 mb-4">{t.privateSpace.fitness.status.mood}</label>
                     <div className="flex gap-4">
                        {['happy', 'neutral', 'bad'].map(m => (
                           <button key={m} onClick={() => updateStatus('mood', m)} className={`flex-1 py-3 rounded-2xl border-2 flex items-center justify-center gap-2 transition-all ${record.status?.mood === m ? (m === 'happy' ? 'border-amber-400 bg-amber-50 text-amber-600' : m === 'neutral' ? 'border-slate-400 bg-slate-50 text-slate-600' : 'border-rose-400 bg-rose-50 text-rose-600') : 'border-slate-100 text-slate-400 hover:bg-slate-50'}`}><i className={`fas ${m === 'happy' ? 'fa-smile' : m === 'neutral' ? 'fa-meh' : 'fa-frown'} text-xl`}></i><span className="text-xs font-bold uppercase">{t.privateSpace.fitness.status.moods[m as keyof typeof t.privateSpace.fitness.status.moods]}</span></button>
                        ))}
                     </div>
                  </div>
               </div>
            )}
            {activeTab === 'DIET' && (
               <div className="space-y-6 animate-fade-in h-full flex flex-col mt-8">
                  <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                     <div className="w-10 h-10 rounded-full bg-white text-blue-500 flex items-center justify-center shadow-sm"><i className="fas fa-tint"></i></div>
                     <div className="flex-1"><label className="text-xs font-bold text-blue-400 uppercase">{t.privateSpace.fitness.diet.water}</label><input type="number" step="50" value={record.diet?.water || ''} onChange={(e) => updateDiet('water', Number(e.target.value))} className="w-full bg-transparent font-mono text-xl font-bold text-blue-800 outline-none placeholder-blue-200" placeholder="0"/></div>
                  </div>
                  <div className="flex-1 flex flex-col min-h-[250px]">
                     <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.privateSpace.fitness.diet.content}</label>
                     <textarea value={record.diet?.content || ''} onChange={(e) => updateDiet('content', e.target.value)} className="flex-1 w-full bg-amber-50/50 border border-amber-100 rounded-2xl p-4 text-sm leading-relaxed text-slate-700 outline-none focus:border-amber-300 resize-none min-h-[200px]" placeholder={t.privateSpace.fitness.diet.contentPlaceholder}/>
                  </div>
               </div>
            )}
            {activeTab === 'PHOTOS' && (
               <div className="h-full flex flex-col animate-fade-in mt-8">
                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto mb-4 custom-scrollbar content-start">
                     {(!record.photos || record.photos.length === 0) && <div className="col-span-full flex flex-col items-center justify-center text-slate-300 border-2 border-dashed border-slate-200 rounded-2xl h-48"><i className="fas fa-camera text-2xl mb-2"></i><span className="text-xs">{t.privateSpace.fitness.photos.empty}</span></div>}
                     {record.photos?.map((url, idx) => (
                        <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-md cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedPhoto(url)}><img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Fitness Check"/><button onClick={(e) => { e.stopPropagation(); const newPhotos = [...(record.photos || [])]; newPhotos.splice(idx, 1); setRecord(prev => ({...prev, photos: newPhotos})); }} className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><i className="fas fa-times text-xs"></i></button></div>
                     ))}
                  </div>
                  <label className="w-full py-3 bg-rose-50 border border-rose-200 text-rose-500 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-2 transition-colors shrink-0"><i className="fas fa-upload"></i>{t.privateSpace.fitness.photos.upload}<input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload}/></label>
               </div>
            )}
            <button onClick={handleSave} disabled={isSaving} className="absolute bottom-6 right-6 w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-xl shadow-rose-500/30 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:scale-100 z-10">{isSaving ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-save text-xl"></i>}</button>
         </div>
      </div>
    </div>
  );
};
