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

// Adjusted for list view
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

  // Helper to Render Pagination
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center gap-2 mb-8 mt-4">
        {/* Jump to First */}
        {currentPage > 1 && (
          <button
            onClick={() => handlePageChange(1)}
            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 transition-all rounded-xl shadow-sm"
            title="First Page"
          >
            <i className="fas fa-step-backward"></i>
          </button>
        )}

        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-xl shadow-sm"
        >
          <i className="fas fa-chevron-left"></i>
        </button>

        <div className="flex items-center px-6 h-10 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-mono text-xs tracking-widest text-slate-500 rounded-xl shadow-sm">
          {t.blogList.page}{' '}
          <span className="text-primary-500 font-bold mx-2 text-sm">{currentPage}</span> /{' '}
          {pagination.totalPages}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.totalPages}
          className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all rounded-xl shadow-sm"
        >
          <i className="fas fa-chevron-right"></i>
        </button>

        {/* Jump to Last */}
        {currentPage < pagination.totalPages && (
          <button
            onClick={() => handlePageChange(pagination.totalPages)}
            className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-500 transition-all rounded-xl shadow-sm"
            title="Last Page"
          >
            <i className="fas fa-step-forward"></i>
          </button>
        )}
      </div>
    );
  };

  // Render Loading State (List Skeleton)
  if (loading || initialLoading) {
    return (
      <div className="container mx-auto px-6 py-24 max-w-7xl pt-32">
        <div className="flex flex-col lg:flex-row gap-10">
          <div className="flex-1 space-y-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-48 border border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 relative overflow-hidden rounded-3xl animate-pulse"
              ></div>
            ))}
          </div>
          <div className="lg:w-[320px] h-96 bg-slate-100/50 dark:bg-slate-900/50 rounded-3xl animate-pulse"></div>
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

      {/* Title Header */}
      <div className="mb-12 border-b border-slate-200 dark:border-slate-800 pb-8 relative">
        <div className="absolute bottom-0 left-0 w-24 h-[2px] bg-primary-500"></div>
        <div className="flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="fas fa-database text-primary-500 text-xs"></i>
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
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* RIGHT COLUMN: Sidebar (Sticky) - Order 1 on Mobile, 2 on Desktop */}
        <aside className="lg:w-[320px] shrink-0 order-1 lg:order-2">
          <div className="lg:sticky lg:top-32 space-y-8">
            {/* Search Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Search Logs
              </h3>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-slate-400 group-focus-within:text-primary-500 transition-colors"></i>
                </div>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t.blogList.searchPlaceholder}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 placeholder-slate-400 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 text-sm transition-all"
                />
              </div>
            </div>

            {/* Tags Widget */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <TagCloud
                tags={tags}
                selectedTag={selectedTag}
                onSelect={handleTagClick}
                theme="primary"
                limit={15}
                label="Topics"
              />
            </div>

            {/* Mobile Only Stats (Since header stats hidden on mobile) */}
            <div className="md:hidden bg-slate-50 dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex justify-center text-xs font-mono text-slate-500">
              <span>
                Total Entries:{' '}
                <b className="text-slate-900 dark:text-white">{pagination?.totalItems}</b>
              </span>
            </div>
          </div>
        </aside>

        {/* LEFT COLUMN: Blog List - Order 2 on Mobile, 1 on Desktop */}
        <div className="flex-1 min-w-0 order-2 lg:order-1">
          {blogs.length > 0 ? (
            <div className="flex flex-col gap-6">
              {blogs.map((blog) => {
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
                    className="group relative cursor-pointer bg-white/80 dark:bg-[#0f1218]/90 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-primary-500/10 dark:hover:shadow-primary-400/5 hover:border-primary-200 dark:hover:border-primary-800/80 transition-all duration-300 hover:-translate-y-1 flex flex-col md:flex-row min-h-[180px]"
                  >
                    {/* Left Accent Bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-200 dark:bg-slate-800 group-hover:bg-gradient-to-b group-hover:from-primary-500 group-hover:to-blue-600 transition-all"></div>

                    <div className="flex-1 p-6 md:p-8 pl-8 md:pl-10 flex flex-col justify-center">
                      {/* Meta Top */}
                      <div className="flex items-center gap-3 mb-3 text-xs flex-wrap">
                        {/* User Info */}
                        <div className="flex items-center gap-2 pr-3 border-r border-slate-200 dark:border-slate-800">
                          <div className="w-5 h-5 rounded-full overflow-hidden bg-slate-200 ring-1 ring-slate-100 dark:ring-slate-800">
                            <img
                              src={authorAvatar}
                              alt={authorName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="font-bold text-slate-600 dark:text-slate-300">
                            {authorName}
                          </span>
                        </div>

                        <span className="font-mono font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pr-3 border-r border-slate-200 dark:border-slate-800">
                          {formatUserDate(
                            blog.createdAt || blog.createdDate || blog.date,
                            currentUser
                          )}
                        </span>

                        {/* Like Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLikeInternal(blog._id);
                          }}
                          className={`flex items-center gap-1.5 text-xs font-bold transition-colors group/like px-2.5 py-0.5 rounded-full border ${
                            isLiked
                              ? 'text-pink-500 bg-pink-50 dark:bg-pink-950/20 border-pink-100 dark:border-pink-900/30'
                              : 'text-slate-400 hover:text-pink-500 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
                          }`}
                        >
                          <i
                            className={`fas fa-heart ${isLiked ? '' : 'group-hover/like:scale-110 transition-transform'}`}
                          ></i>
                          {blog.likes}
                        </button>

                        {blog.isPrivate && (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-bold uppercase tracking-wider text-[10px] bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                            <i className="fas fa-lock text-[9px]"></i> Encrypted
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="font-serif font-bold text-2xl md:text-3xl text-slate-900 dark:text-slate-100 mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                        {blog.name}
                      </h3>

                      {/* Tags (Displaying ALL tags) */}
                      {blog.tags && blog.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {blog.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-0.5 rounded-md bg-primary-50 dark:bg-primary-950/30 text-primary-600 dark:text-primary-400 text-[10px] font-bold uppercase tracking-widest border border-primary-100/55 dark:border-primary-900/30 transition-all hover:bg-primary-100 dark:hover:bg-primary-900/50"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Summary */}
                      <p className="text-slate-500 dark:text-slate-400 font-light leading-relaxed mb-6 text-sm md:text-base line-clamp-2 md:line-clamp-2">
                        {blog.info || 'Log entry... Click to read full transmission.'}
                      </p>

                      {/* Bottom Actions */}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-2 text-xs font-bold text-primary-600 dark:text-primary-400 group-hover:text-primary-700 dark:group-hover:text-primary-300 transition-colors">
                          <span>Read Entry</span>
                          <i className="fas fa-arrow-right transform group-hover:translate-x-1.5 transition-transform"></i>
                        </div>

                        {/* Delete Button (VIP) */}
                        {canDelete && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePost && onDeletePost(blog);
                            }}
                            className="text-slate-300 hover:text-red-500 transition-colors px-1"
                            title="Delete Log"
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Optional Thumbnail (Framed Card Insert Design) */}
                    {hasImage && (
                      <div className="hidden md:block w-48 shrink-0 relative overflow-hidden bg-transparent p-4 flex items-center justify-center">
                        <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800/80 shadow-sm">
                          <img
                            src={blog.image}
                            alt={blog.name}
                            onError={handleImageError}
                            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                            loading="lazy"
                          />
                        </div>
                      </div>
                    )}
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
                className="mt-6 px-6 py-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-sm font-bold hover:bg-primary-500 hover:text-black transition-colors"
              >
                {t.blogList.clearFilters}
              </button>
            </div>
          )}

          {/* Bottom Pagination */}
          {renderPagination()}
        </div>
      </div>
    </div>
  );
};
