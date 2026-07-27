import React from 'react';
import { createPortal } from 'react-dom';
import { ResumeData, Language } from '../../types';

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

interface ResumeEditModalProps {
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editResume: ResumeData | null;
  setEditResume: React.Dispatch<React.SetStateAction<ResumeData | null>>;
  activeTab: 'BASICS' | 'WORK' | 'EDUCATION' | 'SKILLS';
  setActiveTab: (tab: 'BASICS' | 'WORK' | 'EDUCATION' | 'SKILLS') => void;
  language: Language;
  targetProfile: string;
  currentSlug: string;
  updateField: (
    section: keyof ResumeData,
    field: string,
    value: any,
    index?: number,
    nestedField?: string
  ) => void;
  removeItem: (section: 'work' | 'education' | 'skills', index: number) => void;
  addItem: (section: 'work' | 'education' | 'skills') => void;
  handleSave: () => Promise<void>;
}

export const ResumeEditModal: React.FC<ResumeEditModalProps> = ({
  isEditing,
  setIsEditing,
  editResume,
  setEditResume,
  activeTab,
  setActiveTab,
  language,
  targetProfile,
  currentSlug,
  updateField,
  removeItem,
  addItem,
  handleSave
}) => {
  if (!isEditing || !editResume) return null;

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

  return createPortal(
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
                        Is Project / 是否为作品项目 (勾选后会在此简历 de Featured Projects 栏目展示；不勾选则在 Work Experience 展示)
                      </label>
                    </div>

                    {/* Page Break Toggle */}
                    <div className="md:col-span-2 flex items-center gap-2 p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
                      <input
                        type="checkbox"
                        id={`work-pagebreak-${idx}`}
                        checked={!!job.pageBreakBefore}
                        onChange={(e) =>
                          updateField('work', '', e.target.checked, idx, 'pageBreakBefore')
                        }
                        className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 focus:ring-opacity-25"
                      />
                      <label
                        htmlFor={`work-pagebreak-${idx}`}
                        className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 cursor-pointer select-none"
                      >
                        {language === 'zh' ? '此经历前强制分页 / Force page break before this job' : 'Force page break before this job'}
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
                    {/* Page Break Toggle */}
                    <div className="md:col-span-2 flex items-center gap-2 p-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
                      <input
                        type="checkbox"
                        id={`edu-pagebreak-${idx}`}
                        checked={!!edu.pageBreakBefore}
                        onChange={(e) =>
                          updateField('education', '', e.target.checked, idx, 'pageBreakBefore')
                        }
                        className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 focus:ring-opacity-25"
                      />
                      <label
                        htmlFor={`edu-pagebreak-${idx}`}
                        className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 cursor-pointer select-none"
                      >
                        {language === 'zh' ? '在此教育经历前强制分页 / Force page break before this education entry' : 'Force page break before this education entry'}
                      </label>
                    </div>
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
                    {/* Page Break Toggle */}
                    <div className="flex items-center gap-2 p-3 mt-3 bg-rose-500/10 rounded-lg border border-rose-500/30">
                      <input
                        type="checkbox"
                        id={`skills-pagebreak-${idx}`}
                        checked={!!skill.pageBreakBefore}
                        onChange={(e) =>
                          updateField('skills', '', e.target.checked, idx, 'pageBreakBefore')
                        }
                        className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500 focus:ring-opacity-25"
                      />
                      <label
                        htmlFor={`skills-pagebreak-${idx}`}
                        className="text-xs font-bold uppercase text-rose-600 dark:text-rose-400 cursor-pointer select-none"
                      >
                        {language === 'zh' ? '在此技能组前强制分页 / Force page break before this skill group' : 'Force page break before this skill group'}
                      </label>
                    </div>
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
  );
};
