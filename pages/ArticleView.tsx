import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { BlogPost, User } from '../types';
import { apiService } from '../services/api';
import { BlogContent } from '../components/BlogContent';
import { CommentsSection } from '../components/CommentsSection';
import { ExternalFramePost } from '../components/ExternalFramePost';
import { formatUserDate } from '../utils/date';

interface ArticleViewProps {
  onBack: () => void;
  onNavigateToBlog: (blog: BlogPost) => void;
  currentUser: User | null;
  onLoginRequest: () => void;
}

export const ArticleView: React.FC<ArticleViewProps> = ({
  onBack,
  onNavigateToBlog,
  currentUser,
  onLoginRequest
}) => {
  // Use slug from params
  const { slug } = useParams<{ slug: string }>();

  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  // Fetch related posts
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsImageError(false);

    const fetchPost = async () => {
      if (!slug) return;
      setIsLoading(true);
      try {
        // Logic: Slug format is "title-ID". Extract ID from the end.
        const parts = slug.split('-');
        const postId = parts[parts.length - 1];

        // Validate that we have a potential ID (MongoIDs are usually 24 hex chars)
        if (postId && postId.length >= 24) {
          const post = await apiService.getPostById(postId);
          if (post) {
            setBlog(post);
            setContent(post.content || '');

            // Fetch related if tags exist
            if (post.tags && post.tags.length > 0) {
              const { data: related } = await apiService.getPosts(1, 3, '', post.tags[0]);
              setRelatedPosts(related.filter((p) => p._id !== post._id));
            }
          } else {
            setContent('<p>Post not found by ID.</p>');
          }
        } else {
          // Fallback: Attempt legacy search by title
          const searchKeyword = decodeURIComponent(slug).replace(/-/g, ' ');
          const { data } = await apiService.getPosts(1, 1, searchKeyword);

          if (data && data.length > 0) {
            const post = data[0];
            setBlog(post);
            setContent(post.content || '');
          } else {
            setContent('<p>Post not found.</p>');
          }
        }
      } catch (error) {
        console.error('Error loading article:', error);
        setContent('<p>Error loading content. Please try again later.</p>');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // --- 🌟 SEO: 准备 JSON-LD 结构化数据 ---
  // 只有当 blog 数据存在时才生成
  const structuredData = blog
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.name,
        description: blog.info ? blog.info.substring(0, 160) : `Read ${blog.name} on Orion.`,
        // 确保有默认图片，Google 建议文章必须有图片
        image: [
          blog.image || 'https://www.ps5.space/og-image.png' // ⚠️ 请替换为你网站真实的默认封面图 URL
        ],
        // 必须是 ISO 8601 格式
        datePublished: new Date(blog.createdDate || blog.date).toISOString(),
        dateModified: new Date(blog.updatedDate || blog.createdDate || blog.date).toISOString(),
        author: [
          {
            '@type': 'Person',
            name: blog.author || 'Sam',
            url: 'https://www.ps5.space/profile' // ⚠️ 替换为你的关于页面
          }
        ],
        publisher: {
          '@type': 'Organization',
          name: 'Orion Journals',
          logo: {
            '@type': 'ImageObject',
            url: 'https://www.ps5.space/og-image.png' // ⚠️ 替换为你的 Logo URL
          }
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id': typeof window !== 'undefined' ? window.location.href : ''
        }
      }
    : null;

  const containerClass =
    'container mx-auto px-6 py-24 pt-32 max-w-4xl animate-fade-in relative z-10';

  if (!blog && !isLoading) {
    return (
      <div className={containerClass}>
        <div className="text-center text-slate-500">Post not found.</div>
        <button onClick={onBack} className="mt-4 text-primary-500 block mx-auto hover:underline">
          Back to Journal
        </button>
      </div>
    );
  }

  return (
    <article className={containerClass}>
      {blog && (
        <Helmet>
          {/* 1. Title: 核心关键词(文章名)最前，品牌(Orion Journals)殿后。
     这种结构 Google 权重最高，且 "Journals" 这个词中英文语境都显得很高级。 */}
          <title>{`${blog.name} | Orion Journals`}</title>

          {/* 2. Keywords (新增): 这是一个隐藏的 SEO 加分项。
     直接把文章的 tags 拿出来做关键词，搜索引擎超爱这个。 */}
          <meta
            name="keywords"
            content={
              blog.tags && blog.tags.length > 0
                ? blog.tags.join(', ')
                : 'Sam, Engineering, Blog, Life, Orion'
            }
          />

          {/* 3. Description: 智能摘要逻辑。
     - 优先用 info (你写的简介)。
     - 如果没有 info，自动生成一段包含 "Author" + "Topic" 的双语通用句式。
     - 强制截断 160 字符，防止在搜索结果页被省略号截断关键信息。 */}
          <meta
            name="description"
            content={
              blog.info
                ? blog.info.substring(0, 160)
                : `Read "${blog.name}" by ${blog.author || 'Sam'}. A digital memoir on engineering, code, and life recorded on Orion.`
            }
          />

          {/* 4. Open Graph / Social Cards: 让你的链接发在微信、Twitter、Slack 里带有漂亮的预览卡片 */}
          <meta property="og:site_name" content="Orion" />
          <meta property="og:type" content="article" />
          <meta property="og:title" content={`${blog.name} | Orion Journals`} />
          <meta
            property="og:description"
            content={
              blog.info ||
              `Explore "${blog.name}" - Insights on technology and digital evolution by Sam.`
            }
          />
          <meta
            property="og:url"
            content={typeof window !== 'undefined' ? window.location.href : ''}
          />

          {/* 5. Article Author (可选，但对 SEO 很友好): 告诉搜索引擎作者是谁 */}
          <meta property="article:author" content={blog.author || 'Sam'} />

          {/* 6. Image: 有图出图，无图拉倒 (或者你可以设置一个默认的 Orion Logo 图片) */}
          {blog.image && <meta property="og:image" content={blog.image} />}
        </Helmet>
      )}

      <button
        onClick={onBack}
        className="group mb-12 flex items-center text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur flex items-center justify-center mr-3 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors shadow-sm">
          <i className="fas fa-arrow-left text-xs transition-transform group-hover:-translate-x-1"></i>
        </div>
        Back to Insights
      </button>

      {blog && (
        <header className="mb-16 text-center max-w-3xl mx-auto">
          <div className="flex justify-center gap-2 mb-8">
            {blog.tags.map((tag) => (
              <span
                key={tag}
                className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest"
              >
                {tag}
              </span>
            ))}
            {blog.isPrivate && (
              <span className="px-4 py-1.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <i className="fas fa-lock text-[10px]"></i> Encrypted
              </span>
            )}
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-8 text-slate-900 dark:text-white leading-tight">
            {blog.name}
          </h1>

          <div className="flex flex-col items-center gap-4 text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-widest">
            {/* User Info */}
            {blog.user && (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden ring-4 ring-slate-50 dark:ring-slate-900">
                  <img
                    src={
                      blog.user.photoURL ||
                      `https://ui-avatars.com/api/?name=${blog.user.displayName}&background=random`
                    }
                    alt={blog.user.displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {blog.user.displayName}
                </span>
              </div>
            )}

            <div className="flex items-center gap-6 mt-2">
              {/* Author Info */}
              <div className="flex items-center gap-2">
                <i className="fas fa-pen-nib text-xs opacity-50"></i>
                <span>{blog.author}</span>
              </div>
              <span className="opacity-30">|</span>
              <span>{formatUserDate(blog.createdDate || blog.date, currentUser, 'detailed')}</span>
            </div>
          </div>
        </header>
      )}

      {blog?.iframeUrl ? (
        <ExternalFramePost src={blog.iframeUrl} title={blog.name} />
      ) : (
        <div className="max-w-4xl mx-auto">
          {/* Featured Image */}
          {blog?.image && !isImageError ? (
            <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-12 shadow-xl bg-slate-100 dark:bg-slate-800 relative content-visibility-auto">
              <img
                src={blog.image}
                alt={blog.name}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                onError={() => setIsImageError(true)}
              />
            </div>
          ) : blog?.image && isImageError ? (
            <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-12"></div>
          ) : null}

          {/* Content Area */}
          <BlogContent content={content} isLoading={isLoading} />
        </div>
      )}

      {/* Share Section */}
      <div className="max-w-3xl mx-auto mt-20 pt-10 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center mb-24">
        <div className="text-slate-400 text-sm font-mono uppercase tracking-widest">
          End of Transmission
        </div>
        <button
          onClick={handleCopyLink}
          className={`flex items-center gap-3 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider transition-all ${
            isCopied
              ? 'bg-green-500 text-white shadow-lg shadow-green-500/20'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
          }`}
        >
          <i className={`fas ${isCopied ? 'fa-check' : 'fa-link'}`}></i>
          {isCopied ? 'Link Copied' : 'Share Link'}
        </button>
      </div>

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section className="max-w-5xl mx-auto mb-32 border-t border-slate-200 dark:border-slate-800 pt-16">
          <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-10 text-center">
            Further Reading
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {relatedPosts.map((post) => (
              <div
                key={post._id}
                onClick={() => onNavigateToBlog(post)}
                className="group cursor-pointer flex flex-col gap-4"
              >
                {post.image && (
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-sm content-visibility-auto">
                    <img
                      src={post.image}
                      alt={post.name}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      loading="lazy"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  </div>
                )}
                <div>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                    {formatUserDate(post.createdDate || post.date, currentUser, 'short')}
                  </span>
                  <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                    {post.name}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Comments Section */}
      {blog && (
        <div className="max-w-3xl mx-auto">
          <CommentsSection
            postId={blog._id}
            currentUser={currentUser}
            onLoginRequest={onLoginRequest}
          />
        </div>
      )}
    </article>
  );
};
