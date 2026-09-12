import React, { ReactNode, ComponentType } from 'react';
import { SkyDomeBase, EL_CX, EL_CY, EL_R } from './SkyDomeBase';
import { RadialTickLine, MeridianDiurnalChord } from '../../../utils/cosmicMath';

export { EL_CX, EL_CY, EL_R };

export interface MeridianSwathConfig {
  id?: string;
  d: string;
  stroke: string;
  strokeWidth?: number;
  strokeOpacity?: number;
  strokeDasharray?: string;
  glow?: boolean;
  glowWidth?: number;
  glowOpacity?: number;
  title?: string;
}

export interface MeridianRadialTickConfig {
  id?: string;
  tick: RadialTickLine;
  stroke: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  title?: string;
}

export interface MeridianGateAnchorConfig {
  id?: string;
  x: number;
  y: number;
  r?: number;
  stroke?: string;
  title?: string;
}

export interface MeridianPeakTargetConfig {
  id?: string;
  peakPoint: { x: number; y: number };
  stroke?: string;
  title?: string;
}

export interface MeridianDiurnalChordConfig {
  id?: string;
  daylightId?: string;
  twilightId?: string;
  chord: MeridianDiurnalChord;
  stroke: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  strokeOpacity?: number;
  glow?: boolean;
  glowWidth?: number;
  glowOpacity?: number;
  twilightStroke?: string;
  twilightWidth?: number;
  twilightOpacity?: number;
  twilightDasharray?: string;
  daylightTitle?: string;
  twilightTitle?: string;
}

export interface MeridianDomeBaseProps {
  title: string;
  icon: ComponentType<{ className?: string }>;
  iconColorClass?: string;
  peakLabel: string;
  peakElevation: number;
  peakDirectionSuffix?: string;
  meridianDirection?: 'S' | 'N' | 'Z';
  culminationDirection?: 'South' | 'North' | 'Zenith';
  sightingBanner?: string;
  currentElevation: number;
  elevationColorClass?: string;
  elevationStatusSubtitle?: string;
  showTwilightBands?: boolean;
  latitude: number;
  bodyX?: number;
  bodyY?: number;
  bodyVectorStroke?: string;
  renderBodyGraphic?: (pos: { x: number; y: number }) => ReactNode;
  geometryGroupId?: string;
  geometryGroupClassName?: string;
  swaths?: MeridianSwathConfig[];
  radialTicks?: MeridianRadialTickConfig[];
  todayChordConfig?: MeridianDiurnalChordConfig;
  gateAnchor?: MeridianGateAnchorConfig;
  peakTarget?: MeridianPeakTargetConfig;
  extraMeridianSvg?: ReactNode;
  popover?: ReactNode;
  children?: ReactNode;
  hideElevationBanner?: boolean;
  leftHorizonLabel?: string;
  centerHorizonLabel?: string;
  rightHorizonLabel?: string;
  variant?: 'card' | 'embedded';
}

/** Reusable SVG sub-component for meridian swath arcs */
export const MeridianSwath: React.FC<MeridianSwathConfig> = ({
  id,
  d,
  stroke,
  strokeWidth = 2.5,
  strokeOpacity = 0.4,
  strokeDasharray,
  glow = false,
  glowWidth = 5,
  glowOpacity = 0.15,
  title,
}) => {
  if (!d) return null;
  return (
    <React.Fragment key={id}>
      {glow && (
        <path
          d={d}
          fill="none"
          stroke={stroke}
          strokeWidth={glowWidth}
          strokeOpacity={glowOpacity}
          className="blur-[1px] pointer-events-none"
        />
      )}
      <path
        id={id}
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        strokeDasharray={strokeDasharray}
      >
        {title && <title>{title}</title>}
      </path>
    </React.Fragment>
  );
};

