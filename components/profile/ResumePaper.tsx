import React from 'react';
import { ResumeData, Language } from '../../types';
import { EditableText } from './EditableText';
import {
  getLocalized,
  getLocalizedArray,
  getDefaultSectionTitle,
  getSortedWorkExperience,
  getSortedFeaturedProjects,
  getCombinedSkills,
  renderRichText,
  getNormalizedSectionOrder
} from './utils';

interface ResumePaperProps {
  resume: ResumeData;
  isPrint: boolean;
  isVip: boolean;
  language: Language;
  currentPdfMode: 'single-page' | 'multi-page';
  currentPaperSize: 'a4' | 'a3' | 'a5';
  currentPageLimit: number;
  fontSizeClass: string;
  lineHeightClass: string;
  themeColorClass: string;
  marginClass: string;
  sectionGapClass: string;
  pageHeight: number;
  setActiveInlineEdit: (edit: any) => void;
  setInlineEditAnchor: (anchor: HTMLElement | null) => void;
}

export const ResumePaper = React.forwardRef<HTMLDivElement, ResumePaperProps>(
  (
    {
      resume,
      isPrint,
      isVip,
      language,
      currentPdfMode,
      currentPaperSize,
      currentPageLimit,
      fontSizeClass,
      lineHeightClass,
      themeColorClass,
      marginClass,
      sectionGapClass,
      pageHeight,
      setActiveInlineEdit,
      setInlineEditAnchor
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        id="resume-paper-sheet"
        className={`resume-paper-sheet bg-white rounded-[2rem] shadow-xl border border-slate-200 p-8 md:p-16 max-w-4xl mx-auto print:shadow-none print:border-none print:m-0 print:p-8 print:max-w-none print:rounded-none font-sans text-slate-900 ${
          currentPdfMode === 'multi-page' ? `pdf-mode-multi-page layout-mode-${currentPaperSize}` : ''
        } ${fontSizeClass} ${lineHeightClass} ${themeColorClass} ${marginClass} ${sectionGapClass} relative`}
      >
        {/* Visual Page Boundaries for screen preview */}
        {currentPdfMode === 'multi-page' && !isPrint && (
          <>
            <div
              className="absolute left-0 right-0 border-t border-dashed border-rose-500 opacity-60 pointer-events-none select-none print:hidden flex justify-between items-center z-[99] print-limit-tag"
              style={{ top: `${pageHeight}px` }}
            >
              <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-br font-sans font-bold tracking-wider">
                {currentPaperSize.toUpperCase()} PAGE 1 END
              </span>
              <span className="text-[9px] font-sans text-rose-500 pr-2">
                <i className="fas fa-print mr-1"></i>Print Limit / 打印边界
              </span>
            </div>
            <div
              className="absolute left-0 right-0 border-t border-dashed border-rose-500 opacity-60 pointer-events-none select-none print:hidden flex justify-between items-center z-[99] print-limit-tag"
              style={{ top: `${pageHeight * 2}px` }}
            >
              <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-br font-sans font-bold tracking-wider">
                {currentPaperSize.toUpperCase()} PAGE 2 END
              </span>
              <span className="text-[9px] font-sans text-rose-500 pr-2">
                <i className="fas fa-print mr-1"></i>Print Limit / 打印边界
              </span>
            </div>
            <div
              className="absolute left-0 right-0 border-t border-dashed border-rose-500 opacity-60 pointer-events-none select-none print:hidden flex justify-between items-center z-[99] print-limit-tag"
              style={{ top: `${pageHeight * 3}px` }}
            >
              <span className="bg-rose-500 text-white text-[9px] px-2 py-0.5 rounded-br font-sans font-bold tracking-wider">
                {currentPaperSize.toUpperCase()} PAGE 3 END
              </span>
              <span className="text-[9px] font-sans text-rose-500 pr-2">
                <i className="fas fa-print mr-1"></i>Print Limit / 打印边界
              </span>
            </div>
          </>
        )}

        {/* Page Limit Overlay Mask */}
        {!isPrint && currentPdfMode === 'multi-page' && currentPageLimit > 0 && (
          <div
            className="page-limit-mask pointer-events-none select-none print:hidden"
            style={{
              top: `${currentPageLimit * pageHeight}px`,
              height: `calc(100% - ${currentPageLimit * pageHeight}px)`,
              minHeight: '120px'
            }}
          >
            <div className="bg-rose-600 text-white px-4 py-2 rounded-full font-bold shadow-lg flex items-center gap-2 pointer-events-auto text-xs font-sans tracking-wide">
              <i className="fas fa-ban"></i>
              <span>已超出 {currentPageLimit} 页打印限制范围 / Exceeds {currentPageLimit} Page Print Limit</span>
            </div>
          </div>
        )}

        {/* Header / Basics - Removing the border bottom line */}
        <div className="pb-3 mb-5 text-left">
          <EditableText
            path={`basics.name_${language}`}
            label={language === 'zh' ? '大名 / Name' : 'Full Name'}
            value={getLocalized(resume.basics, 'name', language)}
            as="h1"
            className="text-3xl font-sans font-semibold tracking-tight text-slate-900 mb-2.5 block w-full"
            isVip={isVip}
            isPrint={isPrint}
            resume={resume}
            setActiveInlineEdit={setActiveInlineEdit}
            setInlineEditAnchor={setInlineEditAnchor}
          />

          {getLocalized(resume.basics, 'label', language) && (
            <div className="text-lg text-slate-800 font-medium mb-1.5 font-sans">
              <EditableText
                path={`basics.label_${language}`}
                label={language === 'zh' ? '称谓 / Label' : 'Professional Label'}
                value={getLocalized(resume.basics, 'label', language)}
                as="span"
                isVip={isVip}
                isPrint={isPrint}
                resume={resume}
                setActiveInlineEdit={setActiveInlineEdit}
                setInlineEditAnchor={setInlineEditAnchor}
              />
            </div>
          )}

          <div className="text-sm text-slate-700 font-sans space-y-1.5 w-full">
            {/* Row 2: Location | Phone | Email */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <EditableText
                path={`basics.location_${language}`}
                label={language === 'zh' ? '地点 / Location' : 'Location'}
                value={getLocalized(resume.basics, 'location', language)}
                as="span"
                isVip={isVip}
                isPrint={isPrint}
                resume={resume}
                setActiveInlineEdit={setActiveInlineEdit}
                setInlineEditAnchor={setInlineEditAnchor}
              />
              <span className="text-slate-300 select-none">|</span>
              <EditableText
                path="basics.phone"
                label={language === 'zh' ? '电话 / Phone' : 'Phone Number'}
                value={resume.basics.phone || ''}
                as="span"
                isVip={isVip}
                isPrint={isPrint}
                resume={resume}
                setActiveInlineEdit={setActiveInlineEdit}
                setInlineEditAnchor={setInlineEditAnchor}
              />
              <span className="text-slate-300 select-none">|</span>
              <EditableText
                path="basics.email"
                label={language === 'zh' ? '邮箱 / Email' : 'Email Address'}
                value={resume.basics.email || ''}
                as="span"
                isVip={isVip}
                isPrint={isPrint}
                resume={resume}
                setActiveInlineEdit={setActiveInlineEdit}
                setInlineEditAnchor={setInlineEditAnchor}
              />
            </div>

            {/* Row 3: Portfolio | LinkedIn | Visa */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {resume.basics.website && (
                <>
                  <span className="font-semibold text-slate-800">Portfolio:</span>
                  <a
                    href={resume.basics.website.startsWith('http') ? resume.basics.website : `https://${resume.basics.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    <EditableText
                      path="basics.website"
                      label={language === 'zh' ? '个人网站 / Website' : 'Website URL'}
                      value={resume.basics.website}
                      as="span"
                      isVip={isVip}
                      isPrint={isPrint}
                      resume={resume}
                      setActiveInlineEdit={setActiveInlineEdit}
                      setInlineEditAnchor={setInlineEditAnchor}
                    />
                  </a>
                  <span className="text-slate-300 select-none">|</span>
                </>
              )}
              {resume.basics.linkedin && (
                <>
                  <span className="font-semibold text-slate-800">LinkedIn:</span>
                  <a
                    href={resume.basics.linkedin.startsWith('http') ? resume.basics.linkedin : `https://${resume.basics.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline"
                  >
                    <EditableText
                      path="basics.linkedin"
                      label="LinkedIn"
                      value={resume.basics.linkedin}
                      as="span"
                      isVip={isVip}
                      isPrint={isPrint}
                      resume={resume}
                      setActiveInlineEdit={setActiveInlineEdit}
                      setInlineEditAnchor={setInlineEditAnchor}
                    />
                  </a>
                  <span className="text-slate-300 select-none">|</span>
                </>
              )}
              <span className="font-semibold text-slate-800">Visa:</span>
              <EditableText
                path={`basics.visaStatus_${language}`}
                label={language === 'zh' ? '签证状况 / Visa' : 'Visa Status'}
                value={getLocalized(resume.basics, 'visaStatus', language)}
                as="span"
                isVip={isVip}
                isPrint={isPrint}
                resume={resume}
                setActiveInlineEdit={setActiveInlineEdit}
                setInlineEditAnchor={setInlineEditAnchor}
              />
            </div>
          </div>
        </div>

        {/* Summary, Work, Projects, Education, and Skills Sections (Rendered Dynamically via sectionOrder) */}
        {getNormalizedSectionOrder(resume.sectionOrder).map((sectionId) => {
          if (sectionId === 'profile') {
            const summaryText = getLocalized(resume.basics, 'summary', language);
            if (!summaryText) return null;
            return (
              <section key="profile" className="mb-6 print:mb-4">
                <EditableText
                  path={`sectionTitles.profile_${language}`}
                  label={language === 'zh' ? '版块标题 / Title' : 'Section Title'}
                  value={resume.sectionTitles?.[`profile_${language}`] || getDefaultSectionTitle('profile', language)}
                  as="h2"
                  className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b-2 border-slate-900 pb-2 w-full block text-left"
                  isVip={isVip}
                  isPrint={isPrint}
                  resume={resume}
                  setActiveInlineEdit={setActiveInlineEdit}
                  setInlineEditAnchor={setInlineEditAnchor}
                />
                <div className="text-slate-800 leading-relaxed text-base md:text-lg text-left whitespace-pre-line w-full">
                  <EditableText
                    path={`basics.summary_${language}`}
                    label={language === 'zh' ? '个人简介 / Profile Summary' : 'Profile Summary'}
                    value={getLocalized(resume.basics, 'summary', language)}
                    isTextArea={true}
                    as="div"
                    className="w-full"
                    isVip={isVip}
                    isPrint={isPrint}
                    resume={resume}
                    setActiveInlineEdit={setActiveInlineEdit}
                    setInlineEditAnchor={setInlineEditAnchor}
                  />
                </div>
              </section>
            );
          }
          if (sectionId === 'work') {
            const workExperience = getSortedWorkExperience(resume.work);
            if (workExperience.length === 0) return null;
            return (
              <section key="work" className="mb-6 print:mb-4">
                <EditableText
                  path={`sectionTitles.work_${language}`}
                  label={language === 'zh' ? '版块标题 / Title' : 'Section Title'}
                  value={resume.sectionTitles?.[`work_${language}`] || getDefaultSectionTitle('work', language)}
                  as="h2"
                  className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3.5 border-b-2 border-slate-900 pb-2 w-full block text-left"
                  isVip={isVip}
                  isPrint={isPrint}
                  resume={resume}
                  setActiveInlineEdit={setActiveInlineEdit}
                  setInlineEditAnchor={setInlineEditAnchor}
                />
                <div className="space-y-5 print:space-y-3.5">
                  {getSortedWorkExperience(resume.work).map((job, idx) => {
                    const jobOriginalIndex = resume.work.findIndex(
                      (item) => (item.company_zh && item.company_zh === job.company_zh) || (item.company_en && item.company_en === job.company_en)
                    );

                    return (
                      <React.Fragment key={idx}>
                        {currentPdfMode === 'multi-page' && job.pageBreakBefore && (
                          <div className="page-break relative my-4 border-t-2 border-dashed border-rose-400 opacity-60 print:hidden print:my-0 print:border-none flex justify-center items-center">
                            <span className="absolute bg-white px-2 py-0.5 text-[9px] font-sans text-rose-500 font-bold border border-rose-300 rounded-full select-none pointer-events-none">
                              <i className="fas fa-scissors mr-1"></i>Page Break / 分页
                            </span>
                          </div>
                        )}
                        <div className="break-inside-avoid page-break-inside-avoid">
                          <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-1">
                            <h3 className="text-xl font-bold text-black flex items-center gap-2">
                              <EditableText
                                path={`work.${jobOriginalIndex}.position_${language}`}
                                label={language === 'zh' ? '职位名称 / Position' : 'Job Position'}
                                value={getLocalized(job, 'position', language)}
                                as="span"
                                isVip={isVip}
                                isPrint={isPrint}
                                resume={resume}
                                setActiveInlineEdit={setActiveInlineEdit}
                                setInlineEditAnchor={setInlineEditAnchor}
                              />
                            </h3>
                            <div className="flex items-center gap-2">
                              {typeof job.weight === 'number' && job.weight > 0 && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                                  Weight: {job.weight}
                                </span>
                              )}
                              <span className="font-sans text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded font-medium">
                                <EditableText
                                  path={`work.${jobOriginalIndex}.startDate`}
                                  label={language === 'zh' ? '开始日期 / Start Date' : 'Start Date'}
                                  value={job.startDate || ''}
                                  as="span"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                /> — <EditableText
                                  path={`work.${jobOriginalIndex}.endDate`}
                                  label={language === 'zh' ? '结束日期 / End Date' : 'End Date'}
                                  value={job.endDate || ''}
                                  as="span"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                />
                              </span>
                            </div>
                          </div>

                          {getLocalized(job, 'company', language) && (
                            <p className="text-slate-800 font-bold text-base mb-3 italic">
                              <EditableText
                                path={`work.${jobOriginalIndex}.company_${language}`}
                                label={language === 'zh' ? '公司名称 / Company' : 'Company Name'}
                                value={getLocalized(job, 'company', language)}
                                as="span"
                                isVip={isVip}
                                isPrint={isPrint}
                                resume={resume}
                                setActiveInlineEdit={setActiveInlineEdit}
                                setInlineEditAnchor={setInlineEditAnchor}
                              />
                            </p>
                          )}

                          {/* Location Display */}
                          {(job.location_zh || job.location_en) && (
                            <p className="text-sm text-slate-600 mb-2 font-sans flex items-center gap-2">
                              <i aria-hidden="true" className="fas fa-map-marker-alt opacity-70"></i>
                              <EditableText
                                path={`work.${jobOriginalIndex}.location_${language}`}
                                label={language === 'zh' ? '工作地点 / Job Location' : 'Job Location'}
                                value={getLocalized(job, 'location', language)}
                                as="span"
                                isVip={isVip}
                                isPrint={isPrint}
                                resume={resume}
                                setActiveInlineEdit={setActiveInlineEdit}
                                setInlineEditAnchor={setInlineEditAnchor}
                              />
                            </p>
                          )}

                          <ul className="space-y-1.5 text-slate-800 leading-relaxed text-base text-left">
                            {getLocalizedArray(job, 'highlights', language).map((hl: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-slate-400 select-none pt-1 shrink-0 font-bold">•</span>
                                <EditableText
                                  path={`work.${jobOriginalIndex}.highlights_${language}.${i}`}
                                  label={`${language === 'zh' ? '工作亮点' : 'Highlight'} #${i + 1}`}
                                  value={hl}
                                  isTextArea={true}
                                  as="span"
                                  className="flex-1"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </section>
            );
          }
          if (sectionId === 'projects') {
            const featuredProjects = getSortedFeaturedProjects(resume.work);
            if (featuredProjects.length === 0) return null;
            return (
              <section key="projects" className="mb-6 print:mb-4">
                <EditableText
                  path={`sectionTitles.projects_${language}`}
                  label={language === 'zh' ? '版块标题 / Title' : 'Section Title'}
                  value={resume.sectionTitles?.[`projects_${language}`] || getDefaultSectionTitle('projects', language)}
                  as="h2"
                  className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3.5 border-b-2 border-slate-900 pb-2 w-full block text-left"
                  isVip={isVip}
                  isPrint={isPrint}
                  resume={resume}
                  setActiveInlineEdit={setActiveInlineEdit}
                  setInlineEditAnchor={setInlineEditAnchor}
                />
                <div className="space-y-5 print:space-y-3.5">
                  {getSortedFeaturedProjects(resume.work).map((job, idx) => {
                    const jobOriginalIndex = resume.work.findIndex(
                      (item) => (item.company_zh && item.company_zh === job.company_zh) || (item.company_en && item.company_en === job.company_en)
                    );

                    return (
                      <React.Fragment key={idx}>
                        {currentPdfMode === 'multi-page' && job.pageBreakBefore && (
                          <div className="page-break relative my-4 border-t-2 border-dashed border-rose-400 opacity-60 print:hidden print:my-0 print:border-none flex justify-center items-center">
                            <span className="absolute bg-white px-2 py-0.5 text-[9px] font-sans text-rose-500 font-bold border border-rose-300 rounded-full select-none pointer-events-none">
                              <i className="fas fa-scissors mr-1"></i>Page Break / 分页
                            </span>
                          </div>
                        )}
                        <div className="break-inside-avoid page-break-inside-avoid">
                          <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-1">
                            <h3 className="text-xl font-bold text-black flex items-center gap-2">
                              <EditableText
                                path={`work.${jobOriginalIndex}.company_${language}`}
                                label={language === 'zh' ? '项目名称 / Project' : 'Project Name'}
                                value={getLocalized(job, 'company', language)}
                                as="span"
                                isVip={isVip}
                                isPrint={isPrint}
                                resume={resume}
                                setActiveInlineEdit={setActiveInlineEdit}
                                setInlineEditAnchor={setInlineEditAnchor}
                              />
                            </h3>
                            <div className="flex items-center gap-2">
                              {typeof job.weight === 'number' && job.weight > 0 && (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 font-bold">
                                  Weight: {job.weight}
                                </span>
                              )}
                              <span className="font-sans text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded font-medium">
                                <EditableText
                                  path={`work.${jobOriginalIndex}.startDate`}
                                  label={language === 'zh' ? '开始日期 / Start Date' : 'Start Date'}
                                  value={job.startDate || ''}
                                  as="span"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                /> — <EditableText
                                  path={`work.${jobOriginalIndex}.endDate`}
                                  label={language === 'zh' ? '结束日期 / End Date' : 'End Date'}
                                  value={job.endDate || ''}
                                  as="span"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                />
                              </span>
                            </div>
                          </div>

                          {getLocalized(job, 'position', language) && (
                            <p className="text-slate-800 font-bold text-base mb-3 italic">
                              <EditableText
                                path={`work.${jobOriginalIndex}.position_${language}`}
                                label={language === 'zh' ? '角色 / Role' : 'Role / Subtitle'}
                                value={getLocalized(job, 'position', language)}
                                as="span"
                                isVip={isVip}
                                isPrint={isPrint}
                                resume={resume}
                                setActiveInlineEdit={setActiveInlineEdit}
                                setInlineEditAnchor={setInlineEditAnchor}
                              />
                            </p>
                          )}

                          {/* Location Display */}
                          {(job.location_zh || job.location_en) && (
                            <p className="text-sm text-slate-600 mb-2 font-sans flex items-center gap-2">
                              <i aria-hidden="true" className="fas fa-map-marker-alt opacity-70"></i>
                              <EditableText
                                path={`work.${jobOriginalIndex}.location_${language}`}
                                label={language === 'zh' ? '项目链接或地点 / Link or Location' : 'Link or Location'}
                                value={getLocalized(job, 'location', language)}
                                as="span"
                                isVip={isVip}
                                isPrint={isPrint}
                                resume={resume}
                                setActiveInlineEdit={setActiveInlineEdit}
                                setInlineEditAnchor={setInlineEditAnchor}
                              />
                            </p>
                          )}

                          <ul className="space-y-1.5 text-slate-800 leading-relaxed text-base text-left">
                            {getLocalizedArray(job, 'highlights', language).map((hl: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-slate-400 select-none pt-1 shrink-0 font-bold">•</span>
                                <EditableText
                                  path={`work.${jobOriginalIndex}.highlights_${language}.${i}`}
                                  label={`${language === 'zh' ? '项目描述亮点' : 'Project Highlight'} #${i + 1}`}
                                  value={hl}
                                  isTextArea={true}
                                  as="span"
                                  className="flex-1"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </section>
            );
          }
          if (sectionId === 'education') {
            if (!resume.education || resume.education.length === 0) return null;
            return (
              <section key="education" className="mb-6 print:mb-4">
                <EditableText
                  path={`sectionTitles.education_${language}`}
                  label={language === 'zh' ? '版块标题 / Title' : 'Section Title'}
                  value={resume.sectionTitles?.[`education_${language}`] || getDefaultSectionTitle('education', language)}
                  as="h2"
                  className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b-2 border-slate-900 pb-2 w-full block text-left"
                  isVip={isVip}
                  isPrint={isPrint}
                  resume={resume}
                  setActiveInlineEdit={setActiveInlineEdit}
                  setInlineEditAnchor={setInlineEditAnchor}
                />
                <div className="space-y-4 print:space-y-2.5">
                  {resume.education.map((edu, idx) => (
                    <React.Fragment key={idx}>
                      {currentPdfMode === 'multi-page' && edu.pageBreakBefore && (
                        <div className="page-break relative my-4 border-t-2 border-dashed border-rose-400 opacity-60 print:hidden print:my-0 print:border-none flex justify-center items-center">
                          <span className="absolute bg-white px-2 py-0.5 text-[9px] font-sans text-rose-500 font-bold border border-rose-300 rounded-full select-none pointer-events-none">
                            <i className="fas fa-scissors mr-1"></i>Page Break / 分页
                          </span>
                        </div>
                      )}
                      <div className="break-inside-avoid page-break-inside-avoid">
                        <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-1">
                          <h3 className="text-xl font-bold text-black flex items-center gap-2">
                            <EditableText
                              path={`education.${idx}.studyType_${language}`}
                              label={language === 'zh' ? '专业与学位 / Major & Degree' : 'Major & Degree'}
                              value={getLocalized(edu, 'studyType', language)}
                              as="span"
                              isVip={isVip}
                              isPrint={isPrint}
                              resume={resume}
                              setActiveInlineEdit={setActiveInlineEdit}
                              setInlineEditAnchor={setInlineEditAnchor}
                            />
                          </h3>
                          <span className="text-sm font-sans text-slate-700 font-medium">
                            <EditableText
                              path={`education.${idx}.startDate`}
                              label={language === 'zh' ? '入学日期 / Start Date' : 'Start Date'}
                              value={edu.startDate || ''}
                              as="span"
                              isVip={isVip}
                              isPrint={isPrint}
                              resume={resume}
                              setActiveInlineEdit={setActiveInlineEdit}
                              setInlineEditAnchor={setInlineEditAnchor}
                            /> — <EditableText
                              path={`education.${idx}.endDate`}
                              label={language === 'zh' ? '毕业日期 / End Date' : 'End Date'}
                              value={edu.endDate || ''}
                              as="span"
                              isVip={isVip}
                              isPrint={isPrint}
                              resume={resume}
                              setActiveInlineEdit={setActiveInlineEdit}
                              setInlineEditAnchor={setInlineEditAnchor}
                            />
                          </span>
                        </div>
                        <p className="text-slate-800 text-base mb-1 font-sans flex flex-wrap items-center gap-x-2 text-left">
                          <span className="font-semibold">
                            <EditableText
                              path={`education.${idx}.institution`}
                              label={language === 'zh' ? '学校 / Institution' : 'Institution Name'}
                              value={edu.institution || ''}
                              as="span"
                              isVip={isVip}
                              isPrint={isPrint}
                              resume={resume}
                              setActiveInlineEdit={setActiveInlineEdit}
                              setInlineEditAnchor={setInlineEditAnchor}
                            />
                          </span>
                          {edu.location && (
                            <>
                              <span className="text-slate-300 select-none">|</span>
                              <span className="text-sm text-slate-600 flex items-center gap-1">
                                <i aria-hidden="true" className="fas fa-map-marker-alt opacity-70"></i>
                                <EditableText
                                  path={`education.${idx}.location`}
                                  label={language === 'zh' ? '学校地点 / Location' : 'School Location'}
                                  value={edu.location}
                                  as="span"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                />
                              </span>
                            </>
                          )}
                          {getLocalized(edu, 'score', language) && (
                            <>
                              <span className="text-slate-300 select-none">|</span>
                              <span className="text-slate-600 italic">
                                <EditableText
                                  path={`education.${idx}.score_${language}`}
                                  label={language === 'zh' ? '成绩表现 / GPA & Honors' : 'GPA & Honors'}
                                  value={getLocalized(edu, 'score', language)}
                                  as="span"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                />
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </section>
            );
          }
          if (sectionId === 'volunteer') {
            const volunteerList = resume.volunteer || [];
            if (volunteerList.length === 0) return null;
            return (
              <section key="volunteer" className="mb-6 print:mb-4">
                <EditableText
                  path={`sectionTitles.volunteer_${language}`}
                  label={language === 'zh' ? '版块标题 / Title' : 'Section Title'}
                  value={resume.sectionTitles?.[`volunteer_${language}`] || getDefaultSectionTitle('volunteer', language)}
                  as="h2"
                  className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3.5 border-b-2 border-slate-900 pb-2 w-full block text-left"
                  isVip={isVip}
                  isPrint={isPrint}
                  resume={resume}
                  setActiveInlineEdit={setActiveInlineEdit}
                  setInlineEditAnchor={setInlineEditAnchor}
                />
                <div className="space-y-5 print:space-y-3.5">
                  {volunteerList.map((vol, idx) => {
                    return (
                      <React.Fragment key={idx}>
                        {currentPdfMode === 'multi-page' && vol.pageBreakBefore && (
                          <div className="page-break relative my-4 border-t-2 border-dashed border-rose-400 opacity-60 print:hidden print:my-0 print:border-none flex justify-center items-center">
                            <span className="absolute bg-white px-2 py-0.5 text-[9px] font-sans text-rose-500 font-bold border border-rose-300 rounded-full select-none pointer-events-none">
                              <i className="fas fa-scissors mr-1"></i>Page Break / 分页
                            </span>
                          </div>
                        )}
                        <div className="break-inside-avoid page-break-inside-avoid">
                          <div className="flex flex-col md:flex-row md:items-baseline justify-between mb-1">
                            {getLocalized(vol, 'position', language) ? (
                              <h3 className="text-xl font-bold text-black flex items-center gap-2">
                                <EditableText
                                  path={`volunteer.${idx}.position_${language}`}
                                  label={language === 'zh' ? '职位名称 / Position' : 'Position'}
                                  value={getLocalized(vol, 'position', language)}
                                  as="span"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                />
                              </h3>
                            ) : <div />}
                            {(vol.startDate || vol.endDate) && (
                              <div className="flex items-center gap-2">
                                <span className="font-sans text-sm text-slate-700 bg-slate-100 px-2 py-1 rounded font-medium">
                                  {vol.startDate && (
                                    <EditableText
                                      path={`volunteer.${idx}.startDate`}
                                      label={language === 'zh' ? '开始日期 / Start Date' : 'Start Date'}
                                      value={vol.startDate || ''}
                                      as="span"
                                      isVip={isVip}
                                      isPrint={isPrint}
                                      resume={resume}
                                      setActiveInlineEdit={setActiveInlineEdit}
                                      setInlineEditAnchor={setInlineEditAnchor}
                                    />
                                  )}
                                  {vol.startDate && vol.endDate && ' — '}
                                  {vol.endDate && (
                                    <EditableText
                                      path={`volunteer.${idx}.endDate`}
                                      label={language === 'zh' ? '结束日期 / End Date' : 'End Date'}
                                      value={vol.endDate || ''}
                                      as="span"
                                      isVip={isVip}
                                      isPrint={isPrint}
                                      resume={resume}
                                      setActiveInlineEdit={setActiveInlineEdit}
                                      setInlineEditAnchor={setInlineEditAnchor}
                                    />
                                  )}
                                </span>
                              </div>
                            )}
                          </div>

                          {getLocalized(vol, 'organization', language) && (
                            <p className="text-slate-800 font-bold text-base mb-3 italic">
                              <EditableText
                                path={`volunteer.${idx}.organization_${language}`}
                                label={language === 'zh' ? '组织机构 / Organization' : 'Organization'}
                                value={getLocalized(vol, 'organization', language)}
                                as="span"
                                isVip={isVip}
                                isPrint={isPrint}
                                resume={resume}
                                setActiveInlineEdit={setActiveInlineEdit}
                                setInlineEditAnchor={setInlineEditAnchor}
                              />
                            </p>
                          )}

                          <ul className="space-y-1.5 text-slate-800 leading-relaxed text-base text-left">
                            {getLocalizedArray(vol, 'highlights', language).map((hl: string, i: number) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-slate-400 select-none pt-1 shrink-0 font-bold">•</span>
                                <EditableText
                                  path={`volunteer.${idx}.highlights_${language}.${i}`}
                                  label={`${language === 'zh' ? '志愿活动亮点' : 'Highlight'} #${i + 1}`}
                                  value={hl}
                                  isTextArea={true}
                                  as="span"
                                  className="flex-1"
                                  isVip={isVip}
                                  isPrint={isPrint}
                                  resume={resume}
                                  setActiveInlineEdit={setActiveInlineEdit}
                                  setInlineEditAnchor={setInlineEditAnchor}
                                />
                              </li>
                            ))}
                          </ul>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </section>
            );
          }
          if (sectionId === 'interest') {
            const interestList = resume.interest || [];
            if (interestList.length === 0) return null;
            return (
              <section key="interest" className="mb-6 print:mb-4">
                <EditableText
                  path={`sectionTitles.interest_${language}`}
                  label={language === 'zh' ? '版块标题 / Title' : 'Section Title'}
                  value={resume.sectionTitles?.[`interest_${language}`] || getDefaultSectionTitle('interest', language)}
                  as="h2"
                  className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b-2 border-slate-900 pb-2 w-full block text-left"
                  isVip={isVip}
                  isPrint={isPrint}
                  resume={resume}
                  setActiveInlineEdit={setActiveInlineEdit}
                  setInlineEditAnchor={setInlineEditAnchor}
                />
                <div className="space-y-3.5 font-sans text-left">
                  {interestList.map((interestGroup, idx) => (
                    <React.Fragment key={idx}>
                      {currentPdfMode === 'multi-page' && interestGroup.pageBreakBefore && (
                        <div className="page-break relative my-4 border-t-2 border-dashed border-rose-400 opacity-60 print:hidden print:my-0 print:border-none flex justify-center items-center">
                          <span className="absolute bg-white px-2 py-0.5 text-[9px] font-sans text-rose-500 font-bold border border-rose-300 rounded-full select-none pointer-events-none">
                            <i className="fas fa-scissors mr-1"></i>Page Break / 分页
                          </span>
                        </div>
                      )}
                      <div className="break-inside-avoid page-break-inside-avoid flex flex-col md:flex-row md:items-baseline gap-x-2 mb-2 leading-relaxed">
                        <h3 className="text-base font-bold text-slate-900 min-w-[80px] max-w-[200px] shrink-0 text-left">
                          <EditableText
                            path={`interest.${idx}.name_${language}`}
                            label={language === 'zh' ? '兴趣分类 / Category' : 'Interest Category'}
                            value={getLocalized(interestGroup, 'name', language)}
                            as="span"
                            isVip={isVip}
                            isPrint={isPrint}
                            resume={resume}
                            setActiveInlineEdit={setActiveInlineEdit}
                            setInlineEditAnchor={setInlineEditAnchor}
                          />
                        </h3>
                        <div className="text-slate-800 text-sm md:text-base flex-1 text-left">
                          <EditableText
                            path={`interest.${idx}.keywords`}
                            label={language === 'zh' ? '兴趣细节' : 'Keywords'}
                            value={interestGroup.keywords?.join('\n') || ''}
                            isTextArea={true}
                            as="span"
                            isVip={isVip}
                            isPrint={isPrint}
                            resume={resume}
                            setActiveInlineEdit={setActiveInlineEdit}
                            setInlineEditAnchor={setInlineEditAnchor}
                          >
                            {interestGroup.keywords?.map((kw, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <span className="mr-1.5 font-bold text-slate-400">, </span>}
                                {renderRichText(kw)}
                              </React.Fragment>
                            ))}
                          </EditableText>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </section>
            );
          }
          if (sectionId === 'skills') {
            const skillsList = getCombinedSkills(resume.skills);
            if (skillsList.length === 0) return null;
            return (
              <section key="skills" className="mb-6 print:mb-4">
                <EditableText
                  path={`sectionTitles.skills_${language}`}
                  label={language === 'zh' ? '版块标题 / Title' : 'Section Title'}
                  value={resume.sectionTitles?.[`skills_${language}`] || getDefaultSectionTitle('skills', language)}
                  as="h2"
                  className="text-sm font-bold uppercase tracking-widest text-slate-900 mb-3 border-b-2 border-slate-900 pb-2 w-full block text-left"
                  isVip={isVip}
                  isPrint={isPrint}
                  resume={resume}
                  setActiveInlineEdit={setActiveInlineEdit}
                  setInlineEditAnchor={setInlineEditAnchor}
                />
                <div className="space-y-3.5 font-sans text-left">
                  {skillsList.map((skillGroup, idx) => (
                    <React.Fragment key={idx}>
                      {currentPdfMode === 'multi-page' && skillGroup.pageBreakBefore && (
                        <div className="page-break relative my-4 border-t-2 border-dashed border-rose-400 opacity-60 print:hidden print:my-0 print:border-none flex justify-center items-center">
                          <span className="absolute bg-white px-2 py-0.5 text-[9px] font-sans text-rose-500 font-bold border border-rose-300 rounded-full select-none pointer-events-none">
                            <i className="fas fa-scissors mr-1"></i>Page Break / 分页
                          </span>
                        </div>
                      )}
                      <div className="break-inside-avoid page-break-inside-avoid flex flex-col md:flex-row md:items-baseline gap-x-2 mb-2 leading-relaxed">
                        <h3 className="text-base font-bold text-slate-900 min-w-[80px] max-w-[200px] shrink-0 text-left">
                          <EditableText
                            path={`skills.${idx}.name_${language}`}
                            label={language === 'zh' ? '技能品类 / Category' : 'Skill Category'}
                            value={getLocalized(skillGroup, 'name', language)}
                            as="span"
                            isVip={isVip}
                            isPrint={isPrint}
                            resume={resume}
                            setActiveInlineEdit={setActiveInlineEdit}
                            setInlineEditAnchor={setInlineEditAnchor}
                          />
                        </h3>
                        <div className="text-slate-800 text-sm md:text-base flex-1 text-left">
                          <EditableText
                            path={`skills.${idx}.keywords`}
                            label={language === 'zh' ? '技能细节' : 'Keywords'}
                            value={skillGroup.keywords?.join('\n') || ''}
                            isTextArea={true}
                            as="span"
                            isVip={isVip}
                            isPrint={isPrint}
                            resume={resume}
                            setActiveInlineEdit={setActiveInlineEdit}
                            setInlineEditAnchor={setInlineEditAnchor}
                          >
                            {skillGroup.keywords?.map((kw, i) => (
                              <React.Fragment key={i}>
                                {i > 0 && <span className="mr-1.5 font-bold text-slate-400">, </span>}
                                {renderRichText(kw)}
                              </React.Fragment>
                            ))}
                          </EditableText>
                        </div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </section>
            );
          }
          return null;
        })}
      </div>
    );
  }
);

ResumePaper.displayName = 'ResumePaper';
