import React, { useState, useEffect } from 'react';
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
    const [resume, setResume] = useState<ResumeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Resume Profile Switcher
    const [targetProfile, setTargetProfile] = useState<'sam' | 'jenny'>('sam');

    // Admin Editing
    const [isEditing, setIsEditing] = useState(false);
    const [editResume, setEditResume] = useState<ResumeData | null>(null);
    const [activeTab, setActiveTab] = useState<'BASICS' | 'WORK' | 'EDUCATION' | 'SKILLS'>(
      'BASICS'
    );

    const isVip = currentUser?.vip;

    useEffect(() => {
      loadResume();
    }, [targetProfile]);

    const loadResume = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.getResumeData(targetProfile);
        setResume(data);
      } catch (e) {
        console.error('Failed to load resume', e);
        setResume(null);
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
        await apiService.updateResume(editResume, targetProfile);
        setResume(editResume);
        setIsEditing(false);
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
            'Go',
            'PostgreSQL',
            'MongoDB',
            'Redis',
            'RESTful API'
          ]
        },
        {
          name_zh: 'DevOps & 运维',
          name_en: 'Devops',
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

    if (isLoading) {
      return (
        <div className="text-center py-20 text-slate-400 animate-pulse">Retrieving dossier...</div>
      );
    }

    if (!resume) {
      return <div className="text-center py-20 text-slate-400">Resume data unavailable.</div>;
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
          <div className="absolute -top-16 right-0 flex gap-4 z-20">
            {/* Profile Switcher */}
            <div className="flex bg-slate-800 rounded-lg overflow-hidden border border-slate-700">
              <button
                onClick={() => setTargetProfile('sam')}
                className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${targetProfile === 'sam' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
              >
                Sam
              </button>
              <button
                onClick={() => setTargetProfile('jenny')}
                className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${targetProfile === 'jenny' ? 'bg-pink-500 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Jenny
              </button>
            </div>

            <button
              onClick={handleEditOpen}
              className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-lg hover:bg-slate-700 transition-colors shadow-lg flex items-center gap-2"
            >
              <i className="fas fa-edit"></i> Edit {targetProfile === 'sam' ? 'Sam' : 'Jenny'}
            </button>
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
                    Editing: {targetProfile}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {activeTab === 'BASICS' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <button
                        onClick={() => addItem('work')}
                        className="w-full py-3 border-2 border-dashed border-current/30 text-current/60 font-bold uppercase rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        + Add Work Experience
                      </button>
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

        {/* --- Resume Document Content --- */}
        <div
          ref={ref}
          className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-16 max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-8 print:max-w-none print:rounded-none font-serif text-slate-900"
        >
          {/* Header / Basics */}
          <div className="pb-2 mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-1.5">
                {renderRichText(getLocalized(resume.basics, 'name'))}
              </h1>
              <p className="text-lg text-slate-800 dark:text-slate-300 font-medium">
                {renderRichText(getLocalized(resume.basics, 'label'))}
              </p>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-400 font-sans space-y-1 text-right">
              {resume.basics.email && (
                <div className="flex items-center justify-end gap-2">
                  <i className="fas fa-envelope opacity-70"></i> {resume.basics.email}
                </div>
              )}
              {resume.basics.phone && (
                <div className="flex items-center justify-end gap-2">
                  <i className="fas fa-phone opacity-70"></i> {resume.basics.phone}
                </div>
              )}
              {targetProfile !== 'jenny' && (
                <div className="flex items-center justify-end gap-2">
                  <i className="fas fa-globe opacity-70"></i>{' '}
                  <span className="opacity-90">Portfolio:</span>
                  <a
                    href="https://ps6.space"
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline font-bold"
                  >
                    https://ps6.space
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Education */}
          <section className="mb-12">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-6 border-b-2 border-slate-900 dark:border-slate-800 pb-2">
              Education
            </h3>

            <div className="grid grid-cols-1 gap-6">
              {resume.education.map((edu, idx) => (
                <div
                  key={idx}
                  className="bg-transparent dark:bg-slate-800/50 p-0 dark:p-6 rounded-none dark:rounded-2xl border-none dark:border dark:border-slate-800 break-inside-avoid page-break-inside-avoid"
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="text-lg font-bold text-black dark:text-white">
                      {renderRichText(edu.institution)}
                    </h4>
                    <span className="text-sm font-sans text-slate-700 dark:text-slate-400 font-medium">
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  {edu.location && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-sans flex items-center gap-2">
                      <i className="fas fa-map-marker-alt opacity-70"></i>
                      {renderRichText(edu.location)}
                    </p>
                  )}
                  <p className="text-slate-800 dark:text-slate-300 font-medium text-base">
                    {renderRichText(getLocalized(edu, 'studyType'))} in{' '}
                    {renderRichText(getLocalized(edu, 'area'))}
                  </p>
                  {edu.score_en && (
                    <p className="text-slate-700 dark:text-slate-400 text-sm mt-1 italic">
                      {renderRichText(getLocalized(edu, 'score'))}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Summary / Profile */}
          <section className="mb-12">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-4 border-b-2 border-slate-900 dark:border-slate-800 pb-2">
              Profile
            </h3>
            <div className="text-slate-800 dark:text-slate-300 leading-relaxed text-base md:text-lg text-left whitespace-pre-line">
              {renderRichText(getLocalized(resume.basics, 'summary'))}
            </div>
          </section>

          {/* Work Experience */}
          <section className="mb-12">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-6 border-b-2 border-slate-900 dark:border-slate-800 pb-2">
              Experience
            </h3>
            <div className="space-y-10 border-l-2 border-slate-300 dark:border-slate-800 ml-1 pl-8 relative">
              {getSortedWork().map((job, idx) => (
                <div key={idx} className="relative break-inside-avoid page-break-inside-avoid">
                  <span className="absolute -left-[39px] top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 bg-slate-900 dark:bg-slate-500"></span>

                  <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-1">
                    <h4 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                      {renderRichText(getLocalized(job, 'company'))}
                    </h4>
                    <div className="flex items-center gap-2">
                      {typeof job.weight === 'number' && job.weight > 0 && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 font-bold">
                          Weight: {job.weight}
                        </span>
                      )}
                      <span className="font-sans text-sm text-slate-700 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded font-medium">
                        {job.startDate} — {job.endDate || 'Present'}
                      </span>
                    </div>
                  </div>

                  <p className="text-slate-800 dark:text-slate-300 font-bold text-base mb-3 italic">
                    {renderRichText(getLocalized(job, 'position'))}
                  </p>

                  {/* Location Display */}
                  {(job.location_zh || job.location_en) && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 font-sans flex items-center gap-2">
                      <i className="fas fa-map-marker-alt opacity-70"></i>
                      {renderRichText(getLocalized(job, 'location'))}
                    </p>
                  )}

                  <ul className="list-disc list-outside ml-4 space-y-1.5 text-slate-800 dark:text-slate-400 leading-relaxed marker:text-slate-500 dark:marker:text-slate-600 text-base text-left">
                    {getLocalizedArray(job, 'highlights').map((hl: string, i: number) => (
                      <li key={i}>{renderRichText(hl)}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Unified Skills Section (Frontend, Backend, Devops, Language) */}
          <section className="mb-12">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-900 dark:text-slate-400 mb-6 border-b-2 border-slate-900 dark:border-slate-800 pb-2">
              Skills
            </h3>
            <div className="space-y-3 font-sans text-sm md:text-base text-slate-800 dark:text-slate-300">
              {getCombinedSkills().map((skillGroup, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2 leading-relaxed break-inside-avoid"
                >
                  <span className="font-bold text-black dark:text-white sm:min-w-[100px] shrink-0">
                    {renderRichText(getLocalized(skillGroup, 'name'))}:
                  </span>
                  <span className="font-normal text-slate-800 dark:text-slate-300">
                    {skillGroup.keywords.map((kw, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && (
                          <span className="mr-1.5 font-bold text-slate-400 dark:text-slate-500">
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
      </div>
    );
  }
);

ResumeDocument.displayName = 'ResumeDocument';
