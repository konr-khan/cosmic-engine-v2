import React from 'react';

export const ArmillaryDefs: React.FC = () => {
  return (
    <defs>
      {/* Radial Gradient for Outer Brass Mater Rim */}
      <radialGradient id="brassRim" cx="50%" cy="50%" r="50%">
        <stop offset="85%" stopColor="#1e293b" stopOpacity="0.8" />
        <stop offset="96%" stopColor="#451a03" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
      </radialGradient>

      {/* Glow Filters */}
      <filter id="sunGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="ringGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id="laserGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <linearGradient id="laserConeGradient" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
      </linearGradient>
    </defs>
  );
};
