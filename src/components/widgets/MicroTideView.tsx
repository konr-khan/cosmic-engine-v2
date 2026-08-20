import React from "react";
import { toRadians } from "../../utils/cosmicMath";
import { TidalVectors } from "../../types";
import { TidalWaveOscillator } from "./lunar/TidalWaveOscillator";

export interface MicroTideViewProps {
  tides?: TidalVectors | null;
  angles?: { sunDegrees?: number; moonDegrees?: number } | null;
  userRotation?: number;
  localTideStatus?: "High Tide" | "Low Tide" | string;
  hoverDate?: Date | null;
  phaseValue?: number;
}

export const MicroTideView: React.FC<MicroTideViewProps> = ({
  tides = { alignment: 0, rx: 16, ry: 12, type: 'Transitional' },
  angles = { sunDegrees: 0, moonDegrees: 0 },
  userRotation = 0,
  localTideStatus = "Low Tide",
  phaseValue,
}) => {
  const safeTides = tides || { alignment: 0, rx: 16, ry: 12, type: 'Transitional' };
  const safeAngles = angles || { sunDegrees: 0, moonDegrees: 0 };
  const safeUserRotation = userRotation || 0;
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
  const isLeftHemisphere = Math.abs(safeAngles.sunDegrees || 0) > 90;

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Info Rail */}
      <div className="flex justify-between items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Earth gravitational tidal force vectors, orbital syzygy &amp; global ocean wave potential
        </p>
      </div>

      {/* Main Grid: 2D Gravitational Vector Disk + Harmonized Tidal Wave Oscillator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 items-stretch">
        
        {/* Left Side: 2D Tidal Bulge & Orbit SVG Viewport (lg:col-span-7) */}
        <div className="lg:col-span-7 relative w-full min-h-[220px] flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800/80 p-3 overflow-hidden">
          {/* Global Potential & Local Water Overlay Badge */}
          <div className="absolute top-2.5 right-2.5 text-right z-10 bg-slate-900/90 backdrop-blur px-2.5 py-1.5 rounded-xl border border-slate-800 font-mono space-y-0.5">
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
            <g transform={`rotate(${safeAngles.sunDegrees || 0})`}>
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

            {/* Earth Night Base (Deep Space Slate) */}
            <circle
              r="12"
              fill="#020617"
              stroke="#334155"
              strokeWidth="0.75"
            />

            {/* Earth Lit Side & Layered Twilight Transitions (Rotated to Sun Vector) */}
            <g transform={`rotate(${safeAngles.sunDegrees || 0})`}>
              {/* Astronomical Twilight Band (h: -18° to -12°, ±108° sector) */}
              <path
                d="M 0,0 L -3.71,-11.41 A 12,12 0 1,1 -3.71,11.41 Z"
                fill="#1e293b"
              />
              {/* Nautical Twilight Band (h: -12° to -6°, ±102° sector) */}
              <path
                d="M 0,0 L -2.49,-11.74 A 12,12 0 1,1 -2.49,11.74 Z"
                fill="#334155"
              />
              {/* Civil Twilight Band (h: -6° to -0.833°, ±96° sector - harmonized oceanic twilight) */}
              <path
                d="M 0,0 L -1.25,-11.93 A 12,12 0 1,1 -1.25,11.93 Z"
                fill="#1e40af"
              />
              {/* Full Daylight Sunlit Hemisphere (180° Blue Oceanic Arc) */}
              <path
                d="M 0,-12 A 12,12 0 0,1 0,12 Z"
                fill="#2563eb"
              />
              {/* Crisp Daylight Terminator Line */}
              <line
                x1="0"
                y1="-12"
                x2="0"
                y2="12"
                stroke="#60a5fa"
                strokeWidth="0.5"
                strokeOpacity="0.8"
              />
            </g>

            {/* Globe Outer Hairline Rim */}
            <circle
              r="12"
              fill="none"
              stroke="#60a5fa"
              strokeWidth="0.75"
              strokeOpacity="0.3"
            />

            {/* User Location Pin (Conforms with Dual View pin formatting) */}
            {(() => {
              const normUserRot = ((safeUserRotation % 360) + 360) % 360;
              const isUserDaylight = normUserRot <= 90 || normUserRot >= 270;
              return (
                <g transform={`rotate(${(safeAngles.sunDegrees || 0) + safeUserRotation})`}>
                  {isUserDaylight && (
                    <circle
                      cx="12"
                      cy="0"
                      r="4"
                      fill="#38bdf8"
                      opacity="0.25"
                      className="animate-pulse pointer-events-none"
                    />
                  )}
                  <circle
                    cx="12"
                    cy="0"
                    r="2"
                    fill={isUserDaylight ? "#38bdf8" : "#64748b"}
                    stroke="#ffffff"
                    strokeWidth="0.75"
                    opacity={isUserDaylight ? 1 : 0.45}
                    className="cursor-pointer drop-shadow-sm"
                  />
                </g>
              );
            })()}

            {/* Moon Orbit */}
            <circle
              cx="0"
              cy="0"
              r="60"
              fill="none"
              stroke="#334155"
              strokeWidth="0.75"
              strokeDasharray="3 3"
            />

            {/* Moon Body */}
            <g
              transform={`translate(${60 * Math.cos(toRadians(safeAngles.moonDegrees || 0))}, ${60 * Math.sin(toRadians(safeAngles.moonDegrees || 0))})`}
            >
              <circle r="6" fill="#020617" stroke="#334155" strokeWidth="0.75" />
              <g transform={`rotate(${safeAngles.sunDegrees || 0})`}>
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
