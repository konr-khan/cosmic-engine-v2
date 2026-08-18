import React, { useMemo } from 'react';
import { Waves } from 'lucide-react';
import { TidalVectors } from '../../../types';

export interface TidalWaveOscillatorProps {
  tides: TidalVectors;
  phaseValue: number;
  localTideStatus: string;
}

export const TidalWaveOscillator: React.FC<TidalWaveOscillatorProps> = ({
  tides,
  phaseValue,
  localTideStatus
}) => {
  const tideWavePoints = useMemo(() => {
    const points: { x: number; y: number }[] = [];
    const width = 800;
    const steps = 100;
    const midY = 45;
    const amplitude = 28 * ((tides.rx - 10) / 10);

    for (let i = 0; i <= steps; i++) {
      const x = (i / steps) * width;
      const rad = (i / steps) * Math.PI * 4;
      const y = midY - Math.cos(rad) * amplitude;
      points.push({ x, y });
    }
    return points;
  }, [tides.rx]);

  const buoyPoint = useMemo(() => {
    const frac = phaseValue ?? 0.5;
    const x = frac * 800;
    const midY = 45;
    const amplitude = 28 * ((tides.rx - 10) / 10);
    const y = midY - Math.cos(frac * Math.PI * 4) * amplitude;
    return { x, y };
  }, [phaseValue, tides.rx]);

  const tideTypeLabel = tides.rx >= 18 
    ? "Maximum Spring Tide (Syzygy)" 
    : (tides.rx <= 13 ? "Minimal Neap Tide (Quadrature)" : "Transitional Moderate Tide");

  return (
    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex flex-col justify-between">
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-300 mb-1">
        <span className="flex items-center gap-1 font-bold text-sky-300">
          <Waves className="w-3.5 h-3.5 text-sky-400" /> Harmonized Ocean Tidal Bulge
        </span>
        <span className="text-[10px] text-slate-400">
          Bulge Axis: <strong className="text-cyan-400">{tides.rx}x</strong>
        </span>
      </div>

      {/* Harmonized Ocean Wave SVG */}
      <div className="relative w-full h-[60px] overflow-hidden">
        <svg viewBox="0 0 800 90" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id="tideWaveGradCard" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.85" />
            </linearGradient>
          </defs>

          <line x1="0" y1="45" x2="800" y2="45" stroke="#334155" strokeWidth="0.75" strokeDasharray="4 4" strokeOpacity="0.5" />

          {(() => {
            let pathD = `M ${tideWavePoints[0].x} ${tideWavePoints[0].y}`;
            for (let i = 1; i < tideWavePoints.length; i++) {
              pathD += ` L ${tideWavePoints[i].x} ${tideWavePoints[i].y}`;
            }
            const fillD = `${pathD} L 800 90 L 0 90 Z`;

            return (
              <g>
                <path d={fillD} fill="url(#tideWaveGradCard)" />
                <path d={pathD} fill="none" stroke="#38bdf8" strokeWidth="1.8" />
              </g>
            );
          })()}

          <g transform={`translate(${buoyPoint.x}, ${buoyPoint.y})`}>
            <circle r="10" fill="#0284c7" opacity="0.25" className="animate-pulse" />
            <circle r="5" fill="#0284c7" stroke="white" strokeWidth="1.5" />
            <circle r="2" fill="#fef08a" />
          </g>
        </svg>
      </div>

      <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
        <span>Potential: <strong className="text-indigo-300">{tideTypeLabel}</strong></span>
        <span>Water: <strong className="text-amber-300">{localTideStatus}</strong></span>
      </div>
    </div>
  );
};