/** Reusable SVG sub-component for radial tick marks on the dome arc */
export const MeridianRadialTick: React.FC<MeridianRadialTickConfig> = ({
  id,
  tick,
  stroke,
  strokeWidth = 1.4,
  strokeDasharray,
  title,
}) => (
  <g id={id}>
    <line
      x1={tick.x1}
      y1={tick.y1}
      x2={tick.x2}
      y2={tick.y2}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      strokeLinecap="round"
    />
    {title && <title>{title}</title>}
  </g>
);

/** Reusable SVG sub-component for today's diurnal chord projection */
export const MeridianDiurnalChordPath: React.FC<MeridianDiurnalChordConfig> = ({
  id = 'meridian-today-diurnal-chord',
  daylightId,
  twilightId,
  chord,
  stroke,
  strokeWidth = 1.5,
  strokeDasharray,
  strokeOpacity = 0.85,
  glow = false,
  glowWidth = 3.5,
  glowOpacity = 0.25,
  twilightStroke = '#d97706',
  twilightWidth = 1.0,
  twilightOpacity = 0.40,
  twilightDasharray,
  daylightTitle,
  twilightTitle,
}) => {
  const dId = daylightId ?? id;
  const tId = twilightId ?? (id ? `${id}-twilight` : undefined);
  return (
    <>
      {glow && chord.daylightD && (
        <path
          d={chord.daylightD}
          fill="none"
          stroke={stroke}
          strokeWidth={glowWidth}
          strokeOpacity={glowOpacity}
          className="blur-[1px] pointer-events-none select-none"
        />
      )}
      {chord.daylightD && (
        <path
          id={dId}
          d={chord.daylightD}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeOpacity={strokeOpacity}
        >
          {daylightTitle && <title>{daylightTitle}</title>}
        </path>
      )}
      {chord.twilightD && (
        <path
          id={tId}
          d={chord.twilightD}
          fill="none"
          stroke={twilightStroke}
          strokeWidth={twilightWidth}
          strokeDasharray={twilightDasharray}
          strokeOpacity={twilightOpacity}
        >
          {twilightTitle && <title>{twilightTitle}</title>}
        </path>
      )}
    </>
  );
};

/** Reusable SVG sub-component for parked gate anchor marker */
export const MeridianGateAnchor: React.FC<MeridianGateAnchorConfig> = ({
  id = 'meridian-gate-anchor',
  x,
  y,
  r = 3.5,
  stroke = '#64748b',
  title,
}) => (
  <g id={id} transform={`translate(${x}, ${y})`}>
    <circle
      cx="0"
      cy="0"
      r={r}
      fill="none"
      stroke={stroke}
      strokeWidth="0.8"
      strokeDasharray="1.5 1.5"
      strokeOpacity="0.6"
    >
      {title && <title>{title}</title>}
    </circle>
  </g>
);

/** Reusable SVG sub-component for meridian daily culmination peak target halo */
export const MeridianPeakTarget: React.FC<MeridianPeakTargetConfig> = ({
  id = 'meridian-peak-target',
  peakPoint,
  stroke = '#fbbf24',
  title,
}) => (
  <g id={id}>
    <line
      x1={EL_CX}
      y1={EL_CY}
      x2={peakPoint.x}
      y2={peakPoint.y}
      stroke={stroke}
      strokeWidth="0.75"
      strokeDasharray="2 2"
      strokeOpacity="0.35"
    />
    <circle
      cx={peakPoint.x}
      cy={peakPoint.y}
      r="5.5"
      fill="none"
      stroke={stroke}
      strokeWidth="1.0"
      strokeDasharray="2 2"
      strokeOpacity="0.75"
    >
      {title && <title>{title}</title>}
    </circle>
  </g>
);

/**
 * Shared base component for celestial meridian profile dome visualizations
 * (South <-> Zenith <-> North).
 *
 * Encapsulates:
 * - South-Zenith-North horizon baseline orientation
 * - Vertical Zenith dashed axis
 * - Solstice and Lunar Standstill corridor swaths
 * - Perpendicular radial tick pins
 * - Tangent diurnal chord projections
 * - Parked nocturnal gate anchors (Approach C)
 * - Daily peak culmination target halos
 */
