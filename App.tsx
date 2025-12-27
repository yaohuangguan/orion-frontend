import React, { useState, useEffect, Suspense, lazy } from 'react';
import { io, Socket } from 'socket.io-client';
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Hero } from './components/Hero';
import { CosmicBackground } from './components/CosmicBackground';
import { ScenicBackground } from './components/ScenicBackground';
import { ToastContainer, toast } from './components/Toast';
import { DeleteModal } from './components/DeleteModal';
import { apiService } from './services/api';
import { Theme, PageView, User, BlogPost, ChatUser, PERM_KEYS, can } from './types';
import { useTranslation } from './i18n/LanguageContext';
import { Helmet } from 'react-helmet-async';

import { LoginModal } from './components/LoginModal';
import { ResumeView } from './components/ResumeView';
import { Footer } from './components/Footer';
import { PageLoader } from './components/PageLoader';
import { AccessRestricted } from './components/AccessRestricted';
import { InstallPwa } from './components/InstallPwa';

import { BlogList } from './pages/BlogList';
import { ArticleView } from './pages/ArticleView';
import { PortfolioPage } from './pages/PortfolioPage';
import { UserProfile } from './pages/UserProfile';
import { SettingsPage } from './pages/SettingsPage';
import { ChatRoom } from './pages/ChatRoom';
import { AuditLogViewer } from './pages/AuditLogViewer';
import { SystemManagement } from './pages/SystemManagement';
import { NotFound } from './pages/NotFound';
import { NoPermission } from './pages/NoPermission';
import { createLazyComponent } from './components/LazyLoader';

const PrivateSpaceDashboard = createLazyComponent(
  () => import('./pages/private/PrivateSpaceDashboard')
);
const FootprintSpace = createLazyComponent(() => import('./pages/FootprintSpace'));

const JournalSpace = createLazyComponent(() => import('./pages/private/JournalSpace'));
const SecondBrainSpace = createLazyComponent(() => import('./pages/private/SecondBrainSpace'));
const LeisureSpace = createLazyComponent(() => import('./pages/private/LeisureSpace'));
const PhotoGallery = createLazyComponent(() => import('./pages/private/PhotoGallery'));
const FitnessSpace = createLazyComponent(() => import('./pages/private/FitnessSpace'));

const SOCKET_URL = 'https://bananaboom-api-242273127238.asia-east1.run.app';

// 声明全局变量以访问 index.html 中的时间戳
declare global {
  interface Window {
    __APP_START_TIME__: number;
    marked: { parse: (text: string) => string };
    hljs: any;
  }
}

const Layout: React.FC<{
  user: User | null;
  socket: Socket | null;
  theme: Theme;
  toggleTheme: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onNavigateToChat: (user: ChatUser) => void;
}> = ({ user, socket, theme, toggleTheme, onLogin, onLogout, onNavigateToChat }) => {
  const location = useLocation();
  const isPrivateSpace = location.pathname.startsWith('/captain-cabin');
  const isArticleView = /^\/blogs\/.+/.test(location.pathname);

  let mainBgClass = '';
  if (isPrivateSpace) {
    mainBgClass = 'bg-gradient-to-br from-pink-200 via-rose-200 to-pink-200';
  } else if (isArticleView) {
    mainBgClass = theme === Theme.DARK ? 'bg-[#111]' : 'bg-white';
  } else {
    mainBgClass = theme === Theme.DARK ? 'bg-slate-950' : 'bg-transparent';
  }

  const getCurrentPageView = (path: string): PageView => {
    if (path.startsWith('/blogs')) return PageView.BLOG;
    if (path.startsWith('/profile')) return PageView.RESUME;
    if (path.startsWith('/user-profile')) return PageView.PROFILE;
    if (path.startsWith('/system-management')) return PageView.SYSTEM;
    if (path.startsWith('/system-settings')) return PageView.SETTINGS;
    if (path.startsWith('/footprints')) return PageView.FOOTPRINT;
    if (path.startsWith('/chatroom')) return PageView.CHAT;
    if (path.startsWith('/captain-cabin')) return PageView.PRIVATE_SPACE;
    return PageView.HOME;
  };

  return (
    <div
      className={`min-h-screen relative overflow-hidden transition-colors duration-500 selection:bg-primary-500/30 ${mainBgClass}`}
    >
      <Helmet titleTemplate="%s | Orion" defaultTitle="Orion | Engineering & Design">
        <meta
          name="description"
          content="A modern, high-performance blog and portfolio built with Next.js architecture, React, and Tailwind CSS."
        />
      </Helmet>

      <ToastContainer />
      <InstallPwa />

      {!isPrivateSpace && !isArticleView && (
        <>{theme === Theme.DARK ? <CosmicBackground theme={theme} /> : <ScenicBackground />}</>
      )}

      <Header
        theme={theme}
        toggleTheme={toggleTheme}
        setPage={() => {}}
        currentPage={getCurrentPageView(location.pathname)}
        currentUser={user}
        onLogin={onLogin}
        onLogout={onLogout}
        socket={socket}
        onNavigateToChat={onNavigateToChat}
      />

      <main className="relative z-10 pointer-events-none w-full pb-24 md:pb-0">
        <div className="pointer-events-auto w-full min-h-screen">
          <Outlet />
        </div>
      </main>

      <Footer
        currentPage={getCurrentPageView(location.pathname)}
        currentUser={user}
        onLogin={onLogin}
      />

      <div className="block xl:hidden">
        <MobileBottomNav currentUser={user} onLoginRequest={onLogin} />
      </div>
    </div>
  );
};

