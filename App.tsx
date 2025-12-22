
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { io, Socket } from 'socket.io-client';
import { Routes, Route, Navigate, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Header } from './components/Header';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Hero } from './components/Hero';
import { BlogList } from './components/BlogList';
import { CosmicBackground } from './components/CosmicBackground';
import { ScenicBackground } from './components/ScenicBackground';
import { ToastContainer, toast } from './components/Toast';
import { DeleteModal } from './components/DeleteModal';
import { UserProfile } from './components/UserProfile';
import { SettingsPage } from './components/SettingsPage';
import { ChatRoom } from './components/ChatRoom';
import { AuditLogViewer } from './components/AuditLogViewer';
import { PortfolioPage } from './components/PortfolioPage';
import { apiService } from './services/api';
import { Theme, PageView, User, BlogPost, ChatUser, PERM_KEYS, can } from './types';
import { useTranslation } from './i18n/LanguageContext';

// New Component Imports
import { LoginModal } from './components/LoginModal';
import { ArticleView } from './components/ArticleView';
import { ResumeView } from './components/ResumeView';
import { Footer } from './components/Footer';
import { PageLoader } from './components/PageLoader';
import { SystemManagement } from './components/SystemManagement';
import { AccessRestricted } from './components/AccessRestricted';
import { InstallPwa } from './components/InstallPwa';

// Lazy Load Heavy Components
const PrivateSpaceDashboard = lazy(() => import('./components/private/PrivateSpaceDashboard'));
const FootprintSpace = lazy(() => import('./components/FootprintSpace'));

// Lazy Load Private Sub-Spaces for explicit routing
const JournalSpace = lazy(() => import('./components/private/JournalSpace'));
const SecondBrainSpace = lazy(() => import('./components/private/SecondBrainSpace'));
const LeisureSpace = lazy(() => import('./components/private/LeisureSpace'));
const PhotoGallery = lazy(() => import('./components/private/PhotoGallery'));
const FitnessSpace = lazy(() => import('./components/private/FitnessSpace'));

const SOCKET_URL = 'https://bananaboom-api-242273127238.asia-east1.run.app';

declare global {
  interface Window {
    marked: any;
    hljs: any;
  }
}

