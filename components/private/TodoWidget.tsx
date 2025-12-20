
import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../../services/api';
import { Todo } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { createPortal } from 'react-dom';
import { toast } from '../Toast';

type TabType = 'todo' | 'in_progress' | 'done';

export const TodoWidget: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('todo');
  
  // Modal & Edit State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTodo, setCurrentTodo] = useState<Partial<Todo>>({
    todo: '', description: '', status: 'todo', images: [], targetDate: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Deletion State for individual cards
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

  // Widget Expansion State (Mobile/Desktop view toggle)
  // Default to collapsed (false) as requested
  const [isExpanded, setIsExpanded] = useState(false);

  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const data = await apiService.getTodos();
      // Normalize legacy data if needed (map legacy done=true to status='done')
      const normalized = data.map(item => {
        if (!item.status) {
           if (item.done) return { ...item, status: 'done' as const };
           return { ...item, status: 'todo' as const };
        }
        return item;
      });
      setTodos(normalized);
    } catch (error) {
      console.error('Failed to fetch bucket list', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setCurrentTodo({ todo: '', description: '', status: activeTab, images: [], targetDate: '' });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (todo: Todo) => {
    setCurrentTodo({ ...todo });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTodo.todo?.trim()) return;

    setIsProcessing(true);
    try {
      if (isEditing && currentTodo._id) {
        // Update existing
        // Note: backend endpoint for updates is typically POST /done/:id in this architecture
        const updatedList = await apiService.updateTodo(currentTodo._id, currentTodo);
        setTodos(updatedList);
      } else {
        // Create new
        const updatedList = await apiService.addTodo(
           currentTodo.todo!, 
           currentTodo.description, 
           currentTodo.targetDate, 
           currentTodo.images
        );
        setTodos(updatedList);
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!currentTodo._id) return;
    // Removed alert confirmation as requested

    setIsProcessing(true);
    try {
      await apiService.deleteTodo(currentTodo._id);
      setTodos(prev => prev.filter(t => t._id !== currentTodo._id)); // Optimistic update
      setIsModalOpen(false);
      toast.success("Wish deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingIds.has(id)) return;

    setDeletingIds(prev => new Set(prev).add(id));

    try {
        await apiService.deleteTodo(id);
        setTodos(prev => prev.filter(t => t._id !== id));
        toast.success("Wish deleted");
    } catch (e) {
        console.error(e);
        toast.error("Failed to delete");
        setDeletingIds(prev => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const url = await apiService.uploadImage(file);
      setCurrentTodo(prev => ({
        ...prev,
        images: [...(prev.images || []), url]
      }));
      toast.success("Image uploaded");
    } catch (e) {
      toast.error("Upload failed");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...(currentTodo.images || [])];
    newImages.splice(index, 1);
    setCurrentTodo(prev => ({ ...prev, images: newImages }));
  };

  // Quick Status Update Handler
  const handleQuickStatusUpdate = async (e: React.MouseEvent, todo: Todo, newStatus: TabType) => {
    e.stopPropagation();
    if (isProcessing) return;
    
    // We don't use global isProcessing here to avoid blocking other interactions if possible, 
    // but preventing double clicks on same item is good.
    // For now, reuse isProcessing is fine or we could track processingIds.
    setIsProcessing(true); 
    try {
        // Pass only the status update
        const updatedList = await apiService.updateTodo(todo._id, { status: newStatus });
        setTodos(updatedList);
        toast.success(`Updated status to ${t.privateSpace.bucketList.tabs[newStatus]}`);
    } catch (e) {
        console.error(e);
        toast.error("Failed to update status");
    } finally {
        setIsProcessing(false);
    }
  };

  // Filter Logic
  const filteredTodos = todos.filter(item => {
    const itemStatus = item.status || (item.done ? 'done' : 'todo');
    return itemStatus === activeTab;
  });

  const getStats = () => {
    const doneCount = todos.filter(t => t.status === 'done' || t.done).length;
    const total = todos.length;
    return { doneCount, total };
  };

  return (
    <div className={`bg-pink-50/80 rounded-3xl shadow-lg border border-pink-200 transition-all duration-500 relative flex flex-col ${isExpanded ? 'h-[500px]' : 'h-16'} overflow-hidden group`}>
      
      {/* Header Bar */}
      <div 
        className="h-16 px-5 flex items-center justify-between bg-white/50 backdrop-blur-sm border-b border-pink-100 cursor-pointer shrink-0 z-10"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-400 to-rose-500 flex items-center justify-center text-white shadow-md">
            <i className="fas fa-list-ul"></i>
          </div>
          <div>
             <h3 className="text-lg font-bold text-slate-800 leading-none">{t.privateSpace.bucketList.title}</h3>
             <p className="text-[10px] text-pink-500 font-mono uppercase tracking-widest mt-1">
                {getStats().doneCount} / {getStats().total} {t.privateSpace.bucketList.tabs.done}
             </p>
          </div>
        </div>
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-pink-400 hover:bg-pink-100 transition-all duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
           <i className="fas fa-chevron-down"></i>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex flex-col flex-1 min-h-0 bg-white/30 relative transition-opacity duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
         
         {/* Tabs */}
         <div className="flex p-2 gap-2 shrink-0">
            {(['todo', 'in_progress', 'done'] as TabType[]).map(tab => (
               <button
                 key={tab}
                 onClick={() => setActiveTab(tab)}
                 className={`flex-1 py-2 text-xs font-bold uppercase rounded-xl transition-all border ${
                    activeTab === tab 
                      ? 'bg-white text-rose-500 border-rose-200 shadow-sm' 
                      : 'bg-transparent text-slate-400 border-transparent hover:bg-white/50'
                 }`}
               >
                 {t.privateSpace.bucketList.tabs[tab]}
               </button>
            ))}
         </div>

         {/* List Area */}
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-3">
            {isLoading ? (
               <div className="text-center py-10 text-pink-300 text-xs animate-pulse">Loading dreams...</div>
            ) : filteredTodos.length === 0 ? (
               <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2 border-2 border-dashed border-pink-100 rounded-2xl mx-4">
                  <i className="fas fa-cloud text-3xl text-pink-100"></i>
                  <p className="text-xs">{t.privateSpace.bucketList.empty}</p>
               </div>
            ) : (
               filteredTodos.map(todo => {
                  const authorAvatar = todo.user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(todo.user?.displayName || 'Anonymous')}&background=random`;
                  const createdDate = todo.create_date || todo.timestamp;
                  const itemStatus = todo.status || (todo.done ? 'done' : 'todo');
                  const isDeleting = deletingIds.has(todo._id);

                  return (
                    <div 
                      key={todo._id}
                      onClick={() => handleOpenEdit(todo)}
                      className={`group bg-white p-4 rounded-2xl border border-pink-100 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden flex flex-col gap-2 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                       {/* User Info Header */}
                       <div className="flex items-center justify-between pb-2 border-b border-slate-50 mb-1">
                          <div className="flex items-center gap-2">
                             <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-100">
                                <img src={authorAvatar} alt="user" className="w-full h-full object-cover" />
                             </div>
                             <span className="text-[10px] font-bold text-slate-500">{todo.user?.displayName || 'Unknown'}</span>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="text-[9px] text-slate-300 font-mono">
                                 {createdDate ? new Date(createdDate).toLocaleDateString() : ''}
                              </span>
                              <button
                                onClick={(e) => handleQuickDelete(e, todo._id)}
                                className="w-5 h-5 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete"
                              >
                                {isDeleting ? (
                                    <i className="fas fa-circle-notch fa-spin text-[10px]"></i>
                                ) : (
                                    <i className="fas fa-trash text-[10px]"></i>
                                )}
                              </button>
                          </div>
                       </div>

                       {/* Main Content */}
                       <div className="flex justify-between items-start gap-4 relative z-10">
                          <div className="flex-1 min-w-0">
                             <h4 className={`font-bold text-slate-800 text-sm ${itemStatus === 'done' ? 'line-through opacity-60' : ''}`}>
                                {todo.todo}
                             </h4>
                             {todo.description && (
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed break-words line-clamp-3">
                                   {todo.description}
                                </p>
                             )}
                             {todo.targetDate && (
                                <div className="mt-2 flex items-center gap-2 text-[10px] font-mono text-pink-400 bg-pink-50 w-fit px-2 py-0.5 rounded">
                                   <i className="fas fa-clock"></i> {new Date(todo.targetDate).toLocaleDateString()}
                                </div>
                             )}
                          </div>
                          {/* Status Icon */}
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                             itemStatus === 'done' ? 'bg-amber-400 border-amber-400 text-white' : 
                             itemStatus === 'in_progress' ? 'bg-white border-pink-400 text-pink-400 animate-pulse' : 
                             'bg-slate-100 border-slate-200 text-slate-300'
                          }`}>
                             {itemStatus === 'done' && <i className="fas fa-check text-[10px]"></i>}
                             {itemStatus === 'in_progress' && <i className="fas fa-running text-[10px]"></i>}
                          </div>
                       </div>
                       
                       {/* Images Preview strip */}
                       {todo.images && todo.images.length > 0 && (
                          <div className="flex gap-2 mt-2 overflow-hidden h-12 relative z-10 pt-2 border-t border-slate-50">
                             {todo.images.slice(0, 3).map((img, i) => (
                                <img key={i} src={img} className="w-12 h-12 rounded-lg object-cover border border-slate-100" />
                             ))}
                             {todo.images.length > 3 && (
                                <div className="w-12 h-12 rounded-lg bg-pink-50 flex items-center justify-center text-[10px] text-pink-400 font-bold border border-pink-100">+{todo.images.length - 3}</div>
                             )}
                          </div>
                       )}

                       {/* Quick Actions Bar */}
                       <div className="flex gap-2 mt-2 pt-2 border-t border-slate-50 relative z-20">
                          {itemStatus === 'todo' && (
                             <>
                               <button 
                                 onClick={(e) => handleQuickStatusUpdate(e, todo, 'in_progress')}
                                 className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-500 text-[10px] font-bold uppercase hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                 title="Start Progress"
                               >
                                 <i className="fas fa-play"></i> {t.privateSpace.bucketList.actions.start}
                               </button>
                               <button 
                                 onClick={(e) => handleQuickStatusUpdate(e, todo, 'done')}
                                 className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-500 text-[10px] font-bold uppercase hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                                 title="Mark Complete"
                               >
                                 <i className="fas fa-check"></i> {t.privateSpace.bucketList.actions.complete}
                               </button>
                             </>
                          )}
                          {itemStatus === 'in_progress' && (
                             <>
                               <button 
                                 onClick={(e) => handleQuickStatusUpdate(e, todo, 'todo')}
                                 className="flex-1 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-bold uppercase hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                                 title="Move back to Wishlist"
                               >
                                 <i className="fas fa-undo"></i> {t.privateSpace.bucketList.actions.later}
                               </button>
                               <button 
                                 onClick={(e) => handleQuickStatusUpdate(e, todo, 'done')}
                                 className="flex-1 py-1.5 rounded-lg bg-emerald-50 text-emerald-500 text-[10px] font-bold uppercase hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                                 title="Mark Complete"
                               >
                                 <i className="fas fa-check"></i> {t.privateSpace.bucketList.actions.complete}
                               </button>
                             </>
                          )}
                          {itemStatus === 'done' && (
                             <>
                               <button 
                                 onClick={(e) => handleQuickStatusUpdate(e, todo, 'todo')}
                                 className="flex-1 py-1.5 rounded-lg bg-slate-50 text-slate-400 text-[10px] font-bold uppercase hover:bg-slate-100 transition-colors flex items-center justify-center gap-1"
                                 title="Move back to Wishlist"
                               >
                                 <i className="fas fa-undo"></i> {t.privateSpace.bucketList.actions.wishlist}
                               </button>
                               <button 
                                 onClick={(e) => handleQuickStatusUpdate(e, todo, 'in_progress')}
                                 className="flex-1 py-1.5 rounded-lg bg-blue-50 text-blue-500 text-[10px] font-bold uppercase hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                 title="Move to In Progress"
                               >
                                 <i className="fas fa-redo"></i> {t.privateSpace.bucketList.actions.restart}
                               </button>
                             </>
                          )}
                       </div>

                       {/* Progress Bar Decoration for In Progress */}
                       {itemStatus === 'in_progress' && (
                          <div className="absolute bottom-0 left-0 h-0.5 bg-pink-400 w-1/3 animate-[shimmer_2s_infinite_linear]"></div>
                       )}
                    </div>
                  );
               })
            )}
         </div>

         {/* Add Button */}
         <button 
            onClick={handleOpenAdd}
            className="absolute bottom-6 right-6 w-12 h-12 bg-rose-500 text-white rounded-full shadow-xl hover:bg-rose-600 hover:scale-110 transition-all flex items-center justify-center z-20"
         >
            <i className="fas fa-plus"></i>
         </button>
      </div>

      {/* --- DETAIL / EDIT MODAL --- */}
      {isModalOpen && createPortal(
         <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               {/* Modal Header */}
               <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-pink-50 to-white">
                  <h3 className="text-xl font-display font-bold text-slate-800">
                     {isEditing ? t.privateSpace.bucketList.edit : t.privateSpace.bucketList.add}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                     <i className="fas fa-times"></i>
                  </button>
               </div>

               {/* Form Content */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  
                  {/* Title */}
                  <input 
                     type="text" 
                     value={currentTodo.todo}
                     onChange={e => setCurrentTodo(prev => ({...prev, todo: e.target.value}))}
                     placeholder={t.privateSpace.bucketList.placeholder}
                     // Force text color to slate-800 to be visible in all modes since modal background is white
                     className="w-full text-2xl font-bold text-slate-800 placeholder:text-slate-300 outline-none border-b border-transparent focus:border-pink-300 transition-all bg-transparent"
                     autoFocus
                  />

                  {/* Status & Date Row */}
                  <div className="flex gap-4">
                     <div className="flex-1">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.privateSpace.bucketList.status}</label>
                        <div className="flex bg-slate-100 rounded-xl p-1">
                           {(['todo', 'in_progress', 'done'] as TabType[]).map(st => (
                              <button
                                 key={st}
                                 onClick={() => setCurrentTodo(prev => ({...prev, status: st}))}
                                 className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                                    currentTodo.status === st 
                                       ? 'bg-white text-rose-500 shadow-sm' 
                                       : 'text-slate-400 hover:text-slate-600'
                                 }`}
                              >
                                 {t.privateSpace.bucketList.tabs[st]}
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="flex-1">
                        <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.privateSpace.bucketList.targetDate}</label>
                        <input 
                           type="date" 
                           value={currentTodo.targetDate ? new Date(currentTodo.targetDate).toISOString().split('T')[0] : ''}
                           onChange={e => setCurrentTodo(prev => ({...prev, targetDate: e.target.value}))}
                           // Explicit text color for visibility
                           className="w-full bg-slate-100 border-none rounded-xl px-3 py-2 text-sm text-slate-800 focus:ring-2 focus:ring-pink-200 outline-none"
                        />
                     </div>
                  </div>

                  {/* Description */}
                  <div>
                     <label className="block text-xs font-bold uppercase text-slate-400 mb-2">{t.privateSpace.bucketList.description}</label>
                     <textarea 
                        value={currentTodo.description}
                        onChange={e => setCurrentTodo(prev => ({...prev, description: e.target.value}))}
                        // Explicit text color for visibility
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm text-slate-800 min-h-[120px] focus:ring-2 focus:ring-pink-200 outline-none resize-none placeholder-slate-400"
                        placeholder="Add details, links, or plans..."
                     />
                  </div>

                  {/* Evidence / Photos */}
                  <div>
                     <div className="flex justify-between items-center mb-3">
                        <label className="text-xs font-bold uppercase text-slate-400">{t.privateSpace.bucketList.evidence}</label>
                        <button 
                           onClick={() => fileInputRef.current?.click()}
                           disabled={isProcessing}
                           className="text-xs font-bold text-pink-500 hover:bg-pink-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                        >
                           <i className="fas fa-camera"></i> {t.privateSpace.bucketList.uploadEvidence}
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                     </div>
                     
                     <div className="grid grid-cols-3 gap-3">
                        {currentTodo.images?.map((img, idx) => (
                           <div key={idx} className="aspect-square relative group rounded-xl overflow-hidden shadow-sm bg-slate-100">
                              <img src={img} className="w-full h-full object-cover" />
                              <button 
                                 onClick={() => removeImage(idx)}
                                 className="absolute top-1 right-1 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                              >
                                 <i className="fas fa-times text-[10px]"></i>
                              </button>
                           </div>
                        ))}
                        {(currentTodo.images?.length === 0) && (
                           <div className="col-span-3 h-24 border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center text-slate-300 text-xs">
                              No photos yet
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Footer Actions */}
               <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                  {isEditing ? (
                     <button 
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-600 text-xs font-bold uppercase px-2 transition-colors"
                     >
                        {t.privateSpace.bucketList.delete}
                     </button>
                  ) : <div></div>}
                  
                  <button 
                     onClick={handleSave}
                     disabled={isProcessing || !currentTodo.todo}
                     className="px-8 py-3 bg-rose-500 text-white font-bold rounded-xl shadow-lg hover:bg-rose-600 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                     {isProcessing && <i className="fas fa-circle-notch fa-spin"></i>}
                     {isEditing ? t.privateSpace.bucketList.update : t.privateSpace.bucketList.save}
                  </button>
               </div>
            </div>
         </div>,
         document.body
      )}
    </div>
  );
};
