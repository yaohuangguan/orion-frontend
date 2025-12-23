import React, { useState, useRef, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { TodoWidget } from '../../components/private/TodoWidget';
import { PrivateBlogFeed } from '../../components/private/PrivateBlogFeed';
import { SimpleEditor } from '../../components/private/SimpleEditor';
import { DeleteModal } from '../../components/DeleteModal';
import { BlogPost, User, PaginationData, Tag } from '../../types';
import { apiService } from '../../services/api';
import { useTranslation } from '../../i18n/LanguageContext';
import { BlogContent } from '../../components/BlogContent';
import { CommentsSection } from '../../components/CommentsSection';
import { formatUserDate } from '../../utils/date';
import { TagCloud } from '../../components/TagCloud';

export const JournalSpace: React.FC = () => {
  const { user } = useOutletContext<{ user: User | null }>();
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL State
  const page = parseInt(searchParams.get('page') || '1', 10);
  const search = searchParams.get('q') || '';
  const tag = searchParams.get('tag') || '';

  // Data State
  const [privateBlogs, setPrivateBlogs] = useState<BlogPost[]>([]);
  const [privatePagination, setPrivatePagination] = useState<PaginationData | null>(null);

  // Tags State
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);

  // Public Logs State (if switched)
  const [logSource, setLogSource] = useState<'private' | 'public'>('private');
  const [publicBlogs, setPublicBlogs] = useState<BlogPost[]>([]);
  const [publicPagination, setPublicPagination] = useState<PaginationData | null>(null);
  const [isPublicLoading, setIsPublicLoading] = useState(false);

  // Like Tracking State
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // UI State
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<BlogPost | null>(null);
  const [previewData, setPreviewData] = useState<{
    title: string;
    content: string;
    tags: string[];
    date: string;
  } | null>(null);
  const [isPreviewHidden, setIsPreviewHidden] = useState(false);
  const [searchQuery, setSearchQuery] = useState(search);

  // Load likes from local storage on mount
  useEffect(() => {
    const savedLikes = localStorage.getItem('liked_posts');
    if (savedLikes) {
      try {
        setLikedPosts(new Set(JSON.parse(savedLikes)));
      } catch (e) {}
    }
  }, []);

  // Fetch Tags on Mount (ALL types for private dashboard)
  useEffect(() => {
    const loadTags = async () => {
      try {
        // Request all tags so private user can filter everything
        const tags = await apiService.getTags('all');
        setAvailableTags(tags);
      } catch (e) {
        console.error('Failed to load tags', e);
      }
    };
    loadTags();
  }, []);

  // Sync internal search with URL
  useEffect(() => {
    setSearchQuery(search);
  }, [search]);

  // Debounced Search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== search) {
        setSearchParams((prev) => {
          const p = new URLSearchParams(prev);
          if (searchQuery) p.set('q', searchQuery);
          else p.delete('q');
          p.set('page', '1');
          return p;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, search, setSearchParams]);

  // Fetch Private Data
  const fetchPrivateBlogs = async () => {
    try {
      const { data, pagination } = await apiService.getPrivatePosts(page, 10, search, tag);
      setPrivateBlogs(data);
      setPrivatePagination(pagination);
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch Public Data
  const fetchPublicLogs = async () => {
    setIsPublicLoading(true);
    try {
      const { data, pagination } = await apiService.getPosts(page, 10, search, tag); // Pass tag here too
      setPublicBlogs(data);
      setPublicPagination(pagination);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPublicLoading(false);
    }
  };

  useEffect(() => {
    if (logSource === 'private') fetchPrivateBlogs();
    else fetchPublicLogs();
  }, [page, search, tag, logSource]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set('page', newPage.toString());
      return p;
    });
  };

  const handleTagToggle = (selectedTagName: string | null) => {
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (!selectedTagName) {
        p.delete('tag');
      } else {
        p.set('tag', selectedTagName);
      }
      p.set('page', '1');
      return p;
    });
  };

  // Handle Like Toggle Logic (Success First)
  const handleLike = async (id: string) => {
    const isLiked = likedPosts.has(id);

    try {
      if (isLiked) {
        // Currently Liked -> Unlike
        await apiService.unlikePost(id);

        // Update UI
        if (logSource === 'public') {
          setPublicBlogs((prev) =>
            prev.map((p) => (p._id === id ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p))
          );
        } else {
          setPrivateBlogs((prev) =>
            prev.map((p) => (p._id === id ? { ...p, likes: Math.max(0, (p.likes || 0) - 1) } : p))
          );
        }
        if (selectedEntry && selectedEntry._id === id) {
          setSelectedEntry((prev) =>
            prev ? { ...prev, likes: Math.max(0, (prev.likes || 0) - 1) } : null
          );
        }

        // Update Local State
        const newLikedPosts = new Set(likedPosts);
        newLikedPosts.delete(id);
        setLikedPosts(newLikedPosts);
        localStorage.setItem('liked_posts', JSON.stringify(Array.from(newLikedPosts)));
      } else {
        // Not Liked -> Like
        await apiService.likePost(id);

        // Update UI
        if (logSource === 'public') {
          setPublicBlogs((prev) =>
            prev.map((p) => (p._id === id ? { ...p, likes: (p.likes || 0) + 1 } : p))
          );
        } else {
          setPrivateBlogs((prev) =>
            prev.map((p) => (p._id === id ? { ...p, likes: (p.likes || 0) + 1 } : p))
          );
        }
        if (selectedEntry && selectedEntry._id === id) {
          setSelectedEntry((prev) => (prev ? { ...prev, likes: (prev.likes || 0) + 1 } : null));
        }

        // Update Local State
        const newLikedPosts = new Set(likedPosts);
        newLikedPosts.add(id);
        setLikedPosts(newLikedPosts);
        localStorage.setItem('liked_posts', JSON.stringify(Array.from(newLikedPosts)));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handlePostCreated = () => {
    // Determine if it was a new post or an edit based on current state
    // If editingPost is not null, we are updating. If null, we are creating.
    const wasEditing = !!editingPost;

    setEditingPost(null);
    setPreviewData(null);

    // Refresh tags list as new post might introduce new tags
    apiService.getTags('all').then(setAvailableTags);

    // If creating a new post and NOT on the first page, navigate to page 1 to ensure visibility.
    // The useEffect hook will automatically trigger fetchPrivateBlogs() when 'page' changes.
    if (!wasEditing && page !== 1) {
      setSearchParams((prev) => {
        const p = new URLSearchParams(prev);
        p.set('page', '1');
        return p;
      });
    } else {
      // Otherwise (Editing existing post, OR Creating on Page 1), manually refresh the current view.
      if (logSource === 'private') fetchPrivateBlogs();
      else fetchPublicLogs();
    }
  };

  const confirmDelete = async (secret?: string) => {
    if (!postToDelete) return;
    try {
      await apiService.deletePost(postToDelete._id, secret);
      setPostToDelete(null);
      if (selectedEntry?._id === postToDelete._id) setSelectedEntry(null);
      if (logSource === 'private') fetchPrivateBlogs();
      else fetchPublicLogs();

      // Refresh tags
      apiService.getTags('all').then(setAvailableTags);
    } catch (error) {
      console.error(error);
    }
  };

  const displayBlogs = logSource === 'private' ? privateBlogs : publicBlogs;
  const displayPagination = logSource === 'private' ? privatePagination : publicPagination;

  const hasContent = (data: any) => {
    if (!data) return false;
    const textContent = (data.content || '').replace(/<[^>]*>/g, '').trim();
    return !!data.title?.trim() || textContent.length > 0;
  };

  const showPreview = previewData && hasContent(previewData) && !isPreviewHidden;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10 lg:pb-0 h-full min-h-0 relative">
        <DeleteModal
          isOpen={!!postToDelete}
          onClose={() => setPostToDelete(null)}
          onConfirm={confirmDelete}
          title={t.delete.confirmTitle}
          confirmKeyword={
            logSource === 'private' ? user?.private_token || 'ilovechenfangting' : undefined
          }
          isSecret={logSource === 'private'}
          message={logSource === 'private' ? t.delete.confirmSecretMessage : undefined}
        />

        {/* Left Column Container */}
        <div className="h-[60vh] lg:h-full flex flex-col min-h-0 bg-white/60 rounded-3xl border border-white/80 shadow-lg backdrop-blur-md overflow-hidden ring-1 ring-white/50 order-2 lg:order-1 private-feed-top transition-all duration-300 relative">
          {/* Detail View */}
          {selectedEntry && (
            <div className="absolute inset-0 z-20 flex flex-col bg-white animate-slide-up overflow-hidden">
              <div className="p-4 border-b border-rose-100 flex items-center justify-between bg-white shrink-0">
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition-all font-bold text-xs uppercase tracking-wider"
                >
                  <i className="fas fa-arrow-left"></i> Back
                </button>
                <div className="text-right">
                  <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                    {formatUserDate(
                      selectedEntry.createdDate || selectedEntry.date,
                      user,
                      'default'
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar bg-white">
                <div className="max-w-2xl mx-auto">
                  <div className="mb-8 text-center">
                    <div className="flex justify-center gap-2 mb-4">
                      {selectedEntry.tags.map((t) => (
                        <span
                          key={t}
                          className="px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-[10px] font-bold uppercase tracking-widest"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
                      {selectedEntry.name}
                    </h1>
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-mono uppercase">
                      <span>{selectedEntry.author}</span>
                      {selectedEntry.isPrivate && <i className="fas fa-lock text-rose-300"></i>}
                    </div>
                  </div>
                  <div className="mb-12">
                    {selectedEntry.image && (
                      <img
                        src={selectedEntry.image}
                        className="w-full rounded-2xl shadow-lg mb-8"
                        alt={selectedEntry.name}
                      />
                    )}
                    <BlogContent
                      content={selectedEntry.content || ''}
                      shadowClass="shadow-none border-none"
                      forceLight={true}
                    />
                  </div>
                  <div className="border-t border-slate-100 pt-8">
                    <CommentsSection
                      postId={selectedEntry._id}
                      currentUser={user}
                      onLoginRequest={() => {}}
                      forceLight={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview View */}
          {showPreview ? (
            <div className="flex-col h-full flex animate-fade-in bg-white/50">
              <div className="p-6 pb-4 bg-amber-50/50 border-b border-amber-100 flex items-center justify-center relative shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 shadow-sm animate-pulse">
                    <i className="fas fa-eye"></i>
                  </div>
                  <h2 className="text-lg font-display font-bold text-slate-700 uppercase tracking-widest">
                    Live Preview
                  </h2>
                </div>
                <button
                  onClick={() => setIsPreviewHidden(true)}
                  className="absolute right-6 w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 flex items-center justify-center transition-colors shadow-sm"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
                <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-slate-200 mb-6">
                  <h1 className="text-3xl font-display font-bold text-slate-900 mb-2 text-center leading-tight">
                    {previewData?.title || 'Untitled Entry'}
                  </h1>
                </div>
                <BlogContent
                  content={previewData?.content || ''}
                  shadowClass="shadow-sm"
                  forceLight={true}
                />
              </div>
            </div>
          ) : (
            // List View
            <div className={`flex flex-col h-full ${selectedEntry ? 'hidden' : 'flex'}`}>
              <div className="p-6 pb-4 flex flex-col gap-4 bg-white/40 border-b border-rose-100/50 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 transition-colors ${logSource === 'private' ? 'bg-rose-100 text-rose-500' : 'bg-blue-100 text-blue-500'}`}
                    >
                      <i className={`fas ${logSource === 'private' ? 'fa-heart' : 'fa-globe'}`}></i>
                    </div>
                    <div className="min-w-0">
                      <h1 className="text-2xl font-display font-bold text-slate-800 truncate">
                        {logSource === 'private' ? t.privateSpace.journal : 'Public Log'}
                      </h1>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-mono uppercase tracking-widest ${logSource === 'private' ? 'text-rose-400' : 'text-blue-400'}`}
                        >
                          {displayPagination ? displayPagination.totalItems : displayBlogs.length}{' '}
                          Entries
                        </span>
                        {hasContent(previewData) && isPreviewHidden && (
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
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i
                      className={`fas fa-search transition-colors ${logSource === 'private' ? 'text-rose-300 group-focus-within:text-rose-500' : 'text-blue-300 group-focus-within:text-blue-500'}`}
                    ></i>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logs..."
                    className={`block w-full pl-10 pr-3 py-2 bg-white/80 border rounded-xl leading-5 placeholder-slate-300 text-slate-700 focus:outline-none focus:ring-2 sm:text-sm transition-all shadow-sm ${logSource === 'private' ? 'border-rose-100 focus:ring-rose-400/50 focus:border-rose-400' : 'border-blue-100 focus:ring-blue-400/50 focus:border-blue-400'}`}
                  />
                </div>

                {/* Improved Tag Filter using TagCloud */}
                <TagCloud
                  tags={availableTags}
                  selectedTag={tag || null}
                  onSelect={handleTagToggle}
                  theme={logSource === 'private' ? 'rose' : 'blue'}
                  limit={12}
                  label="Categories"
                />
              </div>

              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/30">
                {isPublicLoading ? (
                  <div className="text-center py-20 text-slate-400 animate-pulse">
                    Loading Logs...
                  </div>
                ) : (
                  <PrivateBlogFeed
                    blogs={displayBlogs}
                    onSelectBlog={setSelectedEntry}
                    onLike={handleLike}
                    onEdit={(blog) => {
                      setEditingPost(blog);
                      if (window.innerWidth < 1024)
                        setTimeout(
                          () =>
                            document
                              .getElementById('private-editor')
                              ?.scrollIntoView({ behavior: 'smooth' }),
                          100
                        );
                    }}
                    onDelete={(blog) => setPostToDelete(blog)}
                    pagination={displayPagination}
                    onPageChange={handlePageChange}
                    currentUser={user}
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Widgets & Editor */}
        <div className="flex flex-col gap-6 lg:h-full order-1 lg:order-2 min-h-0">
          <div className="shrink-0 relative z-20">
            <TodoWidget />
          </div>

          <div
            id="private-editor"
            className="lg:flex-1 lg:min-h-0 h-[75vh] shadow-xl rounded-[2rem] bg-white"
          >
            <SimpleEditor
              key={editingPost ? editingPost._id : 'new-post'}
              user={user}
              onPostCreated={handlePostCreated}
              editingPost={editingPost}
              onCancelEdit={() => {
                setEditingPost(null);
                setPreviewData(null);
              }}
              onPreviewChange={setPreviewData}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default JournalSpace;
