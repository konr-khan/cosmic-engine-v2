import React, { useMemo } from 'react';
import { WORLD_LANDMASSES } from '../../../utils/cosmicMath';

export interface TerminatorLandmassesProps {
  longitude: number;
}

/**
 * TerminatorLandmasses
 * 
 * Renders world landmass continent polygons relative to the centered observer longitude
 * with [-360, 0, +360] antimeridian wrapping offsets.
 * Memoized on observer longitude to prevent polygon re-renders during time-only scrubbing.
 */
export const TerminatorLandmasses: React.FC<TerminatorLandmassesProps> = React.memo(({ longitude }) => {
  const landmassPaths = useMemo(() => {
    return WORLD_LANDMASSES.map((poly, idx) => {
      const offsets = [-360, 0, 360];
      const pathD = offsets.map((offset) => {
        let d = '';
        poly.forEach(([lon, lat], i) => {
          const x = lon - longitude + 180 + offset;
          const y = 90 - lat;
          d += i === 0 ? `M ${x.toFixed(1)} ${y.toFixed(1)}` : ` L ${x.toFixed(1)} ${y.toFixed(1)}`;
        });
        d += ' Z';
        return d;
      }).join(' ');

      return (
        <path 
          key={idx} 
          d={pathD} 
          fill="#334155" 
          stroke="#64748b" 
          strokeWidth="0.75" 
          opacity="0.85" 
        />
      );
    });
  }, [longitude]);

  return <>{landmassPaths}</>;
});

TerminatorLandmasses.displayName = 'TerminatorLandmasses';
