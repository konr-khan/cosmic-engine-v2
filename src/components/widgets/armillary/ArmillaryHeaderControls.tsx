import React from 'react';
import { Compass } from 'lucide-react';
import { ArmillaryProjectionMode } from './types';
import { 
  ArmillaryModePills, 
  ArmillaryMorphRail, 
  ArmillaryLayerToggles 
} from './controls';

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
  showLunarNodes?: boolean;
  onToggleLunarNodes?: () => void;
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
  isNodalActive?: boolean;
  onToggleNodal?: () => void;
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
  showLunarNodes = true,
  onToggleLunarNodes,
  showObserverCone = true,
  onToggleObserverCone,
  onResetCamera,
  onSnapToPreset,
  isFreeReteMode = false,
  onToggleFreeRete,
  onSnapToNow,
  apparentSolarHours,
  exaggerateEccentricity = false,
  onToggleEccentricity,
  isNodalActive = false,
  onToggleNodal
}) => {
  const isOrbital = projectionMode === 'heliocentric';

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
            {isNodalActive
              ? '☊ Nodal Plane (5.145° Sightline)'
              : projectionMode === 'heliocentric' 
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
        <ArmillaryModePills
          projectionMode={projectionMode}
          morphLambda={morphLambda}
          onSnapToPreset={onSnapToPreset}
          isNodalActive={isNodalActive}
          onToggleNodal={onToggleNodal}
        />
        <ArmillaryMorphRail
          projectionMode={projectionMode}
          morphLambda={morphLambda}
          onMorphChange={onMorphChange}
          exaggerateEccentricity={exaggerateEccentricity}
          onToggleEccentricity={onToggleEccentricity}
          isFreeReteMode={isFreeReteMode}
          onToggleFreeRete={onToggleFreeRete}
          onSnapToNow={onSnapToNow}
          apparentSolarHours={apparentSolarHours}
        />
        <ArmillaryLayerToggles
          showRays={showRays}
          onToggleRays={onToggleRays}
          showObserverCone={showObserverCone}
          onToggleObserverCone={onToggleObserverCone}
          showStars={showStars}
          onToggleStars={onToggleStars}
          showTympan={showTympan}
          onToggleTympan={onToggleTympan}
          showLunarNodes={showLunarNodes}
          onToggleLunarNodes={onToggleLunarNodes}
          showRule={showRule}
          onToggleRule={onToggleRule}
          onResetCamera={onResetCamera}
          isOrbital={isOrbital}
        />
      </div>
    </div>
  );
};
