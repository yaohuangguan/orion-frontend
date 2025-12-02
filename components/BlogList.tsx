




import React, { useState, useMemo, useEffect, useRef } from 'react';
import { BlogPost, User, PaginationData } from '../types';
import { useTranslation } from '../i18n/LanguageContext';

interface BlogListProps {
  blogs: BlogPost[];
  onSelectBlog: (blog: BlogPost) => void;
  isLoading?: boolean;
  currentUser?: User | null;
  onDeletePost?: (blog: BlogPost) => void;
  
  // New props for Server-Side Pagination & Filtering
  pagination?: PaginationData | null;
  onPageChange?: (page: number) => void;
  onFilterChange?: (search: string, tag: string | null) => void;
  
  // Like Handler
  onLike?: (id: string) => void;
  likedPosts?: Set<string>;
}

const ITEMS_PER_PAGE = 10;

export const BlogList: React.FC<BlogListProps> = ({ 
  blogs, 
  onSelectBlog, 
  isLoading, 
  currentUser, 
  onDeletePost,
  pagination,
  onPageChange,
  onFilterChange,
  onLike,
  likedPosts
}) => {
  const { t } = useTranslation();
  // Client-side state fallback
  const [clientCurrentPage, setClientCurrentPage] = useState(1);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Determine if using Server-Side Pagination
  const isServerSide = !!pagination && !!onPageChange;
  const currentPage = isServerSide ? pagination.currentPage : clientCurrentPage;
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none'; // Hide broken images completely to avoid ugly borders
  };

  // Debounce for search to avoid excessive API calls
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (isServerSide && onFilterChange) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      
      // Debounce call by 500ms
      searchTimeoutRef.current = window.setTimeout(() => {
        onFilterChange(searchQuery, selectedTag);
      }, 500);
      
      return () => {
         if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      };
    } else {
       // Client-side reset to page 1 on filter change
       setClientCurrentPage(1);
    }
  }, [searchQuery, selectedTag, isServerSide]);

  // Client-side: Get all unique tags for filter
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    blogs.forEach(blog => blog.tags.forEach(tag => tags.add(tag)));
    return Array.from(tags).sort();
  }, [blogs]);

  // Client-Side Filter Logic
  const filteredBlogs = useMemo(() => {
    if (isServerSide) return blogs; // Trust backend results

    return blogs.filter(blog => {
      // Search Text (Title or Info)
      const matchesSearch = 
        blog.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (blog.info && blog.info.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Filter Tag
      const matchesTag = selectedTag ? blog.tags.includes(selectedTag) : true;

      return matchesSearch && matchesTag;
    });
  }, [blogs, searchQuery, selectedTag, isServerSide]);

  // Pagination Logic
  const currentBlogs = isServerSide 
    ? filteredBlogs 
    : filteredBlogs.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const totalPages = isServerSide 
    ? pagination.totalPages 
    : Math.ceil(filteredBlogs.length / ITEMS_PER_PAGE);

  const handlePageChangeWrapper = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      if (isServerSide && onPageChange) {
        onPageChange(newPage);
      } else {
        setClientCurrentPage(newPage);
      }
      document.getElementById('latest-posts')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Render Loading State (Skeleton HUD)
  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-24 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 relative overflow-hidden rounded-xl">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/20 dark:to-slate-800/20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="latest-posts" className="container mx-auto px-6 py-24 max-w-7xl relative z-10">
      
      {/* Header / Control Panel */}
      <div className="mb-12 space-y-8">
        {!blogs.some(b => b.isPrivate) && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-8 relative">
            <div className="absolute bottom-0 left-0 w-24 h-[2px] bg-amber-500"></div>
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-database text-amber-500 text-xs"></i>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400">{t.blogList.systemLog}</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-2">
                  {t.blogList.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-lg">
                  {t.blogList.subtitle}
                </p>
              </div>
              
              <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-500">
                 <div className="px-3 py-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900">
                   {t.blogList.entries}: <span className="text-slate-900 dark:text-white font-bold">{isServerSide ? pagination?.totalItems : filteredBlogs.length}</span>
                 </div>
                 <div className="px-3 py-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900">
                   {t.blogList.status}: <span className="text-green-500 font-bold">{t.blogList.online}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
           
           {/* Search Input */}
           <div className="relative w-full lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-slate-400 group-focus-within:text-amber-500 transition-colors"></i>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.blogList.searchPlaceholder}
                className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 placeholder-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 sm:text-sm transition-all shadow-sm"
              />
           </div>

           {/* Tags Filter */}
           <div className="flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 mr-2"><i className="fas fa-filter mr-1"></i> {t.blogList.filter}</span>
              <button 
                onClick={() => setSelectedTag(null)}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                  selectedTag === null 
                    ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {t.blogList.all}
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${
                    selectedTag === tag 
                      ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
           </div>
        </div>
      </div>

      {currentBlogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentBlogs.map((blog, idx) => {
            const canDelete = currentUser?.vip && onDeletePost;
            const hasImage = !!blog.image;
            const isLiked = likedPosts?.has(blog._id);
            
            // Prioritize blog.user.displayName, fallback to blog.author
            const authorName = blog.user?.displayName || blog.author || 'Anonymous';
            // Avatar priorities: blog.user.photoURL -> generated avatar based on authorName
            const authorAvatar = blog.user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;
            
            return (
              <article 
                key={blog._id}
                onClick={() => onSelectBlog(blog)}
                className="group relative cursor-pointer transition-all duration-300 col-span-1"
              >
                {/* HUD Card Container */}
                <div className="h-full flex flex-col relative bg-white/50 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200 dark:border-slate-700/50 hover:border-amber-500/50 dark:hover:border-amber-500/50 transition-colors overflow-hidden rounded-2xl hover:shadow-2xl hover:shadow-amber-500/5">
                  
                  {/* Decorative Corner Brackets (On Hover) */}
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-transparent group-hover:border-amber-500 transition-colors z-20"></div>
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-transparent group-hover:border-amber-500 transition-colors z-20"></div>

                  {/* Image Section - Only render if image exists to save space/layout */}
                  {hasImage ? (
                    <div className="relative overflow-hidden w-full aspect-[16/9] bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <img 
                        src={blog.image} 
                        alt={blog.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        loading="lazy"
                      />
                      
                      {/* Overlay Grid Pattern */}
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>

                      {/* Status Tags on Image */}
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                         {blog.isPrivate && (
                           <span className="inline-flex items-center px-2 py-1 bg-red-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-lg">
                             <i className="fas fa-lock mr-2"></i> Encrypted
                           </span>
                         )}
                      </div>
                    </div>
                  ) : (
                    // Decorative Top Bar for Text-Only Cards
                    <div className="h-1.5 w-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 group-hover:from-amber-500 group-hover:to-amber-600 transition-colors"></div>
                  )}

                  {/* Admin Delete Action */}
                  {canDelete && (
                      <div className={`absolute z-30 ${hasImage ? 'top-4 right-4' : 'top-4 right-4'}`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePost && onDeletePost(blog);
                          }}
                          className="w-8 h-8 rounded-full bg-red-900/10 text-red-500 hover:bg-red-600 hover:text-white flex items-center justify-center transition-colors shadow-lg border border-red-500/30"
                          title="Delete Log (VIP)"
                        >
                            <i className="fas fa-trash text-xs"></i>
                        </button>
                      </div>
                  )}

                  {/* Content Section */}
                  <div className="p-6 flex-1 flex flex-col relative">
                    {/* Data Header */}
                    <div className="flex items-center justify-between mb-4 font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                         <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                         <span>ID: {blog._id.substring(0,6)}</span>
                      </div>
                      <span>{blog.date || blog.createdDate}</span>
                    </div>

                    <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
                      {blog.name}
                    </h3>

                    <p className={`text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-6 ${hasImage ? 'line-clamp-3 text-sm' : 'line-clamp-6 text-sm'}`}>
                      {blog.info}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
                       {/* Tags */}
                       <div className="flex gap-2 flex-wrap max-w-[40%]">
                         {blog.tags.slice(0, 3).map(tag => (
                           <span key={tag} className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 hover:border-amber-500/50 transition-colors rounded-sm">
                             {tag}
                           </span>
                         ))}
                       </div>
                       
                       {/* Author & Likes */}
                       <div className="flex items-center gap-4 shrink-0">
                          {/* Author Info */}
                          <div className="flex flex-col items-end group/author">
                             {/* User Name & Avatar */}
                             {blog.user && (
                               <div className="flex items-center gap-2 mb-0.5">
                                 <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover/author:text-amber-500 transition-colors truncate max-w-[80px]">
                                   {blog.user.displayName}
                                 </span>
                                 <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-700">
                                   <img src={blog.user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.user.displayName)}&background=random`} alt={blog.user.displayName} className="w-full h-full object-cover" />
                                 </div>
                               </div>
                             )}
                             
                             {/* Author Field (Fallback or Secondary) */}
                             <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-mono uppercase">
                                  {/* If no user, show Author with generated avatar inline, else just text */}
                                  {!blog.user && (
                                     <span className="flex items-center gap-1.5">
                                        <span>{blog.author}</span>
                                        <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 inline-block overflow-hidden"><img src={authorAvatar} className="w-full h-full object-cover"/></span>
                                     </span>
                                  )}
                                  {blog.user && <span className="opacity-60">Authored by {blog.author}</span>}
                                </span>
                             </div>
                          </div>

                          <button
                             onClick={(e) => {
                                e.stopPropagation();
                                if (onLike) onLike(blog._id);
                             }}
                             className={`flex items-center gap-1 text-xs font-mono transition-colors group/like px-2 py-1 rounded-full ${
                                isLiked 
                                  ? 'text-pink-500 bg-pink-500/10' 
                                  : 'text-slate-400 hover:text-pink-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                             }`}
                          >
                            <i className={`fas fa-heart ${isLiked ? '' : 'group-hover/like:scale-110 transition-transform'}`}></i> 
                            {blog.likes}
                          </button>
                       </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-32 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-3xl">
          <i className="fas fa-search text-4xl text-slate-300 mb-6 block"></i>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">{t.blogList.noLogs}</h3>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-sm uppercase tracking-widest">{t.blogList.adjustSearch}</p>
          <button 
             onClick={() => { setSearchQuery(''); setSelectedTag(null); }}
             className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-bold hover:bg-amber-500 hover:text-black transition-colors"
          >
            {t.blogList.clearFilters}
          </button>
        </div>
      )}

      {/* Pagination Controls - HUD Style */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-20 gap-1">
          <button
            onClick={() => handlePageChangeWrapper(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 flex items-center justify-center border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-l-lg"
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="flex items-center px-6 h-10 border-t border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs tracking-widest text-slate-500">
             {t.blogList.page} <span className="text-slate-900 dark:text-white font-bold mx-2">{currentPage.toString().padStart(2, '0')}</span> / {totalPages.toString().padStart(2, '0')}
          </div>
          
          <button
            onClick={() => handlePageChangeWrapper(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-10 h-10 flex items-center justify-center border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-r-lg"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};