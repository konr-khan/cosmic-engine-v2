import React from 'react';
import { EclipseData } from '../../../types';

export interface ShadowRayHoverHudProps {
  hoveredEntity: 'sun' | 'earth' | 'moon' | 'umbra' | 'penumbra' | null;
  eclipse: EclipseData;
  distKm: number;
  verticalOffsetKm: number;
  phaseDeg: number;
  phaseName: string;
  illumPercent: number;
  beta: number;
}

export const ShadowRayHoverHud: React.FC<ShadowRayHoverHudProps> = ({
  hoveredEntity,
  eclipse,
  distKm,
  verticalOffsetKm,
  phaseDeg,
  phaseName,
  illumPercent,
  beta
}) => {
  if (!hoveredEntity) return null;

  return (
    <div className="absolute top-12 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]">
      {hoveredEntity === 'sun' && (
        <>
          <div className="text-xs font-bold text-amber-400">Sun (Primary Light Source)</div>
          <div className="text-slate-300">Distance: <strong className="text-white">~149.6M km (1.00 AU)</strong></div>
          <div className="text-slate-300">Solar Radius: <strong className="text-amber-300">696,340 km</strong></div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            Emits direct converging &amp; diverging solar rays shaping Earth&apos;s umbra &amp; penumbra shadow cones.
          </div>
        </>
      )}

      {hoveredEntity === 'earth' && (
        <>
          <div className="text-xs font-bold text-blue-400">Earth (Geocentric Reference Origin)</div>
          <div className="text-slate-300">Radius: <strong className="text-white">6,378 km (1.00 R_E)</strong></div>
          <div className="text-slate-300">Umbra Radius at Moon: <strong className="text-rose-300">{Math.round(eclipse.umbraRadiusKm).toLocaleString()} km</strong></div>
          <div className="text-slate-300">Penumbra Radius at Moon: <strong className="text-slate-300">{Math.round(eclipse.penumbraRadiusKm).toLocaleString()} km</strong></div>
        </>
      )}

      {hoveredEntity === 'moon' && (
        <>
          <div className="text-xs font-bold text-emerald-400 flex items-center justify-between">
            <span>Moon ({phaseName})</span>
            <span className="text-slate-400 text-[9px]">{illumPercent}% Illum</span>
          </div>
          <div className="text-slate-300">
            Orbital Elongation: <strong className="text-white">{phaseDeg}°</strong>
          </div>
          <div className="text-slate-300">
            Distance: <strong className="text-indigo-300">{distKm.toLocaleString()} km</strong> ({(distKm / 6371).toFixed(1)} R_E)
          </div>
          <div className="text-slate-300">
            Ecliptic Lat (β): <strong className="text-rose-300">{beta}°</strong>
          </div>
          <div className="text-slate-300">
            Vertical Miss: <strong className={verticalOffsetKm === 0 ? "text-emerald-400" : (verticalOffsetKm > 0 ? "text-amber-400" : "text-indigo-400")}>
              {verticalOffsetKm > 0 ? `+${verticalOffsetKm.toLocaleString()}` : `${verticalOffsetKm.toLocaleString()}`} km
            </strong>
          </div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            {eclipse.isEclipseActive ? `✨ Active Direct Eclipse: ${eclipse.label}` : 'Moon orbital plane alignment currently outside direct shadow cone.'}
          </div>
        </>
      )}

      {hoveredEntity === 'umbra' && (
        <>
          <div className="text-xs font-bold text-rose-400">Earth Umbra Cone (Total Shadow)</div>
          <div className="text-slate-300">Umbra Radius at Moon: <strong className="text-white">{Math.round(eclipse.umbraRadiusKm).toLocaleString()} km</strong></div>
          <div className="text-slate-300">Total Shadow Length: <strong className="text-rose-300">~1,384,000 km</strong></div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            Region where Earth completely blocks direct sunlight. Moon inside umbra turns crimson (Blood Moon).
          </div>
        </>
      )}

      {hoveredEntity === 'penumbra' && (
        <>
          <div className="text-xs font-bold text-slate-300">Earth Penumbra Cone (Partial Shadow)</div>
          <div className="text-slate-300">Penumbra Radius at Moon: <strong className="text-white">{Math.round(eclipse.penumbraRadiusKm).toLocaleString()} km</strong></div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            Region of partial sunlight blockage causing faint subtle dimming of the lunar surface.
          </div>
        </>
      )}
    </div>
  );
};
