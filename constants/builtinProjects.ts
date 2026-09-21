import type { PortfolioProject } from '../types';

export const NOTE_LEARN_PROJECT: PortfolioProject = {
  _id: 'seed-note-learn',
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
  category: 'web',
  demoUrl: 'https://orion-note-learn.vercel.app/',
  coverImage: '/note-learn-cover.svg',
  order: -1,
  isVisible: true,
  createdAt: '2026-09-20T00:00:00.000Z'
};

export const X_VIDEO_VAULT_PROJECT: PortfolioProject = {
  _id: 'seed-x-video-vault',
  title_zh: 'X Video Vault',
  title_en: 'X Video Vault',
  summary_zh: '把散落在 X Likes 里的视频与 GIF，收进一个真正属于自己的私人收藏库。',
  summary_en: 'A private, searchable home for videos and GIFs saved across your X Likes.',
  description_zh:
    '无需付费 X API。浏览器扩展采集已加载的 Likes，Vault 保存可搜索的元数据、标签、收藏和观看记录，并通过 X 官方嵌入播放。支持移动端上下滑动、PWA 分享、密码登录与扩展令牌；数据由 Cloudflare Workers、D1 与 Drizzle 持久化。',
  description_en:
    'A private full-stack media vault without the paid X API. A browser extension captures loaded Likes, while the app stores searchable metadata, tags, favourites and watch history. It supports mobile swipe navigation, PWA sharing, password authentication and hashed extension tokens, backed by Cloudflare Workers, D1 and Drizzle.',
  techStack: ['Next.js 16', 'React 19', 'Cloudflare Workers', 'D1', 'Drizzle', 'PWA'],
  category: 'fullstack',
  repoUrl: 'https://github.com/yaohuangguan/x-video-vault',
  demoUrl: 'https://x-video-vault-sooty.vercel.app/',
  coverImage: '/x-video-vault-cover.svg',
  order: 98,
  isVisible: true,
  createdAt: '2026-09-20T23:00:20.000Z'
};

export function withBuiltinProjects(projects: PortfolioProject[]) {
  // Persisted projects win over the seed cards once a built-in app is edited and saved.
  return [...projects, X_VIDEO_VAULT_PROJECT, NOTE_LEARN_PROJECT].filter(
    (project, index, all) =>
      index ===
      all.findIndex(
        (candidate) => candidate.demoUrl?.replace(/\/$/, '') === project.demoUrl?.replace(/\/$/, '')
      )
  );
}
