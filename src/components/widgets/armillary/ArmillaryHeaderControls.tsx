import React from 'react';
import { 
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
  showObserverCone?: boolean;
  onToggleObserverCone?: (show: boolean) => void;
}

export const ArmillaryHeaderControls: React.FC<ArmillaryHeaderControlsProps> = ({
  projectionMode,
  morphLambda,
  onMorphChange,
  showRays,
  onToggleRays,
  showStars,
  onToggleStars,
  showTympan,
  onToggleTympan,
  showRule,
  onToggleRule,
  showObserverCone = true,
  onToggleObserverCone,
  onResetCamera,
  onSnapToPreset,
  isFreeReteMode = false,
  onToggleFreeRete,
  onSnapToNow,
  apparentSolarHours,
  exaggerateEccentricity = false,
  onToggleEccentricity
}) => {
  const isOrbital = projectionMode === 'heliocentric';
  const is3D = projectionMode === 'geocentric' || (morphLambda <= 0.05 && !isOrbital);

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
              ? '⊕ Geocentric Armillary Sphere'
              : `${projectionMode.toUpperCase()} Plate`}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
          Universal multi-model continuum: Keplerian Solar System ↔ 3D Celestial Armillary ↔ Historical Astrolabe Plates
        </p>
      </div>

      {/* Control Actions & Segmented Toggles */}
      <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-start xl:justify-end">
        {/* 5-Mode Segmented Pill Bar */}
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

        {/* True Scale vs Exaggerated Eccentricity Segmented Toggle */}
        {isOrbital && onToggleEccentricity && (
          <div className="flex items-center bg-slate-950/90 p-0.5 rounded-xl border border-slate-800/80 text-[11px] font-mono">
            <button
              onClick={() => onToggleEccentricity(false)}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                !exaggerateEccentricity
                  ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="True Orbital Scale (e=0.0167)"
            >
              1× True
            </button>
            <button
              onClick={() => onToggleEccentricity(true)}
              className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                exaggerateEccentricity
                  ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Exaggerated Eccentricity (e=0.25)"
            >
              Exaggerated
            </button>
          </div>
        )}

        {/* Morph Slider Bar */}
        <div 
          className="flex items-center gap-2 bg-slate-950/90 px-3 py-1 rounded-xl border border-slate-800/80 text-xs font-mono select-none touch-none"
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
          onPointerMove={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] uppercase text-slate-400 font-bold whitespace-nowrap">Morph λ:</span>
          <div className="relative flex items-center h-7 w-20 sm:w-28 touch-none">
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
              onPointerUp={(e) => e.stopPropagation()}
              onPointerMove={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
              onInput={(e) => onMorphChange(parseFloat((e.target as HTMLInputElement).value))}
              onChange={(e) => onMorphChange(parseFloat((e.target as HTMLInputElement).value))}
              className="w-full h-2 rounded-full appearance-none cursor-grab active:cursor-grabbing touch-none border border-slate-700/60 focus:outline-none focus:ring-1 focus:ring-amber-400/50 [&::-webkit-slider-thumb]:w-4.5 [&::-webkit-slider-thumb]:h-4.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:hover:bg-amber-300 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:shadow-amber-400/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-amber-950 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:appearance-none [&::-moz-range-thumb]:w-4.5 [&::-moz-range-thumb]:h-4.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-amber-400 [&::-moz-range-thumb]:hover:bg-amber-300 [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-amber-950 [&::-moz-range-thumb]:cursor-grab [&::-moz-range-thumb]:active:cursor-grabbing"
              style={{
                background: `linear-gradient(to right, #f59e0b 0%, #f59e0b ${morphLambda * 100}%, #1e293b ${morphLambda * 100}%, #1e293b 100%)`
              }}
              title="Continuous 3D to 2D morph parameter λ (drag to smoothly blend)"
            />
          </div>
          <span className="text-[11px] font-bold text-amber-400 w-8 text-right font-mono tabular-nums">
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
            onClick={isOrbital ? () => onToggleObserverCone?.(!showObserverCone) : onToggleRays}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              (isOrbital ? showObserverCone : showRays) ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title={isOrbital ? "Toggle Observer Sky Cone (FOV)" : "Toggle Volumetric Laser Projection Rays & Cones"}
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
