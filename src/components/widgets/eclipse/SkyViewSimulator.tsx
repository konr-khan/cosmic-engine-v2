import React, { useState } from 'react';
import { EclipseData } from '../../../types';
import { LunarSurfacePovView } from './LunarSurfacePovView';

export interface SkyViewSimulatorProps {
  eclipse?: EclipseData | null;
}

export const SkyViewSimulator: React.FC<SkyViewSimulatorProps> = ({ eclipse }) => {
  const [perspective, setPerspective] = useState<'terrestrial' | 'lunar'>('terrestrial');
  if (!eclipse) return null;

  return (
    <div className="w-full h-full flex flex-col justify-between items-center relative select-none">
      {/* Top Inline Perspective Selector */}
      <div className="flex justify-between items-center w-full px-2 mb-1 text-xs font-mono">
        <span className="font-semibold text-slate-300 font-sans flex items-center gap-1.5">
          {perspective === 'terrestrial' ? '🌍 Central Path Sky Simulator (Totality Track)' : '🌕 Lunar Surface Sky Simulator'}
        </span>
        <div className="flex bg-slate-950/90 p-0.5 rounded-lg border border-slate-800/90 gap-0.5 text-[10px]">
          <button
            onClick={() => setPerspective('terrestrial')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              perspective === 'terrestrial' ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Central Path Sky
          </button>
          <button
            onClick={() => setPerspective('lunar')}
            className={`px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
              perspective === 'lunar' ? 'bg-indigo-600 text-white shadow-sm border border-indigo-500/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lunar Surface POV
          </button>
        </div>
      </div>

      {/* Main Viewport Content */}
      {perspective === 'lunar' ? (
        <div className="w-full flex-1 flex items-center justify-center min-h-[220px]">
          <LunarSurfacePovView eclipse={eclipse} />
        </div>
      ) : (
        <div className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[220px]">
          <svg viewBox="0 0 240 240" className="w-full h-full max-h-[220px]" preserveAspectRatio="xMidYMid meet">
            {/* Sky Background */}
            <circle cx="120" cy="120" r="100" fill="#020617" stroke="#334155" strokeWidth="1" />
            
            {/* SOLAR ECLIPSE VIEW */}
            {eclipse.category === 'SOLAR' && (
              <g>
                {/* Solar Corona Glowing Rays during Totality */}
                {eclipse.type === 'TOTAL_SOLAR' && (
                  <g>
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(angle => (
                      <line 
                        key={angle}
                        x1={120 + 40 * Math.cos((angle * Math.PI) / 180)}
                        y1={120 + 40 * Math.sin((angle * Math.PI) / 180)}
                        x2={120 + 75 * Math.cos((angle * Math.PI) / 180)}
                        y2={120 + 75 * Math.sin((angle * Math.PI) / 180)}
                        stroke="#fde047" strokeWidth="2.5" opacity="0.75" strokeLinecap="round" className="animate-pulse"
                      />
                    ))}
                  </g>
                )}

                {/* Sun Disk */}
                <circle cx="120" cy="120" r="42" fill="#fbbf24" stroke="#ffffff" strokeWidth="1.5" />

                {/* Moon Disk: Prograde West-to-East Transit (Right to Left across the sky) */}
                {(() => {
                  // Signed longitudinal separation along ecliptic (Moon - Sun) in degrees
                  const dLon = ((eclipse.elongation + 180) % 360) - 180;
                  // West is Right (-dLon > 0), East is Left (-dLon < 0). Scale: 75px per degree
                  const moonX = 120 - (dLon * 75);
                  const moonY = 120 - (eclipse.beta * 8); // North is UP (-Y in SVG)
                  return (
                    <circle 
                      cx={moonX} 
                      cy={moonY} 
                      r="42" 
                      fill="#020617" 
                      stroke={eclipse.type === 'ANNULAR_SOLAR' ? '#fbbf24' : '#334155'} 
                      strokeWidth={eclipse.type === 'ANNULAR_SOLAR' ? 3 : 1} 
                    />
                  );
                })()}
              </g>
            )}

            {/* LUNAR ECLIPSE VIEW */}
            {eclipse.category === 'LUNAR' && (
              <g>
                {/* Earth Umbra Shadow Ring */}
                <circle cx="120" cy="120" r="70" fill="#450a0a" opacity="0.4" stroke="#ef4444" strokeWidth="0.75" strokeDasharray="4 4" />
                
                {/* Moon Body in Umbra */}
                {(() => {
                  // Longitude difference from anti-solar point
                  const dLonOpp = ((eclipse.elongation - 180 + 540) % 360) - 180;
                  const moonX = 120 - (dLonOpp * 50);
                  const moonY = 120 - (eclipse.beta * 8);
                  return (
                    <g>
                      <circle 
                        cx={moonX} 
                        cy={moonY} 
                        r="40" 
                        fill={eclipse.type === 'TOTAL_LUNAR' ? '#9f1239' : '#475569'} 
                        stroke={eclipse.type === 'TOTAL_LUNAR' ? '#f43f5e' : '#cbd5e1'} 
                        strokeWidth="1.5" 
                        className="drop-shadow-lg" 
                      />
                      {eclipse.type === 'TOTAL_LUNAR' && (
                        <circle cx={moonX} cy={moonY} r="40" fill="#fb7185" fillOpacity="0.2" className="animate-pulse" />
                      )}
                    </g>
                  );
                })()}
              </g>
            )}

            {/* NO ECLIPSE NORMAL SKY VIEW */}
            {eclipse.category === 'NO_ECLIPSE' && (
              <g>
                <circle cx="120" cy="120" r="45" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />
                <text x="120" y="124" textAnchor="middle" className="text-xs font-black fill-amber-950 font-mono">
                  SUN (Normal Day)
                </text>
              </g>
            )}
          </svg>

          {/* Viewport Overlay Label */}
          <div className="absolute bottom-2 left-2 right-2 bg-slate-950/90 backdrop-blur-sm p-2 rounded-xl border border-slate-800/80 text-center font-mono text-xs shadow-md">
            <span className="text-amber-400 font-bold">{eclipse.label}</span>
            <span className="text-slate-400 ml-2">Central Path Obscuration: {eclipse.obscuration}%</span>
            <div className="text-[9px] text-slate-500 mt-0.5">
              Simulating central path perspective • Prograde transit West → East (Right → Left)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkyViewSimulator;
