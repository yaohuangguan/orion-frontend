import React, { useMemo } from 'react';
import { renderContent } from './journal/content';
import './journal/journal.css';
import 'katex/dist/katex.min.css';

interface BlogContentProps {
  content: string;
  isLoading?: boolean;
  shadowClass?: string;
  forceLight?: boolean;
}

export const BlogContent: React.FC<BlogContentProps> = ({
  content,
  isLoading,
  shadowClass = '',
  forceLight = false
}) => {
  const html = useMemo(() => renderContent(content || ''), [content]);
  return (
    <div className={`journal-reader ${forceLight ? 'journal-force-light' : ''} ${shadowClass}`}>
      {isLoading ? (
        <p role="status">正在读取日记…</p>
      ) : (
        <div className="journal-prose" dangerouslySetInnerHTML={{ __html: html }} />
      )}
    </div>
  );
};
