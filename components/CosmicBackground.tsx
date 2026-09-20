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

export const CosmicBackground: React.FC<CosmicBackgroundProps> = React.memo(
  ({ theme = Theme.DARK }) => {
    const isDark = theme === Theme.DARK;

    // Colors based on Theme - Adjusted for "Milky" Light Mode
    // Light Mode stars need to be visible against the creamy #fdfbf7 background
    const starColorSm = isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(168, 162, 158, 0.5)'; // Warm gray for small stars
    const starColorMd = isDark ? 'rgba(251, 191, 36, 0.4)' : 'rgba(217, 119, 6, 0.2)'; // Faint Amber
    const starColorLg = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(120, 113, 108, 0.6)'; // Darker Stone for large stars

    // OPTIMIZATION: Reduced star count by ~60% to lower GPU load and save battery
    // Small: 700 -> 300
    // Medium: 200 -> 80
    // Large: 100 -> 40
    const starsSmall = useMemo(() => generateBoxShadowStars(300, starColorSm), [starColorSm]);
    const starsMedium = useMemo(() => generateBoxShadowStars(80, starColorMd), [starColorMd]);
    const starsLarge = useMemo(() => generateBoxShadowStars(40, starColorLg), [starColorLg]);

    return (
      <div
        className={`fixed inset-0 z-0 overflow-hidden pointer-events-none transition-colors duration-700 ${isDark ? 'bg-[#02040a]' : 'bg-transparent'}`}
      >
        {/* 1. Distant Galaxies / Nebulae Layers */}
        <div className="absolute inset-0 transition-opacity duration-1000 opacity-60">
          {/* Dark Mode Nebulae */}
          <div
            className={`absolute top-0 left-0 w-[120vw] h-[120vw] -translate-x-1/4 -translate-y-1/4 rounded-full mix-blend-screen filter blur-[100px] animate-nebula-drift ${isDark ? 'bg-[radial-gradient(circle,rgba(76,29,149,0.15),transparent_70%)]' : 'bg-[radial-gradient(circle,rgba(251,191,36,0.08),transparent_70%)]'}`}
          ></div>

          <div
            className={`absolute bottom-0 right-0 w-[100vw] h-[100vw] translate-x-1/4 translate-y-1/4 rounded-full mix-blend-screen filter blur-[80px] animate-nebula-drift ${isDark ? 'bg-[radial-gradient(circle,rgba(14,165,233,0.1),transparent_70%)]' : 'bg-[radial-gradient(circle,rgba(244,63,94,0.05),transparent_70%)]'}`}
            style={{ animationDirection: 'reverse', animationDuration: '60s' }}
          ></div>

          {/* Central faint band (Milky Way suggestion) */}
          <div
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[40vh] transform rotate-45 mix-blend-screen filter blur-[60px] opacity-30 ${isDark ? 'bg-gradient-to-r from-transparent via-indigo-900/20 to-transparent' : 'bg-gradient-to-r from-transparent via-orange-100/40 to-transparent'}`}
          ></div>
        </div>

        {/* 2. Star Fields - Seamless Loop Animation */}
        {/* We duplicate the star layers to create an infinite scroll effect using translateY */}
        <div className="text-white transition-colors duration-700 will-change-transform opacity-100 relative z-0">
          {/* SMALL STARS */}
          <div className="absolute inset-0 animate-rise-loop">
            <div className="stars-sm" style={{ boxShadow: starsSmall }}></div>
          </div>
          <div className="absolute inset-0 animate-rise-loop" style={{ top: '100%' }}>
            <div className="stars-sm" style={{ boxShadow: starsSmall }}></div>
          </div>

          {/* MEDIUM STARS - Slower */}
          <div className="absolute inset-0 animate-rise-loop-slow">
            <div className="stars-md" style={{ boxShadow: starsMedium }}></div>
          </div>
          <div className="absolute inset-0 animate-rise-loop-slow" style={{ top: '100%' }}>
            <div className="stars-md" style={{ boxShadow: starsMedium }}></div>
          </div>

          {/* LARGE STARS - Slowest */}
          <div className="absolute inset-0 animate-rise-loop-slower">
            <div className="stars-lg" style={{ boxShadow: starsLarge }}></div>
          </div>
          <div className="absolute inset-0 animate-rise-loop-slower" style={{ top: '100%' }}>
            <div className="stars-lg" style={{ boxShadow: starsLarge }}></div>
          </div>
        </div>

        {/* 3. The Astrolabe / Star Chart SVG - Central fixed (STATIC) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vh] h-[160vh] opacity-[0.1] pointer-events-none z-0">
          {/* Outer Ring */}
          <svg viewBox="0 0 1000 1000" className="w-full h-full transition-colors duration-700">
            {/* Main circles */}
            <circle
              cx="500"
              cy="500"
              r="498"
              fill="none"
              stroke={isDark ? '#f59e0b' : '#78716c'}
              strokeWidth="0.5"
              strokeDasharray="2 8"
            />
            <circle
              cx="500"
              cy="500"
              r="400"
              fill="none"
              stroke={isDark ? '#3b82f6' : '#a8a29e'}
              strokeWidth="0.5"
              opacity="0.5"
            />

            {/* Crosshairs */}
            <path
              d="M500,0 L500,1000 M0,500 L1000,500"
              stroke={isDark ? '#f59e0b' : '#78716c'}
              strokeWidth="0.2"
              opacity="0.3"
            />

            {/* Geometric decorative lines */}
            <path
              d="M500,500 L853,146"
              stroke={isDark ? '#f59e0b' : '#78716c'}
              strokeWidth="0.5"
              opacity="0.2"
            />
            <path
              d="M500,500 L146,146"
              stroke={isDark ? '#f59e0b' : '#78716c'}
              strokeWidth="0.5"
              opacity="0.2"
            />
            <path
              d="M500,500 L146,853"
              stroke={isDark ? '#f59e0b' : '#78716c'}
              strokeWidth="0.5"
              opacity="0.2"
            />
            <path
              d="M500,500 L853,853"
              stroke={isDark ? '#f59e0b' : '#78716c'}
              strokeWidth="0.5"
              opacity="0.2"
            />

            {/* Inner geometry */}
            <rect
              x="300"
              y="300"
              width="400"
              height="400"
              fill="none"
              stroke={isDark ? '#3b82f6' : '#a8a29e'}
              strokeWidth="0.5"
              opacity="0.3"
              transform="rotate(45 500 500)"
            />
          </svg>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110vh] h-[110vh] opacity-[0.15] pointer-events-none z-0">
          {/* Inner Ring (Reverse) */}
          <svg viewBox="0 0 1000 1000" className="w-full h-full transition-colors duration-700">
            <circle
              cx="500"
              cy="500"
              r="450"
              fill="none"
              stroke={isDark ? '#f59e0b' : '#57534e'}
              strokeWidth="0.8"
              strokeDasharray="10 10"
              opacity="0.4"
            />
            <circle
              cx="500"
              cy="500"
              r="200"
              fill="none"
              stroke={isDark ? '#ffffff' : '#44403c'}
              strokeWidth="0.5"
              opacity="0.2"
            />

            {/* Triangles */}
            <polygon
              points="500,100 846,700 154,700"
              fill="none"
              stroke={isDark ? '#3b82f6' : '#78716c'}
              strokeWidth="0.5"
              opacity="0.2"
            />
          </svg>
        </div>
      </div>
    );
  }
);
