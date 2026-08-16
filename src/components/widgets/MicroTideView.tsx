import React from "react";
import { CONFIG, toRadians } from "../../utils/cosmicMath";
import { TidalVectors } from "../../types";

export interface MicroTideViewProps {
  tides?: TidalVectors | null;
  angles?: { sunDegrees?: number; moonDegrees?: number } | null;
  userRotation?: number;
  localTideStatus?: "High Tide" | "Low Tide" | string;
  hoverDate?: Date | null;
}

export const MicroTideView: React.FC<MicroTideViewProps> = ({
  tides = { alignment: 0, rx: 16, ry: 12, type: 'Transitional' },
  angles = { sunDegrees: 0, moonDegrees: 0 },
  userRotation = 0,
  localTideStatus = "Low Tide",
}) => {
  const safeTides = tides || { alignment: 0, rx: 16, ry: 12, type: 'Transitional' };
  const safeAngles = angles || { sunDegrees: 0, moonDegrees: 0 };
  const safeUserRotation = userRotation || 0;
  const safeLocalTideStatus = localTideStatus || "Low Tide";

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
              {(safeTides.type || 'Transitional').split(" ")[0].toUpperCase()}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
              Local Water
            </div>
            <div className={`text-sm font-bold ${localTideColor}`}>
              {safeLocalTideStatus === "High Tide" ? "HIGH TIDE" : "LOW TIDE"}
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
          <g transform={`rotate(${safeAngles.sunDegrees || 0})`}>
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
            rx={safeTides.rx || 16}
            ry={safeTides.ry || 12}
            fill="#38bdf8"
            opacity="0.25"
            stroke="#38bdf8"
            strokeWidth="1.5"
            transform={`rotate(${safeAngles.moonDegrees || 0})`}
          />

          {/* Earth Night Base */}
          <circle
            r="12"
            fill={CONFIG.THEME.NIGHT_BG}
            stroke={CONFIG.THEME.NIGHT_STROKE}
            strokeWidth="1"
          />

          {/* Earth Lit Side (Facing Sun) */}
          <g transform={`rotate(${safeAngles.sunDegrees || 0})`}>
            <path
              d="M 0,-12 A 12,12 0 0,1 0,12 Z"
              fill={CONFIG.THEME.DAY_FILL}
            />
          </g>

          {/* User Marker (Rotates by SunAngle + UserRotation) */}
          <g transform={`rotate(${(safeAngles.sunDegrees || 0) + safeUserRotation})`}>
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
            transform={`translate(${60 * Math.cos(toRadians(safeAngles.moonDegrees || 0))}, ${60 * Math.sin(toRadians(safeAngles.moonDegrees || 0))})`}
          >
            <circle r="6" fill="#1e293b" stroke="#475569" strokeWidth="1" />
            <g transform={`rotate(${safeAngles.sunDegrees || 0})`}>
              <path d="M 0,-6 A 6,6 0 0,1 0,6 Z" fill="#f1f5f9" />
            </g>
          </g>
        </svg>
      </div>

      {/* Footer Readout */}
      <div className="mt-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs font-mono text-slate-400">
        <span>Alignment: <strong className={(safeTides.alignment || 0) > 0 ? "text-indigo-400" : "text-amber-400"}>{safeTides.type || "Transitional"}</strong></span>
        <span>Local Status: <strong className={safeLocalTideStatus === "High Tide" ? "text-cyan-400" : "text-slate-300"}>{safeLocalTideStatus}</strong></span>
      </div>
    </div>
  );
};

export default MicroTideView;
