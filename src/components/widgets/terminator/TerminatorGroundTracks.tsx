import React from 'react';
import { GroundTrackResult, ActiveNodalMarker } from '../../../utils/cosmicMath';

export interface TerminatorGroundTracksProps {
  showSunTrack: boolean;
  sunTrack: GroundTrackResult | null;
  showMoonTrack: boolean;
  moonTrack: GroundTrackResult | null;
  activeNodalMarker: ActiveNodalMarker | null;
}

/**
 * TerminatorGroundTracks
 * 
 * Renders 24-hour diurnal ground tracks for the Subsolar and Sublunar points
 * with past (dotted historical) and future (dashed trajectory) segments,
 * as well as active Draconic nodal crossing markers within +-12 hours.
 */
export const TerminatorGroundTracks: React.FC<TerminatorGroundTracksProps> = ({
  showSunTrack,
  sunTrack,
  showMoonTrack,
  moonTrack,
  activeNodalMarker
}) => {
  return (
    <>
      {/* 24-Hour Diurnal Subsolar Ground Track */}
      {showSunTrack && sunTrack && (
        <g className="sun-ground-track pointer-events-none">
          {/* Past 12h: subtle dotted amber (historical trail) */}
          {sunTrack.pastD && (
            <path
              d={sunTrack.pastD}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1"
              strokeDasharray="1 3"
              strokeOpacity="0.30"
            />
          )}
          {/* Future 12h: prominent dashed amber (future trajectory) */}
          {sunTrack.futureD && (
            <path
              d={sunTrack.futureD}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1"
              strokeDasharray="4 3"
              strokeOpacity="0.55"
            />
          )}
        </g>
      )}

      {/* 24-Hour Diurnal Sublunar Ground Track & Active Nodal Crossing */}
      {showMoonTrack && moonTrack && (
        <g className="moon-ground-track">
          {/* Past 12h: subtle dotted cyan/slate (historical trail) */}
          {moonTrack.pastD && (
            <path
              d={moonTrack.pastD}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="1"
              strokeDasharray="1 3"
              strokeOpacity="0.30"
              className="pointer-events-none"
            />
          )}
          {/* Future 12h: prominent dashed cyan/slate (future trajectory) */}
          {moonTrack.futureD && (
            <path
              d={moonTrack.futureD}
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.1"
              strokeDasharray="3.5 2.5"
              strokeOpacity="0.55"
              className="pointer-events-none"
            />
          )}
          {/* Active Ecliptic Nodal Crossing Marker if within +-12h */}
          {activeNodalMarker && (
            <g className="nodal-crossing-marker cursor-help pointer-events-auto">
              <circle
                cx={activeNodalMarker.x}
                cy={activeNodalMarker.y}
                r="7"
                fill={activeNodalMarker.type === 'ascending' ? '#06b6d4' : '#f43f5e'}
                fillOpacity="0.25"
                className="animate-pulse"
              />
              <circle
                cx={activeNodalMarker.x}
                cy={activeNodalMarker.y}
                r="3"
                fill={activeNodalMarker.type === 'ascending' ? '#22d3ee' : '#fb7185'}
                stroke="#ffffff"
                strokeWidth="0.75"
              />
              <text
                x={activeNodalMarker.x + 5}
                y={activeNodalMarker.y - 4}
                className={`text-[8px] font-mono font-bold drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)] select-none ${
                  activeNodalMarker.type === 'ascending' ? 'fill-cyan-300' : 'fill-rose-300'
                }`}
              >
                {activeNodalMarker.symbol} Node
              </text>
              <title>{activeNodalMarker.label}</title>
            </g>
          )}
        </g>
      )}
    </>
  );
};

TerminatorGroundTracks.displayName = 'TerminatorGroundTracks';
