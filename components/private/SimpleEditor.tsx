import React, { useReducer, useEffect, useState, useRef } from 'react';
import { apiService } from '../../services/api';
import { User, BlogPost, Tag } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { toast } from '../Toast';
import { ZenEditor } from './ZenEditor';
import { JournalTemplates, JournalTemplate } from './JournalTemplates';

interface SimpleEditorProps {
  user?: User | null;
  onPostCreated?: () => void;
  editingPost?: BlogPost | null;
  onCancelEdit?: () => void;
  onPreviewChange?: (data: {
    title: string;
    content: string;
    tags: string[];
    date: string;
  }) => void;
}

// Constants for Reducer
const C = {
  CONTENT: 'CONTENT',
  AUTHOR: 'AUTHOR',
  INFO: 'INFO',
  TITLE: 'TITLE',
  TAGS: 'TAGS',
  ISPRIVATE: 'ISPRIVATE',
  LOADING: 'LOADING',
  RESET: 'RESET',
  SET_ALL: 'SET_ALL',
  APPLY_TEMPLATE: 'APPLY_TEMPLATE'
};

const INITIAL_STATE = {
  content: '',
  author: '',
  info: '',
  title: '',
  tags: '',
  isPrivate: true,
  loading: false,
  editorKey: 0
};

const reducer = (state: any, action: any) => {
  const { type, payload } = action;
  switch (type) {
    case C.CONTENT:
      return { ...state, content: payload };
    case C.AUTHOR:
      return { ...state, author: payload };
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
    case C.APPLY_TEMPLATE:
      return {
        ...state,
        title: payload.title,
        content: payload.content,
        tags: payload.tags,
        editorKey: (state.editorKey || 0) + 1
      };
    case C.RESET:
      return INITIAL_STATE;
    default:
      return state;
  }
};

