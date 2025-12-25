// scripts/generate-sitemap.js
import { writeFileSync } from 'fs';
import process from 'process';

const API_URL =
  'https://bananaboom-api-242273127238.asia-east1.run.app/api/posts?page=1&limit=1000';
const FRONTEND_URL = 'https://www.ps5.space';

// 1. 复用你前端的 Slug 生成逻辑
const generateSlug = (post) => {
  const cleanTitle =
    post.name
      // 将所有非字母和数字的字符替换为连字符
      .replace(/[^\p{L}\p{N}]+/gu, '-')
      // 去除头尾的连字符
      .replace(/^-+|-+$/g, '')
      .toLowerCase() || 'post';

  return `${cleanTitle}-${post._id}`;
};

async function generate() {
  try {
    console.log('🔄 Fetching posts from API...');

    // Node 18+ 直接使用全局 fetch，无需 import
    const res = await fetch(API_URL);

    if (!res.ok) throw new Error(`API Error: ${res.status}`);

    const json = await res.json();
    const posts = json.data || []; // 确保有兜底

    console.log(`📊 Found ${posts.length} posts. Generating XML...`);

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${FRONTEND_URL}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${FRONTEND_URL}/blogs</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  ${posts
    .filter((p) => !p.isPrivate) // 只收录公开文章
    .map((post) => {
      // 🔥 关键修改：生成与前端一致的 Slug URL
      const slug = generateSlug(post);
      const lastMod = new Date(post.updatedAt || post.createdAt).toISOString();

      return `
  <url>
    <loc>${FRONTEND_URL}/blogs/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    })
    .join('')}
</urlset>`;

    writeFileSync('./public/sitemap.xml', sitemap);
    console.log('✅ Sitemap generated successfully at ./public/sitemap.xml');
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error);
    process.exit(1);
  }
}

generate();
