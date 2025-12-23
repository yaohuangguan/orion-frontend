import React, { useMemo, useEffect, useRef, useState } from 'react';
import { BlogPost, User, PaginationData, Tag } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { formatUserDate } from '../utils/date';
import { TagCloud } from '../components/TagCloud';
import { Helmet } from 'react-helmet-async';

interface BlogListProps {
  onSelectBlog: (blog: BlogPost) => void;
  isLoading?: boolean;
  currentUser?: User | null;
  onDeletePost?: (blog: BlogPost) => void;
  onLike?: (id: string) => void;
}

const ITEMS_PER_PAGE = 10;

export const BlogList: React.FC<BlogListProps> = ({
  onSelectBlog,
  isLoading: initialLoading,
  currentUser,
  onDeletePost,
  onLike
}) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // State for fetched data
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Derived state from URL params
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('q') || '';
  const selectedTag = searchParams.get('tag') || null;

  // Local state for search input to debounce
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Load likes from local storage
  useEffect(() => {
    const savedLikes = localStorage.getItem('liked_posts');
    if (savedLikes) {
      try {
        setLikedPosts(new Set(JSON.parse(savedLikes)));
      } catch (e) {}
    }
  }, []);

  // Fetch Tags (PUBLIC only)
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const fetchedTags = await apiService.getTags('public');
        setTags(fetchedTags);
      } catch (e) {
        console.error('Failed to fetch tags', e);
      }
    };
    fetchTags();
  }, []);

  // Sync input with URL param if URL changes externally
  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Debounced Search Update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchQuery) {
        setSearchParams((prev) => {
          const newParams = new URLSearchParams(prev);
          if (searchInput) newParams.set('q', searchInput);
          else newParams.delete('q');
          newParams.set('page', '1'); // Reset to page 1 on search
          return newParams;
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, searchQuery, setSearchParams]);

  // Fetch Data when URL params change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data, pagination: pager } = await apiService.getPosts(
          currentPage,
          ITEMS_PER_PAGE,
          searchQuery,
          selectedTag || ''
        );
        setBlogs(data);
        setPagination(pager);
      } catch (error) {
        console.error('Failed to load posts', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    // Listen for global refresh events
    const handleRefresh = () => fetchData();
    window.addEventListener('blog:refresh', handleRefresh);
    return () => window.removeEventListener('blog:refresh', handleRefresh);
  }, [currentPage, searchQuery, selectedTag]);

  // Handle Page Change
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', newPage.toString());
      return newParams;
    });
    document.getElementById('latest-posts')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Tag Click
  const handleTagClick = (tag: string | null) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (tag) newParams.set('tag', tag);
      else newParams.delete('tag');
      newParams.set('page', '1');
      return newParams;
    });
  };

  // Internal Like Handler (Updated: Success -> Update UI)
  const handleLikeInternal = async (id: string) => {
    const isLiked = likedPosts.has(id);

    try {
      if (isLiked) {
        // Currently liked, so UNLIKE
        await apiService.unlikePost(id);

        // Update State AFTER success
        setBlogs((prev) =>
          prev.map((p) => {
            if (p._id === id) {
              return { ...p, likes: Math.max(0, (p.likes || 0) - 1) };
            }
            return p;
          })
        );

        const newLikedPosts = new Set(likedPosts);
        newLikedPosts.delete(id);
        setLikedPosts(newLikedPosts);
        localStorage.setItem('liked_posts', JSON.stringify(Array.from(newLikedPosts)));
      } else {
        // Currently NOT liked, so LIKE
        await apiService.likePost(id);

        // Update State AFTER success
        setBlogs((prev) =>
          prev.map((p) => {
            if (p._id === id) {
              return { ...p, likes: (p.likes || 0) + 1 };
            }
            return p;
          })
        );

        const newLikedPosts = new Set(likedPosts);
        newLikedPosts.add(id);
        setLikedPosts(newLikedPosts);
        localStorage.setItem('liked_posts', JSON.stringify(Array.from(newLikedPosts)));
      }

      if (onLike) onLike(id);
    } catch (e) {
      console.error('Like action failed', e);
    }
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.style.display = 'none';
  };

  // Render Loading State (Skeleton HUD)
  if (loading || initialLoading) {
    return (
      <div className="container mx-auto px-6 py-24 max-w-7xl pt-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-96 border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 relative overflow-hidden rounded-xl"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-200/20 dark:to-slate-800/20 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div id="latest-posts" className="container mx-auto px-6 py-24 pt-32 max-w-7xl relative z-10">
      <Helmet>
        <title>Orion Journals | Engineering & Digital Evolution | 工程与数字演进随笔</title>
        <meta
          name="description"
          content="Sam's recorded thoughts on engineering, star charts, and digital evolution. Sam关于工程技术、星图研究与数字演进的深度思考记录。"
        />
      </Helmet>

      {/* Header / Control Panel */}
      <div className="mb-12 space-y-8">
        {!blogs.some((b) => b.isPrivate) && (
          <div className="border-b border-slate-200 dark:border-slate-800 pb-8 relative">
            <div className="absolute bottom-0 left-0 w-24 h-[2px] bg-amber-500"></div>
            <div className="flex flex-col md:flex-row justify-between items-end gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <i className="fas fa-database text-amber-500 text-xs"></i>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                    {t.blogList.systemLog}
                  </span>
                </div>
                <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-2">
                  {t.blogList.title}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-lg">{t.blogList.subtitle}</p>
              </div>

              <div className="hidden md:flex items-center gap-4 text-xs font-mono text-slate-500">
                <div className="px-3 py-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900">
                  {t.blogList.entries}:{' '}
                  <span className="text-slate-900 dark:text-white font-bold">
                    {pagination?.totalItems || blogs.length}
                  </span>
                </div>
                <div className="px-3 py-1 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-900">
                  {t.blogList.status}:{' '}
                  <span className="text-green-500 font-bold">{t.blogList.online}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between bg-white/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 backdrop-blur-sm">
          {/* Search Input */}
          <div className="relative w-full lg:w-80 group shrink-0">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i className="fas fa-search text-slate-400 group-focus-within:text-amber-500 transition-colors"></i>
            </div>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t.blogList.searchPlaceholder}
              className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 placeholder-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 sm:text-sm transition-all shadow-sm"
            />
          </div>

          {/* Tags Filter (Using New Component) */}
          <div className="flex-1 lg:justify-end w-full lg:w-auto">
            <TagCloud
              tags={tags}
              selectedTag={selectedTag}
              onSelect={handleTagClick}
              theme="amber"
              limit={8}
              label={t.blogList.filter}
            />
          </div>
        </div>
      </div>

      {blogs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {blogs.map((blog, idx) => {
            const canDelete = currentUser?.vip && onDeletePost;
            const hasImage = !!blog.image;
            const isLiked = likedPosts.has(blog._id);

            const authorName = blog.user?.displayName || blog.author || 'Anonymous';
            const authorAvatar =
              blog.user?.photoURL ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=random`;

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

                  {/* Image Section */}
                  {hasImage ? (
                    <div className="relative overflow-hidden w-full aspect-[16/9] bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                      <img
                        src={blog.image}
                        alt={blog.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                      <div className="absolute top-4 left-4 flex flex-col gap-2">
                        {blog.isPrivate && (
                          <span className="inline-flex items-center px-2 py-1 bg-red-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest shadow-lg">
                            <i className="fas fa-lock mr-2"></i> Encrypted
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="h-1.5 w-full bg-gradient-to-r from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-700 group-hover:from-amber-500 group-hover:to-amber-600 transition-colors"></div>
                  )}

                  {/* Admin Delete Action */}
                  {canDelete && (
                    <div
                      className={`absolute z-30 ${hasImage ? 'top-4 right-4' : 'top-4 right-4'}`}
                    >
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
                    <div className="flex items-center justify-between mb-4 font-mono text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                        <span>ID: {blog._id.substring(0, 6)}</span>
                      </div>
                      <span>{formatUserDate(blog.createdDate || blog.date, currentUser)}</span>
                    </div>

                    <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-3 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-tight">
                      {blog.name}
                    </h3>

                    <p
                      className={`text-slate-600 dark:text-slate-400 font-light leading-relaxed mb-6 ${hasImage ? 'line-clamp-3 text-sm' : 'line-clamp-6 text-sm'}`}
                    >
                      {blog.info}
                    </p>

                    <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-800/50 flex items-center justify-between">
                      <div className="flex gap-2 flex-wrap max-w-[40%]">
                        {blog.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 rounded-sm"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-end group/author">
                          {blog.user && (
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover/author:text-amber-500 transition-colors truncate max-w-[80px]">
                                {blog.user.displayName}
                              </span>
                              <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 ring-1 ring-slate-200 dark:ring-slate-700">
                                <img
                                  src={
                                    blog.user.photoURL ||
                                    `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.user.displayName)}&background=random`
                                  }
                                  alt={blog.user.displayName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </div>
                          )}
                          {!blog.user && (
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-mono uppercase">
                                <span className="flex items-center gap-1.5">
                                  <span>{blog.author}</span>
                                  <span className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 inline-block overflow-hidden">
                                    <img
                                      src={authorAvatar}
                                      className="w-full h-full object-cover"
                                    />
                                  </span>
                                </span>
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeInternal(blog._id);
                          }}
                          className={`flex items-center gap-1 text-xs font-mono transition-colors group/like px-2 py-1 rounded-full ${
                            isLiked
                              ? 'text-pink-500 bg-pink-500/10'
                              : 'text-slate-400 hover:text-pink-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <i
                            className={`fas fa-heart ${isLiked ? '' : 'group-hover/like:scale-110 transition-transform'}`}
                          ></i>
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
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
            {t.blogList.noLogs}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 font-mono text-sm uppercase tracking-widest">
            {t.blogList.adjustSearch}
          </p>
          <button
            onClick={() => {
              setSearchInput('');
              handleTagClick(null);
            }}
            className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-bold hover:bg-amber-500 hover:text-black transition-colors"
          >
            {t.blogList.clearFilters}
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center mt-20 gap-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 flex items-center justify-center border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-l-lg"
          >
            <i className="fas fa-chevron-left"></i>
          </button>

          <div className="flex items-center px-6 h-10 border-t border-b border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 font-mono text-xs tracking-widest text-slate-500">
            {t.blogList.page}{' '}
            <span className="text-slate-900 dark:text-white font-bold mx-2">
              {currentPage.toString().padStart(2, '0')}
            </span>{' '}
            / {pagination.totalPages.toString().padStart(2, '0')}
          </div>

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages}
            className="w-10 h-10 flex items-center justify-center border border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-amber-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-r-lg"
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};
