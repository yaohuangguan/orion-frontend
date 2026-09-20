import type { PortfolioProject } from '../types';

export const NOTE_LEARN_PROJECT: PortfolioProject = {
  _id: 'builtin-note-learn',
  title_zh: 'Note Learn · 笔记与手写',
  title_en: 'Note Learn',
  summary_zh: '把想法写下来，把知识留下来。Orion 旗下独立的笔记与学习空间。',
  summary_en:
    'A quiet space for notes, handwriting and learning. An independent app in the Orion collection.',
  description_zh:
    '轻盈的富文本书写、手写画布与笔记管理，让灵感和思考自然流动。作为 Orion 旗下独立应用运行；核心书写体验也已融入 Captain’s Cabin 的 Journal。',
  description_en:
    'Rich text, handwritten sketches and a home for your notes. Note Learn runs as its own app, with its core writing experience also available in the Captain’s Cabin Journal.',
  techStack: ['React', 'TypeScript', 'Tiptap', 'Handwriting'],
  demoUrl: 'https://orion-note-learn.vercel.app/',
  coverImage: '/note-learn-cover.svg',
  order: -1,
  isVisible: true,
  createdAt: '2026-09-20T00:00:00.000Z'
};

export function withBuiltinProjects(projects: PortfolioProject[]) {
  const exists = projects.some(
    (project) =>
      project.demoUrl?.replace(/\/$/, '') === NOTE_LEARN_PROJECT.demoUrl!.replace(/\/$/, '')
  );
  return exists ? projects : [NOTE_LEARN_PROJECT, ...projects];
}
