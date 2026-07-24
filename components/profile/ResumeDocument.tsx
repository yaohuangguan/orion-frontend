import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { apiService } from '../../services/api';
import { ResumeData, User } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { toast } from '../Toast';

interface ResumeDocumentProps {
  currentUser?: User | null;
}

// --- Rich Text Renderer Helper ---
const renderRichText = (text: string | undefined | null): React.ReactNode => {
  if (!text) return null;

  // Pre-normalize HTML tags to markdown tokens for unified parsing
  let processed = text
    .replace(/<b>(.*?)<\/b>/gi, '**$1**')
    .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<i>(.*?)<\/i>/gi, '*$1*')
    .replace(/<em>(.*?)<\/em>/gi, '*$1*');

  // Regex tokenizer for ***bold-italic***, **bold**, *italic*, and <u>underline</u>
  const regex = /(\*\*\*[\s\S]*?\*\*\*|\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|<u>[\s\S]*?<\/u>)/g;
  const parts = processed.split(regex);

  return parts.map((part, index) => {
    if (part.startsWith('***') && part.endsWith('***') && part.length > 6) {
      return (
        <strong key={index}>
          <em>{part.slice(3, -3)}</em>
        </strong>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('<u>') && part.endsWith('</u>') && part.length > 7) {
      return (
        <u key={index} className="underline decoration-amber-500/60 underline-offset-2">
          {part.slice(3, -4)}
        </u>
      );
    }
    return part;
  });
};

// --- Formatting Toolbar Helper Component ---
interface FormattingToolbarProps {
  label?: string;
  targetId: string;
  value: string;
  onChange: (newValue: string) => void;
}

const FormattingToolbar: React.FC<FormattingToolbarProps> = ({
  label,
  targetId,
  value,
  onChange
}) => {
  const applyFormat = (prefix: string, suffix: string) => {
    const el = document.getElementById(targetId) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el) {
      onChange(value ? `${value} ${prefix}text${suffix}` : `${prefix}text${suffix}`);
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const selected = value.substring(start, end);
    const textToInsert = selected ? `${prefix}${selected}${suffix}` : `${prefix}text${suffix}`;
    const newValue = value.substring(0, start) + textToInsert + value.substring(end);
    onChange(newValue);
    setTimeout(() => {
      el.focus();
      const newCursorPos = start + prefix.length + (selected ? selected.length : 4);
      el.setSelectionRange(
        start + prefix.length,
        selected ? newCursorPos : start + prefix.length + 4
      );
    }, 50);
  };

  return (
    <div className="flex items-center justify-between gap-2 mb-1">
      {label && <span className="text-xs font-bold uppercase opacity-60">{label}</span>}
      <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-md text-xs border border-slate-300/50 dark:border-slate-700">
        <span className="text-[10px] opacity-50 px-1 font-mono">格式:</span>
        <button
          type="button"
          onClick={() => applyFormat('**', '**')}
          className="px-2 py-0.5 font-bold hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
          title="加粗 (Bold) **text**"
        >
          <b>B</b>
        </button>
        <button
          type="button"
          onClick={() => applyFormat('*', '*')}
          className="px-2 py-0.5 italic hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
          title="斜体 (Italic) *text*"
        >
          <i>I</i>
        </button>
        <button
          type="button"
          onClick={() => applyFormat('<u>', '</u>')}
          className="px-2 py-0.5 underline hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
          title="下划线 (Underline) <u>text</u>"
        >
          <u>U</u>
        </button>
      </div>
    </div>
  );
};

