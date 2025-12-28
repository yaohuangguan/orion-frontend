import React, { useMemo } from 'react';
import { useTranslation } from '../../../i18n/LanguageContext';
import { FitnessRecord, User } from '../../../types';

interface FitnessPhotoWallProps {
  isOpen: boolean;
  onToggle: () => void;
  // This prop now expects data specifically fetched for the wall
  wallRecords: FitnessRecord[];
  selectedUser: User | null;
  onSelectPhoto: (url: string) => void;
  onPrevRange: () => void;
  onNextRange: () => void;
  rangeLabel: string;
}

export const FitnessPhotoWall: React.FC<FitnessPhotoWallProps> = ({
  isOpen,
  onToggle,
  wallRecords,
  selectedUser,
  onSelectPhoto,
  onPrevRange,
  onNextRange,
  rangeLabel
}) => {
  const { t } = useTranslation();

  // Group by Year-Month for the list view
  const groupedPhotos = useMemo(() => {
    const groups: Record<string, { url: string; record: FitnessRecord }[]> = {};

    // Sort all records by date descending
    // wallRecords is already an array of FitnessRecord
    const allRecords = [...wallRecords].sort(
      (a, b) => new Date(b.dateStr || '').getTime() - new Date(a.dateStr || '').getTime()
    );

    allRecords.forEach((r) => {
      if (selectedUser) {
        const rUser = r.user as User;
        const rUserId = rUser?._id || (typeof r.user === 'string' ? r.user : '');
        const selectedUserId = selectedUser._id;
        if (rUserId !== selectedUserId) return;
      }
      if (!r.photos || r.photos.length === 0) return;

      // Group Key: YYYY-MM
      const key = r.dateStr?.substring(0, 7) || 'Unknown';

      if (!groups[key]) groups[key] = [];
      r.photos.forEach((url) => {
        groups[key].push({ url, record: r });
      });
    });

    return groups;
  }, [wallRecords, selectedUser]);

  const totalPhotos = useMemo(() => {
    return Object.values(groupedPhotos).reduce(
      (acc: number, curr: { url: string; record: FitnessRecord }[]) => acc + curr.length,
      0
    );
  }, [groupedPhotos]);

  return (
    <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full p-4 flex justify-between items-center bg-gradient-to-r from-rose-50 to-white hover:bg-rose-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-500 flex items-center justify-center shadow-sm border border-rose-200">
            <i className="fas fa-images"></i>
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              {t.privateSpace.fitness.photoWall.title}
            </h3>
            <p className="text-[10px] text-rose-400 font-mono">{totalPhotos} Photos in Range</p>
          </div>
        </div>
        <div
          className={`w-8 h-8 rounded-full bg-white border border-rose-100 flex items-center justify-center text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-rose-500' : ''}`}
        >
          <i className="fas fa-chevron-down"></i>
        </div>
      </button>

      {isOpen && (
        <div className="p-6 bg-slate-50/50 animate-slide-up max-h-[600px] overflow-y-auto custom-scrollbar flex flex-col">
          {/* Date Navigation */}
          <div className="flex justify-between items-center mb-6 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
            <button
              onClick={onPrevRange}
              className="px-4 py-2 text-xs font-bold uppercase text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
            >
              <i className="fas fa-chevron-left"></i> {t.privateSpace.fitness.photoWall.prev6}
            </button>
            <span className="text-xs font-mono font-bold text-slate-700">{rangeLabel}</span>
            <button
              onClick={onNextRange}
              className="px-4 py-2 text-xs font-bold uppercase text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2"
            >
              {t.privateSpace.fitness.photoWall.next6} <i className="fas fa-chevron-right"></i>
            </button>
          </div>

          {Object.keys(groupedPhotos).length === 0 ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2 border-2 border-dashed border-slate-200 rounded-2xl">
              <i className="fas fa-camera-retro text-2xl opacity-50"></i>
              <span className="text-xs uppercase tracking-widest">
                {t.privateSpace.fitness.photoWall.empty}
              </span>
            </div>
          ) : (
            Object.entries(groupedPhotos).map(
              ([monthKey, items]: [string, { url: string; record: FitnessRecord }[]]) => (
                <div key={monthKey} className="mb-8 last:mb-0">
                  <div className="sticky top-0 bg-slate-50/95 backdrop-blur z-10 py-2 mb-2 border-b border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {monthKey}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {items.map((item, idx) => (
                      <div
                        key={`${item.record._id}-${idx}`}
                        className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-md cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white"
                        onClick={() => onSelectPhoto(item.url)}
                      >
                        <img
                          src={item.url}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          alt="Moment"
                        />

                        {/* Data Overlay */}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8 text-white opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end">
                          <div className="text-[10px] font-mono text-white/80 mb-1">
                            {item.record.dateStr}
                          </div>
                          {item.record.body?.weight && (
                            <span className="text-xs font-bold flex items-center gap-1">
                              <i className="fas fa-weight text-[10px] text-rose-400"></i>{' '}
                              {item.record.body.weight}kg
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )
          )}
        </div>
      )}
    </div>
  );
};
