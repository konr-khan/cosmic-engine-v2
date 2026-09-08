import React, { ReactNode, ComponentType } from 'react';

export const EL_R = 92;
export const EL_CX = 130;
export const EL_CY = 104;

export interface SkyDomeReferenceLine {
  y: number;
  xLeft: number;
  xRight: number;
  stroke: string;
  label: string;
  labelColor: string;
  title: string;
}

export interface SkyDomeDiurnalPath {
  id: string;
  d: string;
  stroke: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  strokeOpacity?: number;
  label?: string;
  labelColor?: string;
  labelX?: number;
  labelY?: number;
  title?: string;
  isGlowing?: boolean;
}

export interface SkyDomeBaseProps {
  title: string;
  icon: ComponentType<{ className?: string }>;
  iconColorClass?: string;
  peakLabel: string;
  peakElevation: number;
  currentElevation: number;
  elevationColorClass?: string;
  latitude?: number;
  capPathD?: string;
  referenceLines?: SkyDomeReferenceLine[];
  diurnalPaths?: SkyDomeDiurnalPath[];
  bodyX?: number;
  bodyY?: number;
  bodyVectorStroke?: string;
  renderBodyGraphic?: (pos: { x: number; y: number }) => ReactNode;
  popover?: ReactNode;
  children?: ReactNode;
}

