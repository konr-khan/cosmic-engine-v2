import React from 'react';

export interface ArmillaryDefsIds {
  brassRim: string;
  sunGlow: string;
  starGlow: string;
  ringGlow: string;
  laserGlow: string;
  laserConeGradient: string;
}

export const DEFAULT_ARMILLARY_DEFS_IDS: ArmillaryDefsIds = {
  brassRim: 'brassRim',
  sunGlow: 'sunGlow',
  starGlow: 'starGlow',
  ringGlow: 'ringGlow',
  laserGlow: 'laserGlow',
  laserConeGradient: 'laserConeGradient'
};

export interface ArmillaryDefsProps {
  defsIds?: ArmillaryDefsIds;
}

export const ArmillaryDefs: React.FC<ArmillaryDefsProps> = ({
  defsIds = DEFAULT_ARMILLARY_DEFS_IDS
}) => {
  return (
    <defs>
      {/* Radial Gradient for Outer Brass Mater Rim */}
      <radialGradient id={defsIds.brassRim} cx="50%" cy="50%" r="50%">
        <stop offset="85%" stopColor="#1e293b" stopOpacity="0.8" />
        <stop offset="96%" stopColor="#451a03" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#d97706" stopOpacity="1" />
      </radialGradient>

      {/* Glow Filters */}
      <filter id={defsIds.sunGlow} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id={defsIds.starGlow} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id={defsIds.ringGlow} x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="1.2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <filter id={defsIds.laserGlow} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <linearGradient id={defsIds.laserConeGradient} x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.05" />
      </linearGradient>
    </defs>
  );
};
