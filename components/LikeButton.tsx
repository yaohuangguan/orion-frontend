import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';

export const LikeButton: React.FC = () => {
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

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleLike = () => {
    if (!homeId) return;

    try {
      setLikes((prev) => prev + 1);

      const emojis = [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '💖', '💝',
        '😀', '😍', '😎', '🥳', '🥰', '😂',
        '🔥', '✨', '🎉', '👍', '🌟', '🚀'
      ];
      const newHeart = {
        id: Date.now() + Math.random(),
        left: Math.random() * 60 - 30,
        sway: `${Math.random() * 50 - 25}px`,
        rotate: `${Math.random() * 80 - 40}deg`,
        emoji: emojis[Math.floor(Math.random() * emojis.length)]
      };
      setHearts((prev) => [...prev, newHeart]);
      setShowThanks(true);

      pendingLikesRef.current += 1;

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(async () => {
        const countToSend = pendingLikesRef.current;
        pendingLikesRef.current = 0;
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
    <div className="mt-8 flex flex-col items-center select-none">
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
            className="group flex items-center gap-2 px-5 py-2.5 rounded-full border border-pink-500/30 bg-pink-500/10 text-pink-500 hover:bg-pink-500 hover:text-white transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-lg hover:shadow-pink-500/25 pointer-events-auto"
            title="Send Love"
          >
            <i className="fas fa-heart text-sm transition-transform duration-300 group-hover:scale-110"></i>
            <span className="text-xs font-mono font-bold">{likes}</span>
          </button>
        </div>
      )}

      {/* Thank You Message */}
      <div className={`mt-2 text-xs font-bold text-pink-500 uppercase tracking-widest transition-opacity duration-500 h-4 ${showThanks ? 'opacity-100' : 'opacity-0'}`}>
        Thank you! ❤
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
    </div>
  );
};
