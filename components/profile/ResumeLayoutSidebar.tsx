import React from 'react';
import { ResumeData, Language } from '../../types';
import { apiService } from '../../services/api';
import { getNormalizedSectionOrder } from './utils';

interface ResumeLayoutSidebarProps {
  resume: ResumeData | null;
  isVip: boolean;
  language: Language;
  pdfMode: 'single-page' | 'multi-page';
  setPdfMode: (mode: 'single-page' | 'multi-page') => void;
  paperSize: 'a4' | 'a3' | 'a5';
  setPaperSize: (size: 'a4' | 'a3' | 'a5') => void;
  currentSlug: string;
  setResume: React.Dispatch<React.SetStateAction<ResumeData | null>>;
}

export const ResumeLayoutSidebar: React.FC<ResumeLayoutSidebarProps> = ({
  resume,
  isVip,
  language,
  pdfMode,
  setPdfMode,
  paperSize,
  setPaperSize,
  currentSlug,
  setResume
}) => {
  if (!resume || !isVip) return null;

  return (
    <div className="w-full lg:w-80 shrink-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 print:hidden">
      <div>
        <h3 className="text-base font-extrabold flex items-center gap-2 mb-1 text-slate-800 dark:text-slate-200">
          <i className="fas fa-magic text-amber-500"></i>
          <span>{language === 'zh' ? '所见即所得排版 / Layout' : 'Resume Page Settings'}</span>
        </h3>
        <p className="text-xs text-slate-500">
          {language === 'zh' ? '调整版面与样式参数，实时渲染预览' : 'Adjust global page layout and styles.'}
        </p>
      </div>

      {/* PDF Print Mode & Paper Size */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            {language === 'zh' ? '导出模式 Mode' : 'Print Mode'}
          </label>
          <select
            value={pdfMode}
            onChange={async (e) => {
              const val = e.target.value as any;
              setPdfMode(val);
              const updated = {
                ...resume,
                styleSettings: {
                  ...(resume.styleSettings || {}),
                  pdfMode: val
                }
              };
              setResume(updated);
              await apiService.updateResume(updated, currentSlug);
            }}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-850 dark:text-slate-150 font-medium"
          >
            <option value="single-page">{language === 'zh' ? '连续长页 (Continuous Web)' : 'Continuous Web'}</option>
            <option value="multi-page">{language === 'zh' ? '分页打印 (Paginated Print)' : 'Paginated Print'}</option>
          </select>
        </div>

        {pdfMode === 'multi-page' && (
          <>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                {language === 'zh' ? '纸张尺寸 Size' : 'Paper Size'}
              </label>
              <select
                value={paperSize}
                onChange={async (e) => {
                  const val = e.target.value as any;
                  setPaperSize(val);
                  const updated = {
                    ...resume,
                    styleSettings: {
                      ...(resume.styleSettings || {}),
                      paperSize: val
                    }
                  };
                  setResume(updated);
                  await apiService.updateResume(updated, currentSlug);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-855 dark:text-slate-145 font-medium"
              >
                <option value="a4">A4 (210mm x 297mm)</option>
                <option value="a3">A3 (297mm x 420mm)</option>
                <option value="a5">A5 (148mm x 210mm)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
                {language === 'zh' ? '页数限制 Limits' : 'Page Limits'}
              </label>
              <select
                value={resume.pageLimit || 0}
                onChange={async (e) => {
                  const limit = parseInt(e.target.value, 10);
                  const updated = { ...resume, pageLimit: limit };
                  setResume(updated);
                  await apiService.updateResume(updated, currentSlug);
                }}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-855 dark:text-slate-145 font-medium"
              >
                <option value={0}>{language === 'zh' ? '不限页数' : 'Unlimited'}</option>
                <option value={1}>{language === 'zh' ? '强制 1 页' : 'Limit 1 Page'}</option>
                <option value={2}>{language === 'zh' ? '强制 2 页' : 'Limit 2 Pages'}</option>
                <option value={3}>{language === 'zh' ? '强制 3 页' : 'Limit 3 Pages'}</option>
              </select>
            </div>
          </>
        )}

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            {language === 'zh' ? '页边距 Margins' : 'Page Margins'}
          </label>
          <select
            value={resume.styleSettings?.margin || 'normal'}
            onChange={async (e) => {
              const m = e.target.value as any;
              const updated = {
                ...resume,
                styleSettings: {
                  ...(resume.styleSettings || {}),
                  margin: m
                }
              };
              setResume(updated);
              await apiService.updateResume(updated, currentSlug);
            }}
            className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-855 dark:text-slate-145 font-medium"
          >
            <option value="small">{language === 'zh' ? '窄边距 (8mm)' : 'Narrow (8mm)'}</option>
            <option value="normal">{language === 'zh' ? '默认边距 (12mm)' : 'Normal (12mm)'}</option>
            <option value="large">{language === 'zh' ? '宽边距 (18mm)' : 'Wide (18mm)'}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            {language === 'zh' ? '板块间距 Spacing' : 'Section Spacing'}
          </label>
          <select
            value={resume.styleSettings?.sectionGap || 'normal'}
            onChange={async (e) => {
              const sg = e.target.value as any;
              const updated = {
                ...resume,
                styleSettings: {
                  ...(resume.styleSettings || {}),
                  sectionGap: sg
                }
              };
              setResume(updated);
              await apiService.updateResume(updated, currentSlug);
            }}
            className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-855 dark:text-slate-145 font-medium"
          >
            <option value="compact">{language === 'zh' ? '紧凑 (Compact)' : 'Compact'}</option>
            <option value="normal">{language === 'zh' ? '默认 (Normal)' : 'Normal'}</option>
            <option value="relaxed">{language === 'zh' ? '宽松 (Relaxed)' : 'Relaxed'}</option>
          </select>
        </div>
      </div>

      {/* Typography & Color */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            {language === 'zh' ? '默认字号 Size' : 'Font Size'}
          </label>
          <select
            value={resume.styleSettings?.fontSize || 'normal'}
            onChange={async (e) => {
              const fs = e.target.value as any;
              const updated = {
                ...resume,
                styleSettings: {
                  ...(resume.styleSettings || {}),
                  fontSize: fs
                }
              };
              setResume(updated);
              await apiService.updateResume(updated, currentSlug);
            }}
            className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-855 dark:text-slate-145 font-medium"
          >
            <option value="small">{language === 'zh' ? '较小 (Small)' : 'Small'}</option>
            <option value="normal">{language === 'zh' ? '默认 (Normal)' : 'Normal'}</option>
            <option value="large">{language === 'zh' ? '较大 (Large)' : 'Large'}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            {language === 'zh' ? '默认行高 Spacing' : 'Line Spacing'}
          </label>
          <select
            value={resume.styleSettings?.lineHeight || 'normal'}
            onChange={async (e) => {
              const lh = e.target.value as any;
              const updated = {
                ...resume,
                styleSettings: {
                  ...(resume.styleSettings || {}),
                  lineHeight: lh
                }
              };
              setResume(updated);
              await apiService.updateResume(updated, currentSlug);
            }}
            className="w-full bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-855 dark:text-slate-145 font-medium"
          >
            <option value="compact">{language === 'zh' ? '紧凑 (Compact)' : 'Compact'}</option>
            <option value="normal">{language === 'zh' ? '默认 (Normal)' : 'Normal'}</option>
            <option value="relaxed">{language === 'zh' ? '宽松 (Relaxed)' : 'Relaxed'}</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-500 mb-1.5">
            {language === 'zh' ? '主题强调色 Accent' : 'Theme Color'}
          </label>
          <select
            value={resume.styleSettings?.themeColor || 'slate'}
            onChange={async (e) => {
              const col = e.target.value as any;
              const updated = {
                ...resume,
                styleSettings: {
                  ...(resume.styleSettings || {}),
                  themeColor: col
                }
              };
              setResume(updated);
              await apiService.updateResume(updated, currentSlug);
            }}
            className="w-full bg-slate-50 dark:bg-slate-855 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-855 dark:text-slate-145 font-medium"
          >
            <option value="slate">{language === 'zh' ? '极简黑 (Slate)' : 'Slate / Black'}</option>
            <option value="amber">{language === 'zh' ? '琥珀黄 (Amber)' : 'Amber'}</option>
            <option value="emerald">{language === 'zh' ? '翡翠绿 (Emerald)' : 'Emerald'}</option>
            <option value="sky">{language === 'zh' ? '天空蓝 (Sky)' : 'Sky'}</option>
            <option value="crimson">{language === 'zh' ? '玫瑰红 (Crimson)' : 'Crimson'}</option>
          </select>
        </div>
      </div>

      {/* Section Ordering */}
      <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <label className="block text-xs font-bold uppercase text-slate-500 font-extrabold">
          {language === 'zh' ? '版块显示顺序' : 'Section Order'}
        </label>
        <div className="space-y-1.5">
          {getNormalizedSectionOrder(resume.sectionOrder).map((sectionId, idx, arr) => {
            const getSectionName = (sid: string) => {
              if (sid === 'profile') return language === 'zh' ? '个人简介 (Profile)' : 'Profile';
              if (sid === 'work') return language === 'zh' ? '工作经历 (Work)' : 'Work';
              if (sid === 'projects') return language === 'zh' ? '作品项目 (Projects)' : 'Projects';
              if (sid === 'education') return language === 'zh' ? '教育经历 (Education)' : 'Education';
              if (sid === 'volunteer') return language === 'zh' ? '志愿活动 (Volunteer)' : 'Volunteer';
              if (sid === 'interest') return language === 'zh' ? '兴趣爱好 (Interests)' : 'Interests';
              if (sid === 'skills') return language === 'zh' ? '专业技能 (Skills)' : 'Skills';
              return sid;
            };

            const handleMove = async (dir: 'up' | 'down') => {
              const order = [...getNormalizedSectionOrder(resume.sectionOrder)];
              const targetIdx = dir === 'up' ? idx - 1 : idx + 1;
              const temp = order[idx];
              order[idx] = order[targetIdx];
              order[targetIdx] = temp;

              const updated = { ...resume, sectionOrder: order };
              setResume(updated);
              await apiService.updateResume(updated, currentSlug);
            };

            return (
              <div
                key={sectionId}
                className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-xs"
              >
                <span className="font-semibold text-slate-700 dark:text-slate-300">{getSectionName(sectionId)}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMove('up')}
                    className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300 disabled:opacity-30 rounded transition-colors"
                  >
                    <i className="fas fa-arrow-up text-[8px]"></i>
                  </button>
                  <button
                    type="button"
                    disabled={idx === arr.length - 1}
                    onClick={() => handleMove('down')}
                    className="p-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-300 disabled:opacity-30 rounded transition-colors"
                  >
                    <i className="fas fa-arrow-down text-[8px]"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
