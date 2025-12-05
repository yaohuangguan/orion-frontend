
import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { TodoWidget } from './TodoWidget';
import { PrivateBlogFeed } from './PrivateBlogFeed';
import { SimpleEditor } from './SimpleEditor';
import { DeleteModal } from '../DeleteModal';
import { BlogPost, User, PaginationData } from '../../types';
import { apiService } from '../../services/api';
import { useTranslation } from '../../i18n/LanguageContext';

interface JournalSpaceProps {
  user: User | null;
  blogs: BlogPost[]; // Private Blogs from Parent
  onSelectBlog: (blog: BlogPost) => void;
  onRefresh?: () => void;
  pagination?: PaginationData | null;
  onPageChange?: (page: number) => void;
  onFilterChange?: (search: string, tag: string | null) => void;
  initialSearch?: string;
}

export const JournalSpace: React.FC<JournalSpaceProps> = ({ 
  user, 
  blogs: privateBlogs, 
  onSelectBlog, 
  onRefresh,
  pagination: privatePagination,
  onPageChange: onPrivatePageChange,
  onFilterChange: onPrivateFilterChange,
  initialSearch = ''
}) => {
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  
  // View Source State (Private vs Public)
  const [logSource, setLogSource] = useState<'private' | 'public'>('private');
  
  // Public Logs State
  const [publicBlogs, setPublicBlogs] = useState<BlogPost[]>([]);
  const [publicPagination, setPublicPagination] = useState<PaginationData | null>(null);
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  // Preview Data State
  const [previewData, setPreviewData] = useState<{ title: string, content: string, tags: string[], date: string } | null>(null);
  const [isPreviewHidden, setIsPreviewHidden] = useState(false);

  const { t } = useTranslation();
  
  // Debounce for search
  const searchTimeoutRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  // Fetch Public Logs
  const fetchPublicLogs = async (page = 1, search = searchQuery) => {
    setIsPublicLoading(true);
    try {
      const { data, pagination } = await apiService.getPosts(page, 10, search);
      setPublicBlogs(data);
      setPublicPagination(pagination);
    } catch (e) {
      console.error("Failed to fetch public logs in private space", e);
    } finally {
      setIsPublicLoading(false);
    }
  };

  // Effect: Handle Filter/Search Changes based on Source
  useEffect(() => {
    // Prevent triggering filter change on initial mount if query hasn't changed
    if (isFirstRender.current) {
       isFirstRender.current = false;
       return;
    }

    if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(() => {
        if (logSource === 'private') {
            if (onPrivateFilterChange) onPrivateFilterChange(searchQuery, null);
        } else {
            fetchPublicLogs(1, searchQuery);
        }
    }, 500);

    return () => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery, logSource]);

  // Initial Fetch for Public if switched
  useEffect(() => {
    if (logSource === 'public' && publicBlogs.length === 0) {
        fetchPublicLogs(1);
    }
  }, [logSource]);

  const handleLike = useCallback(async (id: string) => {
    try {
      if (logSource === 'public') {
         await apiService.likePost(id);
         // Optimistic update for public
         setPublicBlogs(prev => prev.map(p => p._id === id ? { ...p, likes: (p.likes || 0) + 1 } : p));
      } else {
         await apiService.likePost(id);
         if (onRefresh) onRefresh();
      }
    } catch (error) {
      console.error("Failed to like post", error);
    }
  }, [onRefresh, logSource]);

  const handlePostCreated = () => {
    setEditingPost(null);
    setPreviewData(null); // Clear preview
    if (onRefresh) {
      onRefresh(); // Refresh private list
    }
    if (logSource === 'public') {
        fetchPublicLogs(1); // Refresh public list if viewing public
    }
  };

  const handleEdit = (blog: BlogPost) => {
    setEditingPost(blog);
    if (window.innerWidth < 1024) {
       setTimeout(() => {
         document.getElementById('private-editor')?.scrollIntoView({ behavior: 'smooth' });
       }, 100);
    }
  };

  const confirmDelete = async (secret?: string) => {
    if (!postToDelete) return;
    try {
      await apiService.deletePost(postToDelete._id, secret);
      setPostToDelete(null);
      if (logSource === 'private' && onRefresh) onRefresh();
      if (logSource === 'public') fetchPublicLogs(publicPagination?.currentPage || 1);
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  const handlePublicPageChange = (page: number) => {
      fetchPublicLogs(page);
  };

  // Determine what to show in the Left Column
  const displayBlogs = logSource === 'private' ? privateBlogs : publicBlogs;
  const displayPagination = logSource === 'private' ? privatePagination : publicPagination;
  const displayPageChange = logSource === 'private' ? onPrivatePageChange : handlePublicPageChange;

  // Helper to detect meaningful content (ignores empty tags like <p><br></p>)
  const hasContent = (data: { title: string, content: string } | null) => {
      if (!data) return false;
      const title = data.title?.trim();
      const rawContent = data.content || '';
      // Strip tags to check for text, also remove non-breaking spaces
      const textContent = rawContent.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      // Check for media
      const hasMedia = rawContent.includes('<img') || rawContent.includes('<iframe') || rawContent.includes('<video');
      
      return !!title || textContent.length > 0 || hasMedia;
  };

  // Reset hidden state when content is cleared
  useEffect(() => {
    if (!hasContent(previewData)) {
        setIsPreviewHidden(false);
    }
  }, [previewData]);

  // Check if we should show preview: Must have data AND meaningful content AND not hidden
  const hasActiveContent = hasContent(previewData);
  const showPreview = previewData && hasActiveContent && !isPreviewHidden;

  // Render Preview Content - Direct HTML since Quill outputs HTML
  const renderedPreview = previewData?.content || '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10 lg:pb-0 h-full min-h-0">
      <DeleteModal 
        isOpen={!!postToDelete} 
        onClose={() => setPostToDelete(null)} 
        onConfirm={confirmDelete}
        title={t.delete.confirmTitle}
        // Force secret key confirmation for private logs, standard for public
        confirmKeyword={logSource === 'private' ? (user?.private_token || 'ilovechenfangting') : undefined}
        isSecret={logSource === 'private'}
        message={logSource === 'private' ? t.delete.confirmSecretMessage : undefined}
      />

      {/* Left Column: Blog Feed OR Preview */}
      <div className="h-[60vh] lg:h-full flex flex-col min-h-0 bg-white/60 rounded-3xl border border-white/80 shadow-lg backdrop-blur-md overflow-hidden ring-1 ring-white/50 order-2 lg:order-1 private-feed-top transition-all duration-300">
         
         {/* Preview Header (If Previewing) */}
         {showPreview ? (
            <div className="p-6 pb-4 bg-amber-50/50 border-b border-amber-100 flex items-center justify-between animate-fade-in shrink-0">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 shadow-sm animate-pulse">
                     <i className="fas fa-eye"></i>
                  </div>
                  <h2 className="text-lg font-display font-bold text-slate-700 uppercase tracking-widest">Live Preview</h2>
               </div>
               
               <div className="flex items-center gap-4">
                   <div className="text-xs font-mono text-slate-400 hidden sm:block">
                      {new Date().toLocaleTimeString()}
                   </div>
                   <button 
                     onClick={() => setIsPreviewHidden(true)}
                     className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors shadow-sm"
                     title="Close Preview"
                   >
                      <i className="fas fa-times"></i>
                   </button>
               </div>
            </div>
         ) : (
            // Standard Header
            <div className="p-6 pb-4 flex flex-col gap-4 bg-white/40 border-b border-rose-100/50 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 transition-colors ${logSource === 'private' ? 'bg-rose-100 text-rose-500' : 'bg-blue-100 text-blue-500'}`}>
                            <i className={`fas ${logSource === 'private' ? 'fa-heart' : 'fa-globe'}`}></i>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl font-display font-bold text-slate-800 truncate">
                            {logSource === 'private' ? t.privateSpace.journal : 'Public Log'}
                            </h1>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-mono uppercase tracking-widest ${logSource === 'private' ? 'text-rose-400' : 'text-blue-400'}`}>
                                {displayPagination ? displayPagination.totalItems : displayBlogs.length} Entries
                                </span>
                                {/* Resume Preview Button if hidden but content exists */}
                                {hasActiveContent && isPreviewHidden && (
                                    <button 
                                        onClick={() => setIsPreviewHidden(false)}
                                        className="ml-2 px-2 py-0.5 bg-amber-100 text-amber-600 text-[10px] font-bold uppercase rounded-full animate-pulse hover:bg-amber-200 transition-colors"
                                    >
                                        <i className="fas fa-eye mr-1"></i> Resume Preview
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Source Toggle */}
                    <div className="flex bg-slate-100 p-1 rounded-lg shrink-0">
                        <button 
                            onClick={() => setLogSource('private')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${logSource === 'private' ? 'bg-white text-rose-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Private
                        </button>
                        <button 
                            onClick={() => setLogSource('public')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${logSource === 'public' ? 'bg-white text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Public
                        </button>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <i className={`fas fa-search transition-colors ${logSource === 'private' ? 'text-rose-300 group-focus-within:text-rose-500' : 'text-blue-300 group-focus-within:text-blue-500'}`}></i>
                    </div>
                    <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search logs..."
                        className={`block w-full pl-10 pr-3 py-2 bg-white/80 border rounded-xl leading-5 placeholder-slate-300 text-slate-700 focus:outline-none focus:ring-2 sm:text-sm transition-all shadow-sm ${
                            logSource === 'private' 
                                ? 'border-rose-100 focus:ring-rose-400/50 focus:border-rose-400' 
                                : 'border-blue-100 focus:ring-blue-400/50 focus:border-blue-400'
                        }`}
                    />
                </div>
            </div>
         )}
         
         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
            {showPreview ? (
               // PREVIEW CARD
               <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-lg animate-slide-up">
                  <div className="mb-6 pb-6 border-b border-slate-100">
                     <div className="flex gap-2 mb-4 flex-wrap">
                        {previewData?.tags.map(t => (
                           <span key={t} className="px-2 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase rounded">{t}</span>
                        ))}
                     </div>
                     <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">{previewData?.title || 'Untitled Entry'}</h1>
                     <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                        {previewData?.date ? new Date(previewData.date).toLocaleDateString() : 'Draft'}
                     </div>
                  </div>
                  <div 
                     className="prose prose-slate max-w-none prose-p:text-slate-600 prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-800 prose-pre:bg-slate-800 prose-pre:text-slate-100 prose-pre:rounded-xl"
                     dangerouslySetInnerHTML={{ __html: renderedPreview || '<p class="text-slate-400 italic">Start writing to see preview...</p>' }}
                  />
               </div>
            ) : (
               // LIST VIEW
               isPublicLoading ? (
                  <div className="text-center py-20 text-slate-400 animate-pulse">Loading Logs...</div>
               ) : (
                  <PrivateBlogFeed 
                    blogs={displayBlogs} 
                    onSelectBlog={onSelectBlog} 
                    onLike={handleLike} 
                    onEdit={handleEdit}
                    onDelete={(blog) => setPostToDelete(blog)}
                    pagination={displayPagination}
                    onPageChange={displayPageChange}
                  />
               )
            )}
         </div>
      </div>

      {/* Right Column: Widgets & Editor */}
      <div className="flex flex-col gap-6 lg:h-full order-1 lg:order-2 min-h-0">
        <div className="shrink-0 relative z-20">
           <TodoWidget />
        </div>
        
        <div id="private-editor" className="lg:flex-1 lg:min-h-0 h-[75vh] shadow-xl rounded-[2rem] bg-white">
           <SimpleEditor 
             key={editingPost ? editingPost._id : 'new-post'}
             user={user} 
             onPostCreated={handlePostCreated} 
             editingPost={editingPost}
             onCancelEdit={() => { setEditingPost(null); setPreviewData(null); }}
             onPreviewChange={setPreviewData}
           />
        </div>
      </div>
    </div>
  );
};
