import React from 'react';
import { 
  Layers, 
  Sparkles, 
  RotateCcw, 
  Grid, 
  Eye, 
  Compass,
  Zap,
  Lock,
  Unlock,
  Clock,
  Orbit,
  Globe
} from 'lucide-react';
import { ArmillaryProjectionMode } from './types';

export interface ArmillaryHeaderControlsProps {
  projectionMode: ArmillaryProjectionMode;
  onSelectMode: (mode: ArmillaryProjectionMode) => void;
  morphLambda: number;
  onMorphChange: (lambda: number) => void;
  showRays: boolean;
  onToggleRays: () => void;
  showStars: boolean;
  onToggleStars: () => void;
  showTympan: boolean;
  onToggleTympan: () => void;
  showRule: boolean;
  onToggleRule: () => void;
  onResetCamera: () => void;
  onSnapToPreset: (mode: ArmillaryProjectionMode, targetLambda: number) => void;
  isFreeReteMode?: boolean;
  onToggleFreeRete?: () => void;
  onSnapToNow?: () => void;
  apparentSolarHours?: number;
  exaggerateEccentricity?: boolean;
  onToggleEccentricity?: (val: boolean) => void;
}

export const ArmillaryHeaderControls: React.FC<ArmillaryHeaderControlsProps> = ({
  projectionMode,
  morphLambda,
  showRays,
  onToggleRays,
  showStars,
  onToggleStars,
  showTympan,
  onToggleTympan,
  showRule,
  onToggleRule,
  onResetCamera,
  onSnapToPreset,
  isFreeReteMode = false,
  onToggleFreeRete,
  onSnapToNow,
  apparentSolarHours,
  exaggerateEccentricity = false,
  onToggleEccentricity
}) => {
  const isOrbital = projectionMode === 'heliocentric' || projectionMode === 'geocentric';
  const is3D = projectionMode === '3D' || (morphLambda <= 0.05 && !isOrbital);

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3 mb-2 w-full select-none">
      {/* Title & Description */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            Gyro-Morph Armillary &amp; Astrolabe
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
            {projectionMode === 'heliocentric' 
              ? '☉ Heliocentric Orbit'
              : projectionMode === 'geocentric'
              ? '⊕ Geocentric Apparent'
              : is3D 
              ? '🌐 3D Spherical Lattice' 
              : `${projectionMode.toUpperCase()} Plate`}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
          Universal multi-model continuum: Keplerian Solar System ↔ 3D Celestial Armillary ↔ Historical Astrolabe Plates
        </p>
      </div>

      {/* Control Actions & Segmented Toggles */}
      <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-start xl:justify-end">
        {/* 6-Mode Segmented Pill Bar */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-mono overflow-x-auto">
          {/* 1. Heliocentric Orbit */}
          <button
            onClick={() => onSnapToPreset('heliocentric', 0.0)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              projectionMode === 'heliocentric'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Copernican Heliocentric Keplerian Orbit (Sun centered)"
          >
            <Orbit className="w-3 h-3" />
            <span>☉ Orbit</span>
          </button>

          {/* 2. Geocentric Apparent Orbit */}
          <button
            onClick={() => onSnapToPreset('geocentric', 0.0)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              projectionMode === 'geocentric'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Ptolemaic Geocentric Apparent Ecliptic Motion (Earth centered)"
          >
            <Globe className="w-3 h-3" />
            <span>⊕ Apparent</span>
          </button>

          {/* 3. 3D Armillary Sphere */}
          <button
            onClick={() => onSnapToPreset('3D', 0.0)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
              is3D && projectionMode === '3D'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="3D Spherical Celestial Armillary Sphere"
          >
            <Layers className="w-3 h-3" />
            <span>🌐 Sphere</span>
          </button>

          {/* 4. Stereographic Conformal Rete */}
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

          {/* 5. Universal Rojas Orthographic */}
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

          {/* 6. Topocentric Horizon Stereonet */}
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

        {/* Exaggerated vs True Scale toggle when in orbital modes */}
        {isOrbital && onToggleEccentricity && (
          <div className="flex items-center bg-slate-950/90 p-1 rounded-xl border border-slate-800/80 text-xs font-mono">
            <button
              onClick={() => onToggleEccentricity(!exaggerateEccentricity)}
              className={`px-2 py-1 rounded-lg text-[11px] transition-all cursor-pointer ${
                exaggerateEccentricity 
                  ? 'bg-indigo-600 text-white font-bold' 
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle True Scale (e=0.0167) vs Exaggerated Eccentricity (e=0.25)"
            >
              {exaggerateEccentricity ? 'Exaggerated (e=0.25)' : 'True Scale (1x)'}
            </button>
          </div>
        )}

        {/* Morph Slider Bar */}
        <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800/80 text-xs font-mono">
          <span className="text-[10px] uppercase text-slate-400 font-bold">Morph λ:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={morphLambda}
            draggable={false}
            onDragStart={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onChange={(e) => onSnapToPreset(projectionMode, parseFloat(e.target.value))}
            className="w-20 sm:w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            title="Continuous 3D to 2D morph parameter λ"
          />
          <span className="text-[11px] font-bold text-amber-400 w-8 text-right">
            {Math.round(morphLambda * 100)}%
          </span>
        </div>

        {/* Rete Clock Sync vs Free Solver Segmented Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-950/90 p-1 rounded-xl border border-slate-800/80 text-xs font-mono">
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            {/* Clock Sync Option */}
            <button
              onClick={() => isFreeReteMode && onToggleFreeRete?.()}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                !isFreeReteMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Lock Rete to Live Astronomical Sidereal Clock"
            >
              <Lock className="w-3 h-3" />
              <span className="text-[11px]">Clock Sync</span>
            </button>

            {/* Free Solver Option */}
            <button
              onClick={() => !isFreeReteMode && onToggleFreeRete?.()}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                isFreeReteMode
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Unlock Rete to freely drag and solve Apparent Solar Time"
            >
              <Unlock className="w-3 h-3" />
              <span className="text-[11px]">Free Solver</span>
            </button>
          </div>

          {/* Snap to Now Button when in Free Solver Mode */}
          {isFreeReteMode && onSnapToNow && (
            <button
              onClick={onSnapToNow}
              className="px-2 py-1 rounded-lg bg-indigo-600/90 hover:bg-indigo-500 text-white text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 shadow-sm"
              title="Snap Rete back to current live astronomical time"
            >
              <Clock className="w-2.5 h-2.5" />
              <span>Snap Now</span>
            </button>
          )}

          {/* Solved Apparent Solar Time Badge */}
          {isFreeReteMode && apparentSolarHours !== undefined && (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-md" title="Solved Local Apparent Solar Time">
              ☉ {Math.floor(apparentSolarHours).toString().padStart(2, '0')}:{Math.floor((apparentSolarHours % 1) * 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>

        {/* Feature Toggles */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs">
          <button
            onClick={onToggleRays}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              showRays ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Volumetric Laser Projection Rays &amp; Cones"
          >
            <Zap className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleStars}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              showStars ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 12 Navigational Stars"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleTympan}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              showTympan ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Tympan Almucantars (Altitude Circles)"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleRule}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              showRule ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Interactive Astrolabe Rule / Alidade Sighting Arm"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onResetCamera}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Reset 3D Camera Orientation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
