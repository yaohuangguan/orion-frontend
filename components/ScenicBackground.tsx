import React from 'react';

export const ScenicBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#f8fafc] transition-colors duration-1000">
      {/* Subtle slate-blue vignette for depth */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_45%,rgba(148,163,184,0.04)_100%)]"></div>
    </div>
  );
};
