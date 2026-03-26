import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { featureService } from '../services/featureService';
import { toast } from './Toast';

interface R2ImageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
}

export const R2ImageSelectorModal: React.FC<R2ImageSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  const [files, setFiles] = useState<any[]>([]);
  const [folders, setFolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentFolder('');
      setFiles([]);
      setFolders([]);
      fetchData('');
    }
  }, [isOpen]);

  const fetchData = async (folder: string, nextCursor?: string) => {
    setLoading(true);
    try {
      const res: any = await featureService.getR2Files(50, nextCursor, 'resource', folder);
      if (res.success) {
        if (nextCursor) {
          setFiles((prev) => [...prev, ...(res.data.files || [])]);
        } else {
          setFiles(res.data.files || []);
          setFolders(res.data.folders || []);
        }

        if (res.meta && typeof res.meta.currentPath === 'string') {
          // Ensure folder path logic stays consistent
        }

        setCursor(res.pagination?.nextCursor);
        setHasMore(!!res.pagination?.hasMore);
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load R2 assets');
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderName: string) => {
    const nextPath = folderName; // API returns full path in folder.name or nextQueryParam usually
    setCurrentFolder(nextPath);
    setFiles([]);
    setFolders([]);
    setCursor(undefined);
    fetchData(nextPath);
  };

  const handleBreadcrumbClick = (index: number, parts: string[]) => {
    const newPath = parts.slice(0, index + 1).join('/');
    setCurrentFolder(newPath);
    setFiles([]);
    setFolders([]);
    setCursor(undefined);
    fetchData(newPath);
  };

  const handleRootClick = () => {
    setCurrentFolder('');
    setFiles([]);
    setFolders([]);
    setCursor(undefined);
    fetchData('');
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      fetchData(currentFolder, cursor);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <i className="fas fa-layer-group text-orange-500"></i> R2 Resource Library
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center justify-center"
            >
              <i className="fas fa-times text-slate-500"></i>
            </button>
          </div>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-xl overflow-x-auto whitespace-nowrap custom-scrollbar">
            <button
              onClick={handleRootClick}
              className={`flex items-center gap-1 hover:text-orange-500 transition-colors ${!currentFolder ? 'font-bold text-orange-500' : ''}`}
            >
              <i className="fas fa-home"></i> Root
            </button>
            {currentFolder
              .split('/')
              .filter(Boolean)
              .map((part, index, arr) => (
                <React.Fragment key={index}>
                  <span className="text-slate-300 text-xs">/</span>
                  <button
                    onClick={() => handleBreadcrumbClick(index, arr)}
                    className={`hover:text-orange-500 transition-colors ${index === arr.length - 1 ? 'font-bold text-slate-700 dark:text-slate-200' : ''}`}
                  >
                    {part}
                  </button>
                </React.Fragment>
              ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-slate-100/50 dark:bg-black/20">
          {/* Folders */}
          {folders.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6">
              {folders.map((folder, idx) => (
                <div
                  key={idx}
                  onClick={() => handleFolderClick(folder.nextQueryParam || folder.name)}
                  className="bg-amber-50 dark:bg-slate-800 border border-amber-100 dark:border-slate-700 p-3 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-amber-100 dark:hover:bg-slate-700/80 transition-colors"
                >
                  <i className="fas fa-folder text-amber-400 text-xl"></i>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate w-full">
                    {folder.name.replace(/\/$/, '')}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Files */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file.key || file.name}
                className="group relative aspect-square bg-white dark:bg-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                onClick={() => onSelect(file.url)}
              >
                <div className="w-full h-full flex items-center justify-center bg-slate-100 dark:bg-slate-900">
                  {/* Checkerboard for transparency */}
                  <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:8px_8px]"></div>

                  {file.type === 'image' || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file.name) ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="w-full h-full object-contain p-2"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-400">
                      <i className="fas fa-file text-3xl mb-2"></i>
                      <span className="text-[9px] font-bold uppercase truncate max-w-[80%]">
                        {file.name.split('.').pop()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all shadow-lg">
                    Select
                  </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur p-1">
                  <div className="text-[10px] text-white/90 truncate text-center">{file.name}</div>
                </div>
              </div>
            ))}
          </div>

          {files.length === 0 && folders.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <i className="fas fa-folder-open text-4xl mb-3 opacity-50"></i>
              <p>Folder is empty.</p>
            </div>
          )}

          {loading && (
            <div className="py-8 text-center text-slate-400 animate-pulse">
              <i className="fas fa-circle-notch fa-spin mr-2"></i> Loading...
            </div>
          )}

          {!loading && hasMore && files.length > 0 && (
            <button
              onClick={handleLoadMore}
              className="w-full py-3 mt-4 text-xs font-bold uppercase text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:text-orange-500 hover:border-orange-500 transition-colors"
            >
              Load More
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
