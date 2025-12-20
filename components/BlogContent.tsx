
import React, { useMemo } from 'react';

interface BlogContentProps {
  content: string;
  isLoading?: boolean;
  shadowClass?: string;
  forceLight?: boolean;
  clean?: boolean;
}

export const BlogContent: React.FC<BlogContentProps> = ({ content, isLoading, shadowClass = 'shadow-2xl', forceLight = false, clean = false }) => {
  
  // Custom Markdown Rendering logic
  const renderedContent = useMemo(() => {
    if (isLoading) return '<div class="flex items-center gap-3 text-slate-400 animate-pulse font-mono py-12 justify-center"><i class="fas fa-circle-notch fa-spin"></i> Retrieving data stream...</div>';
    if (!content) return '';
    
    if (window.marked) {
      try {
        return window.marked.parse(content);
      } catch (e) {
        console.warn("Markdown parse error, falling back to raw", e);
        return content;
      }
    }
    return content;
  }, [content, isLoading]);

  // Dynamic CSS to support Light/Dark modes while adhering to the requested design style
  const customStyles = `
    .blog-content-wrapper {
      /* Light Mode Defaults */
      --bc-text: #374151; /* gray-700 */
      --bc-heading: #111827; /* gray-900 */
      --bc-bold: #000;
      --bc-quote-border: #e5e7eb;
      --bc-quote-text: #6b7280;
      --bc-code-bg: #f3f4f6;
      --bc-code-text: #db2777; /* pink-600 for inline code in light mode */
      --bc-pre-bg: #1e1e1e; /* Dark pre blocks by default even in light mode for contrast */
      --bc-pre-border: #374151;
      --bc-pre-text: #f3f4f6;
      --bc-link: #2563eb;
      --bc-img-border: #e5e7eb;
    }

    ${!forceLight ? `
    .dark .blog-content-wrapper {
      /* Dark Mode Overrides (Matching provided snippet) */
      --bc-text: #d1d5db; /* gray-300 */
      --bc-heading: #f3f4f6; /* gray-100 */
      --bc-bold: #fff;
      --bc-quote-border: #4b5563;
      --bc-quote-text: #9ca3af;
      --bc-code-bg: #2f2f2f;
      --bc-code-text: #e5e7eb;
      --bc-pre-bg: #0d0d0d;
      --bc-pre-border: #333;
      --bc-pre-text: #e5e7eb;
      --bc-link: #60a5fa;
      --bc-img-border: #333;
    }
    ` : ''}

    .blog-content-body {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 1.125rem; /* text-lg */
      line-height: 1.8;
      color: var(--bc-text);
    }

    .blog-content-body p {
      margin-bottom: 1.5em;
    }
    .blog-content-body p:last-child {
      margin-bottom: 0;
    }

    .blog-content-body h1, 
    .blog-content-body h2, 
    .blog-content-body h3, 
    .blog-content-body h4 {
      color: var(--bc-heading);
      font-weight: 700;
      margin-top: 2em;
      margin-bottom: 0.75em;
      line-height: 1.3;
      font-family: 'Sen', sans-serif;
    }
    
    .blog-content-body h1 { font-size: 2.25rem; letter-spacing: -0.025em; }
    .blog-content-body h2 { font-size: 1.875rem; letter-spacing: -0.025em; }
    .blog-content-body h3 { font-size: 1.5rem; }
    .blog-content-body h4 { font-size: 1.25rem; }

    .blog-content-body ul, 
    .blog-content-body ol {
      margin-left: 1.5em;
      margin-bottom: 1.5em;
    }
    .blog-content-body ul { list-style-type: disc; }
    .blog-content-body ol { list-style-type: decimal; }
    .blog-content-body li { margin-bottom: 0.5em; }

    .blog-content-body strong {
      color: var(--bc-bold);
      font-weight: 700;
    }

    .blog-content-body blockquote {
      border-left: 4px solid var(--bc-quote-border);
      padding-left: 1.5em;
      color: var(--bc-quote-text);
      font-style: italic;
      margin: 2em 0;
      background: rgba(128, 128, 128, 0.05);
      padding: 1em 1em 1em 1.5em;
      border-radius: 0 12px 12px 0;
    }

    .blog-content-body code {
      background-color: var(--bc-code-bg);
      padding: 0.2em 0.4em;
      border-radius: 6px;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
      font-size: 0.9em;
      color: var(--bc-code-text);
    }

    .blog-content-body pre {
      background-color: var(--bc-pre-bg);
      padding: 1.5em;
      border-radius: 12px;
      overflow-x: auto;
      margin: 2em 0;
      border: 1px solid var(--bc-pre-border);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .blog-content-body pre code {
      background-color: transparent;
      padding: 0;
      border-radius: 0;
      color: var(--bc-pre-text);
      font-size: 0.9em;
      font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
    }

    .blog-content-body a {
      color: var(--bc-link);
      text-decoration: underline;
      text-underline-offset: 4px;
      transition: opacity 0.2s;
    }
    .blog-content-body a:hover {
      opacity: 0.8;
    }

    .blog-content-body img {
      border-radius: 12px;
      margin: 2em auto;
      display: block;
      max-width: 100%;
      border: 1px solid var(--bc-img-border);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    }
    
    .blog-content-body hr {
      border-color: var(--bc-quote-border);
      margin: 3em 0;
    }
  `;

  // Base styling classes for the card container
  const containerClasses = forceLight
    ? `bg-white rounded-[2rem] p-8 md:p-16 border border-slate-200 ${shadowClass} relative overflow-hidden group transition-colors duration-500 blog-content-wrapper`
    : `bg-white dark:bg-[#050914] rounded-[2rem] p-8 md:p-16 border border-slate-200 dark:border-slate-800 ${shadowClass} relative overflow-hidden group transition-colors duration-500 blog-content-wrapper`;

  return (
    <div className={containerClasses}>
        <style>{customStyles}</style>
        
        {/* Subtle decorative gradient - Only if clean is false */}
        {!clean && (
          <>
            <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${forceLight ? 'bg-pink-500/10' : 'bg-primary-500/5'}`}></div>
            <div className={`absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-[100px] pointer-events-none transition-colors duration-700 ${forceLight ? 'bg-rose-500/10' : 'bg-blue-500/5'}`}></div>
          </>
        )}

        <div 
            className="blog-content-body relative z-10"
            dangerouslySetInnerHTML={{ __html: renderedContent }} 
        />
    </div>
  );
};
