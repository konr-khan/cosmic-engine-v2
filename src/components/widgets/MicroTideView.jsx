import React from "react";
import { ZoomIn } from "lucide-react";
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
    tides.alignment > 0 ? "text-indigo-600" : "text-orange-500";
  const localTideColor =
    localTideStatus === "High Tide"
      ? CONFIG.THEME.TIDE_HIGH
      : CONFIG.THEME.TIDE_LOW;

  // Refined "TO SUN" Rotation Logic
  const isLeftHemisphere = Math.abs(angles.sunDegrees) > 90;

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col h-full w-full justify-between">
      <div className="bg-slate-50 p-3 border-b border-slate-200 flex items-center text-slate-600 text-sm font-medium">
        <ZoomIn className="w-4 h-4 mr-2 text-indigo-500" /> Micro View: Earth &
        Tides
      </div>
      <div className="relative w-full flex-1 min-h-[220px] flex items-center justify-center bg-blue-50/50 p-4">
        <div className="absolute top-4 right-4 text-right z-10">
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-0.5">
            Global Potential
          </div>
          <div className={`text-lg font-black ${tideTextColor} mb-1.5`}>
            {tides.type.split(" ")[0].toUpperCase()}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-black mb-0.5">
            Local Water
          </div>
          <div className={`text-lg font-black ${localTideColor}`}>
            {localTideStatus === "High Tide" ? "HIGH" : "LOW"}
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
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <line
            x1="0"
            y1="-100"
            x2="0"
            y2="100"
            stroke="#cbd5e1"
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
              fill="#b45309"
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
            fill="#60a5fa"
            opacity="0.45"
            stroke="#2563eb"
            strokeWidth="1"
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
            stroke="#94a3b8"
            strokeDasharray="2 2"
          />

          {/* Moon Body */}
          <g
            transform={`translate(${60 * Math.cos(toRadians(angles.moonDegrees))}, ${60 * Math.sin(toRadians(angles.moonDegrees))})`}
          >
            <circle r="6" fill="#334155" />
            <g transform={`rotate(${angles.sunDegrees})`}>
              <path d="M 0,-6 A 6,6 0 0,1 0,6 Z" fill="#f1f5f9" />
            </g>
          </g>
        </svg>
      </div>
    </div>
  );
};

export default MicroTideView;
