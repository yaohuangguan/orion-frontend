
import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { CountDateWidget, TabType } from './CountDateWidget';
import { JournalSpace } from './JournalSpace';
import { LeisureSpace } from './LeisureSpace';
import { PhotoGallery } from './PhotoGallery';
import { FitnessSpace } from './FitnessSpace';
import { SecondBrainSpace } from './SecondBrainSpace';
import { NewsWidget } from './HotSearchWidget';
import { AccessRestricted } from '../AccessRestricted';
import { BlogPost, User, PaginationData, PERM_KEYS, can } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';

// Import Theme Components (Static)
import { ChristmasTheme } from './themes/ChristmasTheme';
import { NewYearTheme } from './themes/NewYearTheme';

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

type HolidayMode = 'CHRISTMAS' | 'CNY' | 'OFF';

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
  
  // --- Auto Holiday Logic ---
  const autoHoliday = useMemo<HolidayMode>(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();

    // Christmas: Dec 15 - Dec 30
    if (month === 12 && day >= 15 && day <= 30) return 'CHRISTMAS';
    
    // CNY: Dec 31 - Feb 20 (Covers until approx Lantern Festival)
    if ((month === 12 && day >= 31) || month === 1 || (month === 2 && day <= 20)) return 'CNY';

    return 'OFF';
  }, []);

  // --- Theme State Initialization ---
  const [manualHoliday, setManualHoliday] = useState<HolidayMode | null>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('private_theme');
        if (saved && (saved === 'CHRISTMAS' || saved === 'CNY' || saved === 'OFF')) {
            return saved as HolidayMode;
        }
    }
    return null;
  });

  // Determine active holiday
  const activeHoliday = manualHoliday !== null ? manualHoliday : autoHoliday;
  const effectsEnabled = activeHoliday !== 'OFF';

  // Toggle Handler: Cycle through CHRISTMAS -> CNY -> OFF -> CHRISTMAS
  // Save to localStorage on change
  const handleToggleEffects = () => {
    let next: HolidayMode;
    if (activeHoliday === 'CHRISTMAS') next = 'CNY';
    else if (activeHoliday === 'CNY') next = 'OFF';
    else next = 'CHRISTMAS';

    setManualHoliday(next);
    localStorage.setItem('private_theme', next);
  };

  // Fitness tab should scroll with the page, others have fixed internal layouts on desktop
  // Second Brain also has internal scroll
  const isFixedLayout = activeTab !== 'FITNESS';

  // --- Theme Background Logic ---
  const getBackgroundClass = () => {
    if (activeHoliday !== 'OFF') return ''; // Theme component handles it
    return 'bg-gradient-to-br from-pink-200 via-rose-200 to-pink-200 text-slate-900';
  };

  const hasPrivateAccess = can(user, PERM_KEYS.PRIVATE_ACCESS);
  
  // Permission Check for Together Time Widget
  // Only VIP users or Super Admins can see the special timer. Everyone else sees System Time.
  const canViewTogetherTime = !!(user?.vip || user?.role === 'super_admin');

  return (
    <div className={`
      min-h-screen pt-24 pb-6 px-4 md:px-6 relative flex flex-col gap-6 transition-colors duration-1000
      ${isFixedLayout ? 'lg:h-screen lg:overflow-hidden overflow-y-auto' : 'overflow-y-auto'}
      ${getBackgroundClass()}
    `}>
      
      {/* Floating News Widget - Persistent across tabs */}
      <NewsWidget />

      {/* --- RENDER THEMES --- */}
      {activeHoliday === 'CHRISTMAS' && <ChristmasTheme />}
      {activeHoliday === 'CNY' && <NewYearTheme />}

      {/* Default Floating Hearts Effect (Only when holiday effects are OFF) */}
      {activeHoliday === 'OFF' && (
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
                color: Math.random() > 0.5 ? '#f43f5e' : '#fb7185',
                textShadow: '0 0 10px rgba(244,63,94,0.3)'
                }}
            >
                ❤
            </div>
            ))}
        </div>
      )}

      {/* Top Section: Integrated Together Bar */}
      <div className="container mx-auto max-w-[1600px] shrink-0 relative z-10">
        <CountDateWidget 
          fromDate="2020-02-14" 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          // Pass the calculated active holiday (or null if OFF) for widget styling
          holidayType={activeHoliday === 'OFF' ? null : activeHoliday}
          effectsEnabled={effectsEnabled}
          onToggleEffects={handleToggleEffects}
          // Display "Together Time" only for VIP or Super Admin
          hasAccess={canViewTogetherTime}
        />
      </div>

      {/* Main Content Area */}
      <div className={`container mx-auto flex-1 max-w-[1600px] relative z-10 ${isFixedLayout ? 'lg:min-h-0 pb-10 lg:pb-0' : 'pb-20'}`}>
        
        {activeTab === 'SECOND_BRAIN' && (
          can(user, PERM_KEYS.BRAIN_USE) ? (
            <div className="h-full animate-fade-in lg:overflow-hidden">
               <SecondBrainSpace user={user} />
            </div>
          ) : <AccessRestricted permission={PERM_KEYS.BRAIN_USE} className="bg-white/80 backdrop-blur shadow-xl border-white/50" onSuccess={() => window.location.reload()} />
        )}

        {activeTab === 'JOURNAL' && (
          // Journal base access implied by Private Space, but individual actions might need check
          // We assume if they can see private space, they can see the list at least.
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
          can(user, PERM_KEYS.LEISURE_READ) ? (
            <div className="h-full animate-fade-in lg:overflow-hidden">
               <LeisureSpace user={user} />
            </div>
          ) : <AccessRestricted permission={PERM_KEYS.LEISURE_READ} className="bg-white/80 backdrop-blur shadow-xl border-white/50" onSuccess={() => window.location.reload()} />
        )}

        {activeTab === 'GALLERY' && (
          can(user, PERM_KEYS.CAPSULE_USE) ? (
            <div className="h-full animate-fade-in lg:overflow-hidden">
               <PhotoGallery />
            </div>
          ) : <AccessRestricted permission={PERM_KEYS.CAPSULE_USE} className="bg-white/80 backdrop-blur shadow-xl border-white/50" onSuccess={() => window.location.reload()} />
        )}

        {activeTab === 'FITNESS' && (
          can(user, PERM_KEYS.FITNESS_USE) || can(user, PERM_KEYS.FITNESS_READ_ALL) ? (
            <div className="animate-fade-in w-full">
               <FitnessSpace currentUser={user} />
            </div>
          ) : <AccessRestricted permission={PERM_KEYS.FITNESS_READ_ALL} className="bg-white/80 backdrop-blur shadow-xl border-white/50" onSuccess={() => window.location.reload()} />
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