export const MeridianDomeBase: React.FC<MeridianDomeBaseProps> = ({
  title,
  icon,
  iconColorClass,
  peakLabel,
  peakElevation,
  peakDirectionSuffix,
  meridianDirection,
  culminationDirection,
  sightingBanner,
  currentElevation,
  elevationColorClass,
  elevationStatusSubtitle,
  showTwilightBands,
  latitude,
  bodyX,
  bodyY,
  bodyVectorStroke,
  renderBodyGraphic,
  geometryGroupId,
  geometryGroupClassName,
  swaths = [],
  radialTicks = [],
  todayChordConfig,
  gateAnchor,
  peakTarget,
  extraMeridianSvg,
  popover,
  children,
  hideElevationBanner = true,
  leftHorizonLabel,
  centerHorizonLabel,
  rightHorizonLabel,
  variant,
}) => {
  const isPolar = latitude !== undefined && Math.abs(latitude) >= 89.9;
  const isNorthPole = isPolar && latitude >= 0;

  const defaultLeftLabel = isPolar ? (isNorthPole ? 'S (0°)' : 'N (0°)') : 'S';
  const defaultCenterLabel = isPolar ? (isNorthPole ? 'Z (+90°)' : 'Z (-90°)') : 'Z';
  const defaultRightLabel = isPolar ? (isNorthPole ? 'S (180°)' : 'N (180°)') : 'N';

  return (
    <SkyDomeBase
      title={title}
      icon={icon}
      iconColorClass={iconColorClass}
      peakLabel={peakLabel}
      peakElevation={peakElevation}
      peakDirectionSuffix={peakDirectionSuffix}
      meridianDirection={meridianDirection}
      culminationDirection={culminationDirection}
      sightingBanner={sightingBanner}
      currentElevation={currentElevation}
      elevationColorClass={elevationColorClass}
      elevationStatusSubtitle={elevationStatusSubtitle}
      showTwilightBands={showTwilightBands}
      hideElevationBanner={hideElevationBanner}
      leftHorizonLabel={leftHorizonLabel ?? defaultLeftLabel}
      centerHorizonLabel={centerHorizonLabel ?? defaultCenterLabel}
      rightHorizonLabel={rightHorizonLabel ?? defaultRightLabel}
      showZenithAxis={true}
      latitude={latitude}
      bodyX={bodyX}
      bodyY={bodyY}
      bodyVectorStroke={bodyVectorStroke}
      variant={variant}
      renderBodyGraphic={renderBodyGraphic}
      popover={popover}
      extraSvgContent={
        <g
          id={geometryGroupId ?? 'meridian-dome-geometry'}
          className={geometryGroupClassName ?? 'meridian-dome-geometry'}
        >
          {/* Swaths */}
          {swaths.map((swath, idx) => (
            <MeridianSwath key={swath.id ?? `swath-${idx}`} {...swath} />
          ))}

          {/* Radial Ticks */}
          {radialTicks.map((rt, idx) => (
            <MeridianRadialTick key={rt.id ?? `tick-${idx}`} {...rt} />
          ))}

          {/* Today's Diurnal Chord */}
          {todayChordConfig && <MeridianDiurnalChordPath {...todayChordConfig} />}

          {/* Parked Gate Anchor */}
          {gateAnchor && <MeridianGateAnchor {...gateAnchor} />}

          {/* Daily Culmination Peak Target */}
          {peakTarget && <MeridianPeakTarget {...peakTarget} />}

          {/* Custom extra SVG content (e.g. nodal crossing indicators) */}
          {extraMeridianSvg}
        </g>
      }
    >
      {children}
    </SkyDomeBase>
  );
};

export default MeridianDomeBase;
