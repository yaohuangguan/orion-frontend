
import React, { useState } from 'react';

interface ExternalFramePostProps {
  src: string;
  title: string;
}

export const ExternalFramePost: React.FC<ExternalFramePostProps> = ({ src, title }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className="w-full relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-primary-500 to-violet-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
      
      <div className="relative w-full h-[85vh] min-h-[600px] bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 z-10">
            <i className="fas fa-circle-notch fa-spin text-4xl text-primary-500 mb-4"></i>
            <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading Application...</p>
          </div>
        )}
        
        <iframe 
          src={src} 
          title={title}
          className={`w-full h-full border-0 transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          onLoad={() => setIsLoading(false)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
      
      <div className="mt-4 flex justify-end">
        <a 
          href={src} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs font-medium text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex items-center gap-1 transition-colors"
        >
          <i className="fas fa-external-link-alt"></i> Open in new tab
        </a>
      </div>
    </div>
  );
};
