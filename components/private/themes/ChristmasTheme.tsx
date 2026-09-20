import React from 'react';

export const ChristmasTheme: React.FC = () => {
  // Generate static snowflake positions once
  const snowflakes = React.useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 80}%`, // Don't cover bottom elements
      size: Math.random() * 15 + 10,
      opacity: Math.random() * 0.6 + 0.2
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-gradient-to-b from-slate-900 via-[#1e1b4b] to-[#0f172a]">
      {/* Static Stars/Snow Background */}
      {snowflakes.map((flake, i) => (
        <div
          key={i}
          className="absolute text-white select-none"
          style={{
            left: flake.left,
            top: flake.top,
            fontSize: `${flake.size}px`,
            opacity: flake.opacity
          }}
        >
          ❄
        </div>
      ))}

      {/* Static Bottom Elements */}
      <div className="absolute bottom-0 left-[5%] md:left-[10%] text-[8rem] md:text-[10rem] opacity-90 drop-shadow-2xl select-none transform -translate-y-4">
        ⛄
      </div>

      <div className="absolute bottom-0 right-[5%] md:right-[10%] text-[8rem] md:text-[10rem] opacity-90 drop-shadow-2xl select-none transform -translate-y-4">
        🎄
      </div>

      {/* Static Santa in the sky */}
      <div className="absolute top-[15%] right-[20%] text-6xl md:text-8xl opacity-80 select-none transform rotate-12">
        🎅
      </div>
    </div>
  );
};
