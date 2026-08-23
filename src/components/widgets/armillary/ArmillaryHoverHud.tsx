import React from 'react';
import { HoveredStarInfo, AlidadeSightingInfo, ArmillaryModelOutput, ArmillaryMilestoneNode } from './types';

export interface ArmillaryHoverHudProps {
  hoveredStar: HoveredStarInfo | null;
  hoveredBead: 'sun' | 'moon' | 'earth' | null;
  hoveredMilestone: ArmillaryMilestoneNode | null;
  showRule: boolean;
  sightingInfo: AlidadeSightingInfo | null;
  sun: ArmillaryModelOutput['sun'];
  moon: ArmillaryModelOutput['moon'];
  earth?: ArmillaryModelOutput['earth'];
  physics?: ArmillaryModelOutput['physics'];
}

export const ArmillaryHoverHud: React.FC<ArmillaryHoverHudProps> = ({
  hoveredStar,
  hoveredBead,
  hoveredMilestone,
  showRule,
  sightingInfo,
  sun,
  moon,
  earth,
  physics
}) => {
  return (
    <>
      {/* Floating Sighting HUD (When Alidade Rule Active) */}
      {showRule && sightingInfo && (
        <div className="absolute bottom-4 left-4 z-40 bg-slate-950/90 backdrop-blur-xl border border-amber-500/60 px-3 py-2 rounded-xl shadow-2xl font-mono text-xs text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150 flex items-center gap-3">
          <div>
            <div className="text-[10px] uppercase text-amber-400 font-bold flex items-center gap-1">
              <span>⌖ Alidade Sighting</span>
              {sightingInfo.nearestTarget && (
                <span className="text-emerald-400 font-normal">
                  — Locked: {sightingInfo.nearestTarget.name} ({sightingInfo.nearestTarget.angularDiffDeg.toFixed(1)}°)
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-300">
              Angle: <strong className="text-white">{sightingInfo.ruleAngleDeg.toFixed(1)}°</strong> | 
              RA (α): <strong className="text-amber-300">{sightingInfo.rightAscensionHours.toFixed(2)}h</strong> | 
              Alt (a): <strong className={sightingInfo.localAltitudeDeg >= 0 ? 'text-emerald-400' : 'text-slate-500'}>{sightingInfo.localAltitudeDeg >= 0 ? `+${sightingInfo.localAltitudeDeg}°` : `${sightingInfo.localAltitudeDeg}°`}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Floating Glassmorphic Star Hover HUD Popover */}
      {hoveredStar && (
        <div className="absolute top-4 left-4 z-40 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 p-3 rounded-xl max-w-xs shadow-2xl font-mono text-xs text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
            <strong className="text-amber-400 font-bold">{hoveredStar.name}</strong>
            <span className="text-[10px] text-slate-400 font-normal">{hoveredStar.bayer}</span>
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div>Constellation: <strong className="text-white">{hoveredStar.constellation}</strong></div>
            <div>Visual Mag: <strong className="text-amber-300">{hoveredStar.magnitude}</strong></div>
            <div>RA (α): <strong className="text-white">{hoveredStar.raDeg.toFixed(1)}°</strong> | Dec (δ): <strong className="text-white">{hoveredStar.decDeg >= 0 ? `+${hoveredStar.decDeg.toFixed(1)}°` : `${hoveredStar.decDeg.toFixed(1)}°`}</strong></div>
            <div>Local Alt: <strong className={hoveredStar.altDeg >= 0 ? 'text-emerald-400' : 'text-slate-500'}>{hoveredStar.altDeg >= 0 ? `+${hoveredStar.altDeg}°` : `${hoveredStar.altDeg}°`}</strong> | Az: <strong className="text-slate-300">{hoveredStar.azDeg}°</strong></div>
          </div>
          <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-amber-400/80">
            Click star to snap Alidade sighting arm
          </div>
        </div>
      )}

      {/* Floating Sun Hover Popover */}
      {hoveredBead === 'sun' && (
        <div className="absolute top-4 right-4 z-40 bg-slate-950/90 backdrop-blur-xl border border-amber-500/50 p-3 rounded-xl max-w-xs shadow-2xl font-mono text-xs text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-amber-400 font-bold border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
            <span>☉ Celestial Sun (Sol)</span>
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div>Ecliptic Longitude (λ): <strong className="text-white">{sun.lambdaDeg.toFixed(1)}°</strong></div>
            <div>Right Ascension (α): <strong className="text-white">{sun.raDeg.toFixed(1)}°</strong></div>
            <div>Declination (δ): <strong className="text-amber-400">{sun.decDeg >= 0 ? `+${sun.decDeg.toFixed(1)}°` : `${sun.decDeg.toFixed(1)}°`}</strong></div>
            <div>Local Elevation: <strong className={sun.altDeg >= 0 ? 'text-amber-400' : 'text-slate-500'}>{sun.altDeg >= 0 ? `+${sun.altDeg}°` : `${sun.altDeg}°`}</strong></div>
          </div>
          <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-amber-400/80">
            Click Sun to snap Alidade sighting arm
          </div>
        </div>
      )}

      {/* Floating Moon Hover Popover */}
      {hoveredBead === 'moon' && (
        <div className="absolute top-4 right-4 z-40 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 p-3 rounded-xl max-w-xs shadow-2xl font-mono text-xs text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-slate-200 font-bold border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
            <span>☽ Celestial Moon (Luna)</span>
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div>Right Ascension (α): <strong className="text-white">{moon.raDeg.toFixed(1)}°</strong></div>
            <div>Declination (δ): <strong className="text-slate-300">{moon.decDeg >= 0 ? `+${moon.decDeg.toFixed(1)}°` : `${moon.decDeg.toFixed(1)}°`}</strong></div>
            <div>Local Elevation: <strong className={moon.altDeg >= 0 ? 'text-slate-200' : 'text-slate-500'}>{moon.altDeg >= 0 ? `+${moon.altDeg}°` : `${moon.altDeg}°`}</strong></div>
          </div>
          <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-slate-400">
            Click Moon to snap Alidade sighting arm
          </div>
        </div>
      )}

      {/* Floating Earth Hover Popover (Heliocentric / Geocentric) */}
      {hoveredBead === 'earth' && (
        <div className="absolute top-4 left-4 z-40 bg-slate-950/90 backdrop-blur-xl border border-sky-500/50 p-3 rounded-xl max-w-xs shadow-2xl font-mono text-xs text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-sky-400 font-bold border-b border-slate-800 pb-1 mb-1.5 flex items-center justify-between">
            <span>⊕ Earth (Terra)</span>
            <span className="text-[10px] text-slate-400 font-normal">Orbiter</span>
          </div>
          <div className="space-y-0.5 text-[11px]">
            <div>Axial Tilt (ε): <strong className="text-sky-300">23.44°</strong></div>
            {physics && (
              <>
                <div>Heliocentric Dist: <strong className="text-white">{physics.distanceAU.toFixed(3)} AU</strong></div>
                <div>Orbital Velocity: <strong className="text-emerald-400">{physics.orbitalSpeedKms.toFixed(1)} km/s</strong></div>
                <div>Solar Irradiance: <strong className="text-amber-300">{physics.solarIrradiancePercent.toFixed(1)}%</strong></div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Floating Seasonal Milestone Hover Popover */}
      {hoveredMilestone && (
        <div className="absolute top-4 left-4 z-40 bg-slate-950/90 backdrop-blur-xl border border-purple-500/50 p-3 rounded-xl max-w-xs shadow-2xl font-mono text-xs text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1 mb-1.5">
            <strong className={`${hoveredMilestone.textColor} font-bold`}>{hoveredMilestone.label}</strong>
            <span className="text-[10px] text-slate-400 font-mono">{hoveredMilestone.date}</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="text-slate-300 leading-relaxed">{hoveredMilestone.description}</div>
            <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
              <span>Dist: <strong className="text-white">{hoveredMilestone.distanceAU} AU</strong></span>
              <span>Speed: <strong className="text-emerald-400">{hoveredMilestone.speedKms} km/s</strong></span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
