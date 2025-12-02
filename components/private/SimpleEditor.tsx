


import React, { useReducer, useEffect, useRef, useState } from 'react';
import { apiService } from '../../services/api';
import { User, BlogPost } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { toast } from '../Toast';
import Quill from 'quill';

interface SimpleEditorProps {
  user?: User | null;
  onPostCreated?: () => void;
  editingPost?: BlogPost | null;
  onCancelEdit?: () => void;
}

// Constants for Reducer
const C = {
  CONTENT: 'CONTENT',
  AUTHOR: 'AUTHOR',
  CODE: 'CODE',
  INFO: 'INFO',
  TITLE: 'TITLE',
  TAGS: 'TAGS',
  ISPRIVATE: 'ISPRIVATE',
  LOADING: 'LOADING',
  RESET: 'RESET',
  SET_ALL: 'SET_ALL'
};

const INITIAL_STATE = {
  content: "",
  author: "",
  code: "",
  info: "",
  title: "",
  tags: "",
  isPrivate: true,
  loading: false,
};

const reducer = (state: any, action: any) => {
  const { type, payload } = action;
  switch (type) {
    case C.CONTENT:
      return { ...state, content: payload };
    case C.AUTHOR:
      return { ...state, author: payload };
    case C.CODE:
      return { ...state, code: payload };
    case C.INFO:
      return { ...state, info: payload };
    case C.TITLE:
      return { ...state, title: payload };
    case C.TAGS:
      return { ...state, tags: payload };
    case C.ISPRIVATE:
      return { ...state, isPrivate: payload };
    case C.LOADING:
      return { ...state, loading: payload };
    case C.SET_ALL:
      return { ...state, ...payload };
    case C.RESET:
      return INITIAL_STATE;
    default:
      return state;
  }
};

