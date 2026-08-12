import React from 'react';
import { Sun } from 'lucide-react';
import { CONFIG, toRadians, toDegrees, formatTime, getSectorPath } from '../../utils/cosmicMath';

export const SunClock = ({ solarData, currentTime, latitude, hoverTime, onHoverTime }) => {
  const { 
    dayLength, civil, nautical, astronomical, 
    noonElevation, solarNoon, equationOfTime, 
    isPolarNight, isMidnightSun, sunrise, sunset, declination 
  } = solarData;
  
  const radius = 90;
  const center = 110;
  const rotationAngle = (solarNoon - 12) * 15;

  const displayTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : currentTime;

  // Instantaneous Elevation Math
  const hourAngle = (displayTime - solarNoon) * 15; 
  const currentElevation = toDegrees(Math.asin(
    Math.sin(toRadians(latitude)) * Math.sin(toRadians(declination)) + 
    Math.cos(toRadians(latitude)) * Math.cos(toRadians(declination)) * Math.cos(toRadians(hourAngle))
  ));

  const elR = 60;
  const elCx = 80;
  const elCy = 70;
  const sunX = elCx + elR * Math.sin(toRadians(hourAngle));
  const sunY = elCy - elR * Math.sin(toRadians(currentElevation)); 
  const handAngle = (displayTime - 12) * 15 - 90;

  // Display Text Logic
  let mainText, subText, mainClass, subClass;
  if (isMidnightSun) {
    mainText = "MIDNIGHT"; 
    subText = "SUN";
    mainClass = "text-sm font-bold fill-amber-500 font-mono tracking-widest";
    subClass = mainClass;
  } else if (isPolarNight) {
    mainText = "POLAR"; 
    subText = "NIGHT";
    mainClass = "text-sm font-bold fill-indigo-600 font-mono tracking-widest";
    subClass = mainClass;
  } else {
    const hours = Math.floor(dayLength);
    const minutes = Math.round((dayLength - hours) * 60);
    mainText = `${hours}h ${minutes}m`;
    subText = "HOURS OF SUNLIGHT";
    mainClass = "text-xl font-bold fill-amber-500 font-mono tracking-tight";
    subClass = "text-[7px] font-bold fill-amber-500 uppercase tracking-widest"; 
  }

  const handlePointerMove = (e) => {
    if (!onHoverTime) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    let angle = toDegrees(Math.atan2(dy, dx)) + 90;
    let t = ((angle / 15 + 12) % 24 + 24) % 24;
    onHoverTime(parseFloat(t.toFixed(2)));
  };

  return (
    <div className="flex flex-col items-center w-full select-none">
      <div 
        className="relative cursor-crosshair group"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => onHoverTime && onHoverTime(null)}
      >
        <svg width="220" height="220" className="drop-shadow-lg">
          <circle cx={center} cy={center} r={radius + 5} fill={CONFIG.THEME.NIGHT_BG} stroke="#334155" strokeWidth="1" />
          <circle cx={center} cy={center} r={radius} fill={CONFIG.THEME.NIGHT_STROKE} stroke="#334155" strokeWidth="2" />
          {[0, 6, 12, 18].map(h => {
             const a = (h - 12) * 15 - 90;
             return <line key={h} x1={center + (radius - 5) * Math.cos(toRadians(a))} y1={center + (radius - 5) * Math.sin(toRadians(a))} x2={center + radius * Math.cos(toRadians(a))} y2={center + radius * Math.sin(toRadians(a))} stroke="#64748b" strokeWidth="2" />;
          })}
          <g transform={`rotate(${rotationAngle}, ${center}, ${center})`}>
             <path d={getSectorPath(astronomical, center, radius)} fill="#4338ca" opacity="0.3" />
             <path d={getSectorPath(nautical, center, radius)} fill="#3b82f6" opacity="0.4" />
             <path d={getSectorPath(civil, center, radius)} fill="#f87171" opacity="0.5" />
             <path d={getSectorPath(dayLength, center, radius)} fill={CONFIG.THEME.SUN_FILL} opacity="0.8" />
             <line x1={center} y1={center - radius} x2={center} y2={center - radius + 10} stroke={CONFIG.THEME.SUN_FILL} strokeWidth="2" />
          </g>
          
          {/* Active / Hover Ray */}
          <line 
            x1={center} y1={center} 
            x2={center + radius * Math.cos(toRadians(handAngle))} 
            y2={center + radius * Math.sin(toRadians(handAngle))} 
            stroke={hoverTime !== null && hoverTime !== undefined ? "#38bdf8" : "white"} 
            strokeWidth={hoverTime !== null && hoverTime !== undefined ? "3" : "2"} 
            strokeLinecap="round" 
          />
          <circle cx={center} cy={center} r="4" fill={hoverTime !== null && hoverTime !== undefined ? "#38bdf8" : "white"} />
          <text x={center} y={center - radius - 12} textAnchor="middle" className="text-[10px] fill-slate-500 font-bold">12:00 UTC</text>
          <text x={center} y={center + radius + 15} textAnchor="middle" className="text-[10px] fill-slate-500 font-bold">00:00 UTC</text>
          <circle cx={center} cy={center} r="42" fill="white" className="drop-shadow-sm opacity-95" />
          
          {hoverTime !== null && hoverTime !== undefined ? (
            <g>
              <text x={center} y={center - 3} textAnchor="middle" className="text-base font-black fill-sky-600 font-mono tracking-tight">
                {Math.floor(hoverTime).toString().padStart(2, '0')}:{Math.floor((hoverTime - Math.floor(hoverTime)) * 60).toString().padStart(2, '0')}
              </text>
              <text x={center} y={center + 11} textAnchor="middle" className="text-[7.5px] font-extrabold fill-sky-500 uppercase tracking-wider">HOVER SYNC</text>
            </g>
          ) : (
            <g>
              <text x={center} y={center - 5} textAnchor="middle" className={mainClass}>{mainText}</text>
              <text x={center} y={center + 10} textAnchor="middle" className={subClass}>{subText}</text>
            </g>
          )}
        </svg>
      </div>
      
      <div className="grid grid-cols-2 gap-3 w-full mt-4">
        {['Sunrise', 'Sunset'].map((label, i) => (
          <div key={label} className="bg-slate-50 p-2 rounded-lg border border-slate-100 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase">{label}</span>
            <span className="text-sm font-mono font-bold text-slate-700">{formatTime(i === 0 ? sunrise : sunset)}</span>
          </div>
        ))}
        <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100 flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-1 px-2">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Elevation</div>
            <div className="text-[10px] font-bold text-slate-500">Max: {noonElevation.toFixed(1)}°</div>
          </div>
          <svg width="100%" height="80" viewBox="0 0 160 80" className="overflow-visible" preserveAspectRatio="xMidYMid meet">
            <line x1="10" y1={elCy} x2="150" y2={elCy} stroke="#94a3b8" strokeWidth="2" />
            <path d={`M 20 ${elCy} A ${elR} ${elR} 0 0 1 140 ${elCy}`} fill="none" stroke="#e2e8f0" strokeDasharray="4 4" />
            {currentElevation > -5 && (
              <g>
                <line x1={elCx} y1={elCy} x2={sunX} y2={sunY} stroke="#fcd34d" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                <circle cx={elCx} cy={elCy} r="3" fill="#64748b" />
                <g transform={`translate(${sunX - 10}, ${sunY - 10})`}>
                  <Sun className={`w-5 h-5 ${currentElevation > 0 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                </g>
              </g>
            )}
          </svg>
          <div className="text-center -mt-6 bg-white/80 px-2 rounded backdrop-blur-sm">
            <div className="text-lg font-mono font-bold text-slate-800">{currentElevation.toFixed(1)}°</div>
          </div>
        </div>
      </div>
      
      <div className="mt-3 w-full bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs font-mono space-y-1">
        <div className="flex justify-between">
          <span className="text-slate-500">Eq. of Time:</span>
          <span className={`${equationOfTime > 0 ? 'text-indigo-600' : 'text-orange-600'} font-bold`}>
            {equationOfTime > 0 ? '+' : ''}{equationOfTime.toFixed(2)} min
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Solar Noon (Loc):</span>
          <span className="text-slate-700 font-bold">{formatTime(solarNoon)} UTC</span>
        </div>
      </div>
    </div>
  );
};

export default SunClock;
