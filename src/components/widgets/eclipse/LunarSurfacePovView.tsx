import React from 'react';
import { EclipseData } from '../../../types';

export interface LunarSurfacePovViewProps {
  eclipse: EclipseData;
}

export const LunarSurfacePovView: React.FC<LunarSurfacePovViewProps> = ({ eclipse }) => {
  const beta = eclipse.beta;
  const phaseVal = eclipse.phaseValue || 0;
  const phaseDeg = Math.round(phaseVal * 360);

  const phaseOffset = Math.sin(((phaseDeg - 180) * Math.PI) / 180) * 140;
  const earthX = phaseOffset;
  const earthY = beta * 6;

  const isTerrestrialLunarEclipse = eclipse.category === 'LUNAR' && eclipse.isEclipseActive;

  return (
    <g>
      {/* Lunar Sky Backdrop */}
      <rect x="0" y="0" width="520" height="220" fill="#020617" rx="8" />

      {/* Lunar Horizon Line */}
      <path d="M 0 190 Q 130 180, 260 185 T 520 190 L 520 220 L 0 220 Z" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <text x="20" y="210" className="text-[9px] font-mono font-bold fill-slate-400">
        🌕 Lunar Surface Perspective (View from Moon looking up at Earth)
      </text>

      {/* Sky Center Coordinates */}
      <g transform="translate(260, 100)">
        {/* Sun in Lunar Sky */}
        <g className="cursor-help">
          <title>{`Sun in Lunar Sky\n• Angular Diameter: 32.0' arcmin\n• Distance: ~1.00 AU`}</title>
          <circle cx="0" cy="0" r="32" fill="url(#sunGlow)" />
          <circle cx="0" cy="0" r="26" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
        </g>

        {/* Solar Corona Rays if Earth Eclipses Sun */}
        {eclipse.category === 'LUNAR' && (
          <g>
            {[0, 45, 90, 135, 180, 225, 270, 315].map(a => (
              <line
                key={a}
                x1={36 * Math.cos((a * Math.PI) / 180)}
                y1={36 * Math.sin((a * Math.PI) / 180)}
                x2={60 * Math.cos((a * Math.PI) / 180)}
                y2={60 * Math.sin((a * Math.PI) / 180)}
                stroke="#fef08a" strokeWidth="2" opacity="0.7" strokeDasharray="3 2" className="animate-pulse"
              />
            ))}
          </g>
        )}

        {/* Earth Body in Lunar Sky (Appears ~1.9° Angular Diameter, 3.7x Moon size) */}
        <g transform={`translate(${earthX}, ${earthY})`} className="cursor-help">
          <title>{`Earth in Lunar Sky\n• Angular Diameter: ~1.9° (114' arcmin, 3.7x Sun)\n• Phase Offset from Full: ${Math.round(Math.abs(phaseDeg - 180))}°\n• Ecliptic Latitude β: ${beta}°\n• Eclipse Status: ${isTerrestrialLunarEclipse ? 'Direct Solar Eclipse by Earth' : 'Sun Unobstructed'}`}</title>
          {/* Crimson Atmospheric Ring ("Blood Ring") during Eclipse */}
          {isTerrestrialLunarEclipse && (
            <g>
              <circle cx="0" cy="0" r="54" fill="#9f1239" opacity="0.3" className="animate-ping" />
              <circle cx="0" cy="0" r="48" fill="none" stroke="#f43f5e" strokeWidth="4" opacity="0.9" />
              <circle cx="0" cy="0" r="46" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            </g>
          )}

          {/* Earth Body (Dark nightside with blue limb or bright day crescent) */}
          <circle cx="0" cy="0" r="44" fill={isTerrestrialLunarEclipse ? '#020617' : '#1e3a8a'} stroke={isTerrestrialLunarEclipse ? '#ef4444' : '#60a5fa'} strokeWidth="2" />
          
          {/* Earth Surface Continent Texture Accent */}
          {!isTerrestrialLunarEclipse && (
            <circle cx="0" cy="0" r="44" fill="#3b82f6" fillOpacity="0.3" />
          )}

          <text x="0" y="4" textAnchor="middle" className={`text-[10px] font-mono font-extrabold select-none pointer-events-none ${isTerrestrialLunarEclipse ? 'fill-rose-300' : 'fill-blue-200'}`}>
            EARTH (1.9°)
          </text>
        </g>
      </g>

      {/* HUD Readout Callout */}
      <g transform="translate(360, 25)">
        <rect x="0" y="0" width="145" height="52" fill="#0f172a" opacity="0.9" rx="6" stroke="#334155" strokeWidth="1" />
        <text x="8" y="15" className="text-[8px] font-mono font-bold fill-indigo-300">
          Lunar Sky Event:
        </text>
        <text x="8" y="29" className={`text-[9px] font-mono font-extrabold ${eclipse.category === 'LUNAR' ? 'fill-rose-400' : 'fill-emerald-400'}`}>
          {eclipse.category === 'LUNAR' ? '🔥 Solar Eclipse by Earth' : '☀️ Sun Unobstructed'}
        </text>
        <text x="8" y="43" className="text-[8px] font-mono fill-slate-400">
          Earth Diameter: 1.9° (114&apos; arcmin)
        </text>
      </g>
    </g>
  );
};
