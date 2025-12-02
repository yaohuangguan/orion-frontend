import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { BlogList } from './components/BlogList';
import { CommentsSection } from './components/CommentsSection';
import { CosmicBackground } from './components/CosmicBackground';
import { ToastContainer } from './components/Toast';
import { DeleteModal } from './components/DeleteModal';
import { UserProfile } from './components/UserProfile';
import { SettingsPage } from './components/SettingsPage';
import { ChatRoom } from './components/ChatRoom';
import { AuditLogViewer } from './components/AuditLogViewer';
import { apiService } from './services/api';
import { Theme, PageView, User, BlogPost, PaginationData } from './types';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';

// Lazy Load Heavy Components to reduce initial bundle size and improve TBT (Total Blocking Time)
const PrivateSpaceDashboard = lazy(() => import('./components/private/PrivateSpaceDashboard').then(module => ({ default: module.PrivateSpaceDashboard })));

declare global {
  interface Window {
    marked: any;
  }
}

// --- Loading Fallback ---
const PageLoader = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center">
    <div className="w-10 h-10 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mb-4"></div>
    <p className="text-slate-400 font-mono text-xs uppercase tracking-widest animate-pulse">Loading Asset...</p>
  </div>
);

// --- Heart Firework Effect Helper ---
const triggerHeartExplosion = (e: React.MouseEvent) => {
  const rect = (e.target as HTMLElement).getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  // Create multiple hearts
  for (let i = 0; i < 24; i++) {
    const heart = document.createElement('div');
    heart.innerText = '❤';
    heart.style.position = 'fixed';
    heart.style.left = `${centerX}px`;
    heart.style.top = `${centerY}px`;
    heart.style.fontSize = `${Math.random() * 20 + 10}px`;
    // Random pink/red/rose colors
    heart.style.color = `hsl(${330 + Math.random() * 30}, ${80 + Math.random() * 20}%, ${50 + Math.random() * 20}%)`; 
    heart.style.pointerEvents = 'none';
    heart.style.userSelect = 'none';
    heart.style.zIndex = '9999';
    heart.style.transition = 'transform 1s ease-out, opacity 1s ease-out';
    document.body.appendChild(heart);

    // Calculate random angle and distance for explosion
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 150 + 60;
    const destX = Math.cos(angle) * distance;
    const destY = Math.sin(angle) * distance;

    requestAnimationFrame(() => {
      heart.style.transform = `translate(${destX}px, ${destY}px) scale(0.5) rotate(${Math.random() * 360}deg)`;
      heart.style.opacity = '0';
    });

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(heart);
    }, 1000);
  }
};

