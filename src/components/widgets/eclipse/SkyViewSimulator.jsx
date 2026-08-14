import React from 'react';

export const SkyViewSimulator = ({ eclipse }) => {
  if (!eclipse) return null;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative">
      <svg viewBox="0 0 240 240" className="w-full h-full max-h-[220px]" preserveAspectRatio="xMidYMid meet">
        
        {/* Sky Background */}
        <circle cx="120" cy="120" r="100" fill={eclipse.type.includes('SOLAR') ? '#020617' : '#0f172a'} stroke="#1e293b" strokeWidth="2" />
        
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
                    stroke="#fef08a" strokeWidth="3" opacity="0.6" strokeLinecap="round" className="animate-pulse"
                  />
                ))}
              </g>
            )}

            {/* Sun Disk */}
            <circle cx="120" cy="120" r="42" fill="#fbbf24" stroke="#ffffff" strokeWidth="2" />

            {/* Moon Disk Overlap offset based on beta & obscuration */}
            {(() => {
              const offset = (1 - eclipse.obscuration / 100) * 80;
              return (
                <circle 
                  cx={120 + offset} 
                  cy={120 + (eclipse.beta * 4)} 
                  r="42" 
                  fill="#020617" 
                  stroke={eclipse.type === 'ANNULAR_SOLAR' ? '#f59e0b' : '#334155'} 
                  strokeWidth={eclipse.type === 'ANNULAR_SOLAR' ? '3' : '1'} 
                />
              );
            })()}
          </g>
        )}

        {/* LUNAR ECLIPSE VIEW */}
        {eclipse.category === 'LUNAR' && (
          <g>
            {/* Earth Umbra Shadow Ring */}
            <circle cx="120" cy="120" r="70" fill="#450a0a" opacity="0.5" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 4" />
            
            {/* Moon Body in Umbra */}
            <circle 
              cx="120" 
              cy={120 + (eclipse.beta * 8)} 
              r="40" 
              fill={eclipse.type === 'TOTAL_LUNAR' ? '#9f1239' : '#475569'} 
              stroke={eclipse.type === 'TOTAL_LUNAR' ? '#f43f5e' : '#cbd5e1'} 
              strokeWidth="2" 
              className="drop-shadow-lg" 
            />
            {eclipse.type === 'TOTAL_LUNAR' && (
              <circle cx="120" cy="120" r="40" fill="#fb7185" fillOpacity="0.2" className="animate-pulse" />
            )}
          </g>
        )}

        {/* NO ECLIPSE NORMAL SKY VIEW */}
        {eclipse.category === 'NO_ECLIPSE' && (
          <g>
            <circle cx="120" cy="120" r="45" fill="#fbbf24" stroke="#ffffff" strokeWidth="3" />
            <text x="120" y="125" textAnchor="middle" className="text-xs font-black fill-slate-950 font-mono">
              SUN (Normal Day)
            </text>
          </g>
        )}
      </svg>

      {/* Viewport Overlay Label */}
      <div className="absolute bottom-2 left-2 right-2 bg-slate-900/90 backdrop-blur p-2 rounded-xl border border-slate-800 text-center font-mono text-xs">
        <span className="text-amber-400 font-bold">{eclipse.label}</span>
        <span className="text-slate-400 ml-2">Obscuration: {eclipse.obscuration}%</span>
      </div>
    </div>
  );
};

export default SkyViewSimulator;
