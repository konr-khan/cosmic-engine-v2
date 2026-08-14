import React from "react";
import { CONFIG } from "../../utils/cosmicMath";

const toRadians = (degrees) => degrees * (Math.PI / 180);

export const MicroTideView = ({
  tides,
  angles,
  userRotation,
  localTideStatus,
  hoverDate,
}) => {
  const tideTextColor =
    tides.alignment > 0 ? "text-indigo-400" : "text-amber-400";
  const localTideColor =
    localTideStatus === "High Tide" ? "text-cyan-400" : "text-slate-400";

  // Refined "TO SUN" Rotation Logic
  const isLeftHemisphere = Math.abs(angles.sunDegrees) > 90;

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Inline Info Rail */}
      <div className="flex justify-between items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Earth gravitational tidal force vectors &amp; global water potential
        </p>
      </div>

      {/* Main SVG Viewport */}
      <div className="relative w-full flex-1 min-h-[220px] flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800/80 p-4 overflow-hidden">
        {/* Global Potential & Local Water Overlay Badge */}
        <div className="absolute top-3 right-3 text-right z-10 bg-slate-900/90 backdrop-blur px-3 py-2 rounded-xl border border-slate-800 font-mono space-y-1">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Global Potential
            </div>
            <div className={`text-sm font-bold ${tideTextColor}`}>
              {tides.type.split(" ")[0].toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Local Water
            </div>
            <div className={`text-sm font-bold ${localTideColor}`}>
              {localTideStatus === "High Tide" ? "HIGH TIDE" : "LOW TIDE"}
            </div>
          </div>
        </div>

        <svg
          viewBox="-100 -100 200 200"
          className="w-full h-full max-h-[300px] overflow-visible"
          preserveAspectRatio="xMidYMid meet"
        >
          <line
            x1="-100"
            y1="0"
            x2="100"
            y2="0"
            stroke="#334155"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="-100"
            x2="0"
            y2="100"
            stroke="#334155"
            strokeWidth="1"
          />

          {/* Sun Angle Indicator */}
          <g transform={`rotate(${angles.sunDegrees})`}>
            <line
              x1="0"
              y1="0"
              x2="90"
              y2="0"
              stroke={CONFIG.THEME.SUN_FILL}
              strokeWidth="2"
              strokeDasharray="4 2"
            />
            <text
              x={95}
              y={3}
              textAnchor={isLeftHemisphere ? "end" : "start"}
              fill="#fbbf24"
              fontSize="9"
              fontWeight="bold"
              transform={isLeftHemisphere ? "rotate(180, 95, 0)" : ""}
            >
              TO SUN
            </text>
            <polygon points="85,-3 90,0 85,3" fill={CONFIG.THEME.SUN_FILL} />
          </g>

          {/* Tide Bulge Ellipse */}
          <ellipse
            cx="0"
            cy="0"
            rx={tides.rx}
            ry={tides.ry}
            fill="#38bdf8"
            opacity="0.25"
            stroke="#38bdf8"
            strokeWidth="1.5"
            transform={`rotate(${angles.moonDegrees})`}
          />

          {/* Earth Night Base */}
          <circle
            r="12"
            fill={CONFIG.THEME.NIGHT_BG}
            stroke={CONFIG.THEME.NIGHT_STROKE}
            strokeWidth="1"
          />

          {/* Earth Lit Side (Facing Sun) */}
          <g transform={`rotate(${angles.sunDegrees})`}>
            <path
              d="M 0,-12 A 12,12 0 0,1 0,12 Z"
              fill={CONFIG.THEME.DAY_FILL}
            />
          </g>

          {/* User Marker (Rotates by SunAngle + UserRotation) */}
          <g transform={`rotate(${angles.sunDegrees + userRotation})`}>
            <circle
              cx="12"
              cy="0"
              r="3"
              fill={CONFIG.THEME.SUN_FILL}
              stroke="white"
              strokeWidth="1"
              className="drop-shadow-sm"
            />
          </g>

          {/* Moon Orbit */}
          <circle
            cx="0"
            cy="0"
            r="60"
            fill="none"
            stroke="#475569"
            strokeDasharray="2 2"
          />

          {/* Moon Body */}
          <g
            transform={`translate(${60 * Math.cos(toRadians(angles.moonDegrees))}, ${60 * Math.sin(toRadians(angles.moonDegrees))})`}
          >
            <circle r="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <g transform={`rotate(${angles.sunDegrees})`}>
              <path d="M 0,-6 A 6,6 0 0,1 0,6 Z" fill="#f1f5f9" />
            </g>
          </g>
        </svg>
      </div>

      {/* Footer Readout */}
      <div className="mt-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs font-mono text-slate-400">
        <span>Alignment: <strong className={tides.alignment > 0 ? "text-indigo-400" : "text-amber-400"}>{tides.type}</strong></span>
        <span>Local Status: <strong className={localTideStatus === "High Tide" ? "text-cyan-400" : "text-slate-300"}>{localTideStatus}</strong></span>
      </div>
    </div>
  );
};

export default MicroTideView;
