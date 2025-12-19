
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { io, Socket } from 'socket.io-client';
import { Header } from './components/Header';
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
import { Theme, PageView, User, BlogPost, PaginationData, ChatUser } from './types';
import { useTranslation } from './i18n/LanguageContext';

// New Component Imports
import { LoginModal } from './components/LoginModal';
import { ArticleView } from './components/ArticleView';
import { ResumeView } from './components/ResumeView';
import { Footer } from './components/Footer';
import { PageLoader } from './components/PageLoader';

// Lazy Load Heavy Components
const PrivateSpaceDashboard = lazy(() => import('./components/private/PrivateSpaceDashboard').then(module => ({ default: module.PrivateSpaceDashboard })));
const FootprintSpace = lazy(() => import('./components/FootprintSpace').then(module => ({ default: module.FootprintSpace })));

const SOCKET_URL = 'https://bananaboom-api-242273127238.asia-east1.run.app';

declare global {
  interface Window {
    marked: any;
    hljs: any;
  }
}

// --- App Content Component ---
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

  useEffect(() => {
    // 区分构建工具
    const ver = import.meta.env?.VITE_APP_VERSION
    
    if (ver) {
      console.log(
        `%c ✅ Deployed Version: ${ver.substring(0, 7)} `,
        'background:#333; color:#bada55; border-radius:4px; padding:4px;'
      );
    }
  }, []);


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
  // Search state for Private Blogs
  const [privateSearch, setPrivateSearch] = useState('');
  const [privateTag, setPrivateTag] = useState<string | null>(null);

  // Chat Target State
  const [chatTarget, setChatTarget] = useState<ChatUser | null>(null);

  const { t, language, toggleLanguage } = useTranslation();

  // Socket State
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
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
      handleLogoutCleanup();
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  // Socket Connection Effect
  useEffect(() => {
    if (user && !socket) {
      const newSocket = io(SOCKET_URL);
      
      newSocket.on('connect', () => {
        // Authenticate/Register User immediately with robust payload
        const userPayload = {
            name: user.displayName,
            id: user._id, // Ensure this matches user.id usage in backend
            email: user.email,
            photoURL: user.photoURL
        };
        newSocket.emit('USER_CONNECTED', userPayload);
      });

      // Global Listeners
      newSocket.on('NEW_NOTIFICATION', (data: any) => {
         if (data.type === 'private_message') {
             // Only toast if it's a private message notification
             toast.info(data.content);
         }
         // Dispatch event for Header to update its list
         window.dispatchEvent(new CustomEvent('sys_notification', { detail: data }));
      });
      
      setSocket(newSocket);
    } else if (!user && socket) {
      socket.emit('LOGOUT');
      socket.disconnect();
      setSocket(null);
    }
  }, [user]);

  // Cleanup on unmount
  useEffect(() => {
     return () => {
       if (socket) socket.disconnect();
     }
  }, [socket]);

  // Fetch private blogs ONLY when user logs in AND is on Private Space
  useEffect(() => {
    if (user && currentPage === PageView.PRIVATE_SPACE) {
      if (privateBlogs.length === 0) {
        fetchPrivateBlogs(1);
      } else {
        // Refresh current page
        fetchPrivateBlogs(privatePagination?.currentPage || 1);
      }
      
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
    if (publicBlogs.length === 0) {
      setIsLoadingBlogs(true);
    }
    
    try {
      const { data, pagination: paginationMeta } = await apiService.getPosts(page, 10, search, tag || '');
      setPublicBlogs(data);
      setPagination(paginationMeta);
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

  const fetchPrivateBlogs = async (page?: number, search?: string, tag?: string) => {
    // Resolve parameters, defaulting to current state if not provided
    const targetPage = page || privatePagination?.currentPage || 1;
    const targetSearch = search !== undefined ? search : privateSearch;
    const targetTag = tag !== undefined ? tag : privateTag;

    try {
      const { data, pagination: paginationMeta } = await apiService.getPrivatePosts(targetPage, 10, targetSearch, targetTag || '');
      setPrivateBlogs(data);
      setPrivatePagination(paginationMeta);
      
      // Update state
      setPrivateSearch(targetSearch);
      setPrivateTag(targetTag);
    } catch (error) {
      console.error("Failed to fetch private blogs (safely handled):", error);
      setPrivateBlogs([]);
    }
  };

  const handlePrivateFilterChange = (search: string, tag: string | null) => {
    // Always reset to page 1 when filtering explicitly changes
    fetchPrivateBlogs(1, search, tag || undefined);
  };

  useEffect(() => {
    if (theme === Theme.DARK) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === Theme.LIGHT ? Theme.DARK : Theme.LIGHT);
  };

  const handleLoginSuccess = (user: User) => {
    setUser(user);
    // fetchPrivateBlogs is triggered by useEffect on user change IF on private space
  };

  const handleLogoutCleanup = () => {
    setUser(null);
    setPrivateBlogs([]); 
    localStorage.removeItem('auth_token'); 
    localStorage.removeItem('googleInfo');
    setIsLoginModalOpen(true);
    setCurrentPage(PageView.HOME);
  };

  const handleLogout = () => {
    apiService.logout();
    handleLogoutCleanup();
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
    
    // Give time for view transition then scroll
    setTimeout(() => {
      const scrollTarget = selectedBlog?.isPrivate 
          ? document.querySelector('.private-feed-top') 
          : document.getElementById('latest-posts');
          
      if (scrollTarget) {
        scrollTarget.scrollIntoView({ behavior: 'smooth' });
      } else {
         window.scrollTo(0,0);
      }
    }, 100);
  };

  const handleNavigateToChat = (targetUser: ChatUser) => {
    setChatTarget(targetUser);
    setCurrentPage(PageView.CHAT);
  };

  const confirmPublicDelete = async () => {
    if (!publicPostToDelete) return;
    try {
      await apiService.deletePost(publicPostToDelete._id);
      setPublicPostToDelete(null);
      fetchPublicBlogs(pagination?.currentPage || 1); 
    } catch (error) {
      console.error("Failed to delete public post", error);
    }
  };
  
  const handlePublicLike = async (id: string) => {
    const isLiked = likedPosts.has(id);
    const newLikedPosts = new Set(likedPosts);
    
    try {
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
    }
  };

  // Determine main background class based on theme
  const mainBgClass = currentPage === PageView.PRIVATE_SPACE 
    ? 'bg-gradient-to-br from-pink-200 via-rose-200 to-pink-200' 
    : theme === Theme.DARK ? 'bg-slate-950' : 'bg-transparent';

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 selection:bg-primary-500/30 ${mainBgClass}`}>
      
      {/* Toast Container for Global Notifications */}
      <ToastContainer />

      {/* Delete Modal for Public Blogs */}
      <DeleteModal 
         isOpen={!!publicPostToDelete}
         onClose={() => setPublicPostToDelete(null)}
         onConfirm={confirmPublicDelete}
         title={t.delete.confirmTitle}
      />
      
      {/* Background Layer Logic */}
      {currentPage !== PageView.PRIVATE_SPACE && (
        <>
          {theme === Theme.DARK ? <CosmicBackground theme={theme} /> : <ScenicBackground />}
        </>
      )}

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
          if (page === PageView.FOOTPRINT && !user) {
             alert("Access Denied: Please Login.");
             return;
          }
          setCurrentPage(page);
          window.scrollTo(0, 0);
        }}
        currentPage={currentPage}
        currentUser={user}
        onLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        socket={socket}
        onNavigateToChat={handleNavigateToChat}
      />
      
      <main className="relative z-10 pointer-events-none">
        {currentPage === PageView.HOME && (
          <>
            <Hero onCtaClick={() => {
              setCurrentPage(PageView.BLOG);
              setTimeout(() => document.getElementById('latest-posts')?.scrollIntoView({ behavior: 'smooth' }), 100);
            }} />
            <div id="about" className="pointer-events-auto">
              <ResumeView 
                onNavigate={(page) => {
                   setCurrentPage(page);
                   window.scrollTo(0, 0);
                }} 
                currentUser={user} 
                onLoginRequest={() => setIsLoginModalOpen(true)} 
              />
            </div>
          </>
        )}
        
        {currentPage === PageView.PRIVATE_SPACE && (
          <div className="pointer-events-auto w-full">
            <Suspense fallback={<PageLoader />}>
              <PrivateSpaceDashboard 
                user={user} 
                blogs={privateBlogs} 
                onSelectBlog={handleSelectBlog}
                onRefresh={() => fetchPrivateBlogs(privatePagination?.currentPage || 1)}
                pagination={privatePagination}
                onPageChange={(p) => fetchPrivateBlogs(p)}
                onFilterChange={handlePrivateFilterChange}
                initialSearch={privateSearch}
              />
            </Suspense>
          </div>
        )}
        
        {currentPage === PageView.BLOG && (
          <div className="pointer-events-auto w-full min-h-screen">
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
          </div>
        )}

        {currentPage === PageView.ARTICLE && selectedBlog && (
          <div className="pointer-events-auto w-full min-h-screen">
            <ArticleView 
              blog={selectedBlog}
              // Pass the correct list depending on context
              allBlogs={selectedBlog.isPrivate ? privateBlogs : publicBlogs} 
              onBack={handleBackToBlog}
              onNavigateToBlog={handleSelectBlog}
              currentUser={user}
              onLoginRequest={() => setIsLoginModalOpen(true)}
            />
          </div>
        )}
        
        {currentPage === PageView.RESUME && (
          <div className="pointer-events-auto w-full min-h-screen">
            <PortfolioPage currentUser={user} />
          </div>
        )}

        {currentPage === PageView.PROFILE && user && (
          <div className="pointer-events-auto w-full min-h-screen">
            <UserProfile user={user} onUpdateUser={setUser} />
          </div>
        )}

        {currentPage === PageView.ARCHIVES && (
           <div className="pointer-events-auto w-full min-h-screen">
             <div className="p-20 text-center text-slate-500">Archives have been migrated to the new Profile page.</div>
           </div>
        )}
        
        {currentPage === PageView.CHAT && user && (
          <div className="pointer-events-auto w-full min-h-screen">
            <ChatRoom currentUser={user} socket={socket} targetUser={chatTarget} />
          </div>
        )}

        {currentPage === PageView.AUDIT_LOG && user?.vip && (
          <div className="pointer-events-auto w-full min-h-screen">
            <AuditLogViewer />
          </div>
        )}

        {currentPage === PageView.SETTINGS && (
          <div className="pointer-events-auto w-full min-h-screen">
            <SettingsPage 
              theme={theme} 
              toggleTheme={toggleTheme} 
              language={language}
              toggleLanguage={toggleLanguage}
            />
          </div>
        )}

        {currentPage === PageView.FOOTPRINT && user && (
          <div className="pointer-events-auto w-full min-h-screen">
             <Suspense fallback={<PageLoader />}>
                <FootprintSpace theme={theme} />
             </Suspense>
          </div>
        )}
      </main>

      <Footer currentPage={currentPage} />

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
