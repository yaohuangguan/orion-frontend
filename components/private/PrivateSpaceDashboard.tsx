import React, { useState } from 'react';
import { CountDateWidget, TabType } from './CountDateWidget';
import { JournalSpace } from './JournalSpace';
import { LeisureSpace } from './LeisureSpace';
import { PhotoGallery } from './PhotoGallery';
import { FitnessSpace } from './FitnessSpace';
import { BlogPost, User, PaginationData } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

interface PrivateSpaceDashboardProps {
  user: User | null;
  blogs: BlogPost[];
  onSelectBlog: (blog: BlogPost) => void;
  onRefresh?: () => void;
  
  // Pagination Props
  pagination?: PaginationData | null;
  onPageChange?: (page: number) => void;
  
  // Search/Filter Props
  onFilterChange?: (search: string, tag: string | null) => void;
  initialSearch?: string;
}

export const PrivateSpaceDashboard: React.FC<PrivateSpaceDashboardProps> = ({ 
  user, 
  blogs, 
  onSelectBlog, 
  onRefresh,
  pagination,
  onPageChange,
  onFilterChange,
  initialSearch
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('JOURNAL');

  // Fitness tab should scroll with the page, others have fixed internal layouts on desktop
  const isFixedLayout = activeTab !== 'FITNESS';

  return (
    <div className={`
      min-h-screen pt-24 pb-6 px-4 md:px-6 relative flex flex-col gap-6 text-slate-900
      ${isFixedLayout ? 'lg:h-screen lg:overflow-hidden overflow-y-auto' : 'overflow-y-auto'}
    `}>
      
      {/* Floating Hearts Effect */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i}
            className="absolute animate-rise-slow opacity-60 will-change-transform"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: `-50px`,
              fontSize: `${Math.random() * 30 + 15}px`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`,
              color: Math.random() > 0.5 ? '#f43f5e' : '#fb7185', // rose-500 or rose-400
              textShadow: '0 0 10px rgba(244,63,94,0.3)'
            }}
          >
            ❤
          </div>
        ))}
      </div>

      {/* Top Section: Integrated Together Bar */}
      <div className="container mx-auto max-w-[1600px] shrink-0 relative z-10">
        <CountDateWidget 
          fromDate="2020-02-14" 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>

      {/* Main Content Area */}
      <div className={`container mx-auto flex-1 max-w-[1600px] relative z-10 ${isFixedLayout ? 'lg:min-h-0 pb-10 lg:pb-0' : 'pb-20'}`}>
        {activeTab === 'JOURNAL' && (
          <JournalSpace 
            user={user} 
            blogs={blogs} 
            onSelectBlog={onSelectBlog} 
            onRefresh={onRefresh}
            pagination={pagination}
            onPageChange={onPageChange}
            onFilterChange={onFilterChange}
            initialSearch={initialSearch}
          />
        )}
        
        {activeTab === 'LEISURE' && (
          <div className="h-full animate-fade-in lg:overflow-hidden">
             <LeisureSpace />
          </div>
        )}

        {activeTab === 'GALLERY' && (
          <div className="h-full animate-fade-in lg:overflow-hidden">
             <PhotoGallery />
          </div>
        )}

        {activeTab === 'FITNESS' && (
          <div className="animate-fade-in w-full">
             <FitnessSpace />
          </div>
        )}
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0,0,0,0.2);
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0,0,0,0.4);
        }
      `}</style>
    </div>
  );
};