// --- Login Modal Component (Star Chart Theme) ---
interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [isReset, setIsReset] = useState(false); // State for Reset Password Mode
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [secretKey, setSecretKey] = useState(''); // New Secret Key Field

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsLoading(false);
      setPassword('');
      setPasswordConfirm('');
      setSecretKey('');
    }
  }, [isOpen, isRegister, isReset]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isReset) {
         // Reset Password Flow
         await apiService.resetPasswordBySecret(email, password, secretKey);
         // After reset, switch to login
         setIsReset(false);
         setSecretKey('');
         setPassword('');
         // Success message handled by api toast or we can set error/success state
      } else if (isRegister) {
        if (password !== passwordConfirm) {
           throw new Error(t.login.passwordMismatch);
        }
        await apiService.register(name, email, password, passwordConfirm);
        const user = await apiService.getCurrentUser();
        onLoginSuccess(user);
        onClose();
      } else {
        await apiService.login(email, password);
        const user = await apiService.getCurrentUser();
        onLoginSuccess(user);
        onClose();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || t.login.error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleRegister = () => {
    setIsRegister(!isRegister);
    setIsReset(false);
    setError('');
  };

  const toggleReset = () => {
    setIsReset(!isReset);
    setIsRegister(false);
    setError('');
  };

  // Determine Title & Subtitle based on mode
  let title = t.login.welcome;
  let subtitle = t.login.subtitle;
  if (isRegister) {
    title = t.login.welcomeRegister;
    subtitle = t.login.subtitleRegister;
  } else if (isReset) {
    title = t.login.welcomeReset;
    subtitle = t.login.subtitleReset;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Dark backdrop with blur */}
      <div className="absolute inset-0 bg-[#02040a]/80 backdrop-blur-md" onClick={onClose}></div>
      
      {/* Star Chart Modal Card */}
      <div className="relative bg-[#050914] border border-primary-500/30 rounded-3xl w-full max-w-md p-8 animate-fade-in shadow-[0_0_50px_rgba(245,158,11,0.1)] overflow-hidden">
        
        {/* Decorative Grid Background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-[50px]"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-600/10 rounded-full blur-[50px]"></div>

        <button 
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-primary-400 hover:bg-primary-900/20 transition-colors z-10"
        >
          <i className="fas fa-times"></i>
        </button>
        
        <div className="mb-8 text-center relative z-10">
          <div className="inline-block mb-4 p-3 rounded-full bg-primary-500/10 border border-primary-500/20">
             <i className={`fas ${isReset ? 'fa-key' : 'fa-fingerprint'} text-primary-400 text-xl`}></i>
          </div>
          <h2 className="text-2xl font-bold text-primary-50 font-display tracking-wide">
            {title}
          </h2>
          <p className="text-slate-400 mt-2 text-sm font-mono">
            {subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {error && (
            <div className="p-3 bg-red-900/20 border border-red-500/30 text-red-300 text-sm rounded-xl text-center font-mono">
              <i className="fas fa-exclamation-triangle mr-2"></i>{error}
            </div>
          )}
          
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 pl-1">{t.login.name}</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0f1e] border border-slate-800 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white placeholder-slate-600 font-mono text-sm"
                placeholder="Ident: John Doe"
                required={isRegister}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 pl-1">{t.login.email}</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0f1e] border border-slate-800 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white placeholder-slate-600 font-mono text-sm"
              placeholder="link@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 pl-1">
              {isReset ? t.login.newPassword : t.login.password}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0f1e] border border-slate-800 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white placeholder-slate-600 font-mono text-sm"
              placeholder="••••••••"
              required
            />
          </div>
          
          {isRegister && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 pl-1">{t.login.confirmPassword}</label>
              <input 
                type="password" 
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0f1e] border border-slate-800 focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all text-white placeholder-slate-600 font-mono text-sm"
                placeholder="••••••••"
                required={isRegister}
              />
            </div>
          )}

          {isReset && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 pl-1">{t.login.secretKey}</label>
              <input 
                type="password" 
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#0a0f1e] border border-red-900/50 focus:border-red-500/50 focus:ring-2 focus:ring-red-500/20 outline-none transition-all text-white placeholder-slate-600 font-mono text-sm"
                placeholder="Secret Protocol Key"
                required={isReset}
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3 bg-primary-500 text-black rounded-xl font-bold uppercase tracking-widest hover:bg-primary-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {isLoading 
              ? <i className="fas fa-circle-notch fa-spin"></i> 
              : (isReset ? t.login.reset : (isRegister ? t.login.register : t.login.signin))
            }
          </button>
        </form>
        
        <div className="mt-8 flex flex-col items-center gap-3 relative z-10 border-t border-white/5 pt-4 text-xs font-medium uppercase tracking-wider">
          {!isReset && (
            <button 
              onClick={toggleRegister}
              className="text-slate-400 hover:text-primary-400 transition-colors"
            >
              {isRegister ? t.login.toLogin : t.login.toRegister}
            </button>
          )}

          {!isRegister && (
            <button 
              onClick={toggleReset}
              className="text-slate-500 hover:text-red-400 transition-colors"
            >
              {isReset ? t.login.backToLogin : t.login.forgotPassword}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// --- External Frame (Lazy Loaded manually in Article View if needed, or kept simple) ---
import { ExternalFramePost } from './components/ExternalFramePost';

// --- Article View Component ---
interface ArticleViewProps {
  blog: BlogPost;
  allBlogs: BlogPost[];
  onBack: () => void;
  onNavigateToBlog: (blog: BlogPost) => void;
  currentUser: User | null;
  onLoginRequest: () => void;
}

const ArticleView: React.FC<ArticleViewProps> = ({ blog, allBlogs, onBack, onNavigateToBlog, currentUser, onLoginRequest }) => {
  const [content, setContent] = useState<string>(blog.content || '');
  const [isLoading, setIsLoading] = useState<boolean>(!blog.content && !blog.iframeUrl);
  const [isCopied, setIsCopied] = useState(false);
  const [isImageError, setIsImageError] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsImageError(false);
    
    // Update content when blog changes
    if (blog.iframeUrl) {
      setIsLoading(false);
      return;
    }

    const fetchContent = async () => {
      if (blog.content && blog.content.length > 200) { 
        setContent(blog.content);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const fullPost = await apiService.getPostById(blog._id);
        if (fullPost && fullPost.content) {
          setContent(fullPost.content);
        } else {
          setContent('<p>Unable to load full content at this time.</p>');
        }
      } catch (error) {
        console.error("Error loading article:", error);
        setContent('<p>Error loading content. Please try again later.</p>');
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, [blog._id, blog.content, blog.iframeUrl]);

  const handleCopyLink = () => {
    const url = `${window.location.origin}/posts/${blog._id}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  // Find related posts based on matching tags
  const relatedPosts = allBlogs
    .filter(b => b._id !== blog._id && b.tags.some(tag => blog.tags.includes(tag)))
    .slice(0, 3);

  const containerClass = "container mx-auto px-6 py-24 pt-32 max-w-4xl animate-fade-in relative z-10";

  // Process markdown if available
  const renderedContent = React.useMemo(() => {
    if (isLoading) return '<p class="animate-pulse">Loading full article content...</p>';
    if (window.marked && content) {
      try {
        return window.marked.parse(content);
      } catch (e) {
        console.warn("Markdown parse error, falling back to raw", e);
        return content;
      }
    }
    return content;
  }, [content, isLoading]);

  return (
    <article className={containerClass}>
      <button 
        onClick={onBack}
        className="group mb-12 flex items-center text-sm font-bold text-slate-500 hover:text-primary-600 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur flex items-center justify-center mr-3 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/20 transition-colors shadow-sm">
          <i className="fas fa-arrow-left text-xs transition-transform group-hover:-translate-x-1"></i>
        </div>
        Back to Insights
      </button>
      
      <header className="mb-16 text-center max-w-3xl mx-auto">
        <div className="flex justify-center gap-2 mb-8">
          {blog.tags.map(tag => (
            <span key={tag} className="px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase tracking-widest">
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
                 <img src={blog.user.photoURL || `https://ui-avatars.com/api/?name=${blog.user.displayName}&background=random`} alt={blog.user.displayName} className="w-full h-full object-cover"/>
               </div>
               <span className="font-bold text-slate-800 dark:text-slate-200">{blog.user.displayName}</span>
            </div>
          )}
          
          <div className="flex items-center gap-6 mt-2">
              {/* Author Info */}
              <div className="flex items-center gap-2">
                 <i className="fas fa-pen-nib text-xs opacity-50"></i>
                 <span>{blog.author}</span>
              </div>
              <span className="opacity-30">|</span>
              <span>{blog.date || blog.createdDate}</span>
          </div>
        </div>
      </header>

      {blog.iframeUrl ? (
        <ExternalFramePost src={blog.iframeUrl} title={blog.name} />
      ) : (
        <div className="max-w-3xl mx-auto">
          
          {/* Featured Image */}
          {blog.image && !isImageError ? (
            <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-16 shadow-xl bg-slate-100 dark:bg-slate-800 relative content-visibility-auto">
              <img 
                src={blog.image} 
                alt={blog.name} 
                className="w-full h-full object-cover" 
                loading="lazy"
                decoding="async"
                onError={() => setIsImageError(true)}
              />
            </div>
          ) : blog.image && isImageError ? (
             // Clean placeholder or nothing
             <div className="w-full h-px bg-slate-200 dark:bg-slate-800 mb-16"></div>
          ) : null}

          {/* Content Area - Clean Editorial Style */}
          <div 
            className="prose prose-xl md:prose-2xl prose-slate dark:prose-invert max-w-none 
            prose-headings:font-display prose-headings:font-bold prose-headings:text-slate-900 dark:prose-headings:text-white
            prose-p:leading-loose prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-p:mb-8
            prose-a:text-primary-600 dark:prose-a:text-primary-400 prose-a:no-underline hover:prose-a:underline
            prose-img:rounded-xl prose-img:shadow-lg prose-img:my-12
            prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:pl-6 prose-blockquote:italic
            prose-li:text-slate-600 dark:prose-li:text-slate-300"
            dangerouslySetInnerHTML={{ __html: renderedContent }} 
          />
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
              {relatedPosts.map(post => (
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
                          onError={(e) => e.currentTarget.style.display = 'none'} 
                        />
                     </div>
                   )}
                   <div>
                      <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">{post.date}</span>
                      <h4 className="font-bold text-xl text-slate-800 dark:text-slate-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-tight">
                        {post.name}
                      </h4>
                   </div>
                </div>
              ))}
           </div>
        </section>
      )}

      {/* Comments Section - Centered and Clean */}
      <div className="max-w-3xl mx-auto">
        <CommentsSection 
          postId={blog._id} 
          currentUser={currentUser} 
          onLoginRequest={onLoginRequest} 
        />
      </div>

    </article>
  );
};

