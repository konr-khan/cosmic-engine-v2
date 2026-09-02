/**
 * @file MiniGlobeFlat.tsx
 * Sub-renderer for 2D flattened Astrolabe plate pin view mode ('flat').
 */

import React from 'react';

export interface MiniGlobeFlatProps {
  safeRadius: number;
}

export const MiniGlobeFlat: React.FC<MiniGlobeFlatProps> = ({ safeRadius }) => {
  return (
    <g className="miniglobe-flat">
      <circle cx="0" cy="0" r={safeRadius} fill="#b45309" stroke="#78350f" strokeWidth="0.75" />
      <circle cx="0" cy="0" r={safeRadius * 0.82} fill="#0f172a" stroke="#38bdf8" strokeWidth="0.5" />
      <circle cx="0" cy="0" r={safeRadius * 0.38} fill="#38bdf8" className="animate-pulse" />
      <line x1={-safeRadius * 0.6} y1="0" x2={safeRadius * 0.6} y2="0" stroke="#78350f" strokeWidth="0.5" />
      <line x1="0" y1={-safeRadius * 0.6} x2="0" y2={safeRadius * 0.6} stroke="#78350f" strokeWidth="0.5" />
    </g>
  );
};

export default MiniGlobeFlat;
