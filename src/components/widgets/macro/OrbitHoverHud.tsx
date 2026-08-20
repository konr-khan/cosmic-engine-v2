import React from 'react';
import { OrbitHoverHudProps } from './types';

export const OrbitHoverHud: React.FC<OrbitHoverHudProps> = ({ hoverData }) => {
  if (!hoverData) return null;

  return (
    <div className="absolute top-3 left-3 z-20 bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-xl max-w-xs shadow-xl font-mono space-y-1 pointer-events-none transition-opacity duration-150">
      <div className="text-xs font-bold text-amber-400 flex items-center justify-between">
        <span>{hoverData.label}</span>
        <span className="text-slate-400 text-[10px]">{hoverData.date}</span>
      </div>
      <div className="text-[10px] text-slate-300">
        Distance: <strong className="text-white">{hoverData.distanceAU} AU</strong> ({(hoverData.distanceKm / 1e6).toFixed(1)}M km)
      </div>
      {hoverData.speedKms !== undefined && (
        <div className="text-[10px] text-slate-300">
          Orbital Speed: <strong className="text-indigo-300">{hoverData.speedKms} km/s</strong>
        </div>
      )}
      <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800 leading-tight">
        {hoverData.description}
      </div>
    </div>
  );
};

export default OrbitHoverHud;
