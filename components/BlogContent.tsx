
import React, { useEffect, useMemo, useRef } from 'react';

interface BlogContentProps {
  content: string;
  isLoading?: boolean;
  shadowClass?: string;
}

export const BlogContent: React.FC<BlogContentProps> = ({ content, isLoading, shadowClass = 'shadow-2xl' }) => {
  const contentRef = useRef<HTMLDivElement>(null);

  // Process markdown if available
  const renderedContent = useMemo(() => {
    if (isLoading) return '<div class="flex items-center gap-3 text-slate-400 animate-pulse font-mono py-12 justify-center"><i class="fas fa-circle-notch fa-spin"></i> Retrieving data stream...</div>';
    if (window.marked && content) {
      try {
        return window.marked.parse(content);
      } catch (e) {
        console.warn("Markdown parse error, falling back to raw", e);
        return content;
      }
    }
    return content;
  }, [content, isLoading]);

  // Effect to trigger syntax highlighting and enforce container styling
  // Running without dependency array ensures it runs after every render (essential for theme switches).
  useEffect(() => {
    if (window.hljs && contentRef.current) {
      const blocks = contentRef.current.querySelectorAll('pre code');
      blocks.forEach((block) => {
        const el = block as HTMLElement;

        // 1. Run Syntax Highlighting
        if (!el.classList.contains('hljs')) {
           window.hljs.highlightElement(el);
        }

        // 2. Enforce Background AND Text Color on Parent <pre> tag
        // This ensures the "grey box" never disappears and text is always readable (light)
        const pre = el.parentElement;
        if (pre && pre.tagName === 'PRE') {
           // Force dark background for code blocks in all themes for consistent readability
           // Using inline styles guarantees priority over external CSS or Tailwind conflicts
           pre.style.backgroundColor = '#1e293b'; // Slate 800
           pre.style.color = '#f8fafc'; // Slate 50 (Very light gray/white) - FORCE LIGHT TEXT
           pre.style.borderRadius = '1rem';
           pre.style.padding = '1.5rem';
           pre.style.overflowX = 'auto';
           pre.style.border = '1px solid rgba(51, 65, 85, 0.5)'; // Slate 700/50
           pre.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)';
           
           // Ensure the code element itself is transparent so it fits the pre container
           el.style.backgroundColor = 'transparent';
           el.style.color = 'inherit'; // Inherit the light color from pre
           el.style.padding = '0';
           el.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        }
      });
    }
  }); // No dependency array intended

  return (
    <div className={`bg-white dark:bg-[#050914] rounded-[2rem] p-8 md:p-16 border border-slate-200 dark:border-slate-800 ${shadowClass} relative overflow-hidden group transition-colors duration-500`}>
        
        {/* Subtle decorative gradient glow behind text */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none transition-colors duration-700"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none transition-colors duration-700"></div>

        <div 
            ref={contentRef}
            className="prose prose-lg md:prose-xl prose-slate dark:prose-invert max-w-none relative z-10
            prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
            prose-p:leading-loose prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:mb-8
            prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-12 prose-img:border prose-img:border-slate-100 dark:prose-img:border-slate-800
            prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-900/50 prose-blockquote:py-4 prose-blockquote:pr-4 prose-blockquote:rounded-r-xl
            prose-li:text-slate-600 dark:prose-li:text-slate-300
            
            /* IMPORTANT: We remove some Tailwind prose-pre styles here because we enforce them in JS above 
               to solve the disappearing background issue. We keep text color override. */
            prose-pre:text-slate-100 prose-pre:bg-transparent
            
            /* Inline Code Styling (Single ticks `code`) */
            prose-code:text-rose-600 dark:prose-code:text-rose-400 prose-code:bg-slate-100 dark:prose-code:bg-slate-800/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none
            
            /* Override prose-code styles specifically for code blocks (pre > code) */
            /* Ensure inherit color so JS enforcement works */
            [&_pre_code]:text-inherit [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:font-normal
            
            /* Icon Protection */
            [&_.fa]:font-sans [&_.fas]:font-sans [&_.fab]:font-sans [&_.far]:font-sans" 
            dangerouslySetInnerHTML={{ __html: renderedContent }} 
        />
    </div>
  );
};
