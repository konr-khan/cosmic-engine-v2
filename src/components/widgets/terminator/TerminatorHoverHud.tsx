/**
 * @file TerminatorHoverHud.tsx
 * Pure presenter component rendering glassmorphic telemetry HUD popovers for the
 * Subsolar Point, Sublunar Point, and Observer Location on the Terminator Map.
 */

import React from 'react';
import { LunarNodeProximityTelemetry } from '../../../utils/cosmicMath';

export interface TerminatorHoverHudProps {
  hoveredPoint: 'sun' | 'moon' | 'observer' | null;
  // Subsolar props
  declination: number;
  normalizedSunLong: number;
  sunDistanceAU: number;
  sunDistanceKm: number;
  sunAngularDiamArcmin: number;
  // Sublunar props
  lunarDec: number;
  moonPhase: string;
  moonIllum: string | number;
  moonDistKm: number;
  moonAngularDiamArcmin: number;
  isSupermoon: boolean;
  isMicromoon: boolean;
  lunarNodeTelemetry?: LunarNodeProximityTelemetry | null;
  // Observer props
  latitude: number;
  longitude: number;
}

export const TerminatorHoverHud: React.FC<TerminatorHoverHudProps> = ({
  hoveredPoint,
  declination,
  normalizedSunLong,
  sunDistanceAU,
  sunDistanceKm,
  sunAngularDiamArcmin,
  lunarDec,
  moonPhase,
  moonIllum,
  moonDistKm,
  moonAngularDiamArcmin,
  isSupermoon,
  isMicromoon,
  lunarNodeTelemetry,
  latitude,
  longitude
}) => {
  if (!hoveredPoint) return null;

  return (
    <>
      {hoveredPoint === 'sun' && (
        <div
          data-testid="terminator-sun-hud"
          className="absolute top-3 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]"
        >
          <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
            <span>Subsolar Point (Sun at Zenith)</span>
          </div>
          <div className="text-slate-300">
            Declination (δ): <strong className="text-white">{declination >= 0 ? `+${declination.toFixed(1)}°` : `${declination.toFixed(1)}°`}</strong>
          </div>
          <div className="text-slate-300">
            Subsolar Longitude: <strong className="text-amber-300">{normalizedSunLong >= 0 ? `+${normalizedSunLong.toFixed(1)}°` : `${normalizedSunLong.toFixed(1)}°`}</strong>
          </div>
          <div className="text-slate-300">
            Distance: <strong className="text-amber-300">{sunDistanceAU.toFixed(3)} AU</strong> ({(sunDistanceKm / 1e6).toFixed(1)}M km)
          </div>
          <div className="text-slate-300">
            Apparent Diam: <strong className="text-white">{sunAngularDiamArcmin.toFixed(1)}'</strong> <span className="text-slate-400 text-[9px]">({sunDistanceAU < 0.99 ? 'Perihelion' : sunDistanceAU > 1.01 ? 'Aphelion' : 'Mean Size'})</span>
          </div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            The Sun is at local zenith (+90° altitude) directly overhead at this surface location.
          </div>
        </div>
      )}

      {hoveredPoint === 'moon' && (
        <div
          data-testid="terminator-moon-hud"
          className="absolute top-3 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]"
        >
          <div className="text-xs font-bold text-slate-200 flex items-center justify-between">
            <span>Sublunar Point (Moon at Zenith)</span>
            <span className="text-slate-400 text-[9px]">{moonIllum}% Illum</span>
          </div>
          <div className="text-slate-300">
            Phase: <strong className="text-white">{moonPhase}</strong>
          </div>
          <div className="text-slate-300">
            Declination (δ): <strong className="text-slate-200">{lunarDec >= 0 ? `+${lunarDec.toFixed(1)}°` : `${lunarDec.toFixed(1)}°`}</strong>
          </div>
          <div className="text-slate-300">
            Distance: <strong className="text-indigo-300">{moonDistKm.toLocaleString()} km</strong> ({(moonDistKm / 6371).toFixed(1)} R_E)
          </div>
          <div className="text-slate-300">
            Apparent Diam: <strong className="text-white">{moonAngularDiamArcmin.toFixed(1)}'</strong> <span className="text-slate-400 text-[9px]">({isSupermoon ? 'Supermoon' : isMicromoon ? 'Micromoon' : 'Mean Size'})</span>
          </div>
          {lunarNodeTelemetry?.isNear && lunarNodeTelemetry.badgeText && (
            <div
              data-testid="lunar-node-badge"
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-indigo-950/80 border border-indigo-500/30 text-indigo-200 text-[9px] font-mono"
            >
              <span className="text-cyan-400 font-bold">{lunarNodeTelemetry.symbol}</span>
              <span>{lunarNodeTelemetry.badgeText}</span>
            </div>
          )}
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            The Moon is at local zenith (+90° altitude) directly overhead at this surface location.
          </div>
        </div>
      )}

      {hoveredPoint === 'observer' && (
        <div
          data-testid="terminator-observer-hud"
          className="absolute top-3 left-3 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-2.5 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150 text-[10px]"
        >
          <div className="text-xs font-bold text-sky-400">Observer Location</div>
          <div className="text-slate-300">
            Coordinates: <strong className="text-white">{Math.abs(latitude).toFixed(2)}°{latitude >= 0 ? 'N' : 'S'}, {Math.abs(longitude).toFixed(2)}°{longitude >= 0 ? 'E' : 'W'}</strong>
          </div>
          <div className="text-slate-400 text-[9px] pt-1 border-t border-slate-800">
            Prime center of map projection (centered on your local meridian).
          </div>
        </div>
      )}
    </>
  );
};

export default TerminatorHoverHud;
