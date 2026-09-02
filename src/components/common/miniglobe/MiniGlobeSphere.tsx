/**
 * @file MiniGlobeSphere.tsx
 * Sub-renderer for 3D Earth spherical projection view modes ('topdown', 'transverse', 'axial', 'euler3d').
 * Renders nighttime hemisphere, terminator daylight/twilight bands, rotated world continents,
 * parallels, polar axis, specular limb rim, and topocentric observer pin.
 */

import React from 'react';
import { toRadians } from '../../../types/units';
import { MiniGlobeSphereProps } from './types';

export const MiniGlobeSphere: React.FC<MiniGlobeSphereProps> = ({
  viewMode,
  safeRadius,
  clipPathId,
  dayGradId,
  epsRad,
  camera,
  showTerminator,
  showContinents,
  showParallels,
  showPolarAxis,
  showObserverPin,
  topdownGeometry,
  transverseGeometry,
  axialGeometry,
  eulerGeometry,
  continentPaths
}) => {
  return (
    <g className="miniglobe-sphere">
      {/* Layer 2: Base Nighttime Hemisphere (Deep Slate #020617) */}
      <circle cx="0" cy="0" r={safeRadius} fill="#020617" />

      {/* Layer 3: Daylight & Twilight Terminator Bands (Clipped) */}
      {showTerminator && safeRadius > 0 && (
        <g clipPath={`url(#${clipPathId})`}>
          {/* TOPDOWN Daylight */}
          {viewMode === 'topdown' && topdownGeometry?.dayPath && (
            <path d={topdownGeometry.dayPath} fill={`url(#${dayGradId})`} />
          )}

          {/* TRANSVERSE Daylight */}
          {viewMode === 'transverse' && transverseGeometry?.dayPath && (
            <path d={transverseGeometry.dayPath} fill={`url(#${dayGradId})`} />
          )}

          {/* EULER3D Twilight & Daylight Bands */}
          {viewMode === 'euler3d' && eulerGeometry && (
            <g fillRule="evenodd">
              {eulerGeometry.nauticalPath && (
                <path d={eulerGeometry.nauticalPath} fill="#1e293b" fillRule="evenodd" />
              )}
              {eulerGeometry.civilPath && (
                <path d={eulerGeometry.civilPath} fill="#1e40af" fillRule="evenodd" />
              )}
              {eulerGeometry.dayPath && (
                <path d={eulerGeometry.dayPath} fill={`url(#${dayGradId})`} fillRule="evenodd" />
              )}
            </g>
          )}
        </g>
      )}

      {/* Layer 3b: World Continents Landmasses (Living Marble Earth) */}
      {showContinents && safeRadius > 0 && continentPaths.length > 0 && (
        <g className="miniglobe-continents pointer-events-none" clipPath={`url(#${clipPathId})`}>
          {continentPaths.map((d, idx) => (
            <path 
              key={idx} 
              d={d} 
              fill="#10b981" 
              fillOpacity="0.35" 
              stroke="#34d399" 
              strokeWidth="0.4" 
              strokeOpacity="0.55" 
              strokeLinejoin="round" 
            />
          ))}
        </g>
      )}

      {/* Layer 4: Parallels (Equator, Tropic of Cancer, Tropic of Capricorn) */}
      {showParallels && safeRadius > 0 && (
        <g className="miniglobe-parallels pointer-events-none" clipPath={`url(#${clipPathId})`}>
          {/* TOPDOWN Mode Parallels */}
          {viewMode === 'topdown' && topdownGeometry && (
            <>
              {/* Tropic of Cancer (+23.44°) */}
              <ellipse 
                cx="0" 
                cy={-topdownGeometry.tropShiftY} 
                rx={safeRadius * Math.cos(epsRad)} 
                ry={topdownGeometry.tropRy} 
                fill="none" 
                stroke="#64748b" 
                strokeWidth="0.5" 
                strokeDasharray="2 1.5" 
                opacity="0.6" 
              />
              {/* Equator (0°) */}
              <ellipse 
                cx="0" 
                cy="0" 
                rx={safeRadius} 
                ry={topdownGeometry.eqRy} 
                fill="none" 
                stroke="#38bdf8" 
                strokeWidth="0.75" 
                strokeDasharray="2 1.5" 
                opacity="0.85" 
              />
              {/* Tropic of Capricorn (-23.44°) */}
              <ellipse 
                cx="0" 
                cy={topdownGeometry.tropShiftY} 
                rx={safeRadius * Math.cos(epsRad)} 
                ry={topdownGeometry.tropRy} 
                fill="none" 
                stroke="#64748b" 
                strokeWidth="0.5" 
                strokeDasharray="2 1.5" 
                opacity="0.6" 
              />
            </>
          )}

          {/* TRANSVERSE Mode Parallels */}
          {viewMode === 'transverse' && transverseGeometry && (
            <line 
              x1={transverseGeometry.sideGeom.eqX1} 
              y1={transverseGeometry.sideGeom.eqY1} 
              x2={transverseGeometry.sideGeom.eqX2} 
              y2={transverseGeometry.sideGeom.eqY2} 
              stroke="#38bdf8" 
              strokeWidth="0.85" 
              strokeDasharray="2.5 1.5" 
              opacity="0.85" 
            />
          )}

          {/* AXIAL Mode Parallels */}
          {viewMode === 'axial' && axialGeometry && (
            <path 
              d={axialGeometry.equatorPathD} 
              fill="none" 
              stroke="#38bdf8" 
              strokeWidth="0.85" 
              strokeDasharray="2.5 1.5" 
              opacity="0.85" 
            />
          )}

          {/* EULER3D Mode Equator Parallel */}
          {viewMode === 'euler3d' && (
            <ellipse 
              cx="0" 
              cy="0" 
              rx={safeRadius} 
              ry={Math.max(0.5, safeRadius * Math.sin(toRadians(Math.abs(Number(camera?.pitch) || 0))))} 
              fill="none" 
              stroke="#38bdf8" 
              strokeWidth="0.65" 
              strokeDasharray="2 1.5" 
              opacity="0.75" 
            />
          )}
        </g>
      )}

      {/* Layer 5: Polar Axis Line (23.44° Rotational Axis) */}
      {showPolarAxis && safeRadius > 0 && (
        <g className="miniglobe-polar-axis pointer-events-none" clipPath={`url(#${clipPathId})`}>
          {viewMode === 'topdown' && (
            <line 
              x1="0" 
              y1={-safeRadius} 
              x2="0" 
              y2={safeRadius} 
              stroke="#93c5fd" 
              strokeWidth="0.85" 
              strokeDasharray="2.5 1.5" 
              opacity="0.75" 
            />
          )}
          {viewMode === 'transverse' && transverseGeometry && (
            <line 
              x1={-transverseGeometry.sideGeom.poleLineX} 
              y1={transverseGeometry.sideGeom.poleLineY} 
              x2={transverseGeometry.sideGeom.poleLineX} 
              y2={-transverseGeometry.sideGeom.poleLineY} 
              stroke="#93c5fd" 
              strokeWidth="0.85" 
              strokeDasharray="2.5 1.5" 
              opacity="0.75" 
            />
          )}
          {viewMode === 'axial' && axialGeometry && (
            <line 
              x1={-axialGeometry.poleLineX} 
              y1={axialGeometry.poleLineY} 
              x2={axialGeometry.poleLineX} 
              y2={-axialGeometry.poleLineY} 
              stroke="#93c5fd" 
              strokeWidth="0.85" 
              strokeDasharray="2.5 1.5" 
              opacity="0.75" 
            />
          )}
          {viewMode === 'euler3d' && eulerGeometry && (
            <line 
              x1={-eulerGeometry.polePx} 
              y1={-eulerGeometry.polePy} 
              x2={eulerGeometry.polePx} 
              y2={eulerGeometry.polePy} 
              stroke="#93c5fd" 
              strokeWidth="0.85" 
              strokeDasharray="2.5 1.5" 
              opacity="0.75" 
            />
          )}
        </g>
      )}

      {/* Layer 6: Planetary Specular Limb Rim */}
      {safeRadius > 0 && (
        <>
          <circle 
            cx="0" 
            cy="0" 
            r={safeRadius} 
            fill="none" 
            stroke="#60a5fa" 
            strokeWidth="1.2" 
            strokeOpacity="0.8" 
            className="pointer-events-none" 
          />
          <circle 
            cx="0" 
            cy="0" 
            r={Math.max(0, safeRadius - 0.4)} 
            fill="none" 
            stroke="#93c5fd" 
            strokeWidth="0.4" 
            strokeOpacity="0.4" 
            className="pointer-events-none" 
          />
        </>
      )}

      {/* Layer 7: Topocentric Observer Location Pin ("YOU") */}
      {showObserverPin && safeRadius > 0 && (
        <g className="miniglobe-observer-pin pointer-events-none">
          {/* TOPDOWN Observer Pin */}
          {viewMode === 'topdown' && topdownGeometry && (
            <g transform={`translate(${topdownGeometry.obsPx.toFixed(2)}, ${topdownGeometry.obsPy.toFixed(2)})`}>
              {topdownGeometry.isDaylight ? (
                <>
                  <circle r="3.2" fill="#38bdf8" opacity="0.3" className="animate-pulse" />
                  <circle r="1.6" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
                </>
              ) : (
                <circle r="1.4" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5" opacity="0.8" />
              )}
            </g>
          )}

          {/* TRANSVERSE Observer Pin */}
          {viewMode === 'transverse' && transverseGeometry && (
            <g transform={`translate(${transverseGeometry.sideGeom.obsPx.toFixed(2)}, ${transverseGeometry.sideGeom.obsPy.toFixed(2)})`}>
              {transverseGeometry.sideGeom.isDaylight ? (
                <>
                  <circle r="3.5" fill="#38bdf8" opacity="0.3" className="animate-pulse" />
                  <circle r="1.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.75" />
                </>
              ) : (
                <circle r="1.5" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5" opacity="0.8" />
              )}
            </g>
          )}

          {/* AXIAL Observer Pin */}
          {viewMode === 'axial' && axialGeometry && (
            <g transform={`translate(${axialGeometry.obsPx.toFixed(2)}, ${axialGeometry.obsPy.toFixed(2)})`}>
              {axialGeometry.isDaylight ? (
                <>
                  <circle r="3.5" fill="#38bdf8" opacity="0.3" className="animate-pulse" />
                  <circle r="1.8" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.75" />
                </>
              ) : (
                <circle r="1.5" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5" opacity="0.8" />
              )}
            </g>
          )}

          {/* EULER3D Observer Pin */}
          {viewMode === 'euler3d' && eulerGeometry && eulerGeometry.isObsVisible && (
            <g transform={`translate(${eulerGeometry.obsPx.toFixed(2)}, ${eulerGeometry.obsPy.toFixed(2)})`}>
              {eulerGeometry.isObsDay ? (
                <>
                  <circle r="3.0" fill="#38bdf8" opacity="0.3" className="animate-pulse" />
                  <circle r="1.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
                </>
              ) : (
                <circle r="1.3" fill="#64748b" stroke="#94a3b8" strokeWidth="0.5" opacity="0.8" />
              )}
            </g>
          )}
        </g>
      )}
    </g>
  );
};

export default MiniGlobeSphere;
