
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '../../i18n/LanguageContext';
import { featureService } from '../../services/featureService';
import { apiService } from '../../services/api';
import { CloudinaryUsage } from '../../types';
import { toast } from '../Toast';
import { DeleteModal } from '../DeleteModal';

export const SystemResources: React.FC = () => {
  const { t } = useTranslation();
  const [usageData, setUsageData] = useState<CloudinaryUsage | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Library Modal State
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [libraryImages, setLibraryImages] = useState<{ url: string, public_id: string }[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);
  
  // Delete State
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  const fetchUsage = async () => {
    setLoading(true);
    try {
      const data = await featureService.getCloudinaryUsage();
      setUsageData(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, []);

  const handleOpenLibrary = async () => {
    setIsLibraryOpen(true);
    setLoadingLibrary(true);
    try {
        const imgs = await apiService.getRecentImages();
        setLibraryImages(imgs);
    } catch(e) {
        toast.error("Failed to load images");
    } finally {
        setLoadingLibrary(false);
    }
  };

  const confirmDeleteImage = async () => {
      if (!imageToDelete) return;
      const id = imageToDelete;
      setLibraryImages(prev => prev.filter(img => img.public_id !== id));
      setImageToDelete(null);
      try {
          await apiService.deleteCloudinaryImage(id);
          fetchUsage(); // Refresh usage stats
      } catch (e) {
          console.error(e);
          toast.error("Delete failed");
      }
  };

  const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  if (loading && !usageData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <i className="fas fa-circle-notch fa-spin text-4xl text-primary-500 mb-4"></i>
        <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">Analysing System Metrics...</p>
      </div>
    );
  }

  if (!usageData) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
        {/* Left Column: Overall Status */}
        <div className="lg:col-span-1 space-y-8">
            {/* Plan Card */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary-500/20 transition-colors"></div>
            
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl shadow-lg">
                        <i className="fas fa-cloud"></i>
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white">{t.system.cloudinary.title}</h3>
                        <p className="text-xs text-slate-500 uppercase tracking-wider">{usageData.plan} Plan</p>
                    </div>
                </div>
                
                {/* Library Button */}
                <button 
                    onClick={handleOpenLibrary}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-white hover:bg-blue-500 dark:hover:bg-blue-500 flex items-center justify-center transition-all shadow-sm"
                    title="Manage Image Library"
                >
                    <i className="fas fa-images"></i>
                </button>
            </div>

            {/* Circular Progress for Total Credits */}
            <div className="flex flex-col items-center justify-center py-4">
                <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                        <circle 
                        cx="80" cy="80" r="70" 
                        stroke="currentColor" 
                        strokeWidth="12" 
                        fill="transparent" 
                        strokeDasharray={440} 
                        strokeDashoffset={440 - (440 * usageData.credits.used_percent) / 100} 
                        className={`transition-all duration-1000 ease-out ${
                            usageData.credits.used_percent > 80 ? 'text-red-500' : 
                            usageData.credits.used_percent > 50 ? 'text-amber-500' : 'text-emerald-500'
                        }`}
                        strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-800 dark:text-white">{usageData.credits.used_percent.toFixed(1)}%</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">{t.system.cloudinary.credits}</span>
                    </div>
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">
                    {usageData.credits.usage.toFixed(2)} used of {usageData.credits.limit} monthly credits
                </p>
            </div>
            </div>

            {/* Resources Summary */}
            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-lg">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{t.system.cloudinary.resources}</h4>
            <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 dark:text-slate-300"><i className="fas fa-images mr-2 text-indigo-400"></i> Media Assets</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{formatNumber(usageData.resources)}</span>
            </div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 dark:text-slate-300"><i className="fas fa-magic mr-2 text-purple-400"></i> Derived</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{formatNumber(usageData.derived_resources)}</span>
            </div>
            <div className="h-px bg-slate-100 dark:bg-slate-800 my-3"></div>
            <div className="flex justify-between items-center">
                <span className="text-slate-600 dark:text-slate-300"><i className="fas fa-exchange-alt mr-2 text-emerald-400"></i> Requests</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{formatNumber(usageData.requests)}</span>
            </div>
            </div>
        </div>

        {/* Right Column: Detailed Metrics */}
        <div className="lg:col-span-2 space-y-6">
            {/* Storage Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                        <i className="fas fa-hdd"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{t.system.cloudinary.storage}</h4>
                        <p className="text-xs text-slate-500">{formatBytes(usageData.storage.usage)} Used</p>
                    </div>
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    {usageData.storage.credits_usage.toFixed(2)} Credits
                </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-orange-500 h-full rounded-full" style={{ width: `${(usageData.storage.credits_usage / usageData.credits.usage) * 100}%` }}></div>
            </div>
            <div className="flex justify-end mt-1">
                <span className="text-[10px] text-slate-400">{( (usageData.storage.credits_usage / usageData.credits.usage) * 100 ).toFixed(1)}% of total usage</span>
            </div>
            </div>

            {/* Bandwidth Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                        <i className="fas fa-network-wired"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{t.system.cloudinary.bandwidth}</h4>
                        <p className="text-xs text-slate-500">{formatBytes(usageData.bandwidth.usage)} Consumed</p>
                    </div>
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    {usageData.bandwidth.credits_usage.toFixed(2)} Credits
                </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-cyan-500 h-full rounded-full" style={{ width: `${(usageData.bandwidth.credits_usage / usageData.credits.usage) * 100}%` }}></div>
            </div>
            <div className="flex justify-end mt-1">
                <span className="text-[10px] text-slate-400">{( (usageData.bandwidth.credits_usage / usageData.credits.usage) * 100 ).toFixed(1)}% of total usage</span>
            </div>
            </div>

            {/* Transformations Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <i className="fas fa-sync-alt"></i>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-800 dark:text-white">{t.system.cloudinary.transformations}</h4>
                        <p className="text-xs text-slate-500">{formatNumber(usageData.transformations.usage)} Operations</p>
                    </div>
                </div>
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg">
                    {usageData.transformations.credits_usage.toFixed(2)} Credits
                </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-purple-500 h-full rounded-full" style={{ width: `${(usageData.transformations.credits_usage / usageData.credits.usage) * 100}%` }}></div>
            </div>
            <div className="flex justify-end mt-1">
                <span className="text-[10px] text-slate-400">{( (usageData.transformations.credits_usage / usageData.credits.usage) * 100 ).toFixed(1)}% of total usage</span>
            </div>
            </div>

            {/* Objects Count (Simple Stat) */}
            <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-500 flex items-center justify-center shadow-sm">
                    <i className="fas fa-cubes"></i>
                </div>
                <span className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest text-sm">{t.system.cloudinary.objects}</span>
            </div>
            <span className="text-2xl font-mono font-bold text-slate-900 dark:text-white">{formatNumber(usageData.objects.usage)}</span>
            </div>
        </div>

        {/* --- Image Library Modal --- */}
        {isLibraryOpen && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-fade-in">
            <div className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 dark:border-slate-800 relative">
                
                {/* Modal Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <i className="fas fa-images"></i>
                        </div>
                        <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Image Library</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">{libraryImages.length} Assets</p>
                        </div>
                    </div>
                    <button 
                    onClick={() => setIsLibraryOpen(false)}
                    className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-black/20 custom-scrollbar">
                    {loadingLibrary ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <i className="fas fa-circle-notch fa-spin text-3xl mb-4 text-blue-500"></i>
                        <p className="font-mono text-xs uppercase tracking-widest">Fetching Assets...</p>
                        </div>
                    ) : libraryImages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <i className="fas fa-folder-open text-5xl mb-4 opacity-50"></i>
                        <p>No images found in library.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {libraryImages.map((img) => (
                            <div key={img.public_id} className="group relative aspect-square bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700">
                                <img 
                                src={img.url} 
                                alt="Asset" 
                                className="w-full h-full object-cover" 
                                loading="lazy"
                                />
                                
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                    <button
                                    onClick={() => setImageToDelete(img.public_id)}
                                    className="w-10 h-10 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all flex items-center justify-center hover:bg-red-600 shadow-lg"
                                    title="Delete Asset"
                                    >
                                    <i className="fas fa-trash-alt"></i>
                                    </button>
                                </div>
                                
                                {/* ID Tag */}
                                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur p-1 text-[9px] text-white/80 font-mono truncate text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {img.public_id}
                                </div>
                            </div>
                        ))}
                        </div>
                    )}
                </div>

                {/* Delete Modal inside Portal */}
                <DeleteModal
                    isOpen={!!imageToDelete}
                    onClose={() => setImageToDelete(null)}
                    onConfirm={confirmDeleteImage}
                    title="Delete Asset"
                    message="Permanently remove this image from Cloudinary?"
                    requireInput={false}
                    buttonText="Delete"
                    zIndexClass="z-[10000]"
                />
            </div>
            </div>,
            document.body
        )}
    </div>
  );
};
