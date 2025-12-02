



import React, { useState, useCallback } from 'react';
import { TodoWidget } from './TodoWidget';
import { PrivateBlogFeed } from './PrivateBlogFeed';
import { SimpleEditor } from './SimpleEditor';
import { DeleteModal } from '../DeleteModal';
import { BlogPost, User, PaginationData } from '../../types';
import { apiService } from '../../services/api';
import { useTranslation } from '../../i18n/LanguageContext';

interface JournalSpaceProps {
  user: User | null;
  blogs: BlogPost[];
  onSelectBlog: (blog: BlogPost) => void;
  onRefresh?: () => void;
  pagination?: PaginationData | null;
  onPageChange?: (page: number) => void;
}

export const JournalSpace: React.FC<JournalSpaceProps> = ({ 
  user, 
  blogs, 
  onSelectBlog, 
  onRefresh,
  pagination,
  onPageChange
}) => {
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const { t } = useTranslation();

  const handleLike = useCallback(async (id: string) => {
    try {
      await apiService.likePost(id);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Failed to like post", error);
    }
  }, [onRefresh]);

  const handlePostCreated = () => {
    setEditingPost(null);
    if (onRefresh) {
      onRefresh();
    } else {
      window.location.reload(); 
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
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error("Failed to delete post", error);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10 lg:pb-0 h-full min-h-0">
      <DeleteModal 
        isOpen={!!postToDelete} 
        onClose={() => setPostToDelete(null)} 
        onConfirm={confirmDelete}
        title={t.delete.confirmTitle}
        // Force secret key confirmation for private logs
        confirmKeyword={user?.private_token || 'ilovechenfangting'}
        isSecret={true}
        message={t.delete.confirmSecretMessage}
      />

      {/* Left Column: Blog Feed */}
      <div className="h-[60vh] lg:h-full flex flex-col min-h-0 bg-white/60 rounded-3xl border border-white/80 shadow-lg backdrop-blur-md overflow-hidden ring-1 ring-white/50 order-2 lg:order-1">
         <div className="p-6 pb-2 flex items-center gap-4 bg-white/40 border-b border-rose-100/50">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 shadow-sm">
              <i className="fas fa-heart"></i>
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-slate-800">
                {t.privateSpace.journal}
              </h1>
              <span className="text-xs font-mono text-rose-400 uppercase tracking-widest">
                {pagination ? pagination.totalItems : blogs.length} {t.privateSpace.memories}
              </span>
            </div>
         </div>
         
         <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <PrivateBlogFeed 
              blogs={blogs} 
              onSelectBlog={onSelectBlog} 
              onLike={handleLike} 
              onEdit={handleEdit}
              onDelete={(blog) => setPostToDelete(blog)}
              pagination={pagination}
              onPageChange={onPageChange}
            />
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
             onCancelEdit={() => setEditingPost(null)}
           />
        </div>
      </div>
    </div>
  );
};