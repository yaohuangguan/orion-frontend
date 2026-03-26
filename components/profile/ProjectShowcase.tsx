import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { apiService } from '../../services/api';
import { PortfolioProject, User } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { toast } from '../Toast';
import { DeleteModal } from '../DeleteModal';
import { R2ImageSelectorModal } from '../R2ImageSelectorModal';

interface ProjectShowcaseProps {
  currentUser?: User | null;
}

export const ProjectShowcase: React.FC<ProjectShowcaseProps> = ({ currentUser }) => {
  const { language, t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Admin State
  const [isEditing, setIsEditing] = useState(false);
  const [currentProject, setCurrentProject] = useState<Partial<PortfolioProject>>({});
  // Fix: Dedicated state for Tech Stack input to allow free typing of commas/spaces
  const [techStackInput, setTechStackInput] = useState('');

  const [projectToDelete, setProjectToDelete] = useState<PortfolioProject | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isR2ModalOpen, setIsR2ModalOpen] = useState(false);

  // Demo Modal State
  const [demoProject, setDemoProject] = useState<PortfolioProject | null>(null);
  const [viewMode, setViewMode] = useState<'CHOICE' | 'IFRAME' | null>(null);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const isVip = currentUser?.vip && currentUser?.private_token === 'ilovechenfangting';

  // 1. Load Projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const data = await apiService.getPortfolioProjects();
      setProjects(data);
    } catch (e) {
      console.error('Failed to load projects', e);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Deep Linking Logic: Sync URL 'demo' param with Modal State
  useEffect(() => {
    const demoId = searchParams.get('demo');

    // Only proceed if projects are loaded
    if (isLoading || projects.length === 0) return;

    if (demoId) {
      // If we have a demo ID in URL
      const target = projects.find((p) => p._id === demoId);
      if (target) {
        // Only update state if needed to prevent infinite loops
        if (demoProject?._id !== target._id || viewMode !== 'IFRAME') {
          setDemoProject(target);
          setViewMode('IFRAME'); // Directly go to Iframe view as requested
        }
      }
    } else {
      // If URL param is removed externally (back button), and we are in IFRAME mode, close modal
      // We check for IFRAME mode to allow CHOICE mode to exist without URL param
      if (viewMode === 'IFRAME') {
        closeDemoModal(false);
      }
    }
  }, [searchParams, projects, isLoading, viewMode, demoProject]);

  const getLocalized = (obj: any, field: string) => {
    return language === 'zh'
      ? obj[`${field}_zh`] || obj[`${field}_en`]
      : obj[`${field}_en`] || obj[`${field}_zh`];
  };

  const handleCreate = () => {
    setCurrentProject({
      title_zh: '',
      title_en: '',
      summary_zh: '',
      summary_en: '',
      description_zh: '',
      description_en: '',
      techStack: [],
      repoUrl: '',
      demoUrl: '',
      coverImage: '',
      order: 0,
      isVisible: true
    });
    setTechStackInput('');
    setIsEditing(true);
  };

  const handleEdit = (project: PortfolioProject) => {
    setCurrentProject({ ...project });
    setTechStackInput(project.techStack ? project.techStack.join(', ') : '');
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!projectToDelete) return;
    try {
      await apiService.deleteProject(projectToDelete._id);
      loadProjects();
      setProjectToDelete(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Parse the tech stack string into array
    const processedProject = {
      ...currentProject,
      techStack: techStackInput
        .split(/[,，]/)
        .map((s) => s.trim())
        .filter((s) => s) // Split by comma (EN or CN)
    };

    try {
      if (processedProject._id) {
        await apiService.updateProject(processedProject._id, processedProject);
      } else {
        await apiService.createProject(processedProject);
      }
      setIsEditing(false);
      loadProjects();
    } catch (e) {
      console.error(e);
    }
  };

  // Logic to process file upload (reused by input change and paste)
  const processUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const url = await apiService.uploadImage(file, { folder: 'portfolio' });
      setCurrentProject((prev) => ({ ...prev, coverImage: url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processUpload(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault(); // Prevent pasting binary string
          processUpload(file);
          return;
        }
      }
    }
  };

  // Demo Logic
  const handleLiveDemoClick = (project: PortfolioProject) => {
    // Just open the choice modal locally.
    // We do NOT update the URL here to keep the choice modal "clean" of deep links
    // until the user actually selects a specific viewing mode that supports deep linking (like Iframe).
    setDemoProject(project);
    setViewMode('CHOICE');
  };

  const handleOpenLocal = () => {
    // Update URL to trigger Iframe view via Effect
    // This allows browser back button to work naturally
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (demoProject) newParams.set('demo', demoProject._id);
      return newParams;
    });
    // Optimistically update state
    setViewMode('IFRAME');
    setIframeLoading(true);
  };

  const handleOpenNewTab = () => {
    if (demoProject?.demoUrl) {
      window.open(demoProject.demoUrl, '_blank');
    }
    // Just close modal, don't update URL since we aren't showing anything inside the app
    closeDemoModal(false);
  };

  const closeDemoModal = (updateUrl = true) => {
    setDemoProject(null);
    setViewMode(null);
    setIframeLoading(true);

    if (updateUrl) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete('demo');
        return newParams;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="h-80 bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
        ))}
      </div>
    );
  }

  // Styles for the "Kraft Paper" vs "Star Chart" theme in editor
  const modalBaseClass =
    'fixed z-[9999] inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4';
  const editorClass =
    'w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl border bg-white text-slate-900 border-slate-200 dark:bg-[#020617] dark:text-slate-100 dark:border-slate-700 animate-slide-up';
  const inputClass =
    'w-full p-3 rounded-lg outline-none border focus:border-primary-500 bg-slate-50 border-slate-200 dark:bg-[#1e293b] dark:border-slate-700';

  return (
    <div className="relative pb-20">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(156, 163, 175, 0.3); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(156, 163, 175, 0.5); }
      `}</style>

      <R2ImageSelectorModal
        isOpen={isR2ModalOpen}
        onClose={() => setIsR2ModalOpen(false)}
        onSelect={(url) => {
          setCurrentProject((prev) => ({ ...prev, coverImage: url }));
          setIsR2ModalOpen(false);
        }}
      />

      <DeleteModal
        isOpen={!!projectToDelete}
        onClose={() => setProjectToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Project?"
      />

      {isVip && (
        <div className="mb-8 flex justify-end">
          <button
            onClick={handleCreate}
            className="px-6 py-2 bg-primary-600 dark:bg-amber-500 text-white dark:text-black rounded-xl font-bold uppercase text-sm hover:bg-primary-700 dark:hover:bg-amber-400 transition-colors shadow-lg shadow-primary-500/20 dark:shadow-amber-500/20"
          >
            <i className="fas fa-plus mr-2"></i> Add Project
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing &&
        createPortal(
          <div className={modalBaseClass}>
            <div className={editorClass}>
              <h2 className="text-2xl font-bold mb-6 font-display">
                {currentProject._id ? 'Edit Project' : 'New Project'}
              </h2>

              <form onSubmit={handleSave} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider opacity-60 border-b border-current pb-2">
                      Chinese Content
                    </h3>
                    <input
                      className={inputClass}
                      placeholder="Title (ZH)"
                      value={currentProject.title_zh || ''}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, title_zh: e.target.value }))
                      }
                      required
                    />
                    <textarea
                      className={`${inputClass} h-24`}
                      placeholder="Summary (ZH)"
                      value={currentProject.summary_zh || ''}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, summary_zh: e.target.value }))
                      }
                    />
                    <textarea
                      className={`${inputClass} h-40 font-mono text-sm`}
                      placeholder="Description Markdown (ZH)"
                      value={currentProject.description_zh || ''}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, description_zh: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-xs uppercase tracking-wider opacity-60 border-b border-current pb-2">
                      English Content
                    </h3>
                    <input
                      className={inputClass}
                      placeholder="Title (EN)"
                      value={currentProject.title_en || ''}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, title_en: e.target.value }))
                      }
                      required
                    />
                    <textarea
                      className={`${inputClass} h-24`}
                      placeholder="Summary (EN)"
                      value={currentProject.summary_en || ''}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, summary_en: e.target.value }))
                      }
                    />
                    <textarea
                      className={`${inputClass} h-40 font-mono text-sm`}
                      placeholder="Description Markdown (EN)"
                      value={currentProject.description_en || ''}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, description_en: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-current opacity-80">
                  <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase opacity-60">
                      Tech Stack (comma separated)
                    </label>
                    <input
                      className={inputClass}
                      placeholder="React, Node.js, TypeScript"
                      value={techStackInput}
                      onChange={(e) => setTechStackInput(e.target.value)}
                    />
                  </div>
                  <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase opacity-60">
                      Links & Media
                    </label>
                    <input
                      className={inputClass}
                      placeholder="Demo URL"
                      value={currentProject.demoUrl || ''}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, demoUrl: e.target.value }))
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Repo URL"
                      value={currentProject.repoUrl || ''}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, repoUrl: e.target.value }))
                      }
                    />

                    <div className="flex gap-2 relative">
                      <input
                        className={inputClass}
                        placeholder="Cover Image URL (Paste image supported)"
                        value={currentProject.coverImage || ''}
                        onChange={(e) =>
                          setCurrentProject((p) => ({ ...p, coverImage: e.target.value }))
                        }
                        onPaste={handlePaste}
                      />

                      {currentUser?.role === 'super_admin' && (
                        <button
                          type="button"
                          onClick={() => setIsR2ModalOpen(true)}
                          className="px-4 bg-orange-100 dark:bg-orange-900/30 hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-lg text-orange-600 dark:text-orange-400 transition-colors flex items-center justify-center min-w-[3rem]"
                          title="R2 Library"
                        >
                          <i className="fas fa-database"></i>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center min-w-[3rem]"
                        title="Upload Image"
                      >
                        {isUploading ? (
                          <i className="fas fa-circle-notch fa-spin"></i>
                        ) : (
                          <i className="fas fa-upload"></i>
                        )}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 pt-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold">Order Priority:</label>
                    <input
                      type="number"
                      className={`${inputClass} w-24 text-center`}
                      value={currentProject.order || 0}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, order: parseInt(e.target.value) }))
                      }
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={currentProject.isVisible ?? true}
                      onChange={(e) =>
                        setCurrentProject((p) => ({ ...p, isVisible: e.target.checked }))
                      }
                      className="accent-primary-500 w-5 h-5"
                    />
                    <span className="text-sm font-bold">Visible</span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-current opacity-80">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 rounded-lg font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-primary-500 hover:bg-primary-600 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-black rounded-lg font-bold shadow-lg shadow-primary-500/20 dark:shadow-amber-500/20 transition-all"
                  >
                    Save Project
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Demo View Modals */}
      {viewMode === 'CHOICE' &&
        demoProject &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl p-8 max-w-sm w-full border border-slate-200 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none"></div>

              <button
                onClick={() => closeDemoModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>

              <div className="text-center mb-8 relative z-10">
                <div className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center mx-auto mb-4 text-primary-500 dark:text-primary-400">
                  <i className="fas fa-desktop text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                  {t.portfolio.demoOptions.title}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1">
                  {getLocalized(demoProject, 'title')}
                </p>
              </div>

              <div className="flex flex-col gap-3 relative z-10">
                <button
                  onClick={handleOpenLocal}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-window-maximize"></i> {t.portfolio.demoOptions.local}
                </button>
                <button
                  onClick={handleOpenNewTab}
                  className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 shadow-lg shadow-primary-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-external-link-alt"></i> {t.portfolio.demoOptions.newTab}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {viewMode === 'IFRAME' &&
        demoProject &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex flex-col bg-slate-900 animate-fade-in">
            {/* Header */}
            <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 md:px-6 shadow-lg relative z-20">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => closeDemoModal(true)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-arrow-left"></i>
                </button>
                <h3 className="text-white font-bold text-sm md:text-base hidden sm:block truncate max-w-xs md:max-w-md">
                  {t.portfolio.demoOptions.iframeTitle}: {getLocalized(demoProject, 'title')}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={demoProject.demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-primary-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-800 transition-colors"
                >
                  <span className="hidden sm:inline">{t.portfolio.demoOptions.newTab}</span>
                  <i className="fas fa-external-link-alt"></i>
                </a>
                <button
                  onClick={() => closeDemoModal(true)}
                  className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-slate-700 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>

            {/* Iframe Content */}
            <div className="flex-1 relative bg-black w-full">
              {iframeLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-0">
                  <i className="fas fa-circle-notch fa-spin text-3xl mb-4 text-primary-500"></i>
                  <p className="text-xs uppercase tracking-widest font-mono">
                    Loading Application...
                  </p>
                </div>
              )}
              <iframe
                src={demoProject.demoUrl}
                className="w-full h-full border-0 relative z-10"
                onLoad={() => setIframeLoading(false)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>,
          document.body
        )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
        {projects.map((project, index) => (
          <div
            key={project._id}
            className="group relative flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2"
          >
            {/* Admin Controls */}
            {isVip && (
              <div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(project);
                  }}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-blue-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <i className="fas fa-pencil-alt text-xs"></i>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectToDelete(project);
                  }}
                  className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-red-500 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                >
                  <i className="fas fa-trash text-xs"></i>
                </button>
              </div>
            )}

            {/* Cover Image */}
            <div
              onClick={() => project.coverImage && setZoomedImage(project.coverImage)}
              className="aspect-[16/9] shrink-0 bg-slate-100 dark:bg-slate-950 overflow-hidden relative cursor-zoom-in group/img"
            >
              {/* Zoom Prompt Icon */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl transform scale-50 group-hover/img:scale-100 transition-transform">
                  <i className="fas fa-search-plus"></i>
                </div>
              </div>
              {/* Badge for Top Projects */}
              {index < 10 && (
                <div
                  className={`absolute top-4 left-4 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg border ${
                    index < 5
                      ? 'bg-red-500/80 border-red-400/50 text-white'
                      : 'bg-black/50 border-white/20 text-white'
                  }`}
                >
                  <div className="flex -space-x-1.5">
                    <i
                      className={`fas fa-fire ${index < 5 ? 'text-yellow-300 animate-pulse' : 'text-orange-400'}`}
                    ></i>
                    {index < 5 && (
                      <i
                        className="fas fa-fire text-orange-300 animate-pulse"
                        style={{ animationDelay: '0.1s' }}
                      ></i>
                    )}
                    {index < 5 && (
                      <i
                        className="fas fa-fire text-red-300 animate-pulse"
                        style={{ animationDelay: '0.2s' }}
                      ></i>
                    )}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider leading-none pt-0.5">
                    {index < 5
                      ? language === 'zh'
                        ? '热门'
                        : 'HOT'
                      : language === 'zh'
                        ? '推荐'
                        : 'Pick'}
                  </span>
                </div>
              )}

              {project.coverImage ? (
                <img
                  src={project.coverImage}
                  alt={getLocalized(project, 'title')}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
                  <i className="fas fa-cube text-4xl text-slate-300 dark:text-slate-600"></i>
                </div>
              )}

              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>

              {/* Tech Stack Overlay */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2">
                {project.techStack.map((tech, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md text-white rounded border border-white/10"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 md:p-6 flex flex-col flex-1">
              <h3 className="shrink-0 text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white mb-2 group-hover:text-amber-500 transition-colors">
                {getLocalized(project, 'title')}
              </h3>

              {/* Scrollable Summary & Description Container */}
              <div className="h-60 overflow-y-auto custom-scrollbar pr-2 mb-6 flex flex-col gap-4">
                {/* Summary Section */}
                {getLocalized(project, 'summary') && (
                  <div className="relative pl-3 border-l-2 border-amber-500/30">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {language === 'zh' ? '简介' : 'SUMMARY'}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                      {getLocalized(project, 'summary')}
                    </p>
                  </div>
                )}

                {/* Description Section */}
                {getLocalized(project, 'description') && (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 mt-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                      {language === 'zh' ? '项目详情' : 'DESCRIPTION'}
                    </h4>
                    <div
                      className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{
                        __html: window.marked
                          ? window.marked.parse(getLocalized(project, 'description') || '')
                          : (getLocalized(project, 'description') || '').replace(/\n/g, '<br/>')
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-auto flex gap-4 border-t border-slate-100 dark:border-slate-800 pt-6 shrink-0">
                {project.demoUrl && (
                  <button
                    onClick={() => handleLiveDemoClick(project)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold uppercase tracking-wider hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <i className="fas fa-play-circle text-sm"></i> {t.portfolio.liveDemo}
                  </button>
                )}
                {project.repoUrl && (
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <i className="fab fa-github text-lg"></i> {t.portfolio.sourceCode}
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Zoom Modal */}
      {zoomedImage &&
        createPortal(
          <div
            className="fixed inset-0 z-[10001] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-12 animate-fade-in transition-all duration-300"
            onClick={() => setZoomedImage(null)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setZoomedImage(null);
              }}
              className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors z-50 border border-white/20"
            >
              <i className="fas fa-times text-xl"></i>
            </button>

            <div
              className="relative max-w-7xl max-h-[90vh] w-full flex items-center justify-center animate-zoom-in"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={zoomedImage}
                alt="Project detail"
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              />
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
