import React, { useState, useMemo } from "react";
import { toRadians } from "../../../utils/cosmicMath";
import { TidalVectors } from "../../../types";
import { OrbitalAngles } from "../../../types/coordinates";
import { TidalWaveOscillator } from "../lunar/TidalWaveOscillator";
import { MiniGlobe } from "../../common/MiniGlobe";

export interface MicroTideViewProps {
  tides?: TidalVectors | null;
  angles?: OrbitalAngles | {
    toSun?: number;
    toMoon?: number;
    sunDegrees?: number;
    moonDegrees?: number;
    nodeLongitude?: number;
    descendingNodeLongitude?: number;
  } | null;
  userRotation?: number;
  localTideStatus?: "High Tide" | "Low Tide" | string;
  hoverDate?: Date | null;
  phaseValue?: number;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  sunLambdaDeg?: number;
  nodeLongitude?: number;
  descendingNodeLongitude?: number;
  moonEclipticLatitude?: number;
}

export const MicroTideView: React.FC<MicroTideViewProps> = ({
  tides = { alignment: 0, rx: 16, ry: 12, type: 'Transitional' },
  angles = { sunDegrees: 0, moonDegrees: 0 },
  userRotation = 0,
  localTideStatus = "Low Tide",
  phaseValue,
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12.0,
  sunLambdaDeg = 0,
  nodeLongitude,
  descendingNodeLongitude,
  moonEclipticLatitude,
}) => {
  const [orbitViewMode, setOrbitViewMode] = useState<'standard' | 'nodal'>('standard');

  const safeTides = tides || { alignment: 0, rx: 16, ry: 12, type: 'Transitional' };
  const safeAngles = angles || { sunDegrees: 0, moonDegrees: 0 };
  const safeLocalTideStatus = localTideStatus || "Low Tide";

  // Compute lunar phase value (0 to 1) if not explicitly provided
  const computedPhaseValue = phaseValue !== undefined
    ? phaseValue
    : (((safeAngles.moonDegrees || 0) - (safeAngles.sunDegrees || 0) + 360) % 360) / 360;

  const tideTextColor =
    (safeTides.alignment || 0) > 0 ? "text-indigo-400" : "text-amber-400";
  const localTideColor =
    safeLocalTideStatus === "High Tide" ? "text-cyan-400" : "text-slate-400";

  // Refined "TO SUN" Rotation Logic
  const sunAngleDeg = Number(safeAngles.sunDegrees) || 0;
  const isLeftHemisphere = Math.abs(sunAngleDeg) > 90;

  // Ascending and Descending Node Angular Locations on the 2D Orbital Circle
  const safeNodeLon = Number(nodeLongitude ?? (safeAngles as any).nodeLongitude) || 0;
  const safeSunLambda = Number(sunLambdaDeg) || 0;
  const thetaNodeDeg = ((sunAngleDeg + (safeNodeLon - safeSunLambda)) % 360 + 360) % 360;
  const thetaDescNodeDeg = (thetaNodeDeg + 180) % 360;

  // 4-Quadrant Nodal Orbital Loop Segments (Waxing/Waning x Ascending/Descending)
  const nodalSegments = useMemo(() => {
    const steps = 72;
    const r = 60;
    const waxAsc: string[] = [];
    const waxDesc: string[] = [];
    const wanAsc: string[] = [];
    const wanDesc: string[] = [];

    for (let i = 0; i < steps; i++) {
      const deg1 = (i / steps) * 360;
      const deg2 = ((i + 1) / steps) * 360;
      const rad1 = toRadians(deg1);
      const rad2 = toRadians(deg2);

      const x1 = r * Math.cos(rad1);
      const y1 = r * Math.sin(rad1);
      const x2 = r * Math.cos(rad2);
      const y2 = r * Math.sin(rad2);

      const midDeg = (deg1 + deg2) / 2;
      const elong = ((midDeg - sunAngleDeg) % 360 + 360) % 360;
      const deltaNode = ((midDeg - thetaNodeDeg) % 360 + 360) % 360;

      const isWax = elong <= 180;
      const isAsc = deltaNode <= 180;

      const seg = `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
      if (isWax) {
        if (isAsc) waxAsc.push(seg);
        else waxDesc.push(seg);
      } else {
        if (isAsc) wanAsc.push(seg);
        else wanDesc.push(seg);
      }
    }

    return {
      waxAsc: waxAsc.join(' '),
      waxDesc: waxDesc.join(' '),
      wanAsc: wanAsc.join(' '),
      wanDesc: wanDesc.join(' ')
    };
  }, [sunAngleDeg, thetaNodeDeg]);

  // Node Pins Positions (R = 60px)
  const nodePos = useMemo(() => {
    const radAsc = toRadians(thetaNodeDeg);
    const radDesc = toRadians(thetaDescNodeDeg);
    return {
      asc: { x: 60 * Math.cos(radAsc), y: 60 * Math.sin(radAsc) },
      desc: { x: 60 * Math.cos(radDesc), y: 60 * Math.sin(radDesc) }
    };
  }, [thetaNodeDeg, thetaDescNodeDeg]);

  // Moon Position & Nodal State
  const moonAngleDeg = safeAngles.moonDegrees || 0;
  const moonRad = toRadians(moonAngleDeg);
  const moonX = 60 * Math.cos(moonRad);
  const moonY = 60 * Math.sin(moonRad);
  const moonDeltaNode = ((moonAngleDeg - thetaNodeDeg) % 360 + 360) % 360;
  const isMoonAsc = moonDeltaNode <= 180;

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Info Rail with Segmented Orbit View Toggle */}
      <div className="flex justify-between items-center gap-2 mb-2">
        <p className="text-xs text-slate-400 hidden sm:block">
          Earth gravitational tidal force vectors, orbital syzygy &amp; global ocean wave potential
        </p>

        {/* Orbit View Mode Segmented Controls */}
        <div className="flex items-center gap-1 bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 ml-auto">
          <button
            type="button"
            onClick={() => setOrbitViewMode('standard')}
            aria-label="Standard Orbit View"
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              orbitViewMode === 'standard'
                ? 'bg-slate-800 text-cyan-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Standard
          </button>
          <button
            type="button"
            onClick={() => setOrbitViewMode('nodal')}
            aria-label="Nodal Loop Orbit View"
            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
              orbitViewMode === 'nodal'
                ? 'bg-slate-800 text-sky-300 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ☊ Nodal Loop
          </button>
        </div>
      </div>

      {/* Main Grid: 2D Gravitational Vector Disk + Harmonized Tidal Wave Oscillator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-stretch">
        
        {/* Left Side: 2D Tidal Bulge & Orbit SVG Viewport (lg:col-span-7) */}
        <div className="lg:col-span-7 relative w-full min-h-[220px] flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800/80 p-3 overflow-hidden">
          {/* Global Potential & Local Water Overlay Badge */}
          <div className="absolute top-2.5 right-2.5 text-right z-10 bg-slate-900/90 backdrop-blur px-2.5 py-1.5 rounded-xl border border-slate-800 font-mono space-y-0.5 pointer-events-none">
            <div>
              <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                Global Potential
              </div>
              <div className={`text-xs font-bold ${tideTextColor}`}>
                {(safeTides.type || 'Transitional').split(" ")[0].toUpperCase()}
              </div>
            </div>
            <div>
              <div className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">
                Local Water
              </div>
              <div className={`text-xs font-bold ${localTideColor}`}>
                {safeLocalTideStatus === "High Tide" ? "HIGH TIDE" : "LOW TIDE"}
              </div>
            </div>
          </div>

          {/* Nodal Legend Overlay (when Nodal Loop is active) */}
          {orbitViewMode === 'nodal' && (
            <div className="absolute bottom-2.5 left-2.5 z-10 bg-slate-900/90 backdrop-blur px-2 py-1.5 rounded-lg border border-slate-800 font-mono text-[9px] space-y-1 pointer-events-none shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2.5 h-0.5 bg-sky-400 rounded-full" />
                <span className="text-sky-300 font-bold">☊ Ascending (+β)</span>
                <span className="inline-block w-2.5 h-0.5 bg-rose-400 rounded-full ml-1" />
                <span className="text-rose-300 font-bold">☋ Descending (-β)</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[8px] pt-0.5 border-t border-slate-800/80">
                <span>Solid: Waxing</span>
                <span>Dashed: Waning</span>
              </div>
            </div>
          )}

          <svg
            viewBox="-100 -100 200 200"
            className="w-full h-full max-h-[260px] overflow-visible"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Coordinate Crosshairs */}
            <line
              x1="-100"
              y1="0"
              x2="100"
              y2="0"
              stroke="#334155"
              strokeWidth="0.5"
              strokeOpacity="0.25"
            />
            <line
              x1="0"
              y1="-100"
              x2="0"
              y2="100"
              stroke="#334155"
              strokeWidth="0.5"
              strokeOpacity="0.25"
            />

            {/* Sun Angle Indicator */}
            <g transform={`rotate(${sunAngleDeg})`}>
              <line
                x1="0"
                y1="0"
                x2="90"
                y2="0"
                stroke="#fbbf24"
                strokeWidth="1.2"
                strokeDasharray="4 2"
                opacity="0.85"
              />
              <text
                x={95}
                y={3}
                textAnchor={isLeftHemisphere ? "end" : "start"}
                fill="#fbbf24"
                fontSize="9"
                fontWeight="600"
                fontFamily="monospace"
                transform={isLeftHemisphere ? "rotate(180, 95, 0)" : ""}
              >
                TO SUN
              </text>
              <polygon points="85,-3 90,0 85,3" fill="#fbbf24" />
            </g>

            {/* Tide Bulge Ellipse */}
            <ellipse
              cx="0"
              cy="0"
              rx={safeTides.rx || 16}
              ry={safeTides.ry || 12}
              fill="#38bdf8"
              opacity="0.2"
              stroke="#38bdf8"
              strokeWidth="1.2"
              transform={`rotate(${safeAngles.moonDegrees || 0})`}
            />

            {/* Earth Living Marble Mini-Globe (Unified 9-layer component) */}
            <MiniGlobe
              cx={0}
              cy={0}
              radius={12}
              viewMode="topdown"
              sunAngleDeg={sunAngleDeg}
              latitude={latitude}
              longitude={longitude}
              timeOfDay={timeOfDay}
              sunLambdaDeg={safeSunLambda}
              showContinents={true}
              showTerminator={true}
              showParallels={true}
              showPolarAxis={true}
              showObserverPin={true}
              showAtmosphereGlow={true}
              showLabel={false}
              label="EARTH"
            />

            {/* Moon Orbit: Standard Dashed Circle vs 4-Quadrant Nodal Plane */}
            {orbitViewMode === 'standard' ? (
              <circle
                cx="0"
                cy="0"
                r="60"
                fill="none"
                stroke="#334155"
                strokeWidth="0.75"
                strokeDasharray="3 3"
              />
            ) : (
              <g className="minitide-nodal-orbit">
                {/* Waxing Ascending: Solid Sky Blue */}
                {nodalSegments.waxAsc && (
                  <path d={nodalSegments.waxAsc} fill="none" stroke="#38bdf8" strokeWidth="1.2" />
                )}
                {/* Waxing Descending: Solid Rose Red */}
                {nodalSegments.waxDesc && (
                  <path d={nodalSegments.waxDesc} fill="none" stroke="#f43f5e" strokeWidth="1.2" />
                )}
                {/* Waning Ascending: Dashed Sky Blue */}
                {nodalSegments.wanAsc && (
                  <path d={nodalSegments.wanAsc} fill="none" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="4 3" />
                )}
                {/* Waning Descending: Dashed Rose Red */}
                {nodalSegments.wanDesc && (
                  <path d={nodalSegments.wanDesc} fill="none" stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="4 3" />
                )}

                {/* Ascending Node Pin ☊ */}
                <g transform={`translate(${nodePos.asc.x}, ${nodePos.asc.y})`} className="cursor-pointer">
                  <circle r="4" fill="#020617" stroke="#38bdf8" strokeWidth="1.2" />
                  <circle r="1.5" fill="#38bdf8" />
                  <text
                    x={nodePos.asc.x >= 0 ? 8 : -8}
                    y="3"
                    textAnchor={nodePos.asc.x >= 0 ? "start" : "end"}
                    className="text-[9px] font-mono font-bold fill-sky-400 select-none pointer-events-none"
                  >
                    ☊
                  </text>
                </g>

                {/* Descending Node Pin ☋ */}
                <g transform={`translate(${nodePos.desc.x}, ${nodePos.desc.y})`} className="cursor-pointer">
                  <circle r="4" fill="#020617" stroke="#f43f5e" strokeWidth="1.2" />
                  <circle r="1.5" fill="#f43f5e" />
                  <text
                    x={nodePos.desc.x >= 0 ? 8 : -8}
                    y="3"
                    textAnchor={nodePos.desc.x >= 0 ? "start" : "end"}
                    className="text-[9px] font-mono font-bold fill-rose-400 select-none pointer-events-none"
                  >
                    ☋
                  </text>
                </g>
              </g>
            )}

            {/* Moon Body */}
            <g
              transform={`translate(${moonX}, ${moonY})`}
            >
              {orbitViewMode === 'nodal' && (
                <circle
                  r="9"
                  fill="none"
                  stroke={isMoonAsc ? "#38bdf8" : "#f43f5e"}
                  strokeWidth="1"
                  strokeOpacity="0.4"
                  className="animate-pulse"
                />
              )}
              <circle 
                r="6" 
                fill="#020617" 
                stroke={orbitViewMode === 'nodal' ? (isMoonAsc ? "#38bdf8" : "#f43f5e") : "#334155"} 
                strokeWidth={orbitViewMode === 'nodal' ? "1" : "0.75"} 
              />
              <g transform={`rotate(${sunAngleDeg})`}>
                <path d="M 0,-6 A 6,6 0 0,1 0,6 Z" fill="#f8fafc" />
              </g>
            </g>
          </svg>
        </div>

        {/* Right Side: TidalWaveOscillator & Status Summary (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2.5">
          <TidalWaveOscillator
            tides={safeTides}
            phaseValue={computedPhaseValue}
            localTideStatus={safeLocalTideStatus}
          />

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 flex flex-col justify-between text-xs font-mono text-slate-400 gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-sans text-slate-400">Gravitational Alignment:</span>
              <strong className={`font-semibold font-mono ${(safeTides.alignment || 0) > 0 ? "text-indigo-400" : "text-amber-400"}`}>
                {safeTides.type || "Transitional"}
              </strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[11px] font-sans text-slate-400">Local Observer Water:</span>
              <strong className={`font-semibold font-mono ${safeLocalTideStatus === "High Tide" ? "text-slate-200" : "text-slate-300"}`}>
                {safeLocalTideStatus}
              </strong>
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-800/60 pt-1">
              <span>Syzygy Factor: {((safeTides.alignment || 0) * 100).toFixed(0)}%</span>
              <span>Bulge Radius: {(safeTides.rx || 16).toFixed(1)} RE</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MicroTideView;