export const SimpleEditor: React.FC<SimpleEditorProps> = ({ user, onPostCreated, editingPost, onCancelEdit }) => {
  const { t } = useTranslation();
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstance = useRef<any>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  // Initialize state with cached values if available and NOT editing
  const getInitialState = () => {
    if (editingPost) {
      return {
        ...INITIAL_STATE,
        title: editingPost.name,
        author: editingPost.author,
        info: editingPost.info,
        tags: editingPost.tags.join(' '),
        isPrivate: editingPost.isPrivate,
        content: editingPost.content || '',
        code: editingPost.code || editingPost.codeGroup || '',
      };
    }
    
    return {
      ...INITIAL_STATE,
      content: localStorage.getItem("cachedText") || "",
      author: localStorage.getItem("authorText") || user?.displayName || "Sam",
      code: localStorage.getItem("codeText") || "",
      info: localStorage.getItem("infoText") || "",
      title: localStorage.getItem("titleText") || "",
      tags: localStorage.getItem("tagText") || "",
    };
  };

  const [state, dispatch] = useReducer(reducer, null, getInitialState);

  const {
    content,
    author,
    code,
    info,
    title,
    tags,
    isPrivate,
    loading,
  } = state;

  // Initialize Quill
  useEffect(() => {
    if (editorRef.current && !quillInstance.current) {
        quillInstance.current = new Quill(editorRef.current, {
            theme: 'snow',
            placeholder: t.privateSpace.editor.tellStory,
            modules: {
                syntax: true, // Enable syntax highlighting (Highlight.js)
                toolbar: [
                    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                    [{ 'font': [] }],
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'script': 'sub' }, { 'script': 'super' }],
                    ['blockquote', 'code-block'],
                    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                    [{ 'indent': '-1' }, { 'indent': '+1' }, { 'align': [] }],
                    ['link', 'image', 'video', 'formula'],
                    ['clean']
                ]
            }
        });

        // Set Initial Content
        if (content) {
            quillInstance.current.root.innerHTML = content;
        }

        // Listen for changes
        quillInstance.current.on('text-change', () => {
             const html = quillInstance.current.root.innerHTML;
             dispatch({ type: C.CONTENT, payload: html });
        });
    }
  }, []);

  // Robust Auto-Save (Debounced)
  useEffect(() => {
    if (editingPost) return;

    // We use a longer timeout for auto-save (2s) to avoid spamming while typing
    const handler = setTimeout(() => {
      // Only save if there is actually content to save
      if (content || title || info || code) {
        setIsAutoSaving(true);
        localStorage.setItem("cachedText", content);
        localStorage.setItem("authorText", author);
        localStorage.setItem("codeText", code);
        localStorage.setItem("infoText", info);
        localStorage.setItem("titleText", title);
        localStorage.setItem("tagText", tags);
        
        // Visual delay to let user see "Saving..." briefly
        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSavedTime(new Date().toLocaleTimeString());
        }, 800);
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [content, author, code, info, title, tags, editingPost]);

  const handleManualSave = () => {
    if (editingPost) return;
    setIsAutoSaving(true);
    localStorage.setItem("cachedText", content);
    localStorage.setItem("authorText", author);
    localStorage.setItem("codeText", code);
    localStorage.setItem("infoText", info);
    localStorage.setItem("titleText", title);
    localStorage.setItem("tagText", tags);
    
    setTimeout(() => {
        setIsAutoSaving(false);
        setLastSavedTime(new Date().toLocaleTimeString());
        toast.info("Draft saved manually.");
    }, 500);
  };

  const handleFormSubmit = async () => {
    if (title.trim() == "" || tags.trim() == "") {
      toast.error("Title and Tags are required.");
      return;
    }

    try {
      dispatch({ type: C.LOADING, payload: true });
      
      const payload = {
        name: title,
        info: info || content.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...',
        author,
        content,
        tags: tags,
        code,
        isPrivate,
        // Explicitly send local time to ensure date matches user's timezone
        date: new Date().toISOString()
      };

      if (editingPost) {
        await apiService.updatePost(editingPost._id, payload);
        toast.success("Entry updated successfully!");
      } else {
        await apiService.createPost(payload);
        toast.success("Entry published successfully!");
        
        // Clear Cache
        localStorage.removeItem("cachedText");
        localStorage.removeItem("codeText");
        localStorage.removeItem("authorText");
        localStorage.removeItem("infoText");
        localStorage.removeItem("titleText");
        localStorage.removeItem("tagText");
        
        // Reset State
        dispatch({ type: C.RESET });
        if (quillInstance.current) {
            quillInstance.current.setText('');
        }
        setLastSavedTime(null);
      }

      if (onPostCreated) onPostCreated();

    } catch (error) {
      console.error(error);
      toast.error("Failed to save. Please try again.");
    } finally {
      dispatch({ type: C.LOADING, payload: false });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] border border-rose-100 shadow-xl overflow-hidden relative">
      
      {/* HEADER: Title & Metadata */}
      <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 space-y-4 shrink-0 z-20 bg-white">
         <div className="flex items-center justify-between gap-2">
           <input 
             type="text" 
             value={title}
             onChange={(e) => dispatch({ type: C.TITLE, payload: e.target.value })}
             placeholder={t.privateSpace.editor.titlePlaceholder}
             className="w-full text-2xl md:text-4xl font-display font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent"
           />
           <div className="flex items-center gap-2">
             {/* Auto-save Indicator */}
             {!editingPost && (
                <div className="flex items-center gap-2 mr-2">
                   {isAutoSaving ? (
                     <span className="text-xs font-mono text-amber-500 animate-pulse hidden sm:flex items-center gap-1">
                       <i className="fas fa-sync fa-spin"></i> {t.privateSpace.editor.saving}
                     </span>
                   ) : lastSavedTime ? (
                     <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">
                       {t.privateSpace.editor.saved} {lastSavedTime}
                     </span>
                   ) : null}
                </div>
             )}

             {!editingPost && (
                <button
                  onClick={handleManualSave}
                  className="px-3 py-1 bg-blue-50 text-blue-500 rounded-lg text-xs font-bold uppercase hover:bg-blue-100 shrink-0 transition-colors"
                  title="Save draft to local storage"
                >
                  <i className="fas fa-save md:mr-1"></i> <span className="hidden md:inline">{t.privateSpace.editor.saveDraft}</span>
                </button>
             )}
             {editingPost && (
               <button 
                 onClick={() => {
                   onCancelEdit && onCancelEdit();
                   dispatch({ type: C.RESET });
                 }}
                 className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-xs font-bold uppercase hover:bg-slate-200 shrink-0 transition-colors"
               >
                 {t.privateSpace.editor.cancel}
               </button>
             )}
           </div>
         </div>
         
         {/* Metadata Row */}
         <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 text-sm">
            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all">
               <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">{t.privateSpace.editor.author}</label>
               <input 
                 type="text" 
                 value={author}
                 onChange={(e) => dispatch({ type: C.AUTHOR, payload: e.target.value })}
                 className="bg-transparent outline-none w-full font-medium text-slate-700"
               />
            </div>

            <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all md:col-span-2">
               <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">{t.privateSpace.editor.tags}</label>
               <input 
                 type="text" 
                 value={tags}
                 onChange={(e) => dispatch({ type: C.TAGS, payload: e.target.value })}
                 className="bg-transparent outline-none w-full font-medium text-slate-700"
               />
            </div>

            <div 
              className={`rounded-lg px-3 py-2 border cursor-pointer transition-all flex flex-col justify-center ${isPrivate ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}
              onClick={() => dispatch({ type: C.ISPRIVATE, payload: !isPrivate })}
            >
               <div className="flex items-center justify-between">
                 <span className={`text-xs font-bold uppercase ${isPrivate ? 'text-rose-500' : 'text-slate-500'}`}>
                   {isPrivate ? t.privateSpace.editor.private : t.privateSpace.editor.public}
                 </span>
                 <div className={`w-8 h-4 rounded-full relative transition-colors ${isPrivate ? 'bg-rose-400' : 'bg-slate-300'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isPrivate ? 'left-4.5' : 'left-0.5'}`} style={{ left: isPrivate ? '1.1rem' : '0.1rem'}}></div>
                 </div>
               </div>
            </div>
         </div>
         
         {/* Extended Metadata: Info & Code */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
             <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 focus-within:border-rose-300">
               <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">{t.privateSpace.editor.summary}</label>
               <input 
                 type="text" 
                 value={info}
                 onChange={(e) => dispatch({ type: C.INFO, payload: e.target.value })}
                 className="bg-transparent outline-none w-full text-sm text-slate-700"
                 placeholder="..."
               />
             </div>
             <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 focus-within:border-rose-300">
               <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">{t.privateSpace.editor.code}</label>
               <input 
                 type="text" 
                 value={code}
                 onChange={(e) => dispatch({ type: C.CODE, payload: e.target.value })}
                 className="bg-transparent outline-none w-full text-sm font-mono text-slate-700"
                 placeholder="..."
               />
             </div>
         </div>
      </div>

      {/* EDITOR AREA - Flex structure ensuring toolbar sticks and body scrolls */}
      <div className="flex-1 min-h-0 relative bg-white flex flex-col">
        {/* The Quill container will be mounted here. 
            We use CSS in index.html to target .ql-toolbar (sticky) and .ql-container (scrollable) 
        */}
        <div ref={editorRef} className="h-full border-none" />
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-4 right-4 md:bottom-6 md:right-8 flex items-center gap-4 z-20 pointer-events-none">
         <div className="pointer-events-auto flex items-center gap-4">
            <span className="text-xs font-mono text-slate-300 uppercase tracking-widest bg-white/80 px-2 py-1 rounded backdrop-blur hidden md:inline-block">
                {content.length} {t.privateSpace.editor.chars}
            </span>
            <button 
              onClick={handleFormSubmit}
              disabled={loading}
              className="px-6 md:px-8 py-3 bg-rose-500 text-white text-xs md:text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 hover:shadow-rose-300/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {loading ? (
                <>
                  <i className="fas fa-circle-notch fa-spin"></i> <span className="hidden md:inline">{t.privateSpace.editor.processing}</span>
                </>
              ) : (
                editingPost ? t.privateSpace.editor.update : t.privateSpace.editor.publish
              )}
            </button>
         </div>
      </div>
    </div>
  );
};