// Layout Wrapper Component to handle common elements like Header, Background, Footer
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
  const mainBgClass = isPrivateSpace
    ? 'bg-gradient-to-br from-pink-200 via-rose-200 to-pink-200' 
    : theme === Theme.DARK ? 'bg-slate-950' : 'bg-transparent';

  // Helper to map path to PageView enum for Header highlight
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
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 selection:bg-primary-500/30 ${mainBgClass}`}>
      <ToastContainer />
      <InstallPwa />
      
      {!isPrivateSpace && (
        <>
          {theme === Theme.DARK ? <CosmicBackground theme={theme} /> : <ScenicBackground />}
        </>
      )}

      <Header 
        theme={theme}
        toggleTheme={toggleTheme}
        setPage={() => {}} // Not used with Router Links in Header
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

      <Footer currentPage={getCurrentPageView(location.pathname)} currentUser={user} />
      
      {/* Mobile Bottom Navigation */}
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
  if (!user) {
      // Not logged in -> Redirect to home (or could show login modal trigger)
      return <Navigate to="/" replace />;
  }
  if (requiredPerm && !can(user, requiredPerm)) {
      // Logged in but no permission -> Show Restricted Component
      return <div className="pt-32 container mx-auto px-6"><AccessRestricted permission={requiredPerm} /></div>;
  }
  return <>{element}</>;
};

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('app_theme');
    if (savedTheme === Theme.DARK || savedTheme === Theme.LIGHT) {
      return savedTheme as Theme;
    }
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return Theme.DARK;
    }
    return Theme.LIGHT;
  });
  const [user, setUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  
  // Public Blog State
  const [isLoadingBlogs, setIsLoadingBlogs] = useState(false);
  const [publicPostToDelete, setPublicPostToDelete] = useState<BlogPost | null>(null);
  
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  
  // Chat Navigation State
  const [chatTarget, setChatTarget] = useState<ChatUser | null>(null);

  const { t, language, toggleLanguage } = useTranslation();
  const navigate = useNavigate();

  // Initial Auth Check
  useEffect(() => {
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
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  // Theme Sync
  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Socket Connection
  useEffect(() => {
    if (user && !socket) {
      const newSocket = io(SOCKET_URL);
      newSocket.on('connect', () => {
        newSocket.emit('USER_CONNECTED', {
            name: user.displayName,
            id: user._id,
            email: user.email,
            photoURL: user.photoURL
        });
      });
      newSocket.on('NEW_NOTIFICATION', (data: any) => {
         if (data.type === 'private_message') {
             toast.info(data.content);
         }
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
    }
  }, [user]);

  // Handlers
  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

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
    } catch (error) {
      console.error("Failed to delete public post", error);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };

  if (isAuthChecking) {
    return <PageLoader />;
  }

  return (
    <>
      <Routes>
        <Route element={<Layout 
            user={user} 
            socket={socket} 
            theme={theme} 
            toggleTheme={toggleTheme} 
            onLogin={() => setIsLoginModalOpen(true)}
            onLogout={handleLogout}
            onNavigateToChat={handleNavigateToChat}
        />}>
          
          {/* Public Routes */}
          
          {/* ROOT: Console / Home */}
          <Route path="/" element={
            <>
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
          } />
          
          {/* BLOGS: Public Journal */}
          <Route path="/blogs" element={
             <BlogList 
                onSelectBlog={(blog) => {
                   const cleanTitle = blog.name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'post';
                   const slug = `${cleanTitle}-${blog._id}`;
                   navigate(`/blogs/${slug}`);
                }} 
                isLoading={isLoadingBlogs}
                currentUser={user}
                onDeletePost={(blog) => setPublicPostToDelete(blog)}
              />
          } />

          {/* ARTICLE: SEO Friendly Route */}
          <Route path="/blogs/:slug" element={
             <ArticleView 
                onBack={() => navigate('/blogs')}
                onNavigateToBlog={(blog) => {
                   const cleanTitle = blog.name.replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'post';
                   const slug = `${cleanTitle}-${blog._id}`;
                   navigate(`/blogs/${slug}`);
                }}
                currentUser={user}
                onLoginRequest={() => setIsLoginModalOpen(true)}
             />
          } />

          <Route path="/profile" element={<PortfolioPage currentUser={user} />} />

          {/* Authenticated Routes */}
          <Route path="/user-profile" element={<ProtectedRoute user={user} element={<UserProfile user={user!} onUpdateUser={setUser} />} />} />
          
          <Route path="/system-management" element={<ProtectedRoute user={user} element={<SystemManagement />} requiredPerm={PERM_KEYS.SYSTEM_ACCESS} />} />
          
          <Route path="/system-settings" element={<SettingsPage theme={theme} toggleTheme={toggleTheme} language={language} toggleLanguage={toggleLanguage} />} />
          
          <Route path="/audit-log" element={<ProtectedRoute user={user} element={<AuditLogViewer />} requiredPerm={PERM_KEYS.SYSTEM_LOGS} />} />

          <Route path="/footprints" element={<ProtectedRoute user={user} element={<Suspense fallback={<PageLoader />}><FootprintSpace theme={theme} /></Suspense>} requiredPerm={PERM_KEYS.FOOTPRINT_USE} />} />
          
          <Route path="/chatroom" element={<ProtectedRoute user={user} element={<ChatRoom currentUser={user!} socket={socket} targetUser={chatTarget} />} />} />

          {/* Private Space (Captain Cabin) */}
          <Route path="/captain-cabin" element={
             <ProtectedRoute 
                user={user}
                requiredPerm={PERM_KEYS.PRIVATE_ACCESS}
                element={
                  <Suspense fallback={<PageLoader />}>
                     <PrivateSpaceDashboard user={user} />
                  </Suspense>
                }
             />
          }>
             <Route index element={<Navigate to="journal-space" replace />} />
             <Route path="journal-space" element={<Suspense fallback={<PageLoader />}><JournalSpace /></Suspense>} />
             <Route path="ai-space" element={<Suspense fallback={<PageLoader />}><SecondBrainSpace user={user}/></Suspense>} />
             <Route path="leisure-space" element={<Suspense fallback={<PageLoader />}><LeisureSpace user={user}/></Suspense>} />
             <Route path="capsule-gallery" element={<Suspense fallback={<PageLoader />}><PhotoGallery /></Suspense>} />
             <Route path="fitness-space" element={<Suspense fallback={<PageLoader />}><FitnessSpace currentUser={user}/></Suspense>} />
          </Route>

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
