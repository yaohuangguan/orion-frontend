import React from 'react';
import { BlogPost, PaginationData, User } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { formatUserDate } from '../../utils/date';

interface PrivateBlogFeedProps {
  blogs: BlogPost[];
  onSelectBlog: (blog: BlogPost) => void;
  onLike?: (id: string) => void;
  onEdit?: (blog: BlogPost) => void;
  onDelete?: (blog: BlogPost) => void;
  pagination?: PaginationData | null;
  onPageChange?: (page: number) => void;
  currentUser?: User | null;
}

export const PrivateBlogFeed: React.FC<PrivateBlogFeedProps> = ({
  blogs,
  onSelectBlog,
  onLike,
  onEdit,
  onDelete,
  pagination,
  onPageChange,
  currentUser
}) => {
  const { t } = useTranslation();

  const handlePageChange = (newPage: number) => {
    if (onPageChange && pagination) {
      if (newPage > 0 && newPage <= pagination.totalPages) {
        onPageChange(newPage);
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {blogs.map((blog) => {
        // Fallback for avatar if no user present
        const authorAvatar =
          blog.user?.photoURL ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.author || 'Anonymous')}&background=random`;

        return (
          <div
            key={blog._id}
            className="group relative bg-white rounded-2xl p-6 border border-pink-100 hover:border-pink-300 shadow-sm hover:shadow-md transition-all duration-300"
          >
            {/* Date Badge & Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-pink-50 text-pink-600 text-xs font-bold rounded-full font-mono">
                  {formatUserDate(
                    blog.createdDate || blog.date,
                    currentUser,
                    'default',
                    t.privateSpace.unknownDate
                  )}
                </span>
                {blog.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="text-xs text-slate-400 font-medium">
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-3">
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(blog);
                    }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    title="Edit Post"
                  >
                    <i className="fas fa-pencil-alt text-xs"></i>
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(blog);
                    }}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete Post"
                  >
                    <i className="fas fa-trash text-xs"></i>
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLike && onLike(blog._id);
                  }}
                  className="text-slate-300 hover:text-pink-500 transition-colors flex items-center gap-1 group/like"
                >
                  <i className="fas fa-heart group-hover/like:scale-110 transition-transform"></i>
                  <span className="text-xs font-mono">{blog.likes || 0}</span>
                </button>
              </div>
            </div>

            {/* Content Preview */}
            <div onClick={() => onSelectBlog(blog)} className="cursor-pointer">
              <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-pink-600 transition-colors">
                {blog.name}
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                {blog.info || t.privateSpace.preview}
              </p>
            </div>

            {/* Footer: User + Author Display */}
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <div className="flex flex-col gap-1">
                {/* User Line */}
                {blog.user && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-100">
                      <img
                        src={
                          blog.user.photoURL ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(blog.user.displayName)}&background=random`
                        }
                        alt={blog.user.displayName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-600">
                      {blog.user.displayName}
                    </span>
                  </div>
                )}

                {/* Author Line */}
                <div className="flex items-center gap-1.5">
                  {!blog.user && (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-100 ring-1 ring-slate-100">
                      <img
                        src={authorAvatar}
                        alt={blog.author}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono uppercase">
                    <i className="fas fa-pen-nib text-[8px]"></i>
                    <span>{blog.author || 'Anonymous'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectBlog(blog)}
                className="text-xs font-bold text-pink-400 hover:text-pink-600 uppercase tracking-wider flex items-center gap-1"
              >
                {t.privateSpace.read} <i className="fas fa-arrow-right text-[10px]"></i>
              </button>
            </div>
          </div>
        );
      })}

      {blogs.length === 0 && (
        <div className="text-center py-20 bg-pink-50/50 rounded-2xl border border-dashed border-pink-200">
          <i className="fas fa-feather text-4xl mb-4 text-pink-200"></i>
          <p className="text-slate-400 font-medium">{t.privateSpace.emptyJournal}</p>
          <p className="text-xs text-slate-300 mt-2">{t.privateSpace.writeFirst}</p>
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center pt-4 gap-2">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrevPage}
            className="w-8 h-8 rounded-full border border-pink-200 text-pink-400 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>

          <span className="text-xs font-mono text-pink-400 font-bold px-2">
            {pagination.currentPage} / {pagination.totalPages}
          </span>

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNextPage}
            className="w-8 h-8 rounded-full border border-pink-200 text-pink-400 hover:bg-pink-50 hover:text-pink-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
        </div>
      )}

      {/* Infinite Scroll Loader Indicator (Optional visual cue when no pagination or loading) */}
      {!pagination && blogs.length > 0 && (
        <div className="flex justify-center py-4">
          <div className="w-1.5 h-1.5 bg-pink-200 rounded-full mx-1"></div>
          <div className="w-1.5 h-1.5 bg-pink-200 rounded-full mx-1"></div>
          <div className="w-1.5 h-1.5 bg-pink-200 rounded-full mx-1"></div>
        </div>
      )}
    </div>
  );
};
