import React, { useState, useEffect } from 'react';
import { Theme, PageView, User, AuditLog } from '../types';
import { useTranslation } from '../i18n/LanguageContext';
import { io } from 'socket.io-client';

interface HeaderProps {
  theme: Theme;
  toggleTheme: () => void;
  setPage: (page: PageView) => void;
  currentPage: PageView;
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

const SOCKET_URL = 'https://bananaboom-api-242273127238.asia-east1.run.app';

export const Header: React.FC<HeaderProps> = ({ 
  theme, 
  toggleTheme,
  setPage, 
  currentPage: currentPage,
  currentUser,
  onLogin,
  onLogout
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Notification States
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const { t, language, toggleLanguage } = useTranslation();

  // Socket Listener for NEW_OPERATION_LOG
  useEffect(() => {
    // Connect to socket regardless, but handle logic inside
    const socket = io(SOCKET_URL);
    
    socket.on('connect', () => {
      // console.log("Header Socket Connected");
    });

    socket.on('NEW_OPERATION_LOG', (data: { message: string, log: AuditLog }) => {
      // ONLY for VIPs
      if (currentUser?.vip) {
         setNotifications(prev => [data, ...prev]);
         setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]); // Re-run if user changes (e.g. login/logout)

  // OPTIMIZATION: Throttled scroll listener
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    setIsNotifOpen(false);
  };

  // Strict VIP Logic: Must be logged in, vip=true, and correct token
  const canAccessPrivateSpace = currentUser?.vip && currentUser?.private_token === 'ilovechenfangting';

  const navLinks = [
    { label: t.header.home, value: PageView.HOME, code: '01' },
    { label: t.header.blog, value: PageView.BLOG, code: '02' },
    { label: t.header.about, value: PageView.RESUME, code: '03' },
  ];

  if (currentUser) {
    navLinks.push({ label: t.header.chat, value: PageView.CHAT, code: '04' });
  }

  if (canAccessPrivateSpace) {
    navLinks.push({ label: t.header.privateSpace, value: PageView.PRIVATE_SPACE, code: '00' });
  }

  const isPrivate = currentPage === PageView.PRIVATE_SPACE;

  // Header Background Logic - High Contrast White/Pink for Private Space
  // Changed: Private space is now always semi-opaque white to ensure contrast against dark stars
  let headerClasses = `fixed w-full top-0 z-50 transition-all duration-500 `;
  if (isPrivate) {
    headerClasses += 'bg-white/90 border-b border-rose-200 backdrop-blur-md py-3 shadow-sm shadow-rose-100/50';
  } else {
    headerClasses += isScrolled
      ? 'bg-[#fdfbf7]/80 dark:bg-[#02040a]/90 backdrop-blur-md border-b border-slate-200/50 dark:border-white/5 py-3 shadow-sm' 
      : 'bg-transparent py-6';
  }

  return (
    <header className={headerClasses}>
      {/* Container - max-w-9xl approx (1600px) centered.
          Padding is set to px-6 to allow items to move closer to edges on laptops, preventing overlap with center nav.
      */}
      <div className="w-full px-6 max-w-[1600px] mx-auto flex justify-between items-center relative">
        {/* Logo - ps5.space */}
        <div 
          className="flex items-center gap-3 cursor-pointer group z-20 relative"
          onClick={() => setPage(PageView.HOME)}
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full blur-md transition-all duration-500 ${isPrivate ? 'bg-rose-400/60 group-hover:bg-rose-500/80' : 'bg-primary-500/20 group-hover:bg-primary-500/40'}`}></div>
            <div className={`relative w-full h-full rounded-full border flex items-center justify-center backdrop-blur-sm transition-colors ${isPrivate ? 'bg-rose-50 border-rose-200 group-hover:border-rose-300' : 'bg-white/50 dark:bg-black/50 border-slate-200 dark:border-white/20 group-hover:border-primary-500/50'}`}>
               <i className={`fas ${isPrivate ? 'fa-heart' : 'fa-satellite-dish'} text-sm ${isPrivate ? 'text-rose-500' : 'text-primary-500 dark:text-primary-400'}`}></i>
            </div>
          </div>
          <div className="flex flex-col">
            <span className={`font-mono text-xl tracking-[0.2em] uppercase transition-colors duration-300 ${isPrivate ? 'text-rose-600 group-hover:text-rose-500 font-bold' : 'text-slate-800 dark:text-white group-hover:text-primary-500 dark:group-hover:text-primary-400'}`}>
              ps5<span className={`${isPrivate ? 'text-rose-400' : 'text-slate-400 dark:text-white/40'}`}>.space</span>
            </span>
            {!isPrivate && <span className="text-[8px] font-mono text-slate-500 dark:text-slate-600 uppercase tracking-widest hidden sm:block">Deep Space Network</span>}
          </div>
        </div>

        {/* Desktop Nav - Keep XL breakpoint to prevent overlap */}
        <nav className="hidden xl:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
           <div className={`flex items-center gap-1 px-2 py-1.5 rounded-full border backdrop-blur-md transition-colors duration-500 ${isPrivate ? 'bg-white/50 border-rose-200' : 'bg-white/70 dark:bg-white/5 border-slate-200 dark:border-white/10 shadow-lg shadow-black/5'}`}>
            {navLinks.map((link) => {
              const isActive = currentPage === link.value;
              
              // Private Space Special Button
              if (link.value === PageView.PRIVATE_SPACE) {
                return (
                   <button
                    key={link.value}
                    onClick={() => setPage(link.value)}
                    className={`relative px-5 py-2 rounded-full transition-all duration-300 group ${
                      isActive 
                        ? 'bg-gradient-to-r from-rose-400 to-pink-500 text-white font-bold shadow-lg shadow-rose-400/30 transform scale-105' 
                        : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50'
                    }`}
                   >
                     <span className="text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                       <i className="fas fa-heart text-[8px]"></i> {link.label}
                     </span>
                   </button>
                );
              }

              // Sci-Fi Nav Items
              return (
                <button
                  key={link.value}
                  onClick={() => setPage(link.value)}
                  className={`relative px-4 py-2 group rounded-full transition-all duration-300 overflow-hidden flex flex-col items-center justify-center min-w-[100px] ${
                    isActive 
                      ? 'bg-primary-500/10 dark:bg-primary-900/20' 
                      : 'hover:bg-slate-100 dark:hover:bg-white/5'
                  }`}
                >
                  {/* Decorative bracket borders for Active State */}
                  {isActive && (
                    <>
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3 w-[2px] bg-primary-500 dark:bg-primary-400 rounded-r-sm"></span>
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 h-3 w-[2px] bg-primary-500 dark:bg-primary-400 rounded-l-sm"></span>
                    </>
                  )}

                  <div className="flex items-baseline gap-2 relative z-10">
                    <span className={`text-[9px] font-mono transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-500'}`}>{link.code}</span>
                    <span className={`text-xs font-bold font-mono tracking-widest uppercase transition-colors ${
                      isActive 
                        ? 'text-slate-900 dark:text-primary-100' 
                        : 'text-slate-700 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                    }`}>
                      {link.label}
                    </span>
                  </div>

                  {/* Active Indicator Dot */}
                  <span className={`absolute bottom-0.5 w-1 h-1 rounded-full bg-primary-500 dark:bg-primary-400 transition-all duration-300 ${isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-0 group-hover:opacity-50 group-hover:scale-75'}`}></span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Actions - Added High Z-Index to prevent blocking */}
        <div className="flex items-center gap-4 relative z-50">
          <button 
            onClick={toggleTheme} 
            className={`w-8 h-8 flex items-center justify-center transition-colors ${isPrivate ? 'text-rose-700 hover:text-rose-900' : 'text-slate-600 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400'}`}
            aria-label="Toggle Theme"
          >
            <i className={`fas ${theme === Theme.DARK ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          
          {/* Notification Bell (Everyone sees bell, but only VIPs get realtime alerts) */}
          {currentUser && (
             <div className="relative">
                <button 
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className={`w-8 h-8 flex items-center justify-center transition-colors relative ${isPrivate ? 'text-rose-700 hover:text-rose-900' : 'text-slate-600 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400'}`}
                >
                   <i className="fas fa-bell"></i>
                   {unreadCount > 0 && (
                     <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#050914]"></span>
                   )}
                </button>

                {/* Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 top-full mt-4 w-72 animate-fade-in z-50">
                     <div className={`backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden ${isPrivate ? 'bg-white/95 border-rose-200 shadow-rose-200/50' : 'bg-white/95 dark:bg-[#0f172a]/95 border-slate-200 dark:border-slate-700/50'}`}>
                        <div className={`p-3 border-b flex justify-between items-center ${isPrivate ? 'border-rose-100' : 'border-slate-200 dark:border-slate-700/50'}`}>
                           <span className={`text-xs font-bold uppercase tracking-wider ${isPrivate ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'}`}>{t.header.notifications}</span>
                           {notifications.length > 0 && (
                             <button onClick={handleClearNotifications} className="text-[10px] text-slate-500 hover:text-red-400">{t.header.clearAll}</button>
                           )}
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                           {notifications.length === 0 ? (
                              <div className="p-4 text-center text-slate-500 text-xs italic">{t.header.emptyNotifications}</div>
                           ) : (
                              notifications.map((n, idx) => (
                                <div key={idx} className={`p-3 border-b text-xs last:border-0 ${isPrivate ? 'border-rose-50 hover:bg-rose-50' : 'border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                                   <div className={`font-bold mb-1 ${isPrivate ? 'text-rose-700' : 'text-primary-600 dark:text-primary-400'}`}>System Alert</div>
                                   <div className={isPrivate ? 'text-slate-600' : 'text-slate-700 dark:text-slate-300'}>{n.message}</div>
                                   <div className="text-[10px] text-slate-500 mt-1">{new Date().toLocaleTimeString()}</div>
                                </div>
                              ))
                           )}
                        </div>
                     </div>
                  </div>
                )}
             </div>
          )}

          {currentUser ? (
            // Logged In Dropdown Menu - Keep XL breakpoint
            <div className={`hidden xl:block relative group border-l pl-4 ${isPrivate ? 'border-rose-200' : 'border-slate-200 dark:border-white/10'}`}>
              <button className="flex items-center gap-3 py-1 outline-none">
                 <div className={`w-8 h-8 rounded-full p-[1px] ${isPrivate ? 'bg-gradient-to-tr from-rose-300 to-pink-500' : 'bg-gradient-to-tr from-primary-400 to-primary-600'}`}>
                   <img 
                     src={currentUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.displayName)}&background=random`} 
                     alt="User" 
                     className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                   />
                 </div>
                 <span className={`text-xs font-mono max-w-[100px] truncate ${isPrivate ? 'text-rose-800 font-bold' : 'text-slate-700 dark:text-primary-500/80 group-hover:text-primary-600 dark:group-hover:text-primary-400'}`}>
                   {currentUser.displayName}
                 </span>
                 <i className={`fas fa-chevron-down text-[10px] transition-transform group-hover:rotate-180 ${isPrivate ? 'text-rose-600' : 'text-slate-400'}`}></i>
              </button>

              {/* Hover Dropdown */}
              <div className="absolute right-0 top-full pt-4 hidden group-hover:block w-56 animate-fade-in z-50">
                 <div className={`backdrop-blur-xl border rounded-xl shadow-2xl overflow-hidden ${isPrivate ? 'bg-white/95 border-rose-200 shadow-rose-200/50' : 'bg-white/95 dark:bg-[#0f172a]/95 border-slate-200 dark:border-slate-700/50'}`}>
                    <div className={`p-3 border-b ${isPrivate ? 'border-rose-100' : 'border-slate-200 dark:border-slate-700/50'}`}>
                      <p className={`text-xs font-mono uppercase tracking-wider mb-1 ${isPrivate ? 'text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>Signed in as</p>
                      <p className={`text-sm font-bold truncate ${isPrivate ? 'text-rose-900' : 'text-slate-900 dark:text-white'}`}>{currentUser.email}</p>
                    </div>
                    
                    <div className="p-1">
                      <button 
                        onClick={() => setPage(PageView.PROFILE)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${isPrivate ? 'text-rose-700 hover:bg-rose-50 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-primary-400'}`}
                      >
                         <i className="fas fa-id-card w-4 text-center"></i> {t.header.profile}
                      </button>
                      <button 
                        onClick={() => setPage(PageView.SETTINGS)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${isPrivate ? 'text-rose-700 hover:bg-rose-50 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-primary-400'}`}
                      >
                         <i className="fas fa-cog w-4 text-center"></i> {t.header.settings}
                      </button>
                      
                      {/* VIP ONLY: Audit Log Link */}
                      {currentUser.vip && (
                         <button 
                            onClick={() => setPage(PageView.AUDIT_LOG)}
                            className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 ${isPrivate ? 'text-rose-700 hover:bg-rose-50 font-medium' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-primary-400'}`}
                         >
                            <i className="fas fa-shield-alt w-4 text-center"></i> {t.header.audit}
                         </button>
                      )}
                    </div>

                    <div className={`p-1 border-t ${isPrivate ? 'border-rose-100 bg-rose-50/50' : 'border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-red-500/5'}`}>
                      <button 
                        onClick={onLogout}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-3 font-medium ${isPrivate ? 'text-rose-600 hover:bg-rose-100 hover:text-rose-800' : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300'}`}
                      >
                         <i className="fas fa-sign-out-alt w-4 text-center"></i> {t.header.signOut}
                      </button>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            // Keep XL breakpoint for login button
            <button 
              onClick={onLogin}
              className="hidden xl:flex items-center gap-2 px-6 py-2 rounded-full border border-primary-500/30 bg-primary-500/10 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-widest hover:bg-primary-500 hover:text-white transition-all duration-300 hover:shadow-[0_0_20px_rgba(14,165,233,0.4)]"
            >
              <i className="fas fa-terminal text-[10px]"></i>
              {t.header.signIn}
            </button>
          )}

          {/* Language Toggle - Moved to Right of User Profile/Login */}
          <button
            onClick={toggleLanguage}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-300 group
              ${isPrivate 
                ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100 hover:border-rose-300' 
                : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-white hover:border-primary-500 dark:hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 shadow-sm'
              }
            `}
            title={language === 'en' ? 'Switch to Chinese' : 'Switch to English'}
          >
            <i className={`fas fa-globe text-xs ${isPrivate ? 'text-rose-500' : 'text-slate-400 group-hover:text-primary-500'}`}></i>
            <span className="text-xs font-bold font-mono uppercase tracking-wider">
              {language === 'en' ? 'English' : '中文'}
            </span>
          </button>

          {/* Mobile Toggle - Keep XL breakpoint */}
          <button 
            className={`xl:hidden ${isPrivate ? 'text-rose-600' : 'text-slate-800 dark:text-white'}`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`xl:hidden absolute top-full left-0 w-full p-6 shadow-2xl animate-fade-in backdrop-blur-xl h-screen overflow-y-auto pb-32 ${isPrivate ? 'bg-white/95 border-b border-rose-200' : 'bg-[#fdfbf7] dark:bg-[#050914] border-b border-slate-200 dark:border-white/10'}`}>
          <div className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <button
                key={link.value}
                onClick={() => {
                  setPage(link.value);
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left text-lg font-mono uppercase tracking-widest ${
                  currentPage === link.value
                    ? (isPrivate ? 'text-rose-500 font-bold' : 'text-primary-600 dark:text-primary-400')
                    : (isPrivate ? 'text-slate-600' : 'text-slate-500 dark:text-slate-400')
                }`}
              >
                <span className="opacity-50 mr-2">{link.code}</span> {link.label}
              </button>
            ))}
            
            {/* Mobile User Options */}
            {currentUser && (
               <>
                 <div className={`border-t my-4 ${isPrivate ? 'border-rose-100' : 'border-slate-200 dark:border-white/10'}`}></div>
                 <button
                    onClick={() => { setPage(PageView.PROFILE); setIsMobileMenuOpen(false); }}
                    className={`text-left text-lg font-mono uppercase tracking-widest flex items-center gap-2 ${isPrivate ? 'text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <i className="fas fa-id-card text-xs"></i> {t.header.profile}
                  </button>
                  <button
                    onClick={() => { setPage(PageView.SETTINGS); setIsMobileMenuOpen(false); }}
                    className={`text-left text-lg font-mono uppercase tracking-widest flex items-center gap-2 ${isPrivate ? 'text-slate-600' : 'text-slate-500 dark:text-slate-400'}`}
                  >
                    <i className="fas fa-cog text-xs"></i> {t.header.settings}
                  </button>
                  
                  {currentUser.vip && (
                    <button
                      onClick={() => { setPage(PageView.AUDIT_LOG); setIsMobileMenuOpen(false); }}
                      className={`text-left text-lg font-mono uppercase tracking-widest flex items-center gap-2 ${isPrivate ? 'text-slate-600' : 'text-primary-600 dark:text-primary-400'}`}
                    >
                      <i className="fas fa-shield-alt text-xs"></i> {t.header.audit}
                    </button>
                  )}
               </>
            )}

            <div className={`pt-6 border-t mt-2 ${isPrivate ? 'border-rose-100' : 'border-slate-200 dark:border-white/10'}`}>
              {currentUser ? (
                <button 
                  onClick={onLogout}
                  className={`w-full py-3 text-center font-mono text-sm uppercase rounded ${isPrivate ? 'text-rose-500 border border-rose-200 bg-rose-50' : 'text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 bg-red-50 dark:bg-red-900/10'}`}
                >
                  {t.header.signOut}
                </button>
              ) : (
                <button 
                  onClick={onLogin}
                  className="w-full py-3 bg-primary-600 text-white font-bold uppercase tracking-widest text-sm"
                >
                  {t.header.signIn}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};