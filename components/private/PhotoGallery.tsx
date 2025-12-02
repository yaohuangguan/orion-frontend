
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../i18n/LanguageContext';
import { apiService } from '../../services/api';
import { Photo } from '../../types';
import { toast } from '../Toast';
import { DeleteModal } from '../DeleteModal';

export const PhotoGallery: React.FC = () => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // State for Edit/Delete actions
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<Photo | null>(null);

  // State for New Upload Modal
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadDate, setUploadDate] = useState('');
  
  // Dragging State
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragItemDim, setDragItemDim] = useState({ w: 0, h: 0 });

  const photosRef = useRef<Photo[]>([]);
  photosRef.current = photos;

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPointerDown = useRef(false);
  const wasDragging = useRef(false);
  const pointerStartPos = useRef({ x: 0, y: 0 });
  
  // Ref to hold the photo attempting to be dragged
  const pendingDrag = useRef<{ photo: Photo, target: HTMLElement } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
  }, []);

  const loadPhotos = async () => {
    try {
      const data = await apiService.getPhotos();
      setPhotos(data);
    } catch (e) {
      console.error(e);
      // Keep state clean on error
    } finally {
      setIsLoading(false);
    }
  };

  const startDrag = (photo: Photo, target: HTMLElement, startX: number, startY: number) => {
    const rect = target.getBoundingClientRect();
    setDragId(photo._id);
    setDragItemDim({ w: rect.width, h: rect.height });
    setDragStart({ x: startX, y: startY });
    
    // Offset logic: Overlay should appear exactly over the original item
    setDragOffset({ 
      x: startX - rect.left, 
      y: startY - rect.top 
    });
    
    if (navigator.vibrate) navigator.vibrate(50);
  };

  const handlePointerDown = (e: React.PointerEvent, photo: Photo) => {
    if (editingPhotoId || isUploading) return;
    
    // Only left click
    if (e.button !== 0) return;

    isPointerDown.current = true;
    pointerStartPos.current = { x: e.clientX, y: e.clientY };
    wasDragging.current = false;
    pendingDrag.current = { photo, target: e.currentTarget as HTMLElement };
    
    // Clear any existing timer
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    // If Touch: Wait for Long Press
    if (e.pointerType === 'touch') {
      longPressTimer.current = setTimeout(() => {
        if (isPointerDown.current) {
          startDrag(photo, e.currentTarget as HTMLElement, e.clientX, e.clientY);
        }
      }, 400); // 400ms Long Press for touch
    }
    // If Mouse: We wait for movement in handleGlobalMove
  };

  // Global Pointer Event Listeners
  useEffect(() => {
    const handleGlobalMove = (e: PointerEvent) => {
      if (!isPointerDown.current) return;

      if (dragId) {
        // --- DRAGGING LOGIC ---
        e.preventDefault(); 
        wasDragging.current = true;

        // Update visual position of overlay
        setDragStart({ x: e.clientX, y: e.clientY });

        // Calculate Swap
        // Get element under cursor (exclude the overlay itself via pointer-events: none)
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        const targetEl = elements.find(el => el.getAttribute('data-photo-id'));
        
        if (targetEl) {
          const targetId = targetEl.getAttribute('data-photo-id');
          if (targetId && targetId !== dragId) {
             // Perform Swap
             const currentList = [...photosRef.current];
             const fromIdx = currentList.findIndex(p => p._id === dragId);
             const toIdx = currentList.findIndex(p => p._id === targetId);
             
             if (fromIdx !== -1 && toIdx !== -1) {
                const [item] = currentList.splice(fromIdx, 1);
                currentList.splice(toIdx, 0, item);
                setPhotos(currentList);
             }
          }
        }
      } else {
        // --- PRE-DRAG LOGIC ---
        // Calculate movement distance
        const d = Math.hypot(e.clientX - pointerStartPos.current.x, e.clientY - pointerStartPos.current.y);
        
        if (e.pointerType !== 'touch') {
           // MOUSE: Start dragging immediately if moved > 5px
           if (d > 5 && pendingDrag.current) {
               startDrag(pendingDrag.current.photo, pendingDrag.current.target, e.clientX, e.clientY);
           }
        } else {
           // TOUCH: If moved enough before long-press fires, cancel it (user is scrolling)
           if (d > 10) {
              if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
              }
           }
        }
      }
    };

    const handleGlobalUp = async () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      
      isPointerDown.current = false;
      pendingDrag.current = null;
      
      if (dragId) {
         // Finished Dragging
         const currentOrderIds = photosRef.current.map(p => p._id);
         setDragId(null);
         wasDragging.current = true;

         // Persist order
         try {
            await apiService.reorderPhotos(currentOrderIds);
            toast.success("Order updated");
         } catch(err) {
            console.error(err);
            toast.error("Failed to save order");
            loadPhotos(); // Revert on failure
         }

         // Tiny delay to ensure the 'click' handler knows we just dragged
         setTimeout(() => { wasDragging.current = false; }, 100);
      }
    };

    window.addEventListener('pointermove', handleGlobalMove, { passive: false });
    window.addEventListener('pointerup', handleGlobalUp);
    // Also listen for cancel (scrolling taking over)
    window.addEventListener('pointercancel', handleGlobalUp);

    return () => {
      window.removeEventListener('pointermove', handleGlobalMove);
      window.removeEventListener('pointerup', handleGlobalUp);
      window.removeEventListener('pointercancel', handleGlobalUp);
    };
  }, [dragId]); 

  const handleUploadClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Open Modal instead of immediate upload
    setPendingFile(file);
    setUploadName("Sweet Memory");
    // Default to today
    setUploadDate(new Date().toISOString().split('T')[0]);
    
    // Reset input so change event triggers again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const confirmUpload = async () => {
    if (!pendingFile || !uploadName) return;

    setIsUploading(true);
    try {
      // This calls POST /photos with name and date
      const updatedList = await apiService.addPhoto(pendingFile, uploadName, uploadDate);
      setPhotos(updatedList);
      toast.success("Photo pinned to the board!");
      setPendingFile(null); // Close Modal
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photo");
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setUploadName('');
    setUploadDate('');
  };

  const handleReplaceClick = () => {
    if (replaceInputRef.current) replaceInputRef.current.click();
  };

  const handleReplaceFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingPhotoId) return;

    setIsUploading(true);
    try {
       // Only update the URL (image), keep name same unless user edits it in text field separately
       const updatedList = await apiService.updatePhoto(editingPhotoId, undefined, file);
       setPhotos(updatedList);
       // Do not close edit mode immediately so they see the change
    } catch (err) {
      console.error(err);
      toast.error("Failed to replace photo");
    } finally {
      setIsUploading(false);
      if (replaceInputRef.current) replaceInputRef.current.value = "";
    }
  };

  // Handles Saving changes (Name & Date) from the Edit Card
  const handleSaveUpdate = async (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newName = formData.get('photoName') as string;
    const newDate = formData.get('photoDate') as string;

    try {
      const updatedList = await apiService.updatePhoto(id, newName, undefined, newDate);
      setPhotos(updatedList);
      setEditingPhotoId(null);
      toast.success("Memory updated!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update memory");
    }
  };

  const handleDelete = async () => {
    if (!photoToDelete) return;
    try {
      const updatedList = await apiService.deletePhoto(photoToDelete._id);
      setPhotos(updatedList);
      setPhotoToDelete(null);
      setEditingPhotoId(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete photo");
    }
  };

  // Generate random rotations for organic feel (memoized-ish by index)
  const getRandomRotation = (index: number) => {
    const seed = index * 1337;
    const deg = (seed % 10) - 5; // -5 to +5 degrees
    return `rotate(${deg}deg)`;
  };

  const formatDateValue = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Calculate total slots (20 total)
  const TOTAL_SLOTS = 20;
  const displayItems = [...photos];
  const emptySlotsCount = Math.max(0, TOTAL_SLOTS - photos.length);
  const emptySlots = Array(emptySlotsCount).fill(null);

  // Find the dragged item for overlay
  const draggingPhoto = photos.find(p => p._id === dragId);

  return (
    <div className="h-full min-h-[80vh] bg-[#4a3728] relative rounded-[2rem] shadow-2xl overflow-hidden border-8 border-[#3e2c22]">
      <DeleteModal 
        isOpen={!!photoToDelete} 
        onClose={() => setPhotoToDelete(null)} 
        onConfirm={handleDelete}
        title={t.privateSpace.gallery.deleteConfirm || "Remove Photo?"}
      />

      {/* Upload Modal Overlay */}
      {pendingFile && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-xl font-bold text-slate-800 mb-4">{t.privateSpace.gallery.pinTitle}</h3>
              
              <div className="space-y-4">
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.privateSpace.gallery.captionLabel}</label>
                    <input 
                      type="text" 
                      value={uploadName} 
                      onChange={(e) => setUploadName(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-amber-500 font-handwriting text-lg"
                      placeholder={t.privateSpace.gallery.captionPlaceholder}
                      autoFocus
                    />
                 </div>
                 
                 <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">{t.privateSpace.gallery.dateLabel}</label>
                    <input 
                      type="date" 
                      value={uploadDate} 
                      onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-amber-500 text-slate-600"
                    />
                 </div>

                 <div className="flex gap-3 pt-2">
                    <button 
                      onClick={cancelUpload}
                      className="flex-1 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      {t.comments.cancel}
                    </button>
                    <button 
                      onClick={confirmUpload}
                      disabled={isUploading || !uploadName}
                      className="flex-1 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                      {isUploading ? <i className="fas fa-circle-notch fa-spin"></i> : t.privateSpace.gallery.pinButton}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Wood Texture Overlay */}
      <div 
        className="absolute inset-0 opacity-40 pointer-events-none z-0"
        style={{
          backgroundImage: `url("https://www.transparenttextures.com/patterns/wood-pattern.png")`,
          backgroundSize: '300px'
        }}
      ></div>

      {/* Christmas / Neon Lights String */}
      <div className="absolute top-0 left-0 w-full h-24 z-10 pointer-events-none">
         <svg className="w-full h-full" preserveAspectRatio="none">
            <path d="M0,10 Q150,50 300,10 T600,10 T900,10 T1200,10 T1500,10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
         </svg>
         {/* Lights */}
         <div className="absolute top-2 left-[10%] w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444] animate-pulse"></div>
         <div className="absolute top-8 left-[20%] w-3 h-3 rounded-full bg-green-500 shadow-[0_0_15px_#22c55e] animate-pulse" style={{ animationDelay: '0.5s' }}></div>
         <div className="absolute top-2 left-[30%] w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_15px_#eab308] animate-pulse" style={{ animationDelay: '1s' }}></div>
         <div className="absolute top-8 left-[40%] w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_15px_#3b82f6] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
         <div className="absolute top-2 left-[50%] w-3 h-3 rounded-full bg-pink-500 shadow-[0_0_15px_#ec4899] animate-pulse" style={{ animationDelay: '0.2s' }}></div>
         <div className="absolute top-8 left-[60%] w-3 h-3 rounded-full bg-purple-500 shadow-[0_0_15px_#a855f7] animate-pulse" style={{ animationDelay: '0.7s' }}></div>
      </div>

      {/* Header */}
      <div className="relative z-20 p-8 flex justify-between items-center bg-black/20 backdrop-blur-sm border-b border-white/10">
         <div>
            <h2 className="text-3xl font-display font-bold text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
               {t.privateSpace.gallery.title}
            </h2>
            <p className="text-white/60 text-sm font-mono mt-1">
               {t.privateSpace.gallery.subtitle}
            </p>
         </div>
         <div className="flex gap-4">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleFileChange}
            />
            {/* Hidden Input for Replacements */}
            <input 
              type="file" 
              ref={replaceInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleReplaceFileChange}
            />
            
            <button 
              onClick={handleUploadClick}
              disabled={isUploading || !!pendingFile || photos.length >= TOTAL_SLOTS}
              className="px-6 py-2 bg-white text-[#4a3728] rounded-full font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.4)] hover:bg-amber-100 hover:scale-105 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isUploading ? <i className="fas fa-circle-notch fa-spin"></i> : <i className="fas fa-camera"></i>}
              {t.privateSpace.gallery.upload}
            </button>
         </div>
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#4a3728] rounded-[2rem]">
           <i className="fas fa-circle-notch fa-spin text-4xl text-amber-500 mb-4"></i>
           <p className="text-amber-100 font-handwriting text-xl animate-pulse">{t.privateSpace.gallery.developing}</p>
        </div>
      )}

      {/* DRAG OVERLAY PORTAL (Fixed Position) */}
      {draggingPhoto && (
         <div 
           className="fixed z-[9999] pointer-events-none opacity-90 shadow-2xl scale-110"
           style={{
             top: dragStart.y - dragOffset.y,
             left: dragStart.x - dragOffset.x,
             width: dragItemDim.w,
             height: dragItemDim.h,
             transform: 'rotate(5deg)'
           }}
         >
             <div className="bg-white p-3 pb-4 shadow-xl w-full h-full flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md border border-black/20"></div>
                <div className="aspect-[4/5] bg-slate-200 overflow-hidden mb-3 border border-slate-100 flex-shrink-0">
                    <img src={draggingPhoto.url} alt="Drag Preview" className="w-full h-full object-cover" />
                </div>
                <div className="text-center font-handwriting text-[#4a3728] flex-1 overflow-hidden">
                   <p className="font-bold text-lg leading-none mb-1 truncate">{draggingPhoto.name || draggingPhoto.caption}</p>
                </div>
             </div>
         </div>
      )}

      {/* Scrollable Corkboard Area */}
      <div className="relative z-10 p-8 overflow-y-auto h-[calc(100%-6rem)] custom-scrollbar touch-pan-y">
         <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8 p-4">
             {/* Render Photos */}
             {displayItems.map((photo, idx) => {
               const isEditing = editingPhotoId === photo._id;
               const isDragging = dragId === photo._id;
               
               return (
                 <div 
                   key={photo._id || idx}
                   data-photo-id={photo._id}
                   className={`relative group bg-white p-3 pb-4 shadow-xl transition-all duration-300 select-none ${isEditing ? 'z-40 scale-110 ring-4 ring-pink-400' : 'hover:scale-105 hover:z-30'}`}
                   style={{ 
                     transform: isEditing ? 'none' : getRandomRotation(idx),
                     opacity: isDragging ? 0 : 1 // Hide original when dragging
                   }}
                   onPointerDown={(e) => handlePointerDown(e, photo)}
                   onClick={() => {
                      if (wasDragging.current) return; // Ignore click if dragging occurred
                      if (!isEditing && !isDragging) setEditingPhotoId(photo._id);
                   }}
                 >
                   {/* Thumbtack */}
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-red-600 shadow-md z-20 border border-black/20"></div>
                   
                   {/* Image */}
                   <div className="aspect-[4/5] bg-slate-200 overflow-hidden mb-3 border border-slate-100 relative group/img pointer-events-none">
                      <img 
                        src={photo.url} 
                        alt={photo.name || photo.caption} 
                        className={`w-full h-full object-cover transition-all duration-500 ${isEditing ? 'grayscale-0' : 'grayscale-[0.2] group-hover:grayscale-0'}`} 
                        draggable={false}
                      />
                      
                      {/* Replace Button (Only in Edit Mode) */}
                      {isEditing && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity pointer-events-auto">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleReplaceClick();
                             }}
                             className="px-3 py-1 bg-white text-black text-xs font-bold uppercase rounded shadow-lg hover:bg-amber-100"
                           >
                             {t.privateSpace.gallery.replace || "Replace"}
                           </button>
                        </div>
                      )}
                   </div>
                   
                   {/* Content */}
                   {isEditing ? (
                      <form onSubmit={(e) => handleSaveUpdate(e, photo._id)} className="flex flex-col gap-2 pointer-events-auto" onClick={e => e.stopPropagation()}>
                         {/* Name Input - Pink Color */}
                         <input 
                           name="photoName"
                           defaultValue={photo.name || photo.caption}
                           className="w-full text-center font-handwriting text-lg border-b border-pink-200 focus:border-pink-500 outline-none bg-transparent text-pink-600 placeholder-pink-300"
                           placeholder="Caption..."
                           autoFocus
                         />
                         
                         {/* Date Input */}
                         <input 
                           name="photoDate"
                           type="date"
                           defaultValue={formatDateValue(photo.createdDate || photo.date)}
                           className="w-full text-center text-xs text-slate-500 border-b border-pink-100 focus:border-pink-400 outline-none bg-transparent pb-1"
                         />

                         <div className="flex justify-between gap-2 mt-2">
                           <button 
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               setPhotoToDelete(photo);
                             }}
                             className="text-red-500 hover:text-red-700 text-xs font-bold uppercase"
                           >
                             {t.privateSpace.gallery.delete || "Delete"}
                           </button>
                           
                           {/* Hidden submit to allow 'Enter' key */}
                           <button type="submit" className="hidden"></button>

                           <button 
                             type="submit"
                             className="text-emerald-500 hover:text-emerald-700 text-xs font-bold uppercase"
                           >
                             Save
                           </button>
                           
                           <button 
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               setEditingPhotoId(null);
                             }}
                             className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase"
                           >
                             {t.comments.cancel}
                           </button>
                         </div>
                      </form>
                   ) : (
                      <div className="text-center font-handwriting text-[#4a3728]">
                        <p className="font-bold text-lg leading-none mb-1 truncate">{photo.name || photo.caption}</p>
                        <p className="text-xs opacity-60 font-sans">
                           {photo.createdDate || photo.date ? new Date(photo.createdDate || photo.date || '').toLocaleDateString() : 'Unknown Date'} 
                        </p>
                      </div>
                   )}
                 </div>
               );
             })}

             {/* Render Empty Slots */}
             {emptySlots.map((_, idx) => (
                <div 
                   key={`empty-${idx}`}
                   className="relative bg-black/10 p-3 pb-4 shadow-inner opacity-50 border-2 border-dashed border-[#5e4b35] rounded"
                >
                   <div className="aspect-[4/5] flex items-center justify-center">
                      <span className="text-[#5e4b35] font-handwriting opacity-50 text-xl transform -rotate-12">{t.privateSpace.gallery.reserved}</span>
                   </div>
                   <div className="text-center mt-2">
                      <div className="h-2 w-16 bg-[#5e4b35] mx-auto rounded opacity-20"></div>
                   </div>
                </div>
             ))}
           </div>
       </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
        .font-handwriting {
          font-family: 'Caveat', cursive;
        }
      `}</style>
    </div>
  );
};