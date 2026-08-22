import React from 'react';
import { 
  Layers, 
  Sparkles, 
  RotateCcw, 
  Grid, 
  Eye, 
  Compass,
  Zap
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
  onSnapToPreset
}) => {
  const is3D = morphLambda <= 0.05;

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
            {is3D ? '3D Spherical Frame' : `${projectionMode.toUpperCase()} Plate`}
          </span>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">
          Continuous 60 FPS topological morph from 3D Celestial Armillary into Renaissance Astrolabe Projections
        </p>
      </div>

      {/* Control Actions & Segmented Toggles */}
      <div className="flex items-center gap-2 flex-wrap w-full xl:w-auto justify-start xl:justify-end">
        {/* Projection Mode Segmented Pill */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-mono">
          <button
            onClick={() => onSnapToPreset('stereographic', 0.0)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer ${
              is3D
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="3D Spherical Celestial Armillary Sphere"
          >
            <Layers className="w-3 h-3" />
            <span>3D Sphere</span>
          </button>

          <button
            onClick={() => onSnapToPreset('stereographic', 1.0)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer ${
              !is3D && projectionMode === 'stereographic'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Conformal Planispheric Astrolabe (Stereographic Rete &amp; Tympan)"
          >
            <span>Stereographic Rete</span>
          </button>

          <button
            onClick={() => onSnapToPreset('rojas', 1.0)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer ${
              !is3D && projectionMode === 'rojas'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Universal Rojas Orthographic Projection on Solstitial Colure"
          >
            <span>Universal Rojas</span>
          </button>

          <button
            onClick={() => onSnapToPreset('horizon', 1.0)}
            className={`px-2.5 py-1 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer ${
              !is3D && projectionMode === 'horizon'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Topocentric Horizon Stereonet (Zenith centered)"
          >
            <span>Horizon Net</span>
          </button>
        </div>

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

        {/* Feature Toggles */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs">
          <button
            onClick={onToggleRays}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              showRays ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Projection Rays"
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