// --- Resume View Component (Refactored) ---
const ResumeView = () => {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-6 py-24 pt-32 max-w-5xl animate-fade-in relative z-10">
      
      {/* 1. Header & Identity */}
      <div className="mb-20 text-center">
        <div className="inline-block p-4 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 mb-8 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
           <i className="fas fa-user-astronaut text-4xl text-white"></i>
        </div>
        <h1 className="text-6xl md:text-7xl font-display font-bold text-slate-900 dark:text-white mb-6 tracking-tight">
          Sam <span className="text-amber-500">Yao</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-600 dark:text-slate-300 font-light max-w-3xl mx-auto leading-relaxed mb-4">
          {t.resume.bio}
        </p>
        <p className="text-sm font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest max-w-3xl mx-auto">
          {t.resume.credentials}
        </p>
        
        <div className="flex justify-center gap-6 mt-8 text-slate-400">
           <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold"><i className="fas fa-map-marker-alt text-amber-500"></i> {t.resume.basedIn}</span>
           <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold"><i className="fas fa-code text-amber-500"></i> Full Stack</span>
           <span className="flex items-center gap-2 text-sm uppercase tracking-widest font-bold"><i className="fas fa-chart-line text-amber-500"></i> Trader</span>
        </div>
      </div>

      {/* 2. Site Introduction / Features Grid */}
      <div className="mb-24">
         <div className="flex items-center gap-4 mb-10">
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{t.resume.siteIntro.title}</h2>
            <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1: Journal */}
            <div className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-500/50 transition-all hover:shadow-2xl hover:shadow-amber-500/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-book text-8xl text-amber-500"></i>
               </div>
               <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-6">
                     <i className="fas fa-pen-fancy text-xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.resume.siteIntro.journalTitle}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t.resume.siteIntro.journalDesc}</p>
               </div>
            </div>

            {/* Feature 2: Profile */}
            <div className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-500/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-id-card text-8xl text-blue-500"></i>
               </div>
               <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6">
                     <i className="fas fa-user-tie text-xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.resume.siteIntro.profileTitle}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t.resume.siteIntro.profileDesc}</p>
               </div>
            </div>

            {/* Feature 3: Chat */}
            <div className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-all hover:shadow-2xl hover:shadow-emerald-500/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-comments text-8xl text-emerald-500"></i>
               </div>
               <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6">
                     <i className="fas fa-satellite-dish text-xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.resume.siteIntro.chatTitle}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t.resume.siteIntro.chatDesc}</p>
               </div>
            </div>

            {/* Feature 4: Private Space */}
            <div className="group p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-rose-500/50 transition-all hover:shadow-2xl hover:shadow-rose-500/5 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                  <i className="fas fa-heart text-8xl text-rose-500"></i>
               </div>
               <div className="relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-6">
                     <i className="fas fa-lock text-xl"></i>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t.resume.siteIntro.privateTitle}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{t.resume.siteIntro.privateDesc}</p>
               </div>
            </div>
         </div>
      </div>

      {/* 3. Resume / Experience Timeline */}
      <div className="grid md:grid-cols-[1fr_2fr] gap-12 border-t border-slate-200 dark:border-slate-800 pt-20">
        {/* Left Column: Education & Skills */}
        <div className="space-y-12">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">{t.resume.education}</h2>
            <div className="space-y-4">
              <div className="bg-white/60 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 backdrop-blur-md hover:border-primary-500/30 transition-colors">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t.resume.educationSchool}</h3>
                <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mt-1">{t.resume.educationDegree}</p>
                <p className="text-xs text-slate-500 mt-2 font-mono uppercase">{t.resume.gpa}</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">{t.resume.skills}</h2>
            <div className="flex flex-wrap gap-2">
              {['React', 'TypeScript', 'Next.js', 'Tailwind', 'Node.js', 'GraphQL', 'AWS', 'Docker', 'Quant Trading', 'Startup'].map(tech => (
                <span key={tech} className="px-3 py-1.5 bg-white/60 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 backdrop-blur-sm">
                  {tech}
                </span>
              ))}
            </div>
          </section>
          
          <section>
             <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-6">Contact</h2>
             <div className="flex flex-col gap-3">
                <a href="mailto:719919153@qq.com" className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors">
                   <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><i className="fas fa-envelope text-xs"></i></div>
                   <span className="text-sm font-mono">719919153@qq.com</span>
                </a>
                <a href="https://github.com/yaohuangguan" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors">
                   <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><i className="fab fa-github text-xs"></i></div>
                   <span className="text-sm font-mono">github.com/yaohuangguan</span>
                </a>
             </div>
          </section>
        </div>

        {/* Right Column: Experience */}
        <div className="space-y-12">
          <section>
            <h2 className="text-sm font-bold uppercase tracking-widest text-slate-400 mb-8">{t.resume.experience}</h2>
            <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-12">
              {t.resume.jobs.map((job, idx) => (
                <div key={idx} className="pl-10 relative group">
                  {/* Timeline Dot */}
                  <span className={`absolute -left-[9px] top-6 w-4 h-4 rounded-full ${job.color} ring-4 ring-white dark:ring-slate-950 transition-transform group-hover:scale-125 shadow-lg`}></span>
                  
                  <div className="bg-transparent group-hover:bg-slate-50 dark:group-hover:bg-slate-800/30 p-6 rounded-3xl transition-colors border border-transparent group-hover:border-slate-200 dark:group-hover:border-slate-700/50">
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{job.company}</h3>
                    <p className="text-sm text-amber-600 dark:text-amber-400 mb-4 font-bold uppercase tracking-wider">{job.role}</p>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-base">
                      {job.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

// --- App Content Component ---
const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(Theme.LIGHT);
  const [currentPage, setCurrentPage] = useState<PageView>(PageView.HOME);
  const [user, setUser] = useState<User | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  
  const [publicBlogs, setPublicBlogs] = useState<BlogPost[]>([]);
  const [privateBlogs, setPrivateBlogs] = useState<BlogPost[]>([]);
  
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  
  // State for public blog deletion
  const [publicPostToDelete, setPublicPostToDelete] = useState<BlogPost | null>(null);
  
  // Server-Side Pagination & Filtering State for Public Blogs
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [publicSearch, setPublicSearch] = useState('');
  const [publicTag, setPublicTag] = useState<string | null>(null);
  
  // Like State Management (Persisted locally for anonymous usage)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  // Server-Side Pagination for Private Blogs
  const [privatePagination, setPrivatePagination] = useState<PaginationData | null>(null);

  const { t, language, toggleLanguage } = useTranslation();

  useEffect(() => {
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme(Theme.DARK);
    }
    
    // Load liked posts from localStorage
    const savedLikes = localStorage.getItem('liked_posts');
    if (savedLikes) {
      try {
        setLikedPosts(new Set(JSON.parse(savedLikes)));
      } catch (e) {
        console.error("Failed to parse liked posts", e);
      }
    }
    
    // Check for existing session
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (e) {
          console.error("Session expired or invalid", e);
          apiService.logout();
        }
      }
    };

    checkAuth();
    fetchPublicBlogs(1);
  }, []);

  // Listen for global logout events (from api.ts)
  useEffect(() => {
    const handleLogoutEvent = () => {
      setUser(null);
      setPrivateBlogs([]); 
      localStorage.removeItem('auth_token'); 
      localStorage.removeItem('googleInfo');
      // Note: The api service now emits a toast for this, so we don't need a redundant alert
      setIsLoginModalOpen(true);
      setCurrentPage(PageView.HOME);
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  // Fetch private blogs ONLY when user logs in AND is on Private Space
  useEffect(() => {
    if (user && currentPage === PageView.PRIVATE_SPACE) {
      fetchPrivateBlogs();
      // Ensure user stays on private page only if valid
      if (user.vip && user.private_token === 'ilovechenfangting') {
         // authorized
      } else {
         setCurrentPage(PageView.HOME);
      }
    } else if (!user && currentPage === PageView.PRIVATE_SPACE) {
      // If logged out on private space, go home
      setCurrentPage(PageView.HOME);
    }
  }, [user, currentPage]);

  const fetchPublicBlogs = async (page: number, search = publicSearch, tag = publicTag) => {
    // Only set loading to true if we don't have data yet (initial load) or if the list is already empty
    // This prevents the flickering/skeleton screen when paginating or filtering existing data.
    if (publicBlogs.length === 0) {
      setIsLoadingBlogs(true);
    }
    
    try {
      const { data, pagination: paginationMeta } = await apiService.getPosts(page, 10, search, tag || '');
      setPublicBlogs(data);
      setPagination(paginationMeta);
      // Update state to reflect current search params used
      setPublicSearch(search);
      setPublicTag(tag);
    } catch (error) {
      console.error("Failed to fetch public blogs", error);
    } finally {
      setIsLoadingBlogs(false);
    }
  };

  const handlePublicFilterChange = (search: string, tag: string | null) => {
    // Reset to page 1 when filter changes
    fetchPublicBlogs(1, search, tag);
  };

  const fetchPrivateBlogs = async (page: number = 1) => {
    // Only fetch if logged in
    try {
      const { data, pagination: paginationMeta } = await apiService.getPrivatePosts(page, 10);
      setPrivateBlogs(data);
      setPrivatePagination(paginationMeta);
    } catch (error) {
      console.error("Failed to fetch private blogs (safely handled):", error);
      // Backend filesystem write error or auth error often happens here. 
      // Return empty array to keep UI stable.
      setPrivateBlogs([]);
    }
  };

  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };

  const handleLoginSuccess = (user: User) => {
    setUser(user);
    // fetchPrivateBlogs is triggered by useEffect on user change IF on private space
  };

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
    setCurrentPage(PageView.HOME);
  };

  const handleSelectBlog = (blog: BlogPost) => {
    setSelectedBlog(blog);
    setCurrentPage(PageView.ARTICLE);
  };

  const handleBackToBlog = () => {
    // Return to the appropriate list view
    if (selectedBlog?.isPrivate) {
      setCurrentPage(PageView.PRIVATE_SPACE);
    } else {
      setCurrentPage(PageView.BLOG);
    }
    
    setTimeout(() => {
      const blogSection = document.getElementById('latest-posts');
      if (blogSection) {
        blogSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Handler for confirming public blog deletion
  const confirmPublicDelete = async () => {
    if (!publicPostToDelete) return;
    try {
      await apiService.deletePost(publicPostToDelete._id);
      setPublicPostToDelete(null);
      // Refresh current page
      fetchPublicBlogs(pagination?.currentPage || 1); 
    } catch (error) {
      console.error("Failed to delete public post", error);
    }
  };
  
  // Handler for Public Likes (Toggle Logic)
  const handlePublicLike = async (id: string) => {
    const isLiked = likedPosts.has(id);
    const newLikedPosts = new Set(likedPosts);
    
    try {
       // Optimistic UI Update
       setPublicBlogs(prev => prev.map(p => {
         if (p._id === id) {
           return { ...p, likes: isLiked ? Math.max(0, (p.likes || 0) - 1) : (p.likes || 0) + 1 };
         }
         return p;
       }));

       if (isLiked) {
         newLikedPosts.delete(id);
         await apiService.unlikePost(id);
       } else {
         newLikedPosts.add(id);
         await apiService.likePost(id);
       }
       
       setLikedPosts(newLikedPosts);
       localStorage.setItem('liked_posts', JSON.stringify(Array.from(newLikedPosts)));
       
    } catch (e) {
      console.error("Like failed", e);
      // Revert if needed (simplified here)
    }
  };

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 selection:bg-primary-500/30 ${
      currentPage === PageView.PRIVATE_SPACE 
        ? 'bg-gradient-to-br from-pink-200 via-rose-200 to-pink-200' 
        : 'bg-transparent'
    }`}>
      
      {/* Toast Container for Global Notifications */}
      <ToastContainer />

      {/* Delete Modal for Public Blogs */}
      <DeleteModal 
         isOpen={!!publicPostToDelete}
         onClose={() => setPublicPostToDelete(null)}
         onConfirm={confirmPublicDelete}
         title={t.delete.confirmTitle}
      />
      
      {/* Background Layer - Only show Cosmic Background if NOT in Private Space */}
      {currentPage !== PageView.PRIVATE_SPACE && <CosmicBackground theme={theme} />}

      <Header 
        theme={theme}
        toggleTheme={toggleTheme}
        setPage={(page) => {
          // Extra security check on nav click
          if (page === PageView.PRIVATE_SPACE) {
            if (!user?.vip || user?.private_token !== 'ilovechenfangting') {
              alert("Access Denied: You do not have the required clearance level.");
              return;
            }
          }
          if (page === PageView.AUDIT_LOG && !user?.vip) {
            alert("Access Denied: VIP Only.");
            return;
          }
          setCurrentPage(page);
          window.scrollTo(0, 0);
        }}
        currentPage={currentPage}
        currentUser={user}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
      />
      
      <main className="relative z-10">
        {currentPage === PageView.HOME && (
          <>
            <Hero onCtaClick={() => {
              setCurrentPage(PageView.BLOG);
              setTimeout(() => document.getElementById('latest-posts')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }} />
            <div id="about">
              <ResumeView />
            </div>
          </>
        )}
        
        {currentPage === PageView.PRIVATE_SPACE && (
          <Suspense fallback={<PageLoader />}>
            <PrivateSpaceDashboard 
              user={user} 
              blogs={privateBlogs} 
              onSelectBlog={handleSelectBlog}
              onRefresh={() => fetchPrivateBlogs(privatePagination?.currentPage || 1)}
              pagination={privatePagination}
              onPageChange={fetchPrivateBlogs}
            />
          </Suspense>
        )}
        
        {currentPage === PageView.BLOG && (
          <BlogList 
            blogs={publicBlogs} 
            onSelectBlog={handleSelectBlog} 
            isLoading={isLoadingBlogs}
            currentUser={user}
            onDeletePost={(blog) => setPublicPostToDelete(blog)}
            pagination={pagination}
            onPageChange={(page) => fetchPublicBlogs(page)}
            onFilterChange={handlePublicFilterChange}
            onLike={handlePublicLike}
            likedPosts={likedPosts}
          />
        )}

        {currentPage === PageView.ARTICLE && selectedBlog && (
          <ArticleView 
            blog={selectedBlog}
            // Pass the correct list depending on context
            allBlogs={selectedBlog.isPrivate ? privateBlogs : publicBlogs} 
            onBack={handleBackToBlog}
            onNavigateToBlog={handleSelectBlog}
            currentUser={user}
            onLoginRequest={() => setIsLoginModalOpen(true)}
          />
        )}
        {currentPage === PageView.RESUME && <ResumeView />}

        {/* New Pages */}
        {currentPage === PageView.PROFILE && user && (
          <UserProfile user={user} onUpdateUser={setUser} />
        )}
        
        {currentPage === PageView.CHAT && user && (
          <ChatRoom currentUser={user} />
        )}

        {/* Audit Log (VIP Only) */}
        {currentPage === PageView.AUDIT_LOG && user?.vip && (
          <AuditLogViewer />
        )}

        {currentPage === PageView.SETTINGS && (
          <SettingsPage 
            theme={theme} 
            toggleTheme={toggleTheme} 
            language={language}
            toggleLanguage={toggleLanguage}
          />
        )}
      </main>

      <footer className={`relative overflow-hidden mt-20 transition-colors z-10 ${
        currentPage === PageView.PRIVATE_SPACE 
          ? 'bg-rose-900/5 text-rose-900/50 border-t border-rose-900/5 py-16' 
          : 'bg-slate-900 text-slate-300 border-t border-slate-800 py-24'
      }`}>
        
        {/* Public Footer Star Chart Background */}
        {currentPage !== PageView.PRIVATE_SPACE && (
          <div className="absolute inset-0 pointer-events-none opacity-20">
             <svg viewBox="0 0 1000 300" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
                <circle cx="500" cy="-500" r="600" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
                <circle cx="500" cy="-500" r="700" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.5" />
                <line x1="0" y1="300" x2="1000" y2="300" stroke="currentColor" strokeWidth="1" />
                <path d="M200,200 L300,100 L400,150" fill="none" stroke="currentColor" strokeWidth="0.5" />
                <circle cx="200" cy="200" r="2" fill="currentColor" />
                <circle cx="300" cy="100" r="2" fill="currentColor" />
                <circle cx="400" cy="150" r="2" fill="currentColor" />
                <circle cx="800" cy="80" r="3" fill="currentColor" opacity="0.5" />
                <circle cx="750" cy="150" r="1" fill="currentColor" />
                <path d="M750,150 L800,80" fill="none" stroke="currentColor" strokeWidth="0.3" opacity="0.5" />
             </svg>
          </div>
        )}

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="mb-8">
            {currentPage === PageView.PRIVATE_SPACE ? (
              <div className="flex items-center justify-center gap-3 font-display font-bold text-2xl text-rose-400">
                <span>Sam Yao</span>
                <span 
                  className="text-3xl text-rose-500 animate-pulse cursor-pointer hover:scale-125 transition-transform duration-300 inline-block"
                  onMouseEnter={triggerHeartExplosion}
                  onClick={triggerHeartExplosion}
                  style={{ textShadow: '0 0 20px rgba(244, 63, 94, 0.6)' }}
                >
                  ❤
                </span>
                <span>Jennifer Chen</span>
              </div>
            ) : (
               <>
                 <div className="mb-6">
                    <h2 className="font-display font-bold text-2xl tracking-widest uppercase mb-2">Sam Yao</h2>
                    <p className="text-xs font-mono text-amber-500 uppercase tracking-[0.3em]">{t.footer.builtBy}</p>
                 </div>
                 
                 <div className="flex justify-center items-center gap-4 my-8 opacity-50">
                    <div className="h-px w-12 bg-slate-500"></div>
                    <div className="w-2 h-2 rounded-full border border-slate-500"></div>
                    <div className="h-px w-12 bg-slate-500"></div>
                 </div>

                 <p className="text-lg font-serif italic text-slate-400 mb-8">
                    "{t.footer.strengthHonor}"
                 </p>
               </>
            )}
          </div>
          <p className="mb-8 max-w-sm mx-auto opacity-80">
            {t.footer.tagline}
          </p>
          <div className="flex justify-center gap-8 mb-8">
            <a href="https://github.com/yaohuangguan" target="_blank" rel="noreferrer" className="hover:text-primary-600 transition-colors"><i className="fab fa-github text-xl"></i></a>
            <a href="https://www.linkedin.com/in/sam-y-54828a140/" target="_blank" rel="noreferrer" className="hover:text-primary-600 transition-colors"><i className="fab fa-linkedin text-xl"></i></a>
            <a href="mailto:719919153@qq.com" className="hover:text-primary-600 transition-colors"><i className="fas fa-envelope text-xl"></i></a>
          </div>
          <p className="text-sm opacity-60">{t.footer.rights}</p>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
};

export default App;