export const SkyDomeBase: React.FC<SkyDomeBaseProps> = ({
  title,
  icon: Icon,
  iconColorClass = 'text-slate-300',
  peakLabel,
  peakElevation,
  currentElevation,
  elevationColorClass,
  latitude,
  capPathD,
  referenceLines = [],
  diurnalPaths = [],
  bodyX = EL_CX,
  bodyY = EL_CY,
  bodyVectorStroke = '#64748b',
  renderBodyGraphic,
  popover,
  children
}) => {
  const isAboveHorizon = currentElevation > 0;
  const isVisible = currentElevation > -18;
  const defaultElevationColor = currentElevation >= 0 ? 'text-amber-400' : 'text-slate-400';
  const meridianLabel = latitude !== undefined && latitude < 0 ? 'N' : 'S';

  return (
    <div className="bg-slate-900/40 rounded-xl p-3.5 border border-slate-800/60 flex flex-col justify-between shadow-inner backdrop-blur-sm relative">
      {/* Header */}
      <div className="w-full flex justify-between items-center mb-1 px-1 font-mono">
        <div className="text-xs text-slate-300 font-semibold uppercase tracking-wider flex items-center gap-1.5 font-sans">
          <Icon className={`w-4 h-4 ${iconColorClass}`} /> {title}
        </div>
        <div className="text-xs text-slate-300 font-mono">
          <span className="text-[10px] text-slate-400 font-sans uppercase mr-1">{peakLabel}:</span>
          <strong className="text-white font-semibold">{peakElevation.toFixed(1)}°</strong>
        </div>
      </div>

      {/* Semicircular Sky Dome SVG (260x120) */}
      <div className="relative w-full py-1 flex items-center justify-center">
        <svg viewBox="0 0 260 120" className="w-full max-h-[155px] overflow-visible" preserveAspectRatio="xMidYMid meet">
          {/* Horizon Line (0°) */}
          <line x1="18" y1={EL_CY} x2="242" y2={EL_CY} stroke="#334155" strokeWidth="0.75" strokeOpacity="0.7" />
          <text x="16" y={EL_CY + 10} textAnchor="end" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>
          <text x="244" y={EL_CY + 10} textAnchor="start" className="text-[8px] font-mono fill-slate-500 font-medium">0°</text>

          {/* Cardinal Compass Indicators (E, S/N, W) */}
          <text x="36" y={EL_CY + 10} textAnchor="middle" className="text-[7.5px] font-mono fill-slate-600 font-medium select-none pointer-events-none">E</text>
          <text x={EL_CX} y={EL_CY + 12} textAnchor="middle" className="text-[7.5px] font-mono fill-slate-600 font-medium select-none pointer-events-none">{meridianLabel}</text>
          <text x="224" y={EL_CY + 10} textAnchor="middle" className="text-[7.5px] font-mono fill-slate-600 font-medium select-none pointer-events-none">W</text>

          {/* Semicircular Elevation Arc Dome */}
          <path
            d={`M ${EL_CX - EL_R} ${EL_CY} A ${EL_R} ${EL_R} 0 0 1 ${EL_CX + EL_R} ${EL_CY}`}
            fill="none"
            stroke="#334155"
            strokeWidth="0.75"
            strokeDasharray="4 3"
            strokeOpacity="0.6"
          />

          {/* Unreachable Zenith Cap (Outside Tropics) */}
          {capPathD && (
            <path
              d={capPathD}
              fill="#020617"
              fillOpacity="0.6"
              stroke="#475569"
              strokeWidth="0.6"
              strokeDasharray="2 2"
            />
          )}

          {/* Solstice / Standstill Reference Lines */}
          {referenceLines.map((line, idx) => (
            <g key={idx}>
              <line
                x1={line.xLeft}
                y1={line.y}
                x2={line.xRight}
                y2={line.y}
                stroke={line.stroke}
                strokeWidth="0.7"
                strokeDasharray="3 2"
                strokeOpacity="0.7"
              />
              <text
                x={line.xRight + 3}
                y={line.y + 2.5}
                className={`text-[6.5px] font-mono ${line.labelColor} font-medium pointer-events-none select-none`}
              >
                {line.label}
              </text>
              <title>{line.title}</title>
            </g>
          ))}

          {/* Diurnal Transit Path Arcs */}
          {diurnalPaths.map((path) => (
            <g key={path.id}>
              {path.isGlowing && path.d && (
                <path
                  d={path.d}
                  fill="none"
                  stroke={path.stroke}
                  strokeWidth={(path.strokeWidth || 1.2) + 2}
                  strokeOpacity={0.25}
                  className="blur-[1px] pointer-events-none select-none"
                />
              )}
              {path.d && (
                <path
                  d={path.d}
                  fill="none"
                  stroke={path.stroke}
                  strokeWidth={path.strokeWidth ?? 0.8}
                  strokeDasharray={path.strokeDasharray}
                  strokeOpacity={path.strokeOpacity ?? 0.8}
                >
                  {path.title && <title>{path.title}</title>}
                </path>
              )}
              {path.label && path.labelX !== undefined && path.labelY !== undefined && (
                <text
                  x={path.labelX}
                  y={path.labelY}
                  className={`text-[6.5px] font-mono ${path.labelColor || 'fill-slate-400'} font-medium pointer-events-none select-none`}
                >
                  {path.label}
                </text>
              )}
            </g>
          ))}

          {/* Zenith Marker (90°) */}
          <line x1={EL_CX} y1={EL_CY - EL_R - 3} x2={EL_CX} y2={EL_CY - EL_R + 3} stroke="#475569" strokeWidth="0.75" />
          <text x={EL_CX} y={EL_CY - EL_R - 5} textAnchor="middle" className="text-[8px] font-mono fill-slate-500 font-medium">+90°</text>

          {/* Observer Horizon Center Origin */}
          <circle cx={EL_CX} cy={EL_CY} r="2" fill="#475569" />

          {/* Body Elevation Vector & Body Graphic */}
          {isVisible && (
            <g>
              <line
                x1={EL_CX}
                y1={EL_CY}
                x2={bodyX}
                y2={bodyY}
                stroke={bodyVectorStroke}
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              {renderBodyGraphic && renderBodyGraphic({ x: bodyX, y: bodyY })}
            </g>
          )}
        </svg>
      </div>

      {/* Live Elevation Readout Badge */}
      <div className="text-center my-1 bg-slate-950/80 px-3 py-1 rounded-lg border border-slate-800/60 shadow-sm">
        <div className={`text-sm font-mono font-semibold ${elevationColorClass || defaultElevationColor}`}>
          {currentElevation >= 0 ? `+${currentElevation.toFixed(1)}°` : `${currentElevation.toFixed(1)}°`}
          <span className="text-[10px] text-slate-400 uppercase font-sans ml-1.5 font-normal">
            {isAboveHorizon ? '(Above Horizon)' : '(Below Horizon)'}
          </span>
        </div>
      </div>

      {/* Hover Popover */}
      {popover}

      {/* Body Content: Metrics Bar, Stats Strip, Mirrored Summary Badges */}
      {children}
    </div>
  );
};

export default SkyDomeBase;
