import React from 'react';
import { Orbit, Globe } from 'lucide-react';
import { ArmillaryProjectionMode } from '../types';

export interface ArmillaryModePillsProps {
  projectionMode: ArmillaryProjectionMode;
  morphLambda: number;
  onSnapToPreset: (mode: ArmillaryProjectionMode, targetLambda: number) => void;
  isNodalActive?: boolean;
  onToggleNodal?: () => void;
}

export const ArmillaryModePills: React.FC<ArmillaryModePillsProps> = ({
  projectionMode,
  morphLambda,
  onSnapToPreset,
  isNodalActive = false,
  onToggleNodal
}) => {
  const isOrbital = projectionMode === 'heliocentric';
  const is3D = projectionMode === 'geocentric' || (morphLambda <= 0.05 && !isOrbital);

  return (
    <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-mono overflow-x-auto">
      {/* 1. Heliocentric Orbit */}
      <button
        onClick={() => {
          if (isNodalActive && onToggleNodal) {
            onToggleNodal();
          } else {
            onSnapToPreset('heliocentric', 0.0);
          }
        }}
        className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
          projectionMode === 'heliocentric' && !isNodalActive
            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Copernican Heliocentric Keplerian Orbit (Sun centered)"
      >
        <Orbit className="w-3 h-3" />
        <span>☉ Orbit</span>
      </button>

      {/* 1b. Nodal Plane Alignment Pill */}
      {isOrbital && (
        <button
          onClick={onToggleNodal}
          className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
            isNodalActive
              ? 'bg-sky-500 text-slate-950 font-bold shadow-md shadow-sky-500/25 ring-1 ring-sky-300'
              : 'text-sky-400/80 hover:text-sky-200 hover:bg-slate-900/60'
          }`}
          title="Align camera to Lunar Nodal Plane (edge-on view of 5.145° orbital inclination)"
        >
          <span>☊ Nodal</span>
        </button>
      )}

      {/* 2. Geocentric Apparent & 3D Celestial Armillary Sphere */}
      <button
        onClick={() => onSnapToPreset('geocentric', 0.0)}
        className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
          projectionMode === 'geocentric'
            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Geocentric Apparent Motion & 3D Celestial Armillary Sphere (Earth centered)"
      >
        <Globe className="w-3 h-3" />
        <span>⊕ Apparent</span>
      </button>

      {/* 3. Stereographic Conformal Rete */}
      <button
        onClick={() => onSnapToPreset('stereographic', 1.0)}
        className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
          !is3D && projectionMode === 'stereographic'
            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Conformal Planispheric Astrolabe (Stereographic Rete &amp; Tympan)"
      >
        <span>🧭 Rete</span>
      </button>

      {/* 4. Universal Rojas Orthographic */}
      <button
        onClick={() => onSnapToPreset('rojas', 1.0)}
        className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
          !is3D && projectionMode === 'rojas'
            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Universal Rojas Orthographic Projection on Solstitial Colure"
      >
        <span>📐 Rojas</span>
      </button>

      {/* 5. Topocentric Horizon Stereonet */}
      <button
        onClick={() => onSnapToPreset('horizon', 1.0)}
        className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
          !is3D && projectionMode === 'horizon'
            ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Topocentric Horizon Stereonet (Zenith centered)"
      >
        <span>🔭 Horizon</span>
      </button>
    </div>
  );
};
