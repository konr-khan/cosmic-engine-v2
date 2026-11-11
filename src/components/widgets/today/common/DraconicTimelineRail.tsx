/**
 * @file DraconicTimelineRail.tsx
 * Interactive ±15-day SVG draconic timeline rail.
 * Visualizes the Moon's orbital passage across Ascending (☊) and Descending (☋) nodes,
 * with continuous ecliptic hemisphere coloring (Sky Blue North / Rose Red South),
 * pinned node markers, proximity countdowns, and a pulsing active lunar bead at T=0.
 */

import React from 'react';
import { calculateSkyDomeLunarNodes } from '../../../../utils/cosmicMath';

export interface DraconicTimelineRailProps {
  nodalData: ReturnType<typeof calculateSkyDomeLunarNodes>;
}

export const DraconicTimelineRail: React.FC<DraconicTimelineRailProps> = ({ nodalData }) => {
  const pastSymbol = nodalData.prevNodeType === 'ascending' ? '☊' : '☋';
  const upcomingSymbol = nodalData.upcomingNodeType === 'ascending' ? '☊' : '☋';

  return (
    <div 
      className="w-full relative py-0.5" 
      title={`Monthly Draconic Window (±15 Days): Today centered, Past node: ${pastSymbol} (${nodalData.daysSincePrevNode}d ago), Next node: ${upcomingSymbol} (in ${nodalData.daysToNextNode}d)`}
    >
      <svg viewBox="0 0 240 16" className="w-full h-4 block overflow-visible">
        {/* Subtle background rail track */}
        <line x1="12" y1="8" x2="228" y2="8" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

        {/* Day markers / ticks (-10d, -5d, +5d, +10d) */}
        {[-10, -5, 5, 10].map((day) => {
          const tickX = 120 + day * 7.2;
          return (
            <line
              key={day}
              x1={tickX}
              y1="6"
              x2={tickX}
              y2="10"
              stroke="#334155"
              strokeWidth="0.75"
              strokeOpacity="0.6"
            />
          );
        })}

        {/* Dynamic continuous timeline segments colored by ecliptic hemisphere (Sky Blue North / Rose Red South) */}
        {nodalData.timelineSegments.map((seg, idx) => {
          const x1 = Math.max(12, Math.min(228, 120 + seg.startDays * 7.2));
          const x2 = Math.max(12, Math.min(228, 120 + seg.endDays * 7.2));
          return (
            <line
              key={idx}
              x1={x1.toFixed(1)}
              y1="8"
              x2={x2.toFixed(1)}
              y2="8"
              stroke={seg.color}
              strokeWidth="2.5"
              strokeOpacity="0.85"
            />
          );
        })}

        {/* Pinned Node Markers along the timeline */}
        {nodalData.timelineNodes.map((node, idx) => {
          const x = 120 + node.daysOffset * 7.2;
          if (x < 10 || x > 230) return null;
          return (
            <g key={idx} transform={`translate(${x.toFixed(1)}, 8)`}>
              <circle cx="0" cy="0" r="2.8" fill="#020617" stroke={node.color} strokeWidth="1.2" />
              <text
                x="0"
                y="-4.5"
                textAnchor="middle"
                className="text-[6.5px] font-bold select-none pointer-events-none"
                fill={node.color}
              >
                {node.symbol}
              </text>
              <title>{`${node.type === 'ascending' ? 'Ascending Node (☊)' : 'Descending Node (☋)'}: ${node.daysOffset >= 0 ? `in ${node.daysOffset.toFixed(1)}d` : `${Math.abs(node.daysOffset).toFixed(1)}d ago`}`}</title>
            </g>
          );
        })}

        {/* Center Target: Today / Now (T = 0, X = 120) */}
        <g transform="translate(120, 8)">
          {/* Vertical Center Guide */}
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#64748b" strokeWidth="0.75" strokeDasharray="1 1" strokeOpacity="0.5" />
          {/* Pulsing Active Moon Bead */}
          <circle
            cx="0"
            cy="0"
            r="4.5"
            fill={nodalData.isMoonAscending ? '#38bdf8' : '#f43f5e'}
            fillOpacity="0.35"
            className="animate-pulse"
          />
          <circle
            cx="0"
            cy="0"
            r="2.5"
            fill="#f8fafc"
            stroke={nodalData.isMoonAscending ? '#38bdf8' : '#f43f5e'}
            strokeWidth="1.2"
          />
        </g>

        {/* Timeline Axis Micro-Labels */}
        <text x="14" y="15" textAnchor="start" className="text-[5.5px] font-mono fill-slate-600 select-none pointer-events-none">−15d</text>
        <text x="120" y="15" textAnchor="middle" className="text-[5.5px] font-mono fill-slate-400 font-semibold select-none pointer-events-none">Today</text>
        <text x="226" y="15" textAnchor="end" className="text-[5.5px] font-mono fill-slate-600 select-none pointer-events-none">+15d</text>
      </svg>
    </div>
  );
};
