import React from 'react';
import { Sparkles, RotateCcw, Grid, Eye, Zap } from 'lucide-react';

export interface ArmillaryLayerTogglesProps {
  showRays: boolean;
  onToggleRays: () => void;
  showObserverCone?: boolean;
  onToggleObserverCone?: (show: boolean) => void;
  showStars: boolean;
  onToggleStars: () => void;
  showTympan: boolean;
  onToggleTympan: () => void;
  showLunarNodes?: boolean;
  onToggleLunarNodes?: () => void;
  showRule: boolean;
  onToggleRule: () => void;
  onResetCamera: () => void;
  isOrbital: boolean;
}

export const ArmillaryLayerToggles: React.FC<ArmillaryLayerTogglesProps> = ({
  showRays,
  onToggleRays,
  showObserverCone = true,
  onToggleObserverCone,
  showStars,
  onToggleStars,
  showTympan,
  onToggleTympan,
  showLunarNodes = true,
  onToggleLunarNodes,
  showRule,
  onToggleRule,
  onResetCamera,
  isOrbital
}) => {
  const isVolumetricActive = Boolean((isOrbital ? showObserverCone : showRays) || (showObserverCone && showRays));

  return (
    <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs">
      <button
        onClick={() => {
          onToggleObserverCone?.(!isVolumetricActive);
          onToggleRays();
        }}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          isVolumetricActive ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
        }`}
        title="Toggle Volumetric Observer Sky Cone & Laser Projection"
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

      {onToggleLunarNodes && (
        <button
          onClick={onToggleLunarNodes}
          className={`p-1.5 rounded-lg transition-all cursor-pointer font-mono font-bold text-xs flex items-center justify-center w-7 h-7 ${
            showLunarNodes ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Draconic Lunar Nodes (☊ / ☋)"
        >
          <span>☊</span>
        </button>
      )}

      <button
        onClick={onResetCamera}
        className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
        title="Reset 3D Camera Orientation"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
