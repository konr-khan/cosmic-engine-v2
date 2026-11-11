import React from 'react';
import { Compass, Zap, Flame, Info } from 'lucide-react';
import { OrbitPhysicsHudProps } from './types';

export const OrbitPhysicsHud: React.FC<OrbitPhysicsHudProps> = ({
  distanceAU,
  distanceKm,
  orbitalSpeedKms,
  solarIrradiancePercent,
  sunAngularDiameterArcmin
}) => {
  return (
    <div className="mt-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800/50 text-xs font-mono text-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2">
      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 flex flex-col items-center text-center">
        <span className="text-slate-400 text-[9px] font-sans font-medium uppercase tracking-wider flex items-center gap-1">
          <Compass className="w-3 h-3 text-indigo-400" /> Earth-Sun Dist
        </span>
        <span className="font-semibold text-indigo-300 text-xs mt-0.5 font-mono">
          {distanceAU} AU <span className="text-slate-400 text-[10px] font-normal font-sans">({(distanceKm / 1e6).toFixed(1)}M km)</span>
        </span>
      </div>

      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 flex flex-col items-center text-center">
        <span className="text-slate-400 text-[9px] font-sans font-medium uppercase tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" /> Orbital Speed
        </span>
        <span className="font-semibold text-amber-300 text-xs mt-0.5 font-mono">
          {orbitalSpeedKms} <span className="text-slate-400 text-[10px] font-normal font-sans">km/s</span>
        </span>
      </div>

      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 flex flex-col items-center text-center">
        <span className="text-slate-400 text-[9px] font-sans font-medium uppercase tracking-wider flex items-center gap-1">
          <Flame className="w-3 h-3 text-rose-400" /> Irradiance
        </span>
        <span className="font-semibold text-rose-300 text-xs mt-0.5 font-mono">
          {solarIrradiancePercent}% <span className="text-slate-400 text-[10px] font-normal font-sans">of mean</span>
        </span>
      </div>

      <div className="bg-slate-900/40 p-2 rounded-lg border border-slate-800/40 flex flex-col items-center text-center">
        <span className="text-slate-400 text-[9px] font-sans font-medium uppercase tracking-wider flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-300" /> Sun Diameter
        </span>
        <span className="font-semibold text-slate-200 text-xs mt-0.5 font-mono">
          {sunAngularDiameterArcmin}' <span className="text-slate-400 text-[10px] font-normal font-sans">arcmin</span>
        </span>
      </div>
    </div>
  );
};

export default OrbitPhysicsHud;
