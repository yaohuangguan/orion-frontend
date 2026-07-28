import React from 'react';
import { Language } from '../../types';

export const safeKey = (k: string) => k.replace(/\./g, '_');

// --- Rich Text Renderer Helper ---
export const renderRichText = (text: string | undefined | null): React.ReactNode => {
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

export const getLocalized = (obj: any, field: string, language: Language) => {
  if (!obj) return '';
  return language === 'zh'
    ? obj[`${field}_zh`] || obj[`${field}_en`] || ''
    : obj[`${field}_en`] || obj[`${field}_zh`] || '';
};

export const getLocalizedArray = (obj: any, field: string, language: Language) => {
  if (!obj) return [];
  return language === 'zh'
    ? obj[`${field}_zh`] || obj[`${field}_en`] || []
    : obj[`${field}_en`] || obj[`${field}_zh`] || [];
};

export const getDefaultSectionTitle = (sectionId: string, language: Language) => {
  if (sectionId === 'profile') return language === 'zh' ? '个人简介 / Profile' : 'Professional Summary';
  if (sectionId === 'work') return language === 'zh' ? '工作经历 / Experience' : 'Work Experience';
  if (sectionId === 'projects') return language === 'zh' ? '作品项目 / Projects' : 'Featured Projects';
  if (sectionId === 'education') return language === 'zh' ? '教育经历 / Education' : 'Education';
  if (sectionId === 'volunteer') return language === 'zh' ? '志愿活动 / Volunteer' : 'Volunteer Experience';
  if (sectionId === 'interest') return language === 'zh' ? '兴趣爱好 / Interests' : 'Interests';
  if (sectionId === 'skills') return language === 'zh' ? '专业技能 / Skills' : 'Skills & Languages';
  return sectionId;
};

export const getSortedWork = (work: any[]) => {
  if (!work) return [];
  return [...work].sort((a, b) => {
    const weightA = typeof a.weight === 'number' ? a.weight : 0;
    const weightB = typeof b.weight === 'number' ? b.weight : 0;
    if (weightA !== weightB) {
      return weightB - weightA;
    }
    return (b.startDate || '').localeCompare(a.startDate || '');
  });
};

export const getSortedWorkExperience = (work: any[]) => {
  return getSortedWork(work).filter((job) => !job.isProject);
};

export const getSortedFeaturedProjects = (work: any[]) => {
  return getSortedWork(work).filter((job) => !!job.isProject);
};

export const getCombinedSkills = (skills: any[]) => {
  return skills || [];
};

export const getNormalizedSectionOrder = (order?: string[]) => {
  const canonicalSections = ['profile', 'work', 'projects', 'education', 'volunteer', 'interest', 'skills'];
  if (!order || order.length === 0) return canonicalSections;
  const result = [...order];
  canonicalSections.forEach((sec) => {
    if (!result.includes(sec)) {
      const skillsIdx = result.indexOf('skills');
      if (skillsIdx !== -1) {
        result.splice(skillsIdx, 0, sec);
      } else {
        result.push(sec);
      }
    }
  });
  return result;
};;
