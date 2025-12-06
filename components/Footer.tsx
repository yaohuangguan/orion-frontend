
import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { PageView } from '../types';

interface FooterProps {
  currentPage: PageView;
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

export const Footer: React.FC<FooterProps> = ({ currentPage }) => {
  const { t } = useTranslation();

  return (
    <footer className={`relative overflow-hidden mt-20 transition-colors z-10 pointer-events-auto ${
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
  );
};
