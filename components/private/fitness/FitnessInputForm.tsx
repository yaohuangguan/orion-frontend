import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { FitnessRecord, User } from '../../../types';

type FitnessTab = 'WORKOUT' | 'STATUS' | 'DIET' | 'PHOTOS';

interface FitnessInputFormProps {
  currentDate: Date;
  selectedUser: User | null;
  record: FitnessRecord;
  updateRecord: (partial: Partial<FitnessRecord>) => void;
  onGoalChange: (goal: 'cut' | 'bulk' | 'maintain') => void;
  onSave: () => void;
  isSaving: boolean;
  onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPhotoSelect: (url: string) => void;
  onPhotoDelete: (index: number) => void;
}

export const FitnessInputForm: React.FC<FitnessInputFormProps> = ({
  currentDate,
  selectedUser,
  record,
  updateRecord,
  onGoalChange,
  onSave,
  isSaving,
  onPhotoUpload,
  onPhotoSelect,
  onPhotoDelete
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FitnessTab>('WORKOUT');

  const updateWorkout = (field: string, value: any) => updateRecord({ workout: { ...record.workout, isDone: record.workout?.isDone ?? false, [field]: value } });
  const updateStatus = (field: string, value: any) => updateRecord({ status: { ...record.status, [field]: value } });
  const updateBody = (field: string, value: any) => updateRecord({ body: { ...record.body, [field]: value } });
  const updateDiet = (field: string, value: any) => updateRecord({ diet: { ...record.diet, [field]: value } });

  const toggleWorkoutType = (type: string) => {
    const currentTypes = record.workout?.types || [];
    const newTypes = currentTypes.includes(type) ? currentTypes.filter(t => t !== type) : [...currentTypes, type];
    updateWorkout('types', newTypes);
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

  // Calculate BMI dynamically
  const currentBMI = useMemo(() => {
    const height = selectedUser?.height;
    const weight = record.body?.weight;
    
    if (height && weight && height > 0 && weight > 0) {
        const heightM = height / 100;
        return (weight / (heightM * heightM)).toFixed(1);
    }
    return null;
  }, [selectedUser?.height, record.body?.weight]);

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden flex flex-col lg:flex-row min-h-[400px]">
       <div className="lg:w-48 bg-rose-50/50 border-b lg:border-b-0 lg:border-r border-rose-100 flex lg:flex-col overflow-x-auto lg:overflow-visible">
          {(['WORKOUT', 'STATUS', 'DIET', 'PHOTOS'] as FitnessTab[]).map(tab => (
             <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 lg:flex-none py-4 px-6 text-left text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${activeTab === tab ? 'text-rose-600 bg-white border-l-0 lg:border-l-4 border-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-rose-50'}`}>
                {t.privateSpace.fitness.tabs[tab.toLowerCase() as keyof typeof t.privateSpace.fitness.tabs]}
             </button>
          ))}
       </div>
       <div className="flex-1 p-6 relative">
          
          {/* Header Area */}
          <div className="flex justify-between items-start mb-6">
              {/* Mode Switch (Cut/Bulk/Maintain) */}
              <div className="flex bg-slate-100 p-1 rounded-xl">
                 {(['cut', 'maintain', 'bulk'] as const).map(mode => {
                    const isActive = selectedUser?.fitnessGoal === mode || (!selectedUser?.fitnessGoal && mode === 'maintain');
                    return (
                       <button
                          key={mode}
                          onClick={() => onGoalChange(mode)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                             isActive 
                               ? (mode === 'cut' ? 'bg-emerald-500 text-white' : mode === 'bulk' ? 'bg-orange-500 text-white' : 'bg-white text-slate-700 shadow-sm')
                               : 'text-slate-400 hover:text-slate-600'
                          }`}
                       >
                          {t.privateSpace.fitness.goals[mode]}
                       </button>
                    );
                 })}
              </div>

              <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-rose-400 uppercase tracking-wider hidden sm:inline">{t.privateSpace.fitness.input.loggingFor}</span>
                  <div className="flex items-center gap-2 bg-rose-500 text-white px-3 py-1 rounded-full shadow-sm">
                      <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[8px]"><i className="fas fa-user"></i></div>
                      <span className="text-xs font-bold truncate max-w-[100px]">{selectedUser?.displayName || t.privateSpace.fitness.input.selectUser}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      {currentDate.toLocaleDateString()}
                  </span>
              </div>
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
                <div className="grid grid-cols-2 gap-6">
                   <div>
                      <div className="flex items-center gap-3 mb-2 justify-between">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center"><i className="fas fa-weight"></i></div>
                            <label className="block text-xs font-bold uppercase text-slate-400">{t.privateSpace.fitness.status.weight}</label>
                         </div>
                         {/* BMI Display */}
                         {currentBMI && (
                            <div className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-bold text-slate-500 border border-slate-200" title="Calculated BMI">
                               BMI: {currentBMI}
                            </div>
                         )}
                      </div>
                      <input type="number" step="0.1" value={record.body?.weight || ''} onChange={(e) => updateBody('weight', Number(e.target.value))} className="w-full text-2xl font-bold text-slate-800 bg-transparent border-b-2 border-slate-100 focus:border-blue-400 outline-none pb-1 font-mono placeholder-slate-200" placeholder="0.0"/>
                   </div>
                   
                   {/* Read-Only Height */}
                   <div>
                      <div className="flex items-center gap-3 mb-2">
                         <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"><i className="fas fa-ruler-vertical"></i></div>
                         <label className="block text-xs font-bold uppercase text-slate-400">{t.privateSpace.fitness.status.height}</label>
                      </div>
                      <div className="w-full text-2xl font-bold text-slate-400 bg-transparent border-b-2 border-slate-100 pb-1 font-mono cursor-not-allowed">
                         {selectedUser?.height || '-'}
                      </div>
                   </div>
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
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-slate-100 shadow-md cursor-pointer hover:shadow-lg transition-all" onClick={() => onPhotoSelect(url)}><img src={url} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Fitness Check"/><button onClick={(e) => { e.stopPropagation(); onPhotoDelete(idx); }} className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><i className="fas fa-times text-xs"></i></button></div>
                   ))}
                </div>
                <label className="w-full py-3 bg-rose-50 border border-rose-200 text-rose-500 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-rose-100 cursor-pointer flex items-center justify-center gap-2 transition-colors shrink-0"><i className="fas fa-upload"></i>{t.privateSpace.fitness.photos.upload}<input type="file" className="hidden" accept="image/*" onChange={onPhotoUpload}/></label>
             </div>
          )}
          <button onClick={onSave} disabled={isSaving} className="absolute bottom-6 right-6 w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-xl shadow-rose-500/30 flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:scale-100 z-10">{isSaving ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-save text-xl"></i>}</button>
       </div>
    </div>
  );
};