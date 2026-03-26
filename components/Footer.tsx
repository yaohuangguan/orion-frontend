import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/LanguageContext';
import { PageView, User, PERM_KEYS, can } from '../types';

interface FooterProps {
  currentPage: PageView;
  currentUser?: User | null;
  onLogin?: () => void;
}

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

export const Footer: React.FC<FooterProps> = ({ currentPage, currentUser, onLogin }) => {
  const { t, language } = useTranslation();

  const hasAccess = can(currentUser, PERM_KEYS.PRIVATE_ACCESS);

  return (
    <footer
      className={`relative overflow-hidden mt-20 transition-colors z-10 pointer-events-auto ${
        currentPage === PageView.PRIVATE_SPACE
          ? 'bg-rose-900/5 text-rose-900/50 border-t border-rose-900/5 py-16'
          : 'bg-[#0b0f17] text-slate-400 border-t border-slate-800/50 pt-20 pb-12'
      }`}
    >
      {/* Public Footer Star Chart Background */}
      {currentPage !== PageView.PRIVATE_SPACE && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <svg
            viewBox="0 0 1000 1000"
            className="w-full h-full text-slate-500"
            preserveAspectRatio="none"
          >
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      )}

      {currentPage === PageView.PRIVATE_SPACE ? (
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="flex flex-col items-center justify-center gap-3 font-display font-bold text-2xl text-rose-400">
            {hasAccess ? (
              <div className="flex items-center gap-3">
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
              <div className="text-xl opacity-80">
                {language === 'zh' ? '欢迎来到舰长室' : "Welcome to the Captain's Cabin"}
              </div>
            )}
          </div>
          <p className="mt-4 text-xs font-mono opacity-50 uppercase tracking-widest">
            {t.footer.rights}
          </p>
        </div>
      ) : (
        <div className="container mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 mb-16">
            {/* Column 1: Brand */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <h2 className="font-display font-bold text-2xl tracking-widest uppercase text-slate-100">
                  Orion
                </h2>
                <div className="h-1 w-8 bg-amber-500 mt-2 rounded-full"></div>
              </div>
              <p className="text-sm leading-relaxed text-slate-500 mb-6 max-w-sm">
                {t.footer.tagline}
              </p>
              <div className="flex gap-4">
                <a
                  href="https://github.com/yaohuangguan"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
                >
                  <i className="fab fa-github"></i>
                </a>
                <a
                  href="https://www.linkedin.com/in/sam-y-54828a140/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-blue-600 transition-all"
                >
                  <i className="fab fa-linkedin-in"></i>
                </a>
                <a
                  href="mailto:moviegoer24@gmail.com"
                  className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-600 transition-all"
                >
                  <i className="fas fa-envelope"></i>
                </a>
              </div>
            </div>

            {/* Column 2: Navigation */}
            <div className="lg:col-span-1 lg:pl-10">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-6">
                Explore
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/"
                    className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-chevron-right text-[8px] opacity-30"></i> {t.header.home}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blogs"
                    className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-chevron-right text-[8px] opacity-30"></i> {t.header.blog}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-chevron-right text-[8px] opacity-30"></i>{' '}
                    {t.portfolio.title}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/footprints"
                    className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-chevron-right text-[8px] opacity-30"></i>{' '}
                    {t.header.footprint}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Resources */}
            <div className="lg:col-span-1">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-6">
                Resources
              </h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    to="/profile"
                    className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-file-alt text-[10px] opacity-50 w-4"></i>{' '}
                    {t.portfolio.resume}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/profile"
                    className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-laptop-code text-[10px] opacity-50 w-4"></i>{' '}
                    {t.portfolio.projects}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/blogs"
                    className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                  >
                    <i className="fas fa-rss text-[10px] opacity-50 w-4"></i> RSS Feed
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: System */}
            <div className="lg:col-span-1">
              <h3 className="font-bold text-slate-200 uppercase tracking-wider text-xs mb-6">
                System
              </h3>
              <ul className="space-y-3 text-sm">
                {currentUser ? (
                  <>
                    <li>
                      <Link
                        to="/user-profile"
                        className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                      >
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>{' '}
                        {t.header.profile}
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/system-settings"
                        className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                      >
                        <i className="fas fa-cog text-[10px] opacity-50 w-4"></i>{' '}
                        {t.header.settings}
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <button
                      onClick={onLogin}
                      className="text-slate-500 hover:text-amber-500 transition-colors flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 bg-slate-600 rounded-full"></span>{' '}
                      {t.header.signIn}
                    </button>
                  </li>
                )}
                <li>
                  <div className="flex items-center gap-2 text-slate-600 cursor-default">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span>System Optimal</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t border-slate-800/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-center md:text-left">
              <p className="text-xs text-slate-600 font-mono">{t.footer.rights}</p>
              <span className="hidden md:inline-block text-slate-800 dark:text-slate-700">|</span>

              {/* Premium Titanium/Gunmetal Text Design - Low key & High end
                      - Gradient: Slate 600 -> Slate 400 -> Slate 600 (Light Mode)
                      - Gradient: Slate 500 -> Slate 300 -> Slate 500 (Dark Mode)
                      - Effect: Matte metallic finish, precise industrial feel
                  */}
              <div className="relative group cursor-default">
                <p className="relative text-xs font-black font-display uppercase tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600 dark:from-slate-500 dark:via-slate-300 dark:to-slate-500 transition-all duration-700 group-hover:tracking-[0.4em] select-none opacity-90 group-hover:opacity-100">
                  {t.footer.strengthHonor}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono">
              <span>Built with Strength, Pride</span>
              <i className="fas fa-heart text-rose-800 animate-pulse"></i>
              <span>& Honor by Sam Yao</span>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};
