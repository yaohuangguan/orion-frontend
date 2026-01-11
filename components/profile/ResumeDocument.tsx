import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { apiService } from '../../services/api';
import { ResumeData, User } from '../../types';
import { useTranslation } from '../../i18n/LanguageContext';
import { toast } from '../Toast';

interface ResumeDocumentProps {
  currentUser?: User | null;
}

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
    const [activeTab, setActiveTab] = useState<
      'BASICS' | 'WORK' | 'EDUCATION' | 'SKILLS' | 'LANGUAGES'
    >('BASICS');

    const isVip = currentUser?.vip;

    // NOTE: activeTab logic was redundant or simplified in previous edit, cleaning up if needed.
    // We removed the duplicate declaration in previous turn.
    // We don't need contentRef or handlePrint here anymore.

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
      return language === 'zh'
        ? obj[`${field}_zh`] || obj[`${field}_en`]
        : obj[`${field}_en`] || obj[`${field}_zh`];
    };

    const getLocalizedArray = (obj: any, field: string) => {
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
            arr[index][nestedField] = value.split('\n').filter((s: string) => s.trim());
          } else {
            arr[index][nestedField] = value;
          }
        } else {
          arr[index] = value;
        }
      }

      setEditResume(newResume);
    };

    const addItem = (section: 'work' | 'education' | 'skills' | 'languages') => {
      if (!editResume) return;
      const newResume = { ...editResume };
      const arr = newResume[section] as any[];

      let newItem = {};
      if (section === 'work')
        newItem = { company_en: 'New Company', highlights_en: [], highlights_zh: [] };
      if (section === 'education') newItem = { institution: 'New School' };
      if (section === 'skills') newItem = { name_en: 'New Skill', keywords: [] };
      if (section === 'languages') newItem = { language_en: 'Language', fluency_en: 'Fluent' };

      arr.push(newItem);
      setEditResume(newResume);
    };

    const removeItem = (section: 'work' | 'education' | 'skills' | 'languages', index: number) => {
      if (!editResume) return;
      const newResume = { ...editResume };
      (newResume[section] as any[]).splice(index, 1);
      setEditResume(newResume);
    };

    if (isLoading) {
      return (
        <div className="text-center py-20 text-slate-400 animate-pulse">Retrieving dossier...</div>
      );
    }

    if (!resume) {
      return <div className="text-center py-20 text-slate-400">Resume data unavailable.</div>;
    }

    // Styles for the "Kraft Paper" vs "Star Chart" theme in editor
    const modalBaseClass =
      'fixed z-[9999] inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4';
    const editorClass =
      'w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden rounded-2xl border bg-white text-slate-900 border-slate-200 dark:bg-[#020617] dark:text-slate-100 dark:border-slate-700 animate-slide-up';
    const inputClass =
      'w-full p-2 rounded outline-none border bg-slate-50 border-slate-200 dark:bg-[#1e293b] dark:border-slate-700';
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
              className="px-4 py-2 bg-slate-800 text-white text-xs font-bold uppercase rounded-lg hover:bg-slate-700 transition-colors shadow-lg"
            >
              <i className="fas fa-edit mr-2"></i> Edit {targetProfile === 'sam' ? 'Sam' : 'Jenny'}
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
                    {(['BASICS', 'WORK', 'EDUCATION', 'SKILLS', 'LANGUAGES'] as const).map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`${tabClassBase} ${activeTab === tab ? activeTabClass : inactiveTabClass}`}
                        >
                          {tab}
                        </button>
                      )
                    )}
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
                        <label className="block text-xs font-bold uppercase opacity-60">
                          Summary
                        </label>
                        <textarea
                          className={`${inputClass} h-24`}
                          value={editResume.basics.summary_zh || ''}
                          onChange={(e) => updateField('basics', 'summary_zh', e.target.value)}
                          placeholder="Summary (ZH)"
                        />
                        <textarea
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
                          className="p-4 border border-current/20 rounded-xl relative bg-black/5 dark:bg-white/5"
                        >
                          <button
                            onClick={() => removeItem('work', idx)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                              className={inputClass}
                              value={job.company_zh || ''}
                              onChange={(e) =>
                                updateField('work', '', e.target.value, idx, 'company_zh')
                              }
                              placeholder="Company (ZH)"
                            />
                            <input
                              className={inputClass}
                              value={job.company_en || ''}
                              onChange={(e) =>
                                updateField('work', '', e.target.value, idx, 'company_en')
                              }
                              placeholder="Company (EN)"
                            />
                            <input
                              className={inputClass}
                              value={job.position_zh || ''}
                              onChange={(e) =>
                                updateField('work', '', e.target.value, idx, 'position_zh')
                              }
                              placeholder="Position (ZH)"
                            />
                            <input
                              className={inputClass}
                              value={job.position_en || ''}
                              onChange={(e) =>
                                updateField('work', '', e.target.value, idx, 'position_en')
                              }
                              placeholder="Position (EN)"
                            />
                            <input
                              className={inputClass}
                              value={job.startDate || ''}
                              onChange={(e) =>
                                updateField('work', '', e.target.value, idx, 'startDate')
                              }
                              placeholder="Start Date"
                            />
                            <input
                              className={inputClass}
                              value={job.endDate || ''}
                              onChange={(e) =>
                                updateField('work', '', e.target.value, idx, 'endDate')
                              }
                              placeholder="End Date"
                            />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <textarea
                              className={`${inputClass} h-32 text-xs font-mono`}
                              value={job.highlights_zh?.join('\n') || ''}
                              onChange={(e) =>
                                updateField('work', '', e.target.value, idx, 'highlights_zh')
                              }
                              placeholder="Highlights ZH (One per line)"
                            />
                            <textarea
                              className={`${inputClass} h-32 text-xs font-mono`}
                              value={job.highlights_en?.join('\n') || ''}
                              onChange={(e) =>
                                updateField('work', '', e.target.value, idx, 'highlights_en')
                              }
                              placeholder="Highlights EN (One per line)"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => addItem('work')}
                        className="w-full py-3 border-2 border-dashed border-current/30 text-current/60 font-bold uppercase rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        Add Work Experience
                      </button>
                    </div>
                  )}

                  {activeTab === 'EDUCATION' && (
                    <div className="space-y-6">
                      {editResume.education.map((edu, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-current/20 rounded-xl relative bg-black/5 dark:bg-white/5"
                        >
                          <button
                            onClick={() => removeItem('education', idx)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
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
                        Add Education
                      </button>
                    </div>
                  )}

                  {activeTab === 'SKILLS' && (
                    <div className="space-y-6">
                      {editResume.skills.map((skill, idx) => (
                        <div
                          key={idx}
                          className="p-4 border border-current/20 rounded-xl relative bg-black/5 dark:bg-white/5"
                        >
                          <button
                            onClick={() => removeItem('skills', idx)}
                            className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <input
                              className={inputClass}
                              value={skill.name_zh || ''}
                              onChange={(e) =>
                                updateField('skills', '', e.target.value, idx, 'name_zh')
                              }
                              placeholder="Category (ZH)"
                            />
                            <input
                              className={inputClass}
                              value={skill.name_en || ''}
                              onChange={(e) =>
                                updateField('skills', '', e.target.value, idx, 'name_en')
                              }
                              placeholder="Category (EN)"
                            />
                          </div>
                          <textarea
                            className={`${inputClass} h-24 text-xs font-mono`}
                            value={skill.keywords?.join('\n') || ''}
                            onChange={(e) =>
                              updateField('skills', '', e.target.value, idx, 'keywords')
                            }
                            placeholder="Keywords (One per line)"
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => addItem('skills')}
                        className="w-full py-3 border-2 border-dashed border-current/30 text-current/60 font-bold uppercase rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        Add Skill Group
                      </button>
                    </div>
                  )}

                  {activeTab === 'LANGUAGES' && (
                    <div className="space-y-4">
                      {editResume.languages.map((lang, idx) => (
                        <div
                          key={idx}
                          className="flex gap-4 items-center p-3 border border-current/20 rounded-lg bg-black/5 dark:bg-white/5"
                        >
                          <input
                            className={`${inputClass} flex-1`}
                            value={lang.language_zh || ''}
                            onChange={(e) =>
                              updateField('languages', '', e.target.value, idx, 'language_zh')
                            }
                            placeholder="Language (ZH)"
                          />
                          <input
                            className={`${inputClass} flex-1`}
                            value={lang.language_en || ''}
                            onChange={(e) =>
                              updateField('languages', '', e.target.value, idx, 'language_en')
                            }
                            placeholder="Language (EN)"
                          />
                          <input
                            className={`${inputClass} flex-1`}
                            value={lang.fluency_zh || ''}
                            onChange={(e) =>
                              updateField('languages', '', e.target.value, idx, 'fluency_zh')
                            }
                            placeholder="Fluency (ZH)"
                          />
                          <input
                            className={`${inputClass} flex-1`}
                            value={lang.fluency_en || ''}
                            onChange={(e) =>
                              updateField('languages', '', e.target.value, idx, 'fluency_en')
                            }
                            placeholder="Fluency (EN)"
                          />
                          <button
                            onClick={() => removeItem('languages', idx)}
                            className="text-red-500 hover:text-red-700 px-2"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addItem('languages')}
                        className="w-full py-3 border-2 border-dashed border-current/30 text-current/60 font-bold uppercase rounded-xl hover:bg-black/5 dark:hover:bg-white/5"
                      >
                        Add Language
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-current/20 bg-black/5 dark:bg-white/5 flex justify-end gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 rounded-lg font-bold hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="px-8 py-2 bg-primary-500 hover:bg-primary-600 text-white dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-black rounded-lg font-bold shadow-lg shadow-primary-500/20 dark:shadow-amber-500/20 transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}

        <div
          ref={ref}
          className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl border border-slate-200 dark:border-slate-800 p-8 md:p-16 max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-8 print:max-w-none print:rounded-none"
        >
          {/* Header / Basics */}
          <div className="border-b-2 border-slate-100 dark:border-slate-800 pb-10 mb-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white mb-2">
                {getLocalized(resume.basics, 'name')}
              </h1>
              <p className="text-xl text-amber-600 dark:text-amber-500 font-medium">
                {getLocalized(resume.basics, 'label')}
              </p>
            </div>
            <div className="text-sm text-slate-500 dark:text-slate-400 font-mono space-y-1 text-right">
              {resume.basics.email && (
                <div className="flex items-center justify-end gap-2">
                  <i className="fas fa-envelope opacity-50"></i> {resume.basics.email}
                </div>
              )}
              {resume.basics.phone && (
                <div className="flex items-center justify-end gap-2">
                  <i className="fas fa-phone opacity-50"></i> {resume.basics.phone}
                </div>
              )}
              <div className="flex items-center justify-end gap-2">
                <i className="fas fa-map-marker-alt opacity-50"></i>{' '}
                {getLocalized(resume.basics, 'location')}
              </div>
            </div>
          </div>

          {/* Summary */}
          <section className="mb-12">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
              Profile
            </h3>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-lg">
              {getLocalized(resume.basics, 'summary')}
            </p>
          </section>

          {/* Work Experience */}
          <section className="mb-12">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
              Experience
            </h3>
            <div className="space-y-10 border-l-2 border-slate-100 dark:border-slate-800 ml-1 pl-8 relative">
              {resume.work.map((job, idx) => (
                <div key={idx} className="relative break-inside-avoid page-break-inside-avoid">
                  <span className="absolute -left-[39px] top-1.5 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 bg-amber-500"></span>

                  <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-2">
                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                      {getLocalized(job, 'company')}
                    </h4>
                    <span className="font-mono text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {job.startDate} — {job.endDate || 'Present'}
                    </span>
                  </div>

                  <p className="text-amber-600 dark:text-amber-500 font-bold text-sm mb-4">
                    {getLocalized(job, 'position')}
                  </p>

                  <ul className="list-disc list-outside ml-4 space-y-2 text-slate-600 dark:text-slate-400 leading-relaxed marker:text-slate-300 dark:marker:text-slate-600">
                    {getLocalizedArray(job, 'highlights').map((hl: string, i: number) => (
                      <li key={i}>{hl}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Education */}
          <section className="mb-12">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
              Education
            </h3>
            <div className="grid grid-cols-1 gap-6">
              {resume.education.map((edu, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 break-inside-avoid page-break-inside-avoid"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                      {edu.institution}
                    </h4>
                    <span className="text-xs font-mono text-slate-400">
                      {edu.startDate} — {edu.endDate}
                    </span>
                  </div>
                  <p className="text-amber-600 dark:text-amber-500 font-medium text-sm">
                    {getLocalized(edu, 'studyType')} in {getLocalized(edu, 'area')}
                  </p>
                  {edu.score_en && (
                    <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 italic">
                      {getLocalized(edu, 'score')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Skills */}
          <section className="mb-12">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
              Skills
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {resume.skills.map((skillGroup, idx) => (
                <div key={idx}>
                  <h5 className="font-bold text-slate-700 dark:text-slate-200 mb-3">
                    {getLocalized(skillGroup, 'name')}
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {skillGroup.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium rounded-full border border-slate-200 dark:border-slate-700"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Languages */}
          <section>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6 border-b border-slate-100 dark:border-slate-800 pb-2">
              Languages
            </h3>
            <div className="flex gap-8">
              {resume.languages.map((lang, idx) => (
                <div key={idx}>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {getLocalized(lang, 'language')}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {getLocalized(lang, 'fluency')}
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