interface ProtectedRouteProps {
  user: User | null;
  element: React.ReactNode;
  requiredPerm?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ user, element, requiredPerm }) => {
  if (!user) return <Navigate to="/" replace />;
  if (requiredPerm && !can(user, requiredPerm)) {
    return (
      <div className="pt-32 container mx-auto px-6">
        <AccessRestricted permission={requiredPerm} />
      </div>
    );
  }
  return <>{element}</>;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === Theme.DARK || savedTheme === Theme.LIGHT) return savedTheme as Theme;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
      return Theme.DARK;
    return Theme.LIGHT;
  });
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [publicPostToDelete, setPublicPostToDelete] = useState<BlogPost | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [chatTarget, setChatTarget] = useState<ChatUser | null>(null);

  const { t, language, toggleLanguage } = useTranslation();
  const navigate = useNavigate();

  // 1. 核心初始化与鉴权
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        } catch (e) {
          apiService.logout();
        }
      }
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  // 2. 控制 Splash Screen 的隐藏逻辑（核心优化点）
  useEffect(() => {
    if (!isAuthChecking) {
      // 策略：核心数据（Auth）加载完成后，检查是否满足最小展示时长
      const MIN_LOADING_TIME = 1200; // 1.2秒，让 Logo 展示完整，不产生闪烁感
      const startTime = window.__APP_START_TIME__ || Date.now();
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

      const hideTimer = setTimeout(() => {
        document.body.classList.add('app-ready');
      }, remaining);

      return () => clearTimeout(hideTimer);
    }
  }, [isAuthChecking]);

  useEffect(() => {
    if (theme === Theme.DARK) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (user && !socket) {
      const newSocket = io(SOCKET_URL);
      // Fix: Cast to any to resolve 'on' not existing on Socket type
      (newSocket as any).on('connect', () => {
        newSocket.emit('USER_CONNECTED', {
          name: user.displayName,
          id: user._id,
          email: user.email,
          photoURL: user.photoURL
        });
      });
      // Fix: Cast to any to resolve 'on' not existing on Socket type
      (newSocket as any).on('NEW_NOTIFICATION', (data: any) => {
        if (data.type === 'private_message') toast.info(data.content);
        window.dispatchEvent(new CustomEvent('sys_notification', { detail: data }));
      });
      setSocket(newSocket);
    } else if (!user && socket) {
      socket.emit('LOGOUT');
      socket.disconnect();
      setSocket(null);
    }
    return () => {
      if (socket) socket.disconnect();
    };
  }, [user]);

  const handleLoginSuccess = (loggedInUser: User) => setUser(loggedInUser);

  const handleLogout = () => {
    apiService.logout();
    setUser(null);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('googleInfo');
    setIsLoginModalOpen(true);
    navigate('/');
  };

  const handleNavigateToChat = (targetUser: ChatUser) => {
    setChatTarget(targetUser);
    navigate('/chatroom');
  };

  const confirmPublicDelete = async () => {
    if (!publicPostToDelete) return;
    try {
      await apiService.deletePost(publicPostToDelete._id);
      setPublicPostToDelete(null);
      window.dispatchEvent(new Event('blog:refresh'));
    } catch (error) {}
  };

  const toggleTheme = () => setTheme((prev) => (prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT));

  // 此时不再返回 PageLoader，而是保持原位，Splash Screen 会在 body.app-ready 之前一直覆盖
  if (isAuthChecking) {
    return null;
  }

  return (
    <>
      <Routes>
        <Route
          element={
            <Layout
              user={user}
              socket={socket}
              theme={theme}
              toggleTheme={toggleTheme}
              onLogin={() => setIsLoginModalOpen(true)}
              onLogout={handleLogout}
              onNavigateToChat={handleNavigateToChat}
            />
          }
        >
          <Route
            path="/"
            element={
              <>
                <Helmet>
                  <title>Orion | Home</title>
                </Helmet>
                <Hero
                  onCtaClick={() => navigate('/blogs')}
                  onSecondaryCtaClick={() => navigate('/profile')}
                />
                <div id="console" className="pointer-events-auto">
                  <ResumeView
                    onNavigate={(page) => {
                      if (page === PageView.BLOG) navigate('/blogs');
                      else if (page === PageView.RESUME) navigate('/profile');
                      else if (page === PageView.CHAT) navigate('/chatroom');
                      else if (page === PageView.PROFILE) navigate('/user-profile');
                    }}
                    currentUser={user}
                    onLoginRequest={() => setIsLoginModalOpen(true)}
                  />
                </div>
              </>
            }
          />

          {/* BLOGS: Public Journal */}
          <Route
            path="/blogs"
            element={
              <BlogList
                onSelectBlog={(blog) => {
                  // 🔥 修改 1: 弃用中文标题拼接，直接使用纯 ID 跳转
                  // 这样生成的链接是 /blogs/694d...，与预渲染脚本完美匹配
                  navigate(`/blogs/${blog._id}`);
                }}
                isLoading={isLoadingBlogs}
                currentUser={user}
                onDeletePost={(blog) => setPublicPostToDelete(blog)}
              />
            }
          />

          {/* ARTICLE: SEO Friendly Route (Pure ID Mode) */}
          <Route
            // 🔥 修改 2: 将参数名从 :slug 改为 :id (语义更清晰)
            // 注意：请检查 ArticleView 组件内部，确保是用 useParams().id 来获取参数
            // 如果组件里写死了解构 const { slug } = useParams()，这里保持 :slug 也可以
            path="/blogs/:slug"
            element={
              <ArticleView
                onBack={() => navigate('/blogs')}
                onNavigateToBlog={(blog) => {
                  // 🔥 修改 3: 详情页内部的关联跳转也同步改为纯 ID
                  navigate(`/blogs/${blog._id}`);
                }}
                currentUser={user}
                onLoginRequest={() => setIsLoginModalOpen(true)}
              />
            }
          />
          <Route path="/profile" element={<PortfolioPage currentUser={user} />} />
          <Route
            path="/user-profile"
            element={
              <ProtectedRoute
                user={user}
                element={<UserProfile user={user!} onUpdateUser={setUser} />}
              />
            }
          />
          <Route
            path="/system-management"
            element={
              <ProtectedRoute
                user={user}
                element={<SystemManagement />}
                requiredPerm={PERM_KEYS.SYSTEM_ACCESS}
              />
            }
          />
          <Route
            path="/system-settings"
            element={
              <SettingsPage
                theme={theme}
                toggleTheme={toggleTheme}
                language={language}
                toggleLanguage={toggleLanguage}
              />
            }
          />
          <Route
            path="/audit-log"
            element={
              <ProtectedRoute
                user={user}
                element={<AuditLogViewer />}
                requiredPerm={PERM_KEYS.SYSTEM_LOGS}
              />
            }
          />
          <Route
            path="/footprints"
            element={
              <ProtectedRoute
                user={user}
                element={
                  <Suspense fallback={<PageLoader />}>
                    <FootprintSpace theme={theme} />
                  </Suspense>
                }
                requiredPerm={PERM_KEYS.FOOTPRINT_USE}
              />
            }
          />
          <Route
            path="/chatroom"
            element={
              <ProtectedRoute
                user={user}
                element={<ChatRoom currentUser={user!} socket={socket} targetUser={chatTarget} />}
              />
            }
          />
          <Route
            path="/captain-cabin"
            element={
              <ProtectedRoute
                user={user}
                requiredPerm={PERM_KEYS.PRIVATE_ACCESS}
                element={
                  <Suspense fallback={<PageLoader />}>
                    <PrivateSpaceDashboard user={user} />
                  </Suspense>
                }
              />
            }
          >
            <Route index element={<Navigate to="journal-space" replace />} />
            <Route
              path="journal-space"
              element={
                <Suspense fallback={<PageLoader />}>
                  <JournalSpace />
                </Suspense>
              }
            />
            <Route
              path="ai-space"
              element={
                <Suspense fallback={<PageLoader />}>
                  <SecondBrainSpace user={user} />
                </Suspense>
              }
            />
            <Route
              path="leisure-space"
              element={
                <Suspense fallback={<PageLoader />}>
                  <LeisureSpace user={user} />
                </Suspense>
              }
            />
            <Route
              path="capsule-gallery"
              element={
                <Suspense fallback={<PageLoader />}>
                  <PhotoGallery />
                </Suspense>
              }
            />
            <Route
              path="fitness-space"
              element={
                <Suspense fallback={<PageLoader />}>
                  <FitnessSpace currentUser={user} />
                </Suspense>
              }
            />
          </Route>
          <Route path="/403" element={<NoPermission />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      <DeleteModal
        isOpen={!!publicPostToDelete}
        onClose={() => setPublicPostToDelete(null)}
        onConfirm={confirmPublicDelete}
        title={t.delete.confirmTitle}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default App;