export const ResumeDocument = React.forwardRef<HTMLDivElement, ResumeDocumentProps>(
  ({ currentUser }, ref) => {
    const { language } = useTranslation();
    const [searchParams] = useSearchParams();
    const urlUser = searchParams.get('user');
    const defaultProfile = (
      urlUser ||
      currentUser?.displayName?.toLowerCase().replace(/\s+/g, '') ||
      currentUser?.email?.split('@')[0] ||
      'sam'
    ).trim();

    const [resume, setResume] = useState<ResumeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [targetProfile, setTargetProfile] = useState<string>(defaultProfile);
    const [currentSlug, setCurrentSlug] = useState<string>(defaultProfile);
    const [resumeList, setResumeList] = useState<Array<{ slug: string; title: string; user: string }>>([]);
    const [availableProfiles, setAvailableProfiles] = useState<string[]>(['sam', 'jenny', defaultProfile]);

    // Admin Editing
    const [isEditing, setIsEditing] = useState(false);
    const [editResume, setEditResume] = useState<ResumeData | null>(null);
    const [activeTab, setActiveTab] = useState<'BASICS' | 'WORK' | 'EDUCATION' | 'SKILLS'>(
      'BASICS'
    );

    const isVip = currentUser?.vip || currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

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
      const backendUrl = `/api/resumes/export-pdf?user=${currentSlug}&lang=${language}`;
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
      const newSlug = cleanSuffix ? `${targetProfile}-${cleanSuffix}` : targetProfile;

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
          languages: []
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

    const getLocalized = (obj: any, field: string) => {
      if (!obj) return '';
      return language === 'zh'
        ? obj[`${field}_zh`] || obj[`${field}_en`] || ''
        : obj[`${field}_en`] || obj[`${field}_zh`] || '';
    };

    const getLocalizedArray = (obj: any, field: string) => {
      if (!obj) return [];
      return language === 'zh'
        ? obj[`${field}_zh`] || obj[`${field}_en`] || []
        : obj[`${field}_en`] || obj[`${field}_zh`] || [];
    };

    const handleEditOpen = () => {
      setEditResume(JSON.parse(JSON.stringify(resume))); // Deep copy
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

    const addItem = (section: 'work' | 'education' | 'skills') => {
      if (!editResume) return;
      const newResume = { ...editResume };
      const arr = (newResume[section] as any[]) || [];

      let newItem = {};
      if (section === 'work')
        newItem = { company_en: 'New Company', highlights_en: [], highlights_zh: [], weight: 0 };
      if (section === 'education') newItem = { institution: 'New School' };
      if (section === 'skills')
        newItem = { name_en: 'New Category', name_zh: '新品类', keywords: [] };

      arr.push(newItem);
      (newResume as any)[section] = arr;
      setEditResume(newResume);
    };

    const removeItem = (section: 'work' | 'education' | 'skills', index: number) => {
      if (!editResume) return;
      const newResume = { ...editResume };
      (newResume[section] as any[]).splice(index, 1);
      setEditResume(newResume);
    };

    // Initialize/Reset skills to 4 standard categories (Frontend, Backend, Devops, Language)
    const initStandardSkills = () => {
      if (!editResume) return;
      const standardCategories = [
        {
          name_zh: '前端 (Frontend)',
          name_en: 'Frontend',
          keywords: [
            'React',
            'TypeScript',
            'Vue.js',
            'Next.js',
            'Tailwind CSS',
            'Vite',
            'HTML5/CSS3'
          ]
        },
        {
          name_zh: '后端 (Backend)',
          name_en: 'Backend',
          keywords: [
            'Node.js',
            'Express',
            'Python',
            'Java',
            'MySQL',
            'MongoDB',
            'Redis',
            'Kafka'
          ]
        },
        {
          name_zh: 'DevOps',
          name_en: 'DevOps',
          keywords: ['Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'AWS', 'Nginx', 'Vercel']
        },
        {
          name_zh: '语言能力 (Language)',
          name_en: 'Language',
          keywords: ['Chinese (Native)', 'English (Professional)']
        }
      ];

      setEditResume({
        ...editResume,
        skills: standardCategories
      });
      toast.success('已预设 4 大品类 (Frontend, Backend, DevOps, Language)');
    };

    // Combine skills and legacy languages for unified display
    const getCombinedSkills = () => {
      if (!resume) return [];
      const skillsList = [...(resume.skills || [])];

      // Merge languages if legacy languages array exists and is not yet present in skills
      if (resume.languages && resume.languages.length > 0) {
        const hasLangGroup = skillsList.some(
          (s) =>
            s.name_en?.toLowerCase() === 'language' ||
            s.name_zh === '语言' ||
            s.name_zh === '语言能力' ||
            s.name_zh?.includes('Language')
        );
        if (!hasLangGroup) {
          skillsList.push({
            name_zh: '语言能力',
            name_en: 'Language',
            keywords: resume.languages.map(
              (l) =>
                `${getLocalized(l, 'language')}${l.fluency_zh || l.fluency_en ? ` (${getLocalized(l, 'fluency')})` : ''}`
            )
          });
        }
      }

      return skillsList;
    };

    // Sort work experience: higher weight ranks first; if weight equal/missing, sort chronologically by startDate
    const getSortedWork = () => {
      if (!resume || !resume.work) return [];
      return [...resume.work].sort((a, b) => {
        const weightA = typeof a.weight === 'number' ? a.weight : 0;
        const weightB = typeof b.weight === 'number' ? b.weight : 0;
        if (weightA !== weightB) {
          return weightB - weightA; // Higher weight comes first
        }
        return (b.startDate || '').localeCompare(a.startDate || '');
      });
    };

    const isProject = (job: any) => {
      return !!job.isProject;
    };

    const getSortedWorkExperience = () => {
      return getSortedWork().filter((job) => !isProject(job));
    };

    const getSortedFeaturedProjects = () => {
      return getSortedWork().filter((job) => isProject(job));
    };

    if (isLoading) {
      return (
        <div className="text-center py-20 text-slate-400 animate-pulse">Retrieving dossier...</div>
      );
    }

    // Modal Styling
    const modalBaseClass =
      'fixed z-[9999] inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4';
    const editorClass =
      'w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden rounded-2xl border bg-white text-slate-900 border-slate-200 dark:bg-[#020617] dark:text-slate-100 dark:border-slate-700 animate-slide-up';
    const inputClass =
      'w-full p-2 rounded outline-none border bg-slate-50 border-slate-200 dark:bg-[#1e293b] dark:border-slate-700 focus:border-amber-500 text-sm';
    const tabClassBase =
      'px-6 py-4 text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap';
    const activeTabClass =
      'text-primary-600 border-b-2 border-primary-600 bg-slate-50 dark:bg-[#0B1120] dark:text-amber-400 dark:border-amber-400';
    const inactiveTabClass = 'opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5';

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

        {/* Edit Modal - Portal to Body */}
        {isEditing &&
          editResume &&
          createPortal(
            <div className={modalBaseClass}>
              <div className={editorClass}>
                <div className="flex justify-between items-center border-b border-current bg-black/5 dark:bg-black/20 pr-4">
                  <div className="flex overflow-x-auto">
                    {(['BASICS', 'WORK', 'EDUCATION', 'SKILLS'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`${tabClassBase} ${activeTab === tab ? activeTabClass : inactiveTabClass}`}
                      >
                        {tab === 'SKILLS' ? 'SKILLS (含语言及4品类)' : tab}
                      </button>
                    ))}
                  </div>
                  <div className="text-xs font-bold uppercase opacity-50 px-4">
                    Editing: {editResume.title || currentSlug} ({targetProfile})
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {activeTab === 'BASICS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Resume Version Title */}
                      <div className="md:col-span-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
                        <label className="block text-xs font-bold uppercase text-amber-600 dark:text-amber-400 mb-1">
                          Resume Version Title / 简历版本名称 (用于多版本管理，例如：全栈工程师简历、兼职简历)
                        </label>
                        <input
                          className={inputClass}
                          value={editResume.title || ''}
                          onChange={(e) => {
                            setEditResume({
                              ...editResume,
                              title: e.target.value
                            });
                          }}
                          placeholder="例如：全栈开发简历"
                        />
                      </div>

                      <div className="space-y-4">
                        <label className="block text-xs font-bold uppercase opacity-60">Name</label>
                        <input
                          className={inputClass}
                          value={editResume.basics.name_zh || ''}
                          onChange={(e) => updateField('basics', 'name_zh', e.target.value)}
                          placeholder="Name (ZH)"
                        />
                        <input
                          className={inputClass}
                          value={editResume.basics.name_en || ''}
                          onChange={(e) => updateField('basics', 'name_en', e.target.value)}
                          placeholder="Name (EN)"
                        />

                        <label className="block text-xs font-bold uppercase opacity-60 mt-4">
                          Label / Role
                        </label>
                        <input
                          className={inputClass}
                          value={editResume.basics.label_zh || ''}
                          onChange={(e) => updateField('basics', 'label_zh', e.target.value)}
                          placeholder="Label (ZH)"
                        />
                        <input
                          className={inputClass}
                          value={editResume.basics.label_en || ''}
                          onChange={(e) => updateField('basics', 'label_en', e.target.value)}
                          placeholder="Label (EN)"
                        />
                      </div>
                      <div className="space-y-4">
                        <label className="block text-xs font-bold uppercase opacity-60">
                          Contact
                        </label>
                        <input
                          className={inputClass}
                          value={editResume.basics.email || ''}
                          onChange={(e) => updateField('basics', 'email', e.target.value)}
                          placeholder="Email"
                        />
                        <input
                          className={inputClass}
                          value={editResume.basics.phone || ''}
                          onChange={(e) => updateField('basics', 'phone', e.target.value)}
                          placeholder="Phone"
                        />
                        <input
                          className={inputClass}
                          value={editResume.basics.website || ''}
                          onChange={(e) => updateField('basics', 'website', e.target.value)}
                          placeholder="Website (e.g. ps6.space)"
                        />

                        <label className="block text-xs font-bold uppercase opacity-60 mt-4">
                          Location
                        </label>
                        <input
                          className={inputClass}
                          value={editResume.basics.location_zh || ''}
                          onChange={(e) => updateField('basics', 'location_zh', e.target.value)}
                          placeholder="Location (ZH)"
                        />
                        <input
                          className={inputClass}
                          value={editResume.basics.location_en || ''}
                          onChange={(e) => updateField('basics', 'location_en', e.target.value)}
                          placeholder="Location (EN)"
                        />

                        <label className="block text-xs font-bold uppercase opacity-60 mt-4">
                          Work Authorization / Visa Status
                        </label>
                        <input
                          className={inputClass}
                          value={editResume.basics.visaStatus_zh || ''}
                          onChange={(e) => updateField('basics', 'visaStatus_zh', e.target.value)}
                          placeholder="Visa Status (ZH) e.g., 工作签证 / 学生签证"
                        />
                        <input
                          className={inputClass}
                          value={editResume.basics.visaStatus_en || ''}
                          onChange={(e) => updateField('basics', 'visaStatus_en', e.target.value)}
                          placeholder="Visa Status (EN) e.g., Student Visa (20 hrs/week)"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-4">
                        <FormattingToolbar
                          label="Summary ZH (支持 **加粗**, *斜体*, <u>下划线</u>)"
                          targetId="basics-summary-zh"
                          value={editResume.basics.summary_zh || ''}
                          onChange={(val) => updateField('basics', 'summary_zh', val)}
                        />
                        <textarea
                          id="basics-summary-zh"
                          className={`${inputClass} h-24`}
                          value={editResume.basics.summary_zh || ''}
                          onChange={(e) => updateField('basics', 'summary_zh', e.target.value)}
                          placeholder="Summary (ZH)"
                        />

                        <FormattingToolbar
                          label="Summary EN (Supports **bold**, *italic*, <u>underline</u>)"
                          targetId="basics-summary-en"
                          value={editResume.basics.summary_en || ''}
                          onChange={(val) => updateField('basics', 'summary_en', val)}
                        />
                        <textarea
                          id="basics-summary-en"
                          className={`${inputClass} h-24`}
                          value={editResume.basics.summary_en || ''}
                          onChange={(e) => updateField('basics', 'summary_en', e.target.value)}
                          placeholder="Summary (EN)"
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'WORK' && (
                    <div className="space-y-8">
                      {editResume.work.map((job, idx) => (
                        <div
                          key={idx}
                          className="p-5 border border-current/20 rounded-xl relative bg-black/5 dark:bg-white/5 space-y-4"
                        >
                          <button
                            onClick={() => removeItem('work', idx)}
                            className="absolute top-3 right-3 text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1"
                          >
                            <i className="fas fa-trash"></i> 删除经历
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                Company (ZH)
                              </label>
                              <input
                                className={inputClass}
                                value={job.company_zh || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'company_zh')
                                }
                                placeholder="Company (ZH)"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                Company (EN)
                              </label>
                              <input
                                className={inputClass}
                                value={job.company_en || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'company_en')
                                }
                                placeholder="Company (EN)"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                Position (ZH)
                              </label>
                              <input
                                className={inputClass}
                                value={job.position_zh || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'position_zh')
                                }
                                placeholder="Position (ZH)"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                Position (EN)
                              </label>
                              <input
                                className={inputClass}
                                value={job.position_en || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'position_en')
                                }
                                placeholder="Position (EN)"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                Location (ZH)
                              </label>
                              <input
                                className={inputClass}
                                value={job.location_zh || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'location_zh')
                                }
                                placeholder="Location (ZH)"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                Location (EN)
                              </label>
                              <input
                                className={inputClass}
                                value={job.location_en || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'location_en')
                                }
                                placeholder="Location (EN)"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                Start Date
                              </label>
                              <input
                                className={inputClass}
                                value={job.startDate || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'startDate')
                                }
                                placeholder="e.g. 2022.03"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                End Date
                              </label>
                              <input
                                className={inputClass}
                                value={job.endDate || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'endDate')
                                }
                                placeholder="e.g. Present"
                              />
                            </div>

                            {/* Weight Field */}
                            <div className="md:col-span-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/30">
                              <label className="block text-xs font-bold uppercase text-amber-600 dark:text-amber-400 mb-1">
                                <i className="fas fa-sort-numeric-down mr-1"></i>
                                Weight / 比重权重 (数值越高越靠前排列；无比重时默认按时间从近到远)
                              </label>
                              <input
                                type="number"
                                className={`${inputClass} max-w-xs`}
                                value={job.weight ?? ''}
                                onChange={(e) =>
                                  updateField(
                                    'work',
                                    '',
                                    e.target.value === '' ? undefined : Number(e.target.value),
                                    idx,
                                    'weight'
                                  )
                                }
                                placeholder="0 (例如: 10, 100)"
                              />
                            </div>

                            {/* Project Toggle */}
                            <div className="md:col-span-2 flex items-center gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                              <input
                                type="checkbox"
                                id={`work-isproject-${idx}`}
                                checked={!!job.isProject}
                                onChange={(e) =>
                                  updateField('work', '', e.target.checked, idx, 'isProject')
                                }
                                className="w-4 h-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500 focus:ring-opacity-25"
                              />
                              <label
                                htmlFor={`work-isproject-${idx}`}
                                className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 cursor-pointer select-none"
                              >
                                Is Project / 是否为作品项目 (勾选后会在此简历的 Featured Projects 栏目展示；不勾选则在 Work Experience 展示)
                              </label>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                              <FormattingToolbar
                                label="Highlights ZH (One per line)"
                                targetId={`work-hl-zh-${idx}`}
                                value={job.highlights_zh?.join('\n') || ''}
                                onChange={(val) =>
                                  updateField('work', '', val, idx, 'highlights_zh')
                                }
                              />
                              <textarea
                                id={`work-hl-zh-${idx}`}
                                className={`${inputClass} h-36 text-xs font-mono`}
                                value={job.highlights_zh?.join('\n') || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'highlights_zh')
                                }
                                placeholder="Highlights ZH (One per line, supports **bold**, *italic*, <u>underline</u>)"
                              />
                            </div>
                            <div>
                              <FormattingToolbar
                                label="Highlights EN (One per line)"
                                targetId={`work-hl-en-${idx}`}
                                value={job.highlights_en?.join('\n') || ''}
                                onChange={(val) =>
                                  updateField('work', '', val, idx, 'highlights_en')
                                }
                              />
                              <textarea
                                id={`work-hl-en-${idx}`}
                                className={`${inputClass} h-36 text-xs font-mono`}
                                value={job.highlights_en?.join('\n') || ''}
                                onChange={(e) =>
                                  updateField('work', '', e.target.value, idx, 'highlights_en')
                                }
                                placeholder="Highlights EN (One per line, supports **bold**, *italic*, <u>underline</u>)"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            if (!editResume) return;
                            const newResume = { ...editResume };
                            const arr = newResume.work || [];
                            arr.push({
                              company_zh: '新公司 / New Company',
                              company_en: 'New Company',
                              position_zh: '岗位 / Position',
                              position_en: 'Position',
                              highlights_zh: [],
                              highlights_en: [],
                              weight: 0,
                              isProject: false
                            });
                            setEditResume(newResume);
                          }}
                          className="flex-1 py-3 border-2 border-dashed border-current/30 text-current/60 font-bold uppercase rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-xs transition-colors"
                        >
                          + Add Work Experience
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editResume) return;
                            const newResume = { ...editResume };
                            const arr = newResume.work || [];
                            arr.push({
                              company_zh: '新项目 / New Project',
                              company_en: 'New Project',
                              position_zh: '项目角色 / Project Role',
                              position_en: 'Project Role',
                              highlights_zh: [],
                              highlights_en: [],
                              weight: 0,
                              isProject: true
                            });
                            setEditResume(newResume);
                          }}
                          className="flex-1 py-3 border-2 border-dashed border-blue-500/30 text-blue-500 hover:border-blue-500 hover:bg-blue-500/5 font-bold uppercase rounded-xl text-xs transition-all"
                        >
                          + Add Featured Project
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'EDUCATION' && (
                    <div className="space-y-6">
                      {editResume.education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-current/20 rounded-xl relative bg-black/5 dark:bg-white/5 space-y-4"
                        >
                          <button
                            onClick={() => removeItem('education', idx)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              className={inputClass}
                              value={edu.institution || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'institution')
                              }
                              placeholder="Institution"
                            />
                            <input
                              className={inputClass}
                              value={edu.location || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'location')
                              }
                              placeholder="Location"
                            />
                            <input
                              className={inputClass}
                              value={edu.area_zh || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'area_zh')
                              }
                              placeholder="Area (ZH)"
                            />
                            <input
                              className={inputClass}
                              value={edu.area_en || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'area_en')
                              }
                              placeholder="Area (EN)"
                            />
                            <input
                              className={inputClass}
                              value={edu.studyType_zh || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'studyType_zh')
                              }
                              placeholder="Degree (ZH)"
                            />
                            <input
                              className={inputClass}
                              value={edu.studyType_en || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'studyType_en')
                              }
                              placeholder="Degree (EN)"
                            />
                            <input
                              className={inputClass}
                              value={edu.startDate || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'startDate')
                              }
                              placeholder="Start Date"
                            />
                            <input
                              className={inputClass}
                              value={edu.endDate || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'endDate')
                              }
                              placeholder="End Date"
                            />
                            <input
                              className={inputClass}
                              value={edu.score_zh || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'score_zh')
                              }
                              placeholder="Score/Honors (ZH)"
                            />
                            <input
                              className={inputClass}
                              value={edu.score_en || ''}
                              onChange={(e) =>
                                updateField('education', '', e.target.value, idx, 'score_en')
                              }
                              placeholder="Score/Honors (EN)"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addItem('education')}
                        className="w-full py-3 border-2 border-dashed border-current/30 text-current/60 font-bold uppercase rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        + Add Education
                      </button>
                    </div>
                  )}

                  {activeTab === 'SKILLS' && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                        <div className="text-xs font-bold text-amber-700 dark:text-amber-300">
                          <i className="fas fa-layer-group mr-1.5"></i>
                          包含 Frontend, Backend, Devops, Language 4大品类 (单行紧凑文本展示)
                        </div>
                        <button
                          type="button"
                          onClick={initStandardSkills}
                          className="px-3 py-1.5 bg-amber-500 text-black font-bold text-xs rounded-lg hover:bg-amber-400 transition-colors shadow"
                        >
                          预设4大品类 (Frontend, Backend, DevOps, Language)
                        </button>
                      </div>

                      {editResume.skills.map((skill, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-current/20 rounded-xl relative bg-black/5 dark:bg-white/5 space-y-4"
                        >
                          <button
                            onClick={() => removeItem('skills', idx)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 text-xs font-bold"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                Category Name (ZH)
                              </label>
                              <input
                                className={inputClass}
                                value={skill.name_zh || ''}
                                onChange={(e) =>
                                  updateField('skills', '', e.target.value, idx, 'name_zh')
                                }
                                placeholder="例如: 前端 / Frontend"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-bold uppercase opacity-60 mb-1">
                                Category Name (EN)
                              </label>
                              <input
                                className={inputClass}
                                value={skill.name_en || ''}
                                onChange={(e) =>
                                  updateField('skills', '', e.target.value, idx, 'name_en')
                                }
                                placeholder="e.g. Frontend"
                              />
                            </div>
                          </div>
                          <div>
                            <FormattingToolbar
                              label="Skill Items / Keywords (One per line, supports **bold**, *italic*, <u>underline</u>)"
                              targetId={`skills-kw-${idx}`}
                              value={skill.keywords?.join('\n') || ''}
                              onChange={(val) => updateField('skills', '', val, idx, 'keywords')}
                            />
                            <textarea
                              id={`skills-kw-${idx}`}
                              className={`${inputClass} h-28 text-xs font-mono`}
                              value={skill.keywords?.join('\n') || ''}
                              onChange={(e) =>
                                updateField('skills', '', e.target.value, idx, 'keywords')
                              }
                              placeholder="React&#10;TypeScript&#10;Vue.js&#10;Next.js"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addItem('skills')}
                        className="w-full py-3 border-2 border-dashed border-current/30 text-current/60 font-bold uppercase rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        + Add Skill Group
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-current/20 bg-black/5 dark:bg-white/5 flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-lg font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-8 py-2 bg-primary-500 hover:bg-primary-600 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-black rounded-lg font-bold shadow-lg shadow-primary-500/20 dark:shadow-amber-500/20 transition-all text-sm"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

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
          <div
            ref={ref}
            id="resume-paper-sheet"
            className="resume-paper-sheet bg-white rounded-[2rem] shadow-xl border border-slate-200 p-8 md:p-16 max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-8 print:max-w-none print:rounded-none font-serif text-slate-900"
          >
            {/* Header / Basics */}
            <div className="pb-2 mb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-black mb-1.5">
                  {renderRichText(getLocalized(resume.basics, 'name'))}
                </h1>
                <p className="text-lg text-slate-800 font-medium">
                  {renderRichText(getLocalized(resume.basics, 'label'))}
                </p>
              </div>
              <div className="text-sm text-slate-700 font-sans space-y-1 text-right">
                {getLocalized(resume.basics, 'location') && (
                  <div className="flex items-center justify-end gap-2">
                    <i aria-hidden="true" className="fas fa-map-marker-alt opacity-70"></i>{' '}
                    <span>{renderRichText(getLocalized(resume.basics, 'location'))}</span>
                  </div>
                )}
                {getLocalized(resume.basics, 'visaStatus') && (
                  <div className="flex items-center justify-end gap-2 font-medium">
                    <i aria-hidden="true" className="fas fa-id-card opacity-70"></i>{' '}
                    <span>{renderRichText(getLocalized(resume.basics, 'visaStatus'))}</span>
                  </div>
                )}
                {resume.basics.email && (
                  <div className="flex items-center justify-end gap-2">
                    <i aria-hidden="true" className="fas fa-envelope opacity-70"></i>{' '}
                    <span>{resume.basics.email}</span>
                  </div>
                )}
                {resume.basics.phone && (
                  <div className="flex items-center justify-end gap-2">
                    <i aria-hidden="true" className="fas fa-phone opacity-70"></i>{' '}
                    <span>{resume.basics.phone}</span>
                  </div>
                )}
                {resume.basics.website && (
                  <div className="flex items-center justify-end gap-2">
                    <i aria-hidden="true" className="fas fa-globe opacity-70"></i>{' '}
                    <span className="opacity-90">Web:</span>
                    <a
                      href={resume.basics.website.startsWith('http') ? resume.basics.website : `https://${resume.basics.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline font-bold"
                    >
                      {resume.basics.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Summary / Profile */}
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b-2 border-slate-900 pb-2">
                Profile
              </h2>
              <div className="text-slate-800 leading-relaxed text-base md:text-lg text-left whitespace-pre-line">
                {renderRichText(getLocalized(resume.basics, 'summary'))}
              </div>
            </section>

            {/* Work Experience */}
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4 border-b-2 border-slate-900 pb-2">
                Work Experience
              </h2>
              <div className="space-y-6">
                {getSortedWorkExperience().map((job, idx) => (
                  <div key={idx} className="break-inside-avoid page-break-inside-avoid">
                    <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-1">
                      <h3 className="text-xl font-bold text-black flex items-center gap-2">
                        {renderRichText(getLocalized(job, 'company'))}
                      </h3>
                      <div className="flex items-center gap-2">
                        {typeof job.weight === 'number' && job.weight > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                            Weight: {job.weight}
                          </span>
                        )}
                        <span className="font-sans text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded font-medium">
                          {job.startDate} — {job.endDate || 'Present'}
                        </span>
                      </div>
                    </div>

                    <p className="text-slate-800 font-bold text-base mb-3 italic">
                      {renderRichText(getLocalized(job, 'position'))}
                    </p>

                    {/* Location Display */}
                    {(job.location_zh || job.location_en) && (
                      <p className="text-sm text-slate-600 mb-2 font-sans flex items-center gap-2">
                        <i aria-hidden="true" className="fas fa-map-marker-alt opacity-70"></i>
                        <span>{renderRichText(getLocalized(job, 'location'))}</span>
                      </p>
                    )}

                    <ul className="list-disc list-outside ml-4 space-y-1.5 text-slate-800 leading-relaxed marker:text-slate-500 text-base text-left">
                      {getLocalizedArray(job, 'highlights').map((hl: string, i: number) => (
                        <li key={i}>{renderRichText(hl)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
            {/* Featured Projects */}
            {getSortedFeaturedProjects().length !== 0 ? (
              <section className="mb-8">
                <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4 border-b-2 border-slate-900 pb-2">
                  Featured Projects
                </h2>
                <div className="space-y-6">
                  {getSortedFeaturedProjects().map((job, idx) => (
                    <div key={idx} className="break-inside-avoid page-break-inside-avoid">
                      <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-1">
                        <h3 className="text-xl font-bold text-black flex items-center gap-2">
                          {renderRichText(getLocalized(job, 'company'))}
                        </h3>
                        <div className="flex items-center gap-2">
                          {typeof job.weight === 'number' && job.weight > 0 && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                              Weight: {job.weight}
                            </span>
                          )}
                          <span className="font-sans text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded font-medium">
                            {job.startDate} — {job.endDate || 'Present'}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-800 font-bold text-base mb-3 italic">
                        {renderRichText(getLocalized(job, 'position'))}
                      </p>

                      {/* Location Display */}
                      {(job.location_zh || job.location_en) && (
                        <p className="text-sm text-slate-600 mb-2 font-sans flex items-center gap-2">
                          <i aria-hidden="true" className="fas fa-map-marker-alt opacity-70"></i>
                          <span>{renderRichText(getLocalized(job, 'location'))}</span>
                        </p>
                      )}

                      <ul className="list-disc list-outside ml-4 space-y-1.5 text-slate-800 leading-relaxed marker:text-slate-500 text-base text-left">
                        {getLocalizedArray(job, 'highlights').map((hl: string, i: number) => (
                          <li key={i}>{renderRichText(hl)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Education */}
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4 border-b-2 border-slate-900 pb-2">
                Education
              </h2>

              <div className="grid grid-cols-1 gap-4">
                {resume.education.map((edu, idx) => (
                  <div
                    key={idx}
                    className="bg-transparent p-0 rounded-none border-none break-inside-avoid page-break-inside-avoid"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="text-lg font-bold text-black">
                        {renderRichText(edu.institution)}
                      </h3>
                      <span className="text-sm font-sans text-slate-700 font-medium">
                        {edu.startDate} — {edu.endDate}
                      </span>
                    </div>
                    {edu.location && (
                      <p className="text-sm text-slate-600 mb-2 font-sans flex items-center gap-2">
                        <i aria-hidden="true" className="fas fa-map-marker-alt opacity-70"></i>
                        <span>{renderRichText(edu.location)}</span>
                      </p>
                    )}
                    <p className="text-slate-800 font-medium text-base">
                      {renderRichText(getLocalized(edu, 'studyType'))} in{' '}
                      {renderRichText(getLocalized(edu, 'area'))}
                    </p>
                    {edu.score_en && (
                      <p className="text-slate-700 text-sm mt-1 italic">
                        {renderRichText(getLocalized(edu, 'score'))}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Unified Skills Section (Frontend, Backend, Devops, Language) */}
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-4 border-b-2 border-slate-900 pb-2">
                Skills
              </h2>
              <div className="space-y-3 font-sans text-sm md:text-base text-slate-800">
                {getCombinedSkills().map((skillGroup, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 leading-relaxed break-inside-avoid"
                  >
                    <span className="font-bold text-black sm:min-w-[100px] shrink-0">
                      {renderRichText(getLocalized(skillGroup, 'name'))}:
                    </span>
                    <span className="font-normal text-slate-800">
                      {skillGroup.keywords.map((kw, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && (
                            <span className="mr-1.5 font-bold text-slate-400">
                              ,
                            </span>
                          )}
                          {renderRichText(kw)}
                        </React.Fragment>
                      ))}
                    </span>
                  </div>
                ))}
              </div>
            </section>
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
      </div>
    );
  }
);

ResumeDocument.displayName = 'ResumeDocument';
