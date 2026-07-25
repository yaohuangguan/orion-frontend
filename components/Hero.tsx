
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { apiService } from '../services/api';

interface HeroProps {
  onCtaClick: () => void;
  onSecondaryCtaClick?: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onCtaClick, onSecondaryCtaClick }) => {
  const { t } = useTranslation();
  const [likes, setLikes] = useState<number>(0);
  const [homeId, setHomeId] = useState<string | null>(null);
  const [hearts, setHearts] = useState<Array<{ id: number; left: number; sway: string; rotate: string; emoji: string }>>([]);
  const [showThanks, setShowThanks] = useState(false);

  const pendingLikesRef = useRef<number>(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchLikes = async () => {
      try {
        const data = await apiService.getHomeLikes();
        if (data && data.length > 0) {
          setLikes(data[0].likes);
          setHomeId(data[0]._id);
        }
      } catch (e) {
        console.error("Failed to fetch likes", e);
      }
    };
    fetchLikes();

    // Cleanup timer on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleLike = () => {
    if (!homeId) return;

    try {
      // 1. Instant frontend increment
      setLikes((prev) => prev + 1);

      // 2. Launch floating heart/emoji effect
      const emojis = [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '💖', '💝', // Different hearts
        '😀', '😍', '😎', '🥳', '🥰', '😂', // Smiley and react faces
        '🔥', '✨', '🎉', '👍', '🌟', '🚀'  // Hype effects
      ];
      const newHeart = {
        id: Date.now() + Math.random(),
        left: Math.random() * 60 - 30, // Random X offset
        sway: `${Math.random() * 50 - 25}px`, // Sway displacement
        rotate: `${Math.random() * 80 - 40}deg`, // Rotate angle
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      };
      setHearts((prev) => [...prev, newHeart]);

      setShowThanks(true);

      // 3. Accumulate pending likes
      pendingLikesRef.current += 1;

      // 4. Debounce API call (Wait 1.2s of inactivity, then send batch request)
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const countToSend = pendingLikesRef.current;
        pendingLikesRef.current = 0; // Reset pool
        try {
          await apiService.addHomeLikesBatch(homeId, countToSend);
        } catch (err) {
          console.error("Failed to send batch likes", err);
        }
        setShowThanks(false);
      }, 1200);

    } catch (e) {
      console.error("Like failed", e);
    }
  };

  const removeHeart = (id: number) => {
    setHearts((prev) => prev.filter((h) => h.id !== id));
  };

  return (
    <section className="relative pt-40 pb-24 md:pt-60 md:pb-48 overflow-hidden min-h-[90vh] flex items-center justify-center pointer-events-none">
      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 text-center max-w-5xl pointer-events-auto">
        
        {/* Status & Like Container - Flex column to hold the message without layout shift */}
        <div className="relative mb-12 flex flex-col items-center">
          <div className="flex flex-wrap justify-center items-center gap-4">
            {/* HUD-style Status Badge - Adapts to Primary Theme */}
            <div className="inline-flex items-center gap-4 px-6 py-2 rounded-full border border-primary-500/20 bg-slate-900/5 dark:bg-black/40 backdrop-blur-md animate-fade-in group cursor-default shadow-[0_0_15px_rgba(var(--color-primary-500),0.1)]">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </div>
              <span className="text-xs font-mono font-bold uppercase tracking-[0.3em] text-primary-600 dark:text-primary-500/80 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors">
                {t.hero.status}
              </span>
            </div>

            {/* Like Button (No limit, Douyin Livestream effect) */}
            {homeId && (
              <div className="relative">
                {/* Floating Hearts Area */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-48 h-72 pointer-events-none overflow-hidden z-50 flex items-end justify-center pb-2">
                  {hearts.map((heart) => (
                    <span
                      key={heart.id}
                      className="absolute animate-heart-float text-3xl select-none"
                      style={{
                        left: `calc(50% + ${heart.left}px)`,
                        '--sway-x': heart.sway,
                        '--rotate-deg': heart.rotate,
                        textShadow: '0 2px 12px rgba(0,0,0,0.15)'
                      } as React.CSSProperties}
                      onAnimationEnd={() => removeHeart(heart.id)}
                    >
                      {heart.emoji}
                    </span>
                  ))}
                </div>

                <button 
                  onClick={handleLike}
                  className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 animate-fade-in shadow-sm hover:shadow-lg hover:shadow-pink-500/25"
                  title="Send Love"
                >
                  <i className="fas fa-heart text-sm transition-transform duration-300 group-hover:scale-110"></i>
                  <span className="text-xs font-mono font-bold">{likes}</span>
                </button>
              </div>
            )}
          </div>

          {/* Thank You Message - Absolute positioned to prevent layout shift */}
          <div className={`absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs font-bold text-pink-500 uppercase tracking-widest transition-opacity duration-500 ${showThanks ? 'opacity-100' : 'opacity-0'}`}>
             Thank you! ❤
          </div>
        </div>

        {/* Global Keyframes styling for Douyin Live floating heart effect */}
        <style>{`
          @keyframes heartFloat {
            0% {
              transform: translateY(0) scale(0.6) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(-260px) translateX(var(--sway-x)) scale(1.4) rotate(var(--rotate-deg));
              opacity: 0;
            }
          }
          .animate-heart-float {
            animation: heartFloat 1.2s cubic-bezier(0.215, 0.61, 0.355, 1) forwards;
          }
        `}</style>

        {/* Main Title - Adapts Gradient */}
        <h1 className="font-display font-bold text-6xl md:text-8xl lg:text-9xl tracking-tighter text-slate-900 dark:text-white mb-10 leading-[0.9] animate-slide-up drop-shadow-2xl">
          <span className="block text-slate-900 dark:text-slate-100">{t.hero.title1}</span>
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 dark:from-primary-200 dark:via-primary-500 dark:to-primary-600 animate-gradient-x pb-2">
            {t.hero.title2}
          </span>
        </h1>

        <div className="w-24 h-1 bg-primary-500/50 mx-auto mb-10 rounded-full blur-[1px]"></div>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-14 max-w-2xl mx-auto leading-relaxed animate-slide-up font-light tracking-wide" style={{ animationDelay: '0.1s' }}>
          {t.hero.introPrefix}
          <strong className="text-slate-900 dark:text-white font-semibold relative inline-block mx-1">
            {t.hero.introName}
            <span className="absolute bottom-0 left-0 w-full h-[1px] bg-primary-500/50"></span>
          </strong>
          {t.hero.introSuffix}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button 
            onClick={onCtaClick}
            className="group relative w-full sm:w-auto px-10 py-5 bg-primary-500 text-white font-bold text-sm uppercase tracking-[0.15em] transition-all hover:bg-primary-600 hover:shadow-[0_0_30px_rgba(var(--color-primary-500),0.4)] clip-path-polygon"
          >
            <span className="relative z-10 flex items-center gap-2">
              {t.hero.ctaPrimary} <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </span>
          </button>
          
          <button 
            onClick={onSecondaryCtaClick || (() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' }))}
            className="w-full sm:w-auto px-10 py-5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 font-bold text-sm uppercase tracking-[0.15em] hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white hover:border-primary-500/30 transition-all backdrop-blur-sm"
          >
            {t.hero.ctaSecondary}
          </button>
        </div>
      </div>
    </section>
  );
};
