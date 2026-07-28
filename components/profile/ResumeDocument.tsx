import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { apiService } from '../../services/api';
import { API_BASE_URL } from '../../services/core';
import { ResumeData, User } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { toast } from '../Toast';
import { ResumeEditModal } from './ResumeEditModal';
import { ResumeLayoutSidebar } from './ResumeLayoutSidebar';
import { ResumePaper } from './ResumePaper';
import { safeKey } from './utils';

interface ResumeDocumentProps {
  currentUser?: User | null;
}

export const ResumeDocument = React.forwardRef<HTMLDivElement, ResumeDocumentProps>(
  ({ currentUser }, ref) => {
    const { language } = useTranslation();
    const [searchParams] = useSearchParams();
    const urlUser = searchParams.get('user');
    const defaultProfile = (urlUser || 'sam').trim().toLowerCase();

    const [resume, setResume] = useState<ResumeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [targetProfile, setTargetProfile] = useState<string>(defaultProfile);
    const [currentSlug, setCurrentSlug] = useState<string>(defaultProfile);
    const [resumeList, setResumeList] = useState<Array<{ slug: string; title: string; user: string }>>([]);
    const [availableProfiles, setAvailableProfiles] = useState<string[]>(['sam', 'jenny', defaultProfile]);

    // Layout and print settings
    const urlPdfMode = searchParams.get('pdfMode') || 'single-page';
    const urlPaperSize = searchParams.get('paperSize') || 'a4';
    const isPrint = searchParams.get('print') === 'true';
    const urlPageLimit = parseInt(searchParams.get('pageLimit') || '0', 10) || 0;

    const [pdfMode, setPdfMode] = useState<'single-page' | 'multi-page'>(
      urlPdfMode === 'multi-page' ? 'multi-page' : 'single-page'
    );
    const [paperSize, setPaperSize] = useState<'a4' | 'a3' | 'a5'>(
      urlPaperSize === 'a3' || urlPaperSize === 'a5' ? urlPaperSize : 'a4'
    );

    const currentPdfMode = isPrint ? urlPdfMode : pdfMode;
    const currentPaperSize = isPrint ? urlPaperSize : paperSize;
    const currentPageLimit = isPrint ? urlPageLimit : (resume?.pageLimit || 0);

    // Admin Editing
    const [isEditing, setIsEditing] = useState(false);
    const [editResume, setEditResume] = useState<ResumeData | null>(null);
    const [activeTab, setActiveTab] = useState<'BASICS' | 'WORK' | 'EDUCATION' | 'SKILLS' | 'VOLUNTEER' | 'INTEREST'>('BASICS');

    const isVip = currentUser?.vip || currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

    // Inline visual editing states
    const [activeInlineEdit, setActiveInlineEdit] = useState<{
      path: string;
      label: string;
      value: string;
      isTextArea?: boolean;
      listIndex?: number;
      listField?: string;
    } | null>(null);
    const [inlineEditAnchor, setInlineEditAnchor] = useState<HTMLElement | null>(null);
    const [tempTextValue, setTempTextValue] = useState('');
    const [tempStyles, setTempStyles] = useState<{
      fontSize?: string;
      fontWeight?: string;
      color?: string;
    }>({});

    useEffect(() => {
      const loadProfiles = async () => {
        try {
          const users = await apiService.getResumeUsers();
          const rawList = [
            'sam',
            'jenny',
            defaultProfile,
            ...(currentUser?.displayName ? [currentUser.displayName] : []),
            ...(Array.isArray(users) ? users : [])
          ];
          const normalized = rawList
            .map((u) => (typeof u === 'string' ? u.trim().toLowerCase() : ''))
            .filter(Boolean);
          const uniqueProfiles = Array.from(new Set(normalized));
          setAvailableProfiles(uniqueProfiles);
        } catch (e) {
          console.error('Failed to load resume profiles', e);
          const fallback = Array.from(
            new Set(['sam', 'jenny', defaultProfile.toLowerCase().trim()].filter(Boolean))
          );
          setAvailableProfiles(fallback);
        }
      };
      loadProfiles();
    }, [defaultProfile, currentUser]);

    useEffect(() => {
      setTargetProfile(defaultProfile);
      setCurrentSlug(defaultProfile);
    }, [defaultProfile]);

    useEffect(() => {
      loadResumeAndList();
    }, [currentSlug]);

    const processResumeList = (list: any[], profile: string) => {
      return list.filter(
        (item) =>
          item.user === profile ||
          item.slug === profile ||
          item.slug?.startsWith(`${profile}-`)
      );
    };

    const loadResumeAndList = async () => {
      setIsLoading(true);
      try {
        const list = await apiService.getResumeList(targetProfile);
        const processed = processResumeList(list, targetProfile);
        setResumeList(processed);

        if (processed.length > 0) {
          let activeSlug = currentSlug;
          if (!activeSlug || !processed.some((item) => item.slug === activeSlug)) {
            const defaultItem = processed.find((item) => item.slug === targetProfile);
            activeSlug = defaultItem ? defaultItem.slug : processed[0].slug;
          }

          if (activeSlug !== currentSlug) {
            setCurrentSlug(activeSlug);
            return;
          }

          const data = await apiService.getResumeData(activeSlug);
          setResume(data);
          if (data?.styleSettings) {
            if (data.styleSettings.pdfMode) {
              setPdfMode(data.styleSettings.pdfMode as any);
            }
            if (data.styleSettings.paperSize) {
              setPaperSize(data.styleSettings.paperSize as any);
            }
          }
        } else {
          setResume(null);
        }
      } catch (e) {
        console.error('Failed to load resume or list', e);
        setResume(null);
        setResumeList([]);
      } finally {
        setIsLoading(false);
      }
    };

    const formatProfileName = (name: string) => {
      if (!name) return '';
      const lower = name.toLowerCase();
      if (lower === 'sam') return 'Sam';
      if (lower === 'jenny') return 'Jenny';
      return name.charAt(0).toUpperCase() + name.slice(1);
    };

    const handleProfileChange = (profile: string) => {
      const cleanProfile = profile.trim().toLowerCase();
      setTargetProfile(cleanProfile);
      setCurrentSlug(cleanProfile);
    };

    const handleExportPdf = () => {
      let host = API_BASE_URL;
      if (host.startsWith('/')) {
        host = import.meta.env.DEV ? 'http://localhost:5000/api' : `${window.location.origin}${host}`;
      }
      const limit = resume?.pageLimit || 0;
      const backendUrl = `${host}/resumes/export-pdf?user=${currentSlug}&lang=${language}&pdfMode=${pdfMode}&paperSize=${paperSize}${limit ? `&pageLimit=${limit}` : ''}`;
      window.open(backendUrl, '_blank');
    };

    // Dialog States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newVersionTitle, setNewVersionTitle] = useState('');
    const [newVersionSuffix, setNewVersionSuffix] = useState('');
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const handleCreateVersion = () => {
      setNewVersionTitle('');
      setNewVersionSuffix('');
      setIsCreateModalOpen(true);
    };

    const submitCreateVersion = async () => {
      const title = newVersionTitle.trim();
      if (!title) {
        toast.error('Version title is required / 请填写版本名称');
        return;
      }

      const cleanSuffix = newVersionSuffix.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
      if (newVersionSuffix.trim() && cleanSuffix !== newVersionSuffix.trim().toLowerCase()) {
        toast.error('Suffix can only contain letters, numbers, and hyphens / 后缀只能包含英文字母、数字和连字符');
        return;
      }

      const newSlug = cleanSuffix ? `${targetProfile}-${cleanSuffix}` : targetProfile;

      if (resumeList.some((item) => item.slug === newSlug)) {
        toast.error('Version slug already exists. Please choose a different suffix. / 该版本的链接已存在，请换个后缀');
        return;
      }

      let newResumeData: Partial<ResumeData>;
      if (resume) {
        newResumeData = JSON.parse(JSON.stringify(resume));
        newResumeData.slug = newSlug;
        newResumeData.title = title;
        newResumeData.user = targetProfile;
        delete newResumeData._id;
      } else {
        newResumeData = {
          slug: newSlug,
          title: title,
          user: targetProfile,
          basics: {
            name_zh: targetProfile.toUpperCase(),
            name_en: targetProfile.toUpperCase(),
            label_zh: '专业岗位',
            label_en: 'Professional Role',
            email: currentUser?.email || '',
            phone: '',
            location_zh: '',
            location_en: '',
            visaStatus_zh: '',
            visaStatus_en: '',
            summary_zh: '个人简介...',
            summary_en: 'Summary...'
          },
          education: [],
          work: [],
          skills: [],
          languages: [],
          volunteer: [],
          interest: []
        };
      }

      try {
        setIsLoading(true);
        setIsCreateModalOpen(false);
        await apiService.updateResume(newResumeData, newSlug);
        setCurrentSlug(newSlug);
        toast.success('Resume version created / 简历版本创建成功');
      } catch (e) {
        console.error('Failed to create new version', e);
        toast.error('Failed to create version / 创建版本失败');
      } finally {
        setIsLoading(false);
      }
    };

    const handleDeleteVersion = () => {
      setIsDeleteModalOpen(true);
    };

    const submitDeleteVersion = async () => {
      try {
        setIsLoading(true);
        setIsDeleteModalOpen(false);
        await apiService.deleteResume(currentSlug);
        setCurrentSlug('');
        toast.success('Resume version deleted / 简历版本删除成功');
      } catch (e) {
        console.error('Failed to delete version', e);
        toast.error('Failed to delete version / 删除版本失败');
      } finally {
        setIsLoading(false);
      }
    };

    const handleEditOpen = () => {
      if (!resume) return;
      const copy = JSON.parse(JSON.stringify(resume)); // Deep copy
      if (!copy.sectionOrder || copy.sectionOrder.length === 0) {
        copy.sectionOrder = ['profile', 'work', 'projects', 'education', 'skills'];
      }
      if (!copy.styleSettings) {
        copy.styleSettings = { fontSize: 'normal', lineHeight: 'normal', themeColor: 'slate' };
      }
      if (copy.pageLimit === undefined) {
        copy.pageLimit = 0;
      }
      setEditResume(copy);
      setActiveTab('BASICS');
      setIsEditing(true);
    };

    const handleSave = async () => {
      if (!editResume) return;
      try {
        await apiService.updateResume(editResume, currentSlug);
        setResume(editResume);
        setIsEditing(false);
        // Refresh list
        const list = await apiService.getResumeList(targetProfile);
        setResumeList(processResumeList(list, targetProfile));
      } catch (e) {
        console.error(e);
      }
    };

    // Generic Field Updater
    const updateField = (
      section: keyof ResumeData,
      field: string,
      value: any,
      index?: number,
      nestedField?: string
    ) => {
      if (!editResume) return;
      const newResume = { ...editResume };

      if (section === 'basics') {
        (newResume.basics as any)[field] = value;
      } else if (Array.isArray(newResume[section]) && index !== undefined) {
        const arr = newResume[section] as any[];
        if (!arr[index]) return;

        if (nestedField) {
          // Special handling for array of strings like highlights/keywords
          if (nestedField === 'keywords' || nestedField.includes('highlights')) {
            arr[index][nestedField] =
              typeof value === 'string' ? value.split('\n').filter((s: string) => s.trim()) : value;
          } else {
            arr[index][nestedField] = value;
          }
        } else {
          arr[index] = value;
        }
      }

      setEditResume(newResume);
    };

    const addItem = (section: 'work' | 'education' | 'skills' | 'volunteer' | 'interest') => {
      if (!editResume) return;
      const newResume = { ...editResume };
      const arr = (newResume[section] as any[]) || [];

      let newItem = {};
      if (section === 'work')
        newItem = { company_en: 'New Company', highlights_en: [], highlights_zh: [], weight: 0 };
      if (section === 'education') newItem = { institution: 'New School' };
      if (section === 'skills')
        newItem = { name_en: 'New Category', name_zh: '新品类', keywords: [] };
      if (section === 'volunteer')
        newItem = { organization_en: 'New Organization', highlights_en: [], highlights_zh: [] };
      if (section === 'interest')
        newItem = { name_en: 'New Category', name_zh: '新品类', keywords: [] };

      arr.push(newItem);
      (newResume as any)[section] = arr;
      setEditResume(newResume);
    };

    const removeItem = (section: 'work' | 'education' | 'skills' | 'volunteer' | 'interest', index: number) => {
      if (!editResume) return;
      const newResume = { ...editResume };
      (newResume[section] as any[]).splice(index, 1);
      setEditResume(newResume);
    };

    // --- Inline Visual Editor Engine Hooks & Helper Functions ---
    useEffect(() => {
      if (activeInlineEdit) {
        setTempTextValue(activeInlineEdit.value);
        const customStyle = resume?.styleSettings?.customStyles?.[safeKey(activeInlineEdit.path)] || {};
        setTempStyles({
          fontSize: customStyle.fontSize || 'inherit',
          fontWeight: customStyle.fontWeight || 'inherit',
          color: customStyle.color || 'inherit'
        });
      } else {
        setTempTextValue('');
        setTempStyles({});
      }
    }, [activeInlineEdit, resume]);

    const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);

    useEffect(() => {
      if (!inlineEditAnchor || !activeInlineEdit) {
        setPopoverCoords(null);
        return;
      }

      const updatePosition = () => {
        const rect = inlineEditAnchor.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;

        let top = rect.bottom + scrollY + 8;
        let left = rect.left + scrollX;

        const popoverWidth = 320;
        if (left + popoverWidth > window.innerWidth) {
          left = window.innerWidth - popoverWidth - 16;
        }
        if (left < 16) {
          left = 16;
        }

        setPopoverCoords({ top, left });
      };

      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }, [inlineEditAnchor, activeInlineEdit]);

    const setNestedValue = (obj: any, path: string, val: any) => {
      const parts = path.split('.');
      let current = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (Array.isArray(current[part]) || (!isNaN(Number(parts[i + 1])) && !current[part])) {
          if (!current[part]) current[part] = [];
        } else if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
      current[parts[parts.length - 1]] = val;
    };

    const handleSaveInlineEdit = async () => {
      if (!resume || !activeInlineEdit) return;

      const copy = JSON.parse(JSON.stringify(resume));
      setNestedValue(copy, activeInlineEdit.path, tempTextValue);

      if (!copy.styleSettings) copy.styleSettings = {};
      if (!copy.styleSettings.customStyles) copy.styleSettings.customStyles = {};

      if (tempStyles.fontSize === 'inherit' && tempStyles.fontWeight === 'inherit' && tempStyles.color === 'inherit') {
        if (copy.styleSettings.customStyles) {
          delete copy.styleSettings.customStyles[safeKey(activeInlineEdit.path)];
        }
      } else {
        copy.styleSettings.customStyles[safeKey(activeInlineEdit.path)] = {
          fontSize: tempStyles.fontSize === 'inherit' ? undefined : tempStyles.fontSize,
          fontWeight: tempStyles.fontWeight === 'inherit' ? undefined : tempStyles.fontWeight,
          color: tempStyles.color === 'inherit' ? undefined : tempStyles.color
        };
      }

      try {
        setResume(copy);
        await apiService.updateResume(copy, currentSlug);
        toast.success(language === 'zh' ? '保存成功 / Saved successfully' : 'Saved successfully');
      } catch (e) {
        toast.error('Failed to save inline modifications');
      }

      setActiveInlineEdit(null);
      setInlineEditAnchor(null);
    };

    if (isLoading) {
      return (
        <div className="text-center py-20 text-slate-400 animate-pulse">Retrieving dossier...</div>
      );
    }

    const fontSizeClass = resume?.styleSettings?.fontSize ? `resume-style-font-${resume.styleSettings.fontSize}` : 'resume-style-font-normal';
    const lineHeightClass = resume?.styleSettings?.lineHeight ? `resume-style-line-${resume.styleSettings.lineHeight}` : 'resume-style-line-normal';
    const themeColorClass = resume?.styleSettings?.themeColor ? `resume-style-theme-${resume.styleSettings.themeColor}` : 'resume-style-theme-slate';
    const marginClass = resume?.styleSettings?.margin ? `resume-style-margin-${resume.styleSettings.margin}` : 'resume-style-margin-normal';
    const sectionGapClass = resume?.styleSettings?.sectionGap ? `resume-style-gap-${resume.styleSettings.sectionGap}` : 'resume-style-gap-normal';
    const pageHeight = currentPaperSize === 'a4' ? 1123 : currentPaperSize === 'a3' ? 1587 : 794;

    return (
      <div className="relative">
        {/* Admin Controls */}
        {isVip && (
          <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/30 dark:shadow-none transition-all duration-300 print:hidden max-w-4xl mx-auto animate-fade-in">
            {/* Left Side: Profile & Version Selectors */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              {/* Account Selector */}
              <div className="relative flex items-center bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-1.5 shadow-inner">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 pl-2 pr-1 select-none">
                  <i className="fas fa-user-circle text-amber-500 text-sm"></i>
                  <span>{language === 'zh' ? '账号' : 'Account'}</span>
                </span>
                <div className="relative flex items-center">
                  <select
                    value={targetProfile.toLowerCase()}
                    onChange={(e) => handleProfileChange(e.target.value)}
                    className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1 text-xs font-bold text-slate-800 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition-all cursor-pointer shadow-sm min-w-[100px]"
                  >
                    {availableProfiles.map((p) => (
                      <option key={p} value={p} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {formatProfileName(p)}
                      </option>
                    ))}
                  </select>
                  <i className="fas fa-chevron-down text-[9px] text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none"></i>
                </div>
              </div>

              {/* Resume Version Selector */}
              {resumeList.length > 0 && (
                <div className="relative flex items-center bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-1.5 shadow-inner">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 pl-2 pr-1 select-none">
                    <i className="fas fa-layer-group text-sky-500 text-sm"></i>
                    <span>{language === 'zh' ? '版本' : 'Version'}</span>
                  </span>
                  <div className="relative flex items-center">
                    <select
                      value={currentSlug}
                      onChange={(e) => setCurrentSlug(e.target.value)}
                      className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1 text-xs font-bold text-slate-800 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 cursor-pointer max-w-[160px] truncate transition-all shadow-sm"
                    >
                      {resumeList.map((item) => (
                        <option key={item.slug} value={item.slug} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                          {item.title || item.slug}
                        </option>
                      ))}
                    </select>
                    <i className="fas fa-chevron-down text-[9px] text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none"></i>
                  </div>
                </div>
              )}

              {/* Layout Mode Selector */}
              <div className="relative flex items-center bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-1.5 shadow-inner">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 pl-2 pr-1 select-none">
                  <i className="fas fa-file-alt text-purple-500 text-sm"></i>
                  <span>{language === 'zh' ? '版式' : 'Layout'}</span>
                </span>
                <div className="relative flex items-center">
                  <select
                    value={pdfMode}
                    onChange={(e) => setPdfMode(e.target.value as any)}
                    className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1 text-xs font-bold text-slate-800 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 cursor-pointer transition-all shadow-sm"
                  >
                    <option value="single-page">{language === 'zh' ? '连续长页' : 'Continuous'}</option>
                    <option value="multi-page">{language === 'zh' ? '分页打印' : 'Paginated'}</option>
                  </select>
                  <i className="fas fa-chevron-down text-[9px] text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none"></i>
                </div>
              </div>

              {/* Paper Size Selector (Only in Paginated Mode) */}
              {pdfMode === 'multi-page' && (
                <div className="relative flex items-center bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 transition-all rounded-xl border border-slate-200/80 dark:border-slate-700/80 p-1.5 shadow-inner">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 pl-2 pr-1 select-none">
                    <i className="fas fa-ruler-combined text-indigo-500 text-sm"></i>
                    <span>{language === 'zh' ? '尺寸' : 'Size'}</span>
                  </span>
                  <div className="relative flex items-center">
                    <select
                      value={paperSize}
                      onChange={(e) => setPaperSize(e.target.value as any)}
                      className="appearance-none bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-3 pr-7 py-1 text-xs font-bold text-slate-800 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 cursor-pointer transition-all shadow-sm"
                    >
                      <option value="a4">A4</option>
                      <option value="a3">A3</option>
                      <option value="a5">A5</option>
                    </select>
                    <i className="fas fa-chevron-down text-[9px] text-slate-400 dark:text-slate-500 absolute right-2.5 pointer-events-none"></i>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCreateVersion}
                title={language === 'zh' ? '新建简历版本' : 'Create New Version'}
                className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl transition-all duration-200 text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 border border-amber-400/30"
              >
                <i className="fas fa-plus text-[10px]"></i>
                <span>{language === 'zh' ? '新建' : 'New'}</span>
              </button>
            </div>

            {/* Right Side: Action Buttons (Edit, Delete) */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {resume && (
                <>
                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={handleDeleteVersion}
                    title={language === 'zh' ? '删除当前版本' : 'Delete current version'}
                    className="px-4 py-2 text-xs font-bold uppercase rounded-xl transition-all duration-200 flex items-center gap-2 shadow-md bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/30 hover:shadow-lg active:scale-95"
                  >
                    <i className="fas fa-trash text-[10px]"></i>
                    <span>{language === 'zh' ? '删除版本' : 'Delete'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={handleEditOpen}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-black text-xs font-bold uppercase rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 shadow-md active:scale-95 border border-transparent dark:border-amber-400/20 font-extrabold"
                  >
                    <i className="fas fa-edit text-[10px]"></i>
                    <span>{language === 'zh' ? '编辑简历' : 'Edit'}</span>
                  </button>

                  {/* Export ATS PDF Button */}
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    title={language === 'zh' ? '导出 ATS 可选文本 PDF' : 'Export ATS Text PDF'}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2 shadow-md active:scale-95 border border-emerald-500/30 font-extrabold"
                  >
                    <i aria-hidden="true" className="fas fa-file-pdf text-[11px]"></i>
                    <span>{language === 'zh' ? '导出 PDF' : 'Export PDF'}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Edit Modal Component */}
        <ResumeEditModal
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          editResume={editResume}
          setEditResume={setEditResume}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          language={language}
          targetProfile={targetProfile}
          currentSlug={currentSlug}
          updateField={updateField}
          removeItem={removeItem}
          addItem={addItem}
          handleSave={handleSave}
        />

        {/* Resume Content / Placeholder */}
        {!resume ? (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-16 max-w-4xl mx-auto text-center font-sans text-slate-800 dark:bg-[#0b1120] dark:border-slate-800 dark:text-slate-300">
            <div className="max-w-md mx-auto space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mb-2">
                <i className="fas fa-file-invoice text-3xl"></i>
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {language === 'zh' ? '暂无简历内容' : 'No Resume Found'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {language === 'zh'
                  ? '该用户尚未创建任何简历版本。如果您有编辑权限，可以点击上方的“新建”按钮来初始化您的第一份简历。'
                  : 'No resume versions are currently available for this user. If you have editing privileges, click the "New" button to initialize your first resume.'}
              </p>
              {isVip && (
                <button
                  type="button"
                  onClick={handleCreateVersion}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold uppercase rounded-xl shadow-lg transition-all duration-200 hover:shadow-xl active:scale-95"
                >
                  <i className="fas fa-plus"></i>
                  <span>{language === 'zh' ? '新建第一份简历' : 'Create First Resume'}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 items-start justify-center px-4 w-full">
            {/* Left: The Resume Paper Sheet */}
            <div className="flex-1 w-full max-w-4xl">
              <ResumePaper
                ref={ref}
                resume={resume}
                isPrint={isPrint}
                isVip={isVip}
                language={language}
                currentPdfMode={currentPdfMode as any}
                currentPaperSize={currentPaperSize as any}
                currentPageLimit={currentPageLimit}
                fontSizeClass={fontSizeClass}
                lineHeightClass={lineHeightClass}
                themeColorClass={themeColorClass}
                marginClass={marginClass}
                sectionGapClass={sectionGapClass}
                pageHeight={pageHeight}
                setActiveInlineEdit={setActiveInlineEdit}
                setInlineEditAnchor={setInlineEditAnchor}
              />
            </div>

            {/* Right: The Layout Control Panel Sidebar */}
            <ResumeLayoutSidebar
              resume={resume}
              isVip={isVip}
              language={language}
              pdfMode={pdfMode}
              setPdfMode={setPdfMode}
              paperSize={paperSize}
              setPaperSize={setPaperSize}
              currentSlug={currentSlug}
              setResume={setResume}
            />
          </div>
        )}

        {/* Custom Modal for Creating Version */}
        {isCreateModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border border-slate-700/50 text-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-scale-up space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h3 className="text-lg font-bold text-amber-400">Create New Resume Version / 新建简历版本</h3>
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <i className="fas fa-times text-lg"></i>
                  </button>
                </div>
                <div className="space-y-4 py-2">
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      Version Title / 简历名称
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 rounded outline-none border bg-slate-950 border-slate-800 focus:border-amber-500 text-sm text-white"
                      value={newVersionTitle}
                      onChange={(e) => setNewVersionTitle(e.target.value)}
                      placeholder="e.g. 学校兼职简历"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                      URL Slug Suffix / 链接后缀
                    </label>
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded p-1">
                      <span className="text-xs text-slate-500 px-2 font-mono">{targetProfile}-</span>
                      <input
                        type="text"
                        className="flex-1 bg-transparent border-none outline-none p-1 text-sm text-white font-mono"
                        value={newVersionSuffix}
                        onChange={(e) => setNewVersionSuffix(e.target.value)}
                        placeholder="parttime"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      只能包含小写字母、数字和连字符。全称：{targetProfile}-{newVersionSuffix || 'suffix'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors text-sm font-bold"
                  >
                    Cancel / 取消
                  </button>
                  <button
                    type="button"
                    onClick={submitCreateVersion}
                    className="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-black rounded-lg font-bold transition-all text-sm"
                  >
                    Create / 确认创建
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Custom Modal for Deleting Version */}
        {isDeleteModalOpen &&
          createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-slate-900 border border-slate-700/50 text-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-scale-up space-y-4">
                <div className="flex items-center gap-3 text-red-500 pb-2 border-b border-slate-800">
                  <i className="fas fa-exclamation-triangle text-xl"></i>
                  <h3 className="text-lg font-bold">Delete Resume Version / 删除确认</h3>
                </div>
                <div className="py-2">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    Are you sure you want to delete this resume version / 确定要删除该简历版本吗？该操作不可撤销。
                  </p>
                  <p className="text-slate-400 text-xs mt-2 bg-slate-950 p-2 rounded border border-slate-800 font-mono">
                    {resume?.title || currentSlug} ({currentSlug})
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors text-sm font-bold"
                  >
                    Cancel / 取消
                  </button>
                  <button
                    type="button"
                    onClick={submitDeleteVersion}
                    className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-all text-sm"
                  >
                    Delete / 确认删除
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        {/* Floating Formatting & Inline Text Editor Popover */}
        {activeInlineEdit && popoverCoords && (
          createPortal(
            <div
              className="absolute z-[99999] w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 space-y-4 animate-scale-up"
              style={{
                top: `${popoverCoords.top}px`,
                left: `${popoverCoords.left}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popover Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                  {language === 'zh' ? '所见即所得编辑' : 'Visual Formatting'}
                </span>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded font-mono">
                  {activeInlineEdit.label}
                </span>
              </div>

              {/* Text Input Content */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  {language === 'zh' ? '文本内容 Text' : 'Text Content'}
                </label>
                {activeInlineEdit.isTextArea ? (
                  <textarea
                    rows={4}
                    value={tempTextValue}
                    onChange={(e) => setTempTextValue(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-200 font-sans"
                  />
                ) : (
                  <input
                    type="text"
                    value={tempTextValue}
                    onChange={(e) => setTempTextValue(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-amber-500 text-slate-800 dark:text-slate-200 font-sans"
                  />
                )}
              </div>

              {/* Style controls (Size, Weight, Color) */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {/* Custom Font Size */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {language === 'zh' ? '字号 Size' : 'Font Size'}
                  </label>
                  <select
                    value={tempStyles.fontSize || 'inherit'}
                    onChange={(e) => setTempStyles({ ...tempStyles, fontSize: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="inherit">{language === 'zh' ? '默认 (Inherit)' : 'Inherit'}</option>
                    <option value="11px">11px</option>
                    <option value="12px">12px</option>
                    <option value="13px">13px</option>
                    <option value="14px">14px</option>
                    <option value="15px">15px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                    <option value="20px">20px</option>
                    <option value="22px">22px</option>
                    <option value="24px">24px</option>
                    <option value="28px">28px</option>
                    <option value="32px">32px</option>
                    <option value="36px">36px</option>
                    <option value="40px">40px</option>
                    <option value="48px">48px</option>
                  </select>
                </div>

                {/* Custom Font Weight */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                    {language === 'zh' ? '粗细 Weight' : 'Font Weight'}
                  </label>
                  <select
                    value={tempStyles.fontWeight || 'inherit'}
                    onChange={(e) => setTempStyles({ ...tempStyles, fontWeight: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="inherit">{language === 'zh' ? '默认 (Inherit)' : 'Inherit'}</option>
                    <option value="normal">{language === 'zh' ? '常规 (400)' : 'Normal (400)'}</option>
                    <option value="medium">{language === 'zh' ? '中等 (500)' : 'Medium (500)'}</option>
                    <option value="semibold">{language === 'zh' ? '半粗 (600)' : 'Semibold (600)'}</option>
                    <option value="bold">{language === 'zh' ? '加粗 (700)' : 'Bold (700)'}</option>
                    <option value="900">{language === 'zh' ? '特粗 (900)' : 'Black (900)'}</option>
                  </select>
                </div>
              </div>

              {/* Custom Color Selector */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  {language === 'zh' ? '文字颜色 Color' : 'Font Color'}
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={['inherit', '#000000', '#d97706', '#059669', '#0284c7', '#e11d48'].includes(tempStyles.color || 'inherit') ? tempStyles.color || 'inherit' : 'custom'}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTempStyles({ ...tempStyles, color: val === 'custom' ? '#2563eb' : val });
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-lg p-1 text-xs outline-none text-slate-800 dark:text-slate-200"
                  >
                    <option value="inherit">{language === 'zh' ? '默认颜色 (Inherit)' : 'Inherit'}</option>
                    <option value="#000000">{language === 'zh' ? '深黑色 (Black)' : 'Black'}</option>
                    <option value="#d97706">{language === 'zh' ? '琥珀橘 (Amber)' : 'Amber'}</option>
                    <option value="#059669">{language === 'zh' ? '翡翠绿 (Emerald)' : 'Emerald'}</option>
                    <option value="#0284c7">{language === 'zh' ? '天空蓝 (Sky)' : 'Sky'}</option>
                    <option value="#e11d48">{language === 'zh' ? '玫瑰红 (Crimson)' : 'Crimson'}</option>
                    <option value="custom">{language === 'zh' ? '自定义 (Custom)' : 'Custom Hex'}</option>
                  </select>

                  {/* Hex Color Input (only if custom or selected hex) */}
                  {tempStyles.color && tempStyles.color !== 'inherit' && (
                    <input
                      type="color"
                      value={tempStyles.color.startsWith('#') ? tempStyles.color : '#000000'}
                      onChange={(e) => setTempStyles({ ...tempStyles, color: e.target.value })}
                      className="w-8 h-7 p-0 border border-slate-200 dark:border-slate-700 rounded cursor-pointer bg-transparent"
                    />
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setTempStyles({ fontSize: 'inherit', fontWeight: 'inherit', color: 'inherit' });
                  }}
                  className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-lg hover:bg-slate-50 font-bold transition-all"
                >
                  {language === 'zh' ? '重置样式' : 'Reset'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveInlineEdit(null);
                    setInlineEditAnchor(null);
                  }}
                  className="px-3 py-1.5 text-slate-500 hover:text-slate-700 font-bold"
                >
                  {language === 'zh' ? '取消' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveInlineEdit}
                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-slate-950 rounded-lg font-bold shadow-md transition-all"
                >
                  {language === 'zh' ? '完成' : 'Done'}
                </button>
              </div>
            </div>,
            document.body
          )
        )}
      </div>
    );
  }
);

ResumeDocument.displayName = 'ResumeDocument';
