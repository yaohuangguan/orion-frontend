import React, { useState, useEffect } from 'react';
import { Comment, User } from '../types';
import { apiService } from '../services/api';
import { useTranslation } from '../i18n/LanguageContext';

interface CommentsSectionProps {
  postId: string;
  currentUser: User | null;
  onLoginRequest: () => void;
}

// --- Smart Avatar Component with Error Fallback ---
const Avatar: React.FC<{ user?: any, size?: 'sm' | 'md' }> = ({ user, size = 'md' }) => {
  // Defensive check for name
  const name = user?.displayName || user?.name || user?.username || 'Anonymous';
  
  // Fallback generator URL
  const generatedAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=128`;
  
  // Initialize source: try user photo first, else generated
  const [imgSrc, setImgSrc] = useState<string>(user?.photoURL || generatedAvatarUrl);
  const [hasError, setHasError] = useState(false);

  // If user prop changes (e.g. data refresh), reset logic
  useEffect(() => {
    setImgSrc(user?.photoURL || generatedAvatarUrl);
    setHasError(false);
  }, [user, name]);

  const sizeClasses = size === 'md' ? 'w-12 h-12' : 'w-8 h-8';

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(generatedAvatarUrl);
    }
  };

  return (
    <div className={`${sizeClasses} rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 ring-2 ring-white dark:ring-slate-800 shadow-md`}>
      <img 
        src={imgSrc} 
        alt={name} 
        className="w-full h-full object-cover"
        onError={handleError}
      />
    </div>
  );
};

export const CommentsSection: React.FC<CommentsSectionProps> = ({ postId, currentUser, onLoginRequest }) => {
  const { t } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null); // comment.id (custom id)
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const data = await apiService.getComments(postId);
      // Ensure data is always an array
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load comments', error);
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await apiService.addComment(postId, currentUser, newComment, currentUser.photoURL);
      // Explicitly refresh from server to ensure sync
      await fetchComments();
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment', error);
      alert(t.comments.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (commentId: string, targetUser: User) => {
    if (!currentUser || !replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await apiService.addReply(
        commentId, 
        currentUser, 
        replyText, 
        targetUser, 
        currentUser.photoURL
      );
      await fetchComments(); 
      setReplyingTo(null);
      setReplyText('');
    } catch (error) {
      console.error('Failed to reply', error);
      alert(t.comments.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to resolve display name safely
  const getUserName = (user: any) => {
    if (!user) return 'Anonymous';
    return user.displayName || user.name || user.username || user.email?.split('@')[0] || 'Anonymous';
  };

  const formatDate = (dateString: string) => {
    try {
      // Use toLocaleString for browser-local time
      return new Date(dateString).toLocaleString(undefined, { 
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-slate-500 animate-pulse border-t border-slate-200 dark:border-slate-800">
        Loading conversation...
      </div>
    );
  }

  return (
    <section className="py-16 border-t border-slate-200 dark:border-slate-800" id="comments">
      <div className="flex items-center justify-between mb-12">
        <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
          {t.comments.title} 
        </h3>
        <span className="text-sm font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
           {Array.isArray(comments) ? comments.length : 0} Comments
        </span>
      </div>

      {/* Post Comment Form */}
      <div className="mb-16">
        {currentUser ? (
          <div className="flex gap-6">
            <div className="hidden sm:block">
              <Avatar user={currentUser} />
            </div>
            <div className="flex-1">
              <form onSubmit={handlePostComment} className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={t.comments.placeholder}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all dark:text-white min-h-[120px] resize-y placeholder:text-slate-400"
                  required
                />
                <div className="absolute bottom-4 right-4">
                  <button
                    type="submit"
                    disabled={isSubmitting || !newComment.trim()}
                    className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? <i className="fas fa-circle-notch fa-spin"></i> : t.comments.postButton}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-800/50">
            <h4 className="font-bold text-slate-900 dark:text-white mb-2">Join the conversation</h4>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">{t.comments.loginToComment}</p>
            <button
              onClick={onLoginRequest}
              className="px-8 py-3 bg-primary-600 text-white rounded-full font-bold text-sm hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20"
            >
              {t.header.signIn}
            </button>
          </div>
        )}
      </div>

      {/* Comments List */}
      <div className="space-y-12">
        {!Array.isArray(comments) || comments.length === 0 ? (
          <div className="text-center py-12">
             <i className="far fa-comments text-4xl text-slate-200 dark:text-slate-700 mb-4"></i>
             <p className="text-slate-500 dark:text-slate-400">{t.comments.noComments}</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="animate-fade-in group">
              <div className="flex gap-6">
                <Avatar user={comment.user} />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {getUserName(comment.user)}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(comment.date)}</span>
                  </div>
                  
                  <div className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg mb-4 whitespace-pre-wrap">
                    {comment.comment}
                  </div>
                  
                  {/* Reply Action */}
                  <div className="flex items-center gap-4">
                    {currentUser && (
                      <button 
                        onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                        className="text-xs font-bold uppercase tracking-wider text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-2"
                      >
                        <i className="fas fa-reply"></i> {t.comments.reply}
                      </button>
                    )}
                  </div>

                  {/* Reply Form */}
                  {replyingTo === comment.id && (
                    <div className="mt-6 flex gap-4 animate-fade-in">
                       <div className="flex-1">
                          <textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={`${t.comments.replyTo} ${getUserName(comment.user)}...`}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                            autoFocus
                          />
                          <div className="flex justify-end gap-3 mt-3">
                             <button
                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                              >
                                {t.comments.cancel}
                              </button>
                              <button
                                onClick={() => handleReply(comment.id, comment.user)}
                                disabled={isSubmitting || !replyText.trim()}
                                className="px-5 py-2 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 disabled:opacity-50"
                              >
                                {isSubmitting ? '...' : t.comments.postButton}
                              </button>
                          </div>
                       </div>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {comment.reply && comment.reply.length > 0 && (
                    <div className="mt-8 space-y-8 pl-8 border-l-2 border-slate-100 dark:border-slate-800">
                      {comment.reply.map((reply) => (
                        <div key={reply.id} className="flex gap-4">
                           <Avatar user={reply.user} size="sm" />
                           <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-slate-900 dark:text-white text-sm">
                                  {getUserName(reply.user)}
                                </span>
                                <span className="text-[10px] text-slate-400">• {formatDate(reply.date)}</span>
                              </div>
                              <div className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {reply.targetUser && (reply.targetUser.displayName || (reply.targetUser as any).name || (reply.targetUser as any).username) && (
                                   <span className="text-primary-500 font-medium text-xs mr-1">@{getUserName(reply.targetUser)}</span>
                                )}
                                {reply.content}
                              </div>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};