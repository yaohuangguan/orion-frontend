
import React, { useMemo } from 'react';
import { Theme } from '../types';

interface CosmicBackgroundProps {
  theme?: Theme;
}

const generateBoxShadowStars = (n: number, color: string) => {
  let value = `${Math.random() * 2000}px ${Math.random() * 2000}px ${color}`;
  for (let i = 2; i <= n; i++) {
    value += `, ${Math.random() * 2000}px ${Math.random() * 2000}px ${color}`;
  }
  return value;
};

export const CosmicBackground: React.FC<CosmicBackgroundProps> = React.memo(({ theme = Theme.DARK }) => {
  const isDark = theme === Theme.DARK;

  // Colors based on Theme - Adjusted for high contrast in Light Mode
  const starColorSm = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(71, 85, 105, 0.8)';
  const starColorMd = isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(51, 65, 85, 0.6)';
  const starColorLg = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(30, 41, 59, 0.8)';

  // OPTIMIZATION: Reduced star count by ~60% to lower GPU load and save battery
  // Small: 700 -> 300
  // Medium: 200 -> 80
  // Large: 100 -> 40
  const starsSmall = useMemo(() => generateBoxShadowStars(300, starColorSm), [starColorSm]);
  const starsMedium = useMemo(() => generateBoxShadowStars(80, starColorMd), [starColorMd]);
  const starsLarge = useMemo(() => generateBoxShadowStars(40, starColorLg), [starColorLg]);

  return (
    <div className={`fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-700 ${isDark ? 'bg-[#02040a]' : 'bg-slate-50'}`}>
      
      {/* 2. Star Fields - STATIC (No Animation) - Using Box Shadow technique */}
      <div className="text-white transition-colors duration-700 will-change-transform">
        <div className="absolute inset-0">
          <div className="stars-sm" style={{ boxShadow: starsSmall }}></div>
        </div>
        <div className="absolute inset-0">
           <div className="stars-md" style={{ boxShadow: starsMedium }}></div>
        </div>
        <div className="absolute inset-0">
          <div className="stars-lg" style={{ boxShadow: starsLarge }}></div>
        </div>
      </div>

      {/* 3. The Astrolabe / Star Chart SVG - Central fixed (STATIC) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vh] h-[160vh] opacity-[0.1] pointer-events-none">
        {/* Outer Ring */}
        <svg viewBox="0 0 1000 1000" className="w-full h-full transition-colors duration-700">
          {/* Main circles */}
          <circle cx="500" cy="500" r="498" fill="none" stroke={isDark ? "#f59e0b" : "#334155"} strokeWidth="0.5" strokeDasharray="2 8" />
          <circle cx="500" cy="500" r="400" fill="none" stroke={isDark ? "#3b82f6" : "#475569"} strokeWidth="0.5" opacity="0.5" />
          
          {/* Crosshairs */}
          <path d="M500,0 L500,1000 M0,500 L1000,500" stroke={isDark ? "#f59e0b" : "#334155"} strokeWidth="0.2" opacity="0.3" />
          
          {/* Geometric decorative lines */}
          <path d="M500,500 L853,146" stroke={isDark ? "#f59e0b" : "#334155"} strokeWidth="0.5" opacity="0.2" />
          <path d="M500,500 L146,146" stroke={isDark ? "#f59e0b" : "#334155"} strokeWidth="0.5" opacity="0.2" />
          <path d="M500,500 L146,853" stroke={isDark ? "#f59e0b" : "#334155"} strokeWidth="0.5" opacity="0.2" />
          <path d="M500,500 L853,853" stroke={isDark ? "#f59e0b" : "#334155"} strokeWidth="0.5" opacity="0.2" />
          
          {/* Inner geometry */}
          <rect x="300" y="300" width="400" height="400" fill="none" stroke={isDark ? "#3b82f6" : "#475569"} strokeWidth="0.5" opacity="0.3" transform="rotate(45 500 500)" />
        </svg>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110vh] h-[110vh] opacity-[0.15] pointer-events-none">
         {/* Inner Ring (Reverse) */}
         <svg viewBox="0 0 1000 1000" className="w-full h-full transition-colors duration-700">
            <circle cx="500" cy="500" r="450" fill="none" stroke={isDark ? "#f59e0b" : "#1e293b"} strokeWidth="0.8" strokeDasharray="10 10" opacity="0.4" />
            <circle cx="500" cy="500" r="200" fill="none" stroke={isDark ? "#ffffff" : "#0f172a"} strokeWidth="0.5" opacity="0.2" />
            
            {/* Triangles */}
            <polygon points="500,100 846,700 154,700" fill="none" stroke={isDark ? "#3b82f6" : "#334155"} strokeWidth="0.5" opacity="0.2" />
         </svg>
      </div>
    </div>
  );
});
