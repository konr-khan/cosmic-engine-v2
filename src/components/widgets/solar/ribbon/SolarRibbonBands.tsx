import React from 'react';
import { AnnualSolarMatrixItem } from '../../../../types';

export interface SolarRibbonBandsProps {
  almanacData: AnnualSolarMatrixItem[];
  keyStats: {
    earliestSunrise: AnnualSolarMatrixItem;
    latestSunset: AnnualSolarMatrixItem;
  };
  dayToX: (day: number) => number;
  timeToY: (time: number) => number;
  getDayLabel: (dayNum: number) => string;
  buildBandPath: (topKey: keyof AnnualSolarMatrixItem, bottomKey: keyof AnnualSolarMatrixItem) => string;
  buildLinePath: (key: keyof AnnualSolarMatrixItem) => string;
  paddingLeft?: number;
  paddingTop?: number;
  chartW?: number;
  chartH?: number;
}

export const SolarRibbonBands: React.FC<SolarRibbonBandsProps> = ({
  almanacData,
  keyStats,
  dayToX,
  timeToY,
  getDayLabel,
  buildBandPath,
  buildLinePath,
  paddingLeft = 55,
  paddingTop = 30,
  chartW = 680,
  chartH = 375,
}) => {
  return (
    <>
      <defs>
        <linearGradient id="solarAlmanacDayGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id="solarAlmanacCivilGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="solarAlmanacNauticalGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64748b" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#475569" stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id="solarAlmanacAstroGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#1e293b" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Night Base Canvas */}
      <rect x={paddingLeft} y={paddingTop} width={chartW} height={chartH} fill="#020617" rx="6" />

      {/* Twilight Bands */}
      <path d={buildBandPath('astroDusk', 'astroDawn')} fill="url(#solarAlmanacAstroGrad)" />
      <path d={buildBandPath('nauticalDusk', 'nauticalDawn')} fill="url(#solarAlmanacNauticalGrad)" />
      <path d={buildBandPath('civilDusk', 'civilDawn')} fill="url(#solarAlmanacCivilGrad)" />
      <path d={buildBandPath('sunset', 'sunrise')} fill="url(#solarAlmanacDayGrad)" />

      {/* Boundary Curves */}
      <path d={buildLinePath('sunrise')} fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.85" />
      <path d={buildLinePath('sunset')} fill="none" stroke="#000000" strokeWidth="1.5" strokeOpacity="0.85" />
      <path d={buildLinePath('solarNoon')} fill="none" stroke="#64748b" strokeWidth="1" strokeDasharray="4 2" opacity="0.6" />
      <path d={buildLinePath('civilDawn')} fill="none" stroke="#475569" strokeWidth="0.75" opacity="0.5" />
      <path d={buildLinePath('civilDusk')} fill="none" stroke="#475569" strokeWidth="0.75" opacity="0.5" />

      {/* Key Stats Annotations */}
      {keyStats?.earliestSunrise && (
        <g transform={`translate(${dayToX(keyStats.earliestSunrise.day)}, ${timeToY(keyStats.earliestSunrise.sunrise)})`}>
          <circle r="3" fill="#000000" />
          <text y="14" textAnchor="middle" className="text-[10px] font-semibold fill-indigo-300 font-mono">
            {getDayLabel(keyStats.earliestSunrise.day)}
          </text>
        </g>
      )}

      {keyStats?.latestSunset && (
        <g transform={`translate(${dayToX(keyStats.latestSunset.day)}, ${timeToY(keyStats.latestSunset.sunset)})`}>
          <circle r="3" fill="#000000" />
          <text y="-8" textAnchor="middle" className="text-[10px] font-semibold fill-indigo-300 font-mono">
            {getDayLabel(keyStats.latestSunset.day)}
          </text>
        </g>
      )}
    </>
  );
};

export default SolarRibbonBands;
