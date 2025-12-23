import React, { useState } from 'react';
import { Tag } from '../types';

export type TagTheme = 'amber' | 'rose' | 'blue' | 'slate';

interface TagCloudProps {
  tags: Tag[];
  selectedTag: string | null;
  onSelect: (tag: string | null) => void;
  theme?: TagTheme;
  limit?: number;
  label?: string;
  className?: string;
}

export const TagCloud: React.FC<TagCloudProps> = ({
  tags,
  selectedTag,
  onSelect,
  theme = 'slate',
  limit = 15,
  label,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Sorting logic: Active tag first, then count desc, then name asc
  // Note: Usually tags come sorted from backend, but active first is nice UI
  // We won't re-sort harshly to prevent UI jumping, just rely on backend order mostly

  const displayTags = isExpanded ? tags : tags.slice(0, limit);
  const hasMore = tags.length > limit;

  // Theme Classes Configuration
  const themeClasses = {
    amber: {
      active: 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 border-amber-500',
      inactive:
        'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-amber-50 dark:hover:bg-slate-700 hover:text-amber-600 border-transparent',
      count: 'text-amber-600',
      labelIcon: 'text-amber-500'
    },
    rose: {
      active: 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 border-rose-500',
      inactive: 'bg-white text-slate-500 hover:bg-rose-50 hover:text-rose-600 border-slate-200',
      count: 'text-rose-400',
      labelIcon: 'text-rose-400'
    },
    blue: {
      active: 'bg-blue-500 text-white shadow-lg shadow-blue-500/20 border-blue-500',
      inactive:
        'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-600 border-transparent',
      count: 'text-blue-400',
      labelIcon: 'text-blue-500'
    },
    slate: {
      active: 'bg-slate-700 text-white shadow-lg border-slate-700',
      inactive: 'bg-slate-100 text-slate-500 hover:bg-slate-200 border-transparent',
      count: 'text-slate-400',
      labelIcon: 'text-slate-500'
    }
  };

  const currentTheme = themeClasses[theme];

  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2 mb-1">
          <i className={`fas fa-tag ${currentTheme.labelIcon}`}></i> {label}
        </span>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        {/* All Button */}
        <button
          onClick={() => onSelect(null)}
          className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border ${
            selectedTag === null ? currentTheme.active : currentTheme.inactive
          }`}
        >
          All
        </button>

        {/* Tag List */}
        {displayTags.map((tagObj) => (
          <button
            key={tagObj.name}
            onClick={() => onSelect(tagObj.name === selectedTag ? null : tagObj.name)}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all border flex items-center gap-1.5 ${
              selectedTag === tagObj.name ? currentTheme.active : currentTheme.inactive
            }`}
          >
            {tagObj.name}
            {tagObj.count > 0 && (
              <span
                className={`text-[10px] font-normal opacity-80 ${selectedTag === tagObj.name ? 'text-white/80' : currentTheme.count}`}
              >
                {tagObj.count}
              </span>
            )}
          </button>
        ))}

        {/* Toggle Expand */}
        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2 py-1 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <i className="fas fa-minus-circle"></i> Less
              </>
            ) : (
              <>
                <i className="fas fa-plus-circle"></i> {tags.length - limit} More
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
