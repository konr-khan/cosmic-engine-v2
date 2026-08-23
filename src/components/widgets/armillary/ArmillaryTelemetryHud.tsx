import React from 'react';
import { ArmillaryModelOutput, ArmillaryProjectionMode } from './types';

export interface ArmillaryTelemetryHudProps {
  model: ArmillaryModelOutput;
  projectionMode: ArmillaryProjectionMode;
  morphLambda: number;
  latitude: number;
  longitude: number;
  cameraPitch: number;
  cameraYaw: number;
}

export const ArmillaryTelemetryHud: React.FC<ArmillaryTelemetryHudProps> = ({
  model,
  projectionMode,
  morphLambda,
  latitude,
  longitude,
  cameraPitch,
  cameraYaw
}) => {
  const { sun, moon, siderealTimeDeg, localSiderealTimeDeg, planetaryHour, physics } = model;

  const formatDeg = (deg: number): string => `${deg >= 0 ? '+' : ''}${deg.toFixed(1)}°`;
  const formatTimeDeg = (deg: number): string => {
    const hours = (deg / 15) % 24;
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    const s = Math.floor(((hours - h) * 60 - m) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isOrbitalMode = projectionMode === 'heliocentric' || projectionMode === 'geocentric';
  const is3D = morphLambda <= 0.05;
  const is2D = morphLambda >= 0.95;

  if (isOrbitalMode && physics) {
    return (
      <div className="mt-2 bg-slate-950/70 backdrop-blur-md rounded-xl border border-slate-800/60 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono select-none">
        {/* 1. Orbital Model Frame */}
        <div className="flex flex-col justify-between border-r border-slate-800/80 pr-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">Orbital Framework</div>
          <div className="text-sky-400 font-bold truncate">
            {projectionMode === 'heliocentric' ? '☉ Heliocentric (Copernican)' : '⊕ Geocentric (Apparent)'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Camera: <span className="text-amber-400">Pitch {formatDeg(cameraPitch)}</span>, <span className="text-amber-400">Yaw {formatDeg(cameraYaw)}</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Origin: <strong className="text-white">{projectionMode === 'heliocentric' ? 'Sun (0, 0, 0)' : 'Earth (0, 0, 0)'}</strong>
          </div>
        </div>

        {/* 2. Earth-Sun Distance */}
        <div className="flex flex-col justify-between border-r border-slate-800/80 pr-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">Earth-Sun Distance</div>
          <div className="text-white font-bold truncate">
            {physics.distanceAU.toFixed(5)} <span className="text-xs font-normal text-slate-400">AU</span>
          </div>
          <div className="text-[11px] text-amber-300 mt-1 truncate">
            {(physics.distanceKm / 1e6).toFixed(2)}M km
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Mean 1 AU: 149.60M km
          </div>
        </div>

        {/* 3. Keplerian Dynamics */}
        <div className="flex flex-col justify-between border-r border-slate-800/80 pr-2">
          <div className="text-[10px] uppercase font-bold text-slate-400">Keplerian Dynamics</div>
          <div className="text-emerald-400 font-bold truncate">
            {physics.orbitalSpeedKms.toFixed(2)} <span className="text-xs font-normal text-slate-400">km/s</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1 truncate">
            Irradiance: <strong className="text-amber-400">{physics.solarIrradiancePercent.toFixed(1)}%</strong>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Flux: {(1361 * (physics.solarIrradiancePercent / 100)).toFixed(0)} W/m²
          </div>
        </div>

        {/* 4. Solar Angular Geometry */}
        <div className="flex flex-col justify-between">
          <div className="text-[10px] uppercase font-bold text-slate-400">Apparent Solar Geometry</div>
          <div className="text-amber-400 font-bold truncate">
            ⌀ {physics.sunAngularDiameterArcmin.toFixed(2)}&apos; <span className="text-xs font-normal text-slate-400">arcmin</span>
          </div>
          <div className="text-[11px] text-slate-300 mt-1 truncate">
            Ecliptic Lon (λ): <strong className="text-white">{sun.lambdaDeg.toFixed(1)}°</strong>
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            Sun RA: {formatTimeDeg(sun.raDeg)} | Dec: {formatDeg(sun.decDeg)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-slate-950/70 backdrop-blur-md rounded-xl border border-slate-800/60 p-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono select-none">
      {/* 1. Projection Geometry & Morph State */}
      <div className="flex flex-col justify-between border-r border-slate-800/80 pr-2">
        <div className="text-[10px] uppercase font-bold text-slate-400">Projection &amp; Frame</div>
        <div className="text-white font-bold truncate">
          {is3D ? '3D Celestial Sphere' : (is2D ? `${projectionMode.toUpperCase()} Plate` : `Morphing (${Math.round(morphLambda * 100)}%)`)}
        </div>
        <div className="text-[11px] text-slate-400 mt-1">
          Camera: <span className="text-amber-400">Pitch {formatDeg(cameraPitch)}</span>, <span className="text-amber-400">Yaw {formatDeg(cameraYaw)}</span>
        </div>
        <div className="text-[10px] text-slate-500 truncate">
          Observer: {latitude >= 0 ? `${latitude.toFixed(1)}°N` : `${Math.abs(latitude).toFixed(1)}°S`}, {longitude >= 0 ? `${longitude.toFixed(1)}°E` : `${Math.abs(longitude).toFixed(1)}°W`}
        </div>
      </div>

      {/* 2. Celestial Ephemeris (Sun & Moon) */}
      <div className="flex flex-col justify-between border-r border-slate-800/80 pr-2">
        <div className="text-[10px] uppercase font-bold text-slate-400">Sun &amp; Moon Coordinates</div>
        <div className="text-amber-300 truncate">
          ☉ Sun: <strong className="text-white">RA {formatTimeDeg(sun.raDeg)}</strong> | <strong className="text-amber-400">Dec {formatDeg(sun.decDeg)}</strong>
        </div>
        <div className="text-slate-300 truncate mt-0.5">
          ☽ Moon: <strong className="text-white">RA {formatTimeDeg(moon.raDeg)}</strong> | <strong className="text-slate-300">Dec {formatDeg(moon.decDeg)}</strong>
        </div>
        <div className="text-[10px] text-slate-400 truncate">
          Sun Alt: <strong className={sun.altDeg >= 0 ? 'text-amber-400' : 'text-slate-500'}>{formatDeg(sun.altDeg)}</strong> | Az: <strong className="text-slate-300">{sun.azDeg.toFixed(1)}°</strong>
        </div>
      </div>

      {/* 3. Horology (Sidereal & Solar Time) */}
      <div className="flex flex-col justify-between border-r border-slate-800/80 pr-2">
        <div className="text-[10px] uppercase font-bold text-slate-400">Sidereal Horology</div>
        <div className="text-slate-300 truncate">
          LST: <strong className="text-emerald-400">{formatTimeDeg(localSiderealTimeDeg)}</strong> <span className="text-slate-500 text-[10px]">({localSiderealTimeDeg.toFixed(1)}°)</span>
        </div>
        <div className="text-slate-300 truncate mt-0.5">
          GMST: <strong className="text-indigo-300">{formatTimeDeg(siderealTimeDeg)}</strong>
        </div>
        <div className="text-[10px] text-slate-500 truncate">
          Rete Rotation: <span className="text-emerald-400">{(localSiderealTimeDeg).toFixed(1)}°</span> relative to Meridian
        </div>
      </div>

      {/* 4. Historical Unequal Planetary Hour */}
      <div className="flex flex-col justify-between">
        <div className="text-[10px] uppercase font-bold text-slate-400">Historical Unequal Horology</div>
        <div className="text-amber-400 font-bold truncate">
          {planetaryHour.label}
        </div>
        <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
          <span>Chaldean Ruler: <strong className="text-amber-300">{planetaryHour.rulingPlanet}</strong></span>
          <span className="text-[10px] text-slate-400">{planetaryHour.progressPercent}%</span>
        </div>
        <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-300"
            style={{ width: `${planetaryHour.progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
};