export const SimpleEditor: React.FC<SimpleEditorProps> = ({
  user,
  onPostCreated,
  editingPost,
  onCancelEdit,
  onPreviewChange
}) => {
  const { t } = useTranslation();
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  // History Stack for Undo/Redo (Main State Only)
  const [history, setHistory] = useState<any[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const ignoreHistoryRef = useRef(false);

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
        content: editingPost.content || ''
      };
    }

    return {
      ...INITIAL_STATE,
      content: localStorage.getItem('cachedText') || '',
      author: localStorage.getItem('authorText') || user?.displayName || 'Sam',
      info: localStorage.getItem('infoText') || '',
      title: localStorage.getItem('titleText') || '',
      tags: localStorage.getItem('tagText') || ''
    };
  };

  const [state, dispatch] = useReducer(reducer, null, getInitialState);

  const { content, author, info, title, tags, isPrivate, loading, editorKey } = state;

  // History Snapshots (Debounced slightly or on specific actions)
  const addToHistory = (newState: any) => {
    // Basic implementation: Keep last 20 states
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    if (newHistory.length > 20) newHistory.shift();
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      ignoreHistoryRef.current = true;
      dispatch({ type: C.SET_ALL, payload: prev });
      setHistoryIndex(historyIndex - 1);
      setTimeout(() => {
        ignoreHistoryRef.current = false;
      }, 100);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      ignoreHistoryRef.current = true;
      dispatch({ type: C.SET_ALL, payload: next });
      setHistoryIndex(historyIndex + 1);
      setTimeout(() => {
        ignoreHistoryRef.current = false;
      }, 100);
    }
  };

  const handleClearAll = () => {
    // Save current state before clearing for Undo
    if (!ignoreHistoryRef.current) addToHistory(state);

    dispatch({ type: C.RESET });
    // Restore author if needed or just blank everything
    // The RESET action sets it to INITIAL_STATE, which has author="".
    // If we want to keep author, we can re-dispatch. But "Clear All" usually implies clear everything.

    // Clear cache too
    localStorage.removeItem('cachedText');
    localStorage.removeItem('titleText');
    localStorage.removeItem('tagText');
    localStorage.removeItem('infoText');

    toast.info('Editor cleared.');
  };

  // Init History
  useEffect(() => {
    if (history.length === 0) {
      addToHistory(state);
    }
  }, []);

  // Load Tags (Fetch 'all' to allow mixing public/private tags easily in editor)
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const data = await apiService.getTags('all');
        setAvailableTags(data);
      } catch (e) {
        console.error('Tags fetch error', e);
      }
    };
    fetchTags();
  }, []);

  // Broadcast changes for Preview
  useEffect(() => {
    if (onPreviewChange) {
      onPreviewChange({
        title,
        content,
        tags: tags.split(' ').filter((t: string) => t),
        date: editingPost?.createdAt || editingPost?.date || new Date().toISOString()
      });
    }
  }, [title, content, tags, editingPost, onPreviewChange]);

  // Robust Auto-Save (Debounced)
  useEffect(() => {
    if (editingPost) return;

    const handler = setTimeout(() => {
      if (content || title || info) {
        setIsAutoSaving(true);
        localStorage.setItem('cachedText', content);
        localStorage.setItem('authorText', author);
        localStorage.setItem('infoText', info);
        localStorage.setItem('titleText', title);
        localStorage.setItem('tagText', tags);

        setTimeout(() => {
          setIsAutoSaving(false);
          setLastSavedTime(new Date().toLocaleTimeString());
        }, 800);
      }
    }, 2000);

    return () => clearTimeout(handler);
  }, [content, author, info, title, tags, editingPost]);

  const handleManualSave = () => {
    if (editingPost) return;
    setIsAutoSaving(true);
    localStorage.setItem('cachedText', content);
    localStorage.setItem('authorText', author);
    localStorage.setItem('infoText', info);
    localStorage.setItem('titleText', title);
    localStorage.setItem('tagText', tags);

    setTimeout(() => {
      setIsAutoSaving(false);
      setLastSavedTime(new Date().toLocaleTimeString());
      toast.info('Draft saved manually.');
    }, 500);
  };

  const handleFormSubmit = async () => {
    if (title.trim() == '' || tags.trim() == '') {
      toast.error('Title and Tags are required.');
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
        isPrivate,
        date: new Date().toISOString()
      };

      if (editingPost) {
        await apiService.updatePost(editingPost._id, payload);
        toast.success('Entry updated successfully!');
      } else {
        await apiService.createPost(payload);
        toast.success('Entry published successfully!');

        // Clear Cache
        localStorage.removeItem('cachedText');
        localStorage.removeItem('infoText');
        localStorage.removeItem('titleText');
        localStorage.removeItem('tagText');

        // Reset State
        dispatch({ type: C.RESET });
        setLastSavedTime(null);
        setHistory([]); // Reset history on submit
      }

      if (onPostCreated) onPostCreated();
    } catch (error) {
      console.error(error);
      toast.error('Failed to save. Please try again.');
    } finally {
      dispatch({ type: C.LOADING, payload: false });
    }
  };

  const addTag = (tagName: string) => {
    const currentTags = tags
      .split(' ')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    if (!currentTags.includes(tagName)) {
      const newTags = [...currentTags, tagName].join(' ');
      dispatch({ type: C.TAGS, payload: newTags });
    }
  };

  const handleTemplateSelect = (template: JournalTemplate) => {
    // Snapshot before apply
    addToHistory(state);

    // Merge existing tags with template tags
    const currentTags = tags
      .split(' ')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    const newTagsSet = new Set([...currentTags, ...template.tags]);
    const mergedTags = Array.from(newTagsSet).join(' ');

    dispatch({
      type: C.APPLY_TEMPLATE,
      payload: {
        title: template.title,
        content: template.content,
        tags: mergedTags
      }
    });

    toast.info(`Applied template: ${template.name}`);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2rem] border border-rose-100 shadow-xl overflow-hidden relative">
      {/* HEADER: Title & Metadata */}
      <div className="px-5 md:px-8 pt-6 md:pt-8 pb-4 space-y-4 shrink-0 z-20 bg-white border-b border-slate-50">
        <div className="flex items-center justify-between gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => dispatch({ type: C.TITLE, payload: e.target.value })}
            placeholder={t.privateSpace.editor.titlePlaceholder}
            className="w-full text-2xl md:text-4xl font-display font-bold text-slate-800 placeholder:text-slate-300 outline-none bg-transparent"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo"
            >
              <i className="fas fa-undo"></i>
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo"
            >
              <i className="fas fa-redo"></i>
            </button>
            <button
              onClick={handleClearAll}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-colors"
              title="Clear All"
            >
              <i className="fas fa-trash-alt"></i>
            </button>

            {!editingPost && (
              <div className="flex items-center gap-2 ml-2 mr-2">
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
                title="Save draft"
              >
                <i className="fas fa-save md:mr-1"></i>{' '}
                <span className="hidden md:inline">{t.privateSpace.editor.saveDraft}</span>
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
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
              {t.privateSpace.editor.author}
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => dispatch({ type: C.AUTHOR, payload: e.target.value })}
              className="bg-transparent outline-none w-full font-medium text-slate-700"
            />
          </div>

          <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 focus-within:border-rose-300 focus-within:ring-2 focus-within:ring-rose-100 transition-all md:col-span-2 relative group">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
              {t.privateSpace.editor.tags}
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => dispatch({ type: C.TAGS, payload: e.target.value })}
              className="bg-transparent outline-none w-full font-medium text-slate-700"
              placeholder="Space separated..."
            />

            {/* Quick Tag Suggestions (On Hover/Focus) */}
            {availableTags.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                <div className="bg-white border border-slate-100 shadow-xl rounded-xl p-2 flex flex-wrap gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                  {availableTags.slice(0, 20).map((tag) => (
                    <button
                      key={tag.name}
                      onClick={() => addTag(tag.name)}
                      className="text-[10px] px-2 py-1 bg-slate-50 hover:bg-rose-50 text-slate-600 hover:text-rose-500 rounded border border-slate-100 transition-colors"
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div
            className={`rounded-lg px-3 py-2 border cursor-pointer transition-all flex flex-col justify-center ${isPrivate ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-100'}`}
            onClick={() => dispatch({ type: C.ISPRIVATE, payload: !isPrivate })}
          >
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase ${isPrivate ? 'text-rose-500' : 'text-slate-500'}`}
              >
                {isPrivate ? t.privateSpace.editor.private : t.privateSpace.editor.public}
              </span>
              <div
                className={`w-8 h-4 rounded-full relative transition-colors ${isPrivate ? 'bg-rose-400' : 'bg-slate-300'}`}
              >
                <div
                  className={`absolute top-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${isPrivate ? 'left-4.5' : 'left-0.5'}`}
                  style={{ left: isPrivate ? '1.1rem' : '0.1rem' }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:gap-4">
          <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 focus-within:border-rose-300">
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-0.5">
              {t.privateSpace.editor.summary}
            </label>
            <input
              type="text"
              value={info}
              onChange={(e) => dispatch({ type: C.INFO, payload: e.target.value })}
              className="bg-transparent outline-none w-full text-sm text-slate-700"
              placeholder="..."
            />
          </div>
          {/* Templates Bar */}
          {!editingPost && (
            <div className="border-t border-slate-50 pt-2">
              <JournalTemplates onSelect={handleTemplateSelect} />
            </div>
          )}
        </div>
      </div>

      {/* EDITOR AREA */}
      <div className="flex-1 min-h-0 relative bg-white flex flex-col p-4 md:p-6 bg-slate-50">
        <ZenEditor
          key={`${title}-${editorKey || 0}`} // Force re-render when template changes title OR template is reapplied (via atomic update)
          initialContent={content}
          onChange={(html) => {
            // Only dispatch change, don't history every key stroke here, handled by ZenEditor internally for text
            dispatch({ type: C.CONTENT, payload: html });
          }}
          placeholder={t.privateSpace.editor.tellStory}
        />
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-6 right-8 md:bottom-8 md:right-10 flex items-center gap-4 z-30 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-4">
          <button
            onClick={handleFormSubmit}
            disabled={loading}
            className="px-6 md:px-8 py-3 bg-rose-500 text-white text-xs md:text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 hover:shadow-rose-300/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
          >
            {loading ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i>{' '}
                <span className="hidden md:inline">{t.privateSpace.editor.processing}</span>
              </>
            ) : editingPost ? (
              t.privateSpace.editor.update
            ) : (
              t.privateSpace.editor.publish
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
