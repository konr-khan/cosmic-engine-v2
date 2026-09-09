import React, { useState, useMemo } from 'react';
import { Moon, Compass } from 'lucide-react';
import { PhaseVisual } from '../../common/PhaseVisual';
import { 
  toRadians, 
  toDegrees, 
  formatTime, 
  clamp, 
  getJulianDate,
  calculateLunarIllumination,
  projectSkyDomePoint,
  generateDiurnalPath,
  calculateMonthlyLunarDeclinationBounds,
  calculateSkyDomeLunarNodes,
  getLunarElevationStatus,
  calculateCulminationBearing,
  calculateRiseSetAzimuth,
  calculateLunarExtremaCulminations
} from '../../../utils/cosmicMath';
import { OrbitalData, SolarAlmanacData } from '../../../types';
import { SkyDomeBase, EL_R, EL_CX, EL_CY, SkyDomeDiurnalPath } from './SkyDomeBase';

export interface MoonElevationDomeProps {
  orbitalData?: OrbitalData | null;
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
  initialNodalMode?: boolean;
}

export const MoonElevationDome: React.FC<MoonElevationDomeProps> = ({
  orbitalData,
  solarData,
  displayTime,
  latitude,
  currentDate = new Date(),
  onSetTime,
  initialNodalMode = false,
}) => {
  const [isHoveringMoonMetrics, setIsHoveringMoonMetrics] = useState(false);
  const [isNodalMode, setIsNodalMode] = useState(initialNodalMode);

  // --- Moon Elevation & Phase Math ---
  const safeOrbital = orbitalData || ({} as Partial<OrbitalData>);
  const phase = safeOrbital.phase || { value: 0, name: 'New Moon' };
  const lunarEvents = safeOrbital.lunarEvents || {
    moonrise: 6,
    transit: 12,
    moonset: 18,
    distanceKm: 384400,
    distanceEarthRadii: 60.3,
    isPerigee: false,
    isApogee: false,
    declination: 0,
    parallacticAngle: 0,
  };
  const {
    moonrise = 6,
    transit = 12,
    moonset = 18,
    distanceKm = 384400,
    distanceEarthRadii = 60.3,
    isPerigee = false,
    isApogee = false,
    declination = 0,
    parallacticAngle = 0,
  } = lunarEvents;

  const moonDeclination = (orbitalData?.lunarPos?.declination ?? declination ?? 0) as number;
  const illPercent = calculateLunarIllumination(phase.value ?? 0);

  const moonHourAngle = (displayTime - transit) * 15;
  const moonPos = projectSkyDomePoint(moonHourAngle, Number(moonDeclination), latitude);
  const currentMoonElevation = moonPos.elevation;
  const moonX = moonPos.x;
  const moonY = moonPos.y;

  const transitPeakElevation = projectSkyDomePoint(0, Number(moonDeclination), latitude).elevation;

  // --- Culmination & Sighting Bearing Math ---
  const culmination = useMemo(
    () => calculateCulminationBearing(latitude, Number(moonDeclination)),
    [latitude, moonDeclination]
  );
  const riseSetAz = useMemo(
    () => calculateRiseSetAzimuth(latitude, Number(moonDeclination)),
    [latitude, moonDeclination]
  );

  // Monthly Declination Bounds over a rolling 30-day window (±15 days)
  const monthlyBounds = useMemo(
    () => calculateMonthlyLunarDeclinationBounds(currentDate),
    [currentDate]
  );

  const extremaCulminations = useMemo(
    () => calculateLunarExtremaCulminations(latitude, monthlyBounds.maxDec, monthlyBounds.minDec),
    [latitude, monthlyBounds.maxDec, monthlyBounds.minDec]
  );

  // --- Lunar Altitude Bounds & Zenith Cap Math ---
  // Major lunar standstill declination: 23.439° (obliquity) + 5.145° (lunar inclination) = 28.584°
  const LUNAR_MAX_DEC = 28.584;
  const absLat = Math.abs(latitude);
  const isLunarTropical = absLat <= LUNAR_MAX_DEC;

  const standstillMaxCulmination = useMemo(
    () => calculateCulminationBearing(latitude, LUNAR_MAX_DEC),
    [latitude]
  );
  const standstillMinCulmination = useMemo(
    () => calculateCulminationBearing(latitude, -LUNAR_MAX_DEC),
    [latitude]
  );

  // Maximum possible lunar transit elevation across all 18.6-year nodal cycles
  const maxAnnualMoonNoon = isLunarTropical ? 90 : (90 - absLat + LUNAR_MAX_DEC);
  const minAnnualMoonNoon = 90 - absLat - LUNAR_MAX_DEC;

  // Lunar Zenith Cap geometry (unreachable sector when latitude is outside lunar tropics)
  let lunarCapPathD = '';
  if (!isLunarTropical && maxAnnualMoonNoon < 89.5) {
    const yCap = EL_CY - EL_R * Math.sin(toRadians(maxAnnualMoonNoon));
    const xCapL = EL_CX - EL_R * Math.cos(toRadians(maxAnnualMoonNoon));
    const xCapR = EL_CX + EL_R * Math.cos(toRadians(maxAnnualMoonNoon));
    lunarCapPathD = `M ${xCapL.toFixed(1)} ${yCap.toFixed(1)} A ${EL_R} ${EL_R} 0 0 1 ${xCapR.toFixed(1)} ${yCap.toFixed(1)} Z`;
  }

  // --- Nodal Geometry & Sky Dome Node Pins ---
  const jd = useMemo(() => getJulianDate(currentDate, displayTime), [currentDate, displayTime]);
  const solarNoon = solarData?.solarNoon ?? 12;
  const sunDeclination = (solarData?.declination ?? 0) as number;
  const sunLambda = solarData?.lambda !== undefined ? Number(solarData.lambda) : undefined;

  const nodalData = useMemo(() => {
    return calculateSkyDomeLunarNodes(
      latitude,
      jd,
      displayTime,
      solarNoon,
      sunLambda,
      {
        phaseValue: phase.value !== undefined ? Number(phase.value) : undefined
      }
    );
  }, [latitude, jd, displayTime, solarNoon, sunLambda, phase.value]);

  const eclipticPathResult = useMemo(
    () => generateDiurnalPath(latitude, sunDeclination),
    [latitude, sunDeclination]
  );

  // --- Curved Diurnal Paths ---
  const maxPathResult = generateDiurnalPath(latitude, monthlyBounds.maxDec);
  const todayPathResult = generateDiurnalPath(latitude, Number(moonDeclination));
  const minPathResult = generateDiurnalPath(latitude, monthlyBounds.minDec);

  const diurnalPaths: SkyDomeDiurnalPath[] = [];

  // In Nodal Mode: Show Ecliptic Reference diurnal curve (Amber hairline dashed)
  if (isNodalMode && eclipticPathResult.pathD) {
    diurnalPaths.push({
      id: 'ecliptic-reference-path',
      d: eclipticPathResult.pathD,
      stroke: '#f59e0b',
      strokeWidth: 0.75,
      strokeDasharray: '2 2',
      strokeOpacity: 0.6,
      label: 'Ecliptic (☉)',
      labelColor: 'fill-amber-400/80',
      labelX: eclipticPathResult.peakPoint.x + 8,
      labelY: eclipticPathResult.peakPoint.y - 4,
      title: `Ecliptic Plane Baseline (Sun Declination: ${sunDeclination.toFixed(1)}°)`
    });
  }

  // 1. Monthly Max Lunar Transit Arc (Soft silver dashed hairline) - Shown in standard mode
  if (!isNodalMode && maxPathResult.pathD && maxPathResult.peakAlt > 0) {
    const maxPeak = extremaCulminations.maxBound.altitude;
    const labelY = EL_CY - EL_R * Math.sin(toRadians(maxPeak));
    const labelX = EL_CX + EL_R * Math.cos(toRadians(maxPeak)) + 3;
    diurnalPaths.push({
      id: 'moon-monthly-max',
      d: maxPathResult.pathD,
      stroke: '#94a3b8',
      strokeWidth: 0.75,
      strokeDasharray: '3 2',
      strokeOpacity: 0.7,
      label: `${maxPeak.toFixed(0)}° ${extremaCulminations.maxBound.shortTag}`,
      labelColor: 'fill-slate-400',
      labelX,
      labelY: labelY + 2.5,
      title: `Max Possible Lunar Altitude (Monthly ±15d Peak: ${monthlyBounds.maxDec.toFixed(1)}° Dec): ${maxPeak.toFixed(1)}° ${extremaCulminations.maxBound.shortTag}`
    });
  }

  // Diurnal Track Styling:
  // In Std View: Classic lunar silver (#e2e8f0), solid stroke
  // In Nodal View: Eclipse-Convention track:
  // Sky Blue (#38bdf8) for North/Ascending (beta >= 0) vs Rose Red (#f43f5e) for South/Descending (beta < 0)
  // Solid stroke for Waxing vs Dashed ('4 3') for Waning
  const moonTrackColor = isNodalMode
    ? (nodalData.isMoonAscending ? '#38bdf8' : '#f43f5e')
    : '#e2e8f0';
  const moonTrackDash = isNodalMode
    ? (nodalData.isWaxing ? undefined : '4 3')
    : undefined;

  // 2. Active Today's Moon Path
  if (todayPathResult.pathD) {
    diurnalPaths.push({
      id: 'today-moon-path',
      d: todayPathResult.pathD,
      stroke: moonTrackColor,
      strokeWidth: 1.5,
      strokeDasharray: moonTrackDash,
      strokeOpacity: 0.95,
      isGlowing: true,
      title: isNodalMode
        ? `Today's Lunar Transit Peak: ${todayPathResult.peakAlt.toFixed(1)}° (${nodalData.quadrantLabel})`
        : `Today's Lunar Transit Peak: ${todayPathResult.peakAlt.toFixed(1)}°`
    });
  }

  // 2b. Today's Moon Sub-Horizon Continuation (Subdued opacity, no dashes to avoid conflict with waning phase)
  if (todayPathResult.twilightD) {
    diurnalPaths.push({
      id: 'today-moon-twilight-path',
      d: todayPathResult.twilightD,
      stroke: isNodalMode ? moonTrackColor : '#94a3b8',
      strokeWidth: 0.8,
      strokeDasharray: isNodalMode ? moonTrackDash : undefined,
      strokeOpacity: 0.20,
      title: "Today's Sub-Horizon Lunar Track"
    });
  }

  // 3. Monthly Min Lunar Transit Arc (Muted slate dashed hairline) - Shown in standard mode
  if (!isNodalMode && minPathResult.pathD && minPathResult.peakAlt > 0) {
    const minPeak = extremaCulminations.minBound.altitude;
    const labelY = EL_CY - EL_R * Math.sin(toRadians(minPeak));
    const labelX = EL_CX + EL_R * Math.cos(toRadians(minPeak)) + 3;
    diurnalPaths.push({
      id: 'moon-monthly-min',
      d: minPathResult.pathD,
      stroke: '#64748b',
      strokeWidth: 0.75,
      strokeDasharray: '3 2',
      strokeOpacity: 0.6,
      label: `${minPeak.toFixed(0)}° ${extremaCulminations.minBound.shortTag}`,
      labelColor: 'fill-slate-500',
      labelX,
      labelY: labelY + 2.5,
      title: `Min Possible Lunar Altitude (Monthly ±15d Trough: ${monthlyBounds.minDec.toFixed(1)}° Dec): ${minPeak.toFixed(1)}° ${extremaCulminations.minBound.shortTag}`
    });
  }

  const lunarStatus = getLunarElevationStatus(currentMoonElevation);

  return (
    <SkyDomeBase
      title="Moon Elevation Arc"
      icon={Moon}
      iconColorClass="text-slate-300"
      peakLabel="Transit Peak"
      peakElevation={transitPeakElevation}
      peakDirectionSuffix={culmination.shortTag}
      meridianDirection={culmination.meridianLabel}
      culminationDirection={culmination.direction}
      sightingBanner={culmination.sightingSummary}
      currentElevation={currentMoonElevation}
      elevationColorClass={lunarStatus.badgeClass}
      elevationStatusSubtitle={lunarStatus.label}
      latitude={latitude}
      capPathD={lunarCapPathD}
      diurnalPaths={diurnalPaths}
      bodyX={moonX}
      bodyY={moonY}
      bodyVectorStroke={currentMoonElevation >= 0 ? moonTrackColor : '#475569'}
      extraSvgContent={isNodalMode && nodalData.isNearNode && nodalData.nearestNode.isVisible && (
        <g className="lunar-upcoming-node-layer">
          {(() => {
            const node = nodalData.nearestNode;
            const isAsc = nodalData.nearestNodeType === 'ascending';
            const color = isAsc ? '#38bdf8' : '#f43f5e';
            const symbol = isAsc ? '☊' : '☋';
            const dist = nodalData.nearestNodeDistDays;
            let labelText: string;
            if (dist <= 0.05) {
              labelText = `${symbol} Crossing Now`;
            } else if (dist <= 0.5) {
              const hours = Math.max(1, Math.round(dist * 24));
              labelText = nodalData.isApproachingNearestNode
                ? `${symbol} in ${hours}h`
                : `${symbol} ${hours}h ago`;
            } else {
              labelText = nodalData.isApproachingNearestNode
                ? `${symbol} in ${dist.toFixed(1)}d`
                : `${symbol} ${dist.toFixed(1)}d ago`;
            }

            return (
              <g
                transform={`translate(${node.x.toFixed(1)}, ${node.y.toFixed(1)})`}
                className="drop-shadow-md cursor-default"
                opacity={node.isAboveHorizon ? 1.0 : 0.5}
              >
                {/* Outer glowing halo */}
                <circle cx="0" cy="0" r="8" fill={color} fillOpacity="0.25" className="animate-pulse" />
                {/* Core disc */}
                <circle cx="0" cy="0" r="4.5" fill="#020617" stroke={color} strokeWidth="1.2" />
                {/* Node symbol */}
                <text x="0" y="2.5" textAnchor="middle" className="text-[7px] font-bold pointer-events-none select-none" fill={color}>
                  {symbol}
                </text>
                {/* Proximity / countdown label */}
                <text x="0" y="-7.5" textAnchor="middle" className="text-[6.5px] font-mono font-semibold pointer-events-none select-none" fill={color}>
                  {labelText}
                </text>
                <title>{`${isAsc ? 'Ascending Node (☊)' : 'Descending Node (☋)'}: True Ecliptic Crossing (β = 0°) at El ${node.elevation.toFixed(1)}°, Dec ${node.declination.toFixed(1)}° (${node.isAboveHorizon ? 'Above Horizon' : 'Sub-Horizon / Setting'})`}</title>
              </g>
            );
          })()}
        </g>
      )}
      renderBodyGraphic={() => (
        <g
          transform={`translate(${moonX}, ${moonY})`}
          className="drop-shadow-md"
          opacity={currentMoonElevation >= 0 ? 1.0 : 0.45}
        >
          {/* Dark Body Base Disc */}
          <circle cx="0" cy="0" r="5.5" fill="#020617" stroke="#334155" strokeWidth="0.75" />

          {/* Phase Illuminated Geometry */}
          <g transform={`rotate(${parallacticAngle || 0})`}>
            {(() => {
              const pVal = phase.value ?? 0;
              if (pVal > 0.48 && pVal < 0.52) {
                return <circle cx="0" cy="0" r="5.5" fill="#f8fafc" />;
              }
              if (pVal > 0.02 && pVal < 0.98) {
                const isWaxing = pVal < 0.5;
                const startY = isWaxing ? -5.5 : 5.5;
                const endY = isWaxing ? 5.5 : -5.5;
                const rxAbs = Math.abs(5.5 * Math.cos(pVal * 2 * Math.PI));
                let termSweep: number;
                if (isWaxing) {
                  termSweep = pVal < 0.25 ? 0 : 1;
                } else {
                  termSweep = pVal < 0.75 ? 1 : 0;
                }
                const d = `M 0,${startY} A 5.5,5.5 0 0,1 0,${endY} A ${rxAbs.toFixed(2)},5.5 0 0,${termSweep} 0,${startY}`;
                return <path d={d} fill="#f8fafc" />;
              }
              return null;
            })()}
          </g>

          {/* Outer Specular Rim */}
          <circle cx="0" cy="0" r="5.5" fill="none" stroke="#64748b" strokeWidth="0.5" strokeOpacity="0.6" />
        </g>
      )}
      popover={isHoveringMoonMetrics ? (
        <div className="absolute bottom-20 right-4 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
            <span>{phase.name}</span>
            <span className="text-slate-400 text-[10px] font-normal">{illPercent}% Illum</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Distance: <strong className="text-white font-semibold">{(distanceKm || 384400).toLocaleString()} km</strong>{' '}
            <span className="text-slate-400">({(distanceEarthRadii || ((distanceKm || 384400) / 6371)).toFixed(1)} R_E)</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Parallactic Angle: <strong className="text-indigo-300 font-semibold">{parallacticAngle.toFixed(1)}°</strong>
          </div>
          <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800 leading-tight">
            {isPerigee
              ? 'Lunar Perigee: Moon is at its closest orbital approach to Earth (~363,300 km), creating maximum gravitational tides.'
              : isApogee
              ? 'Lunar Apogee: Moon is at its furthest orbital distance (~405,500 km), with minimal apparent angular size.'
              : 'Mean Orbit: Moon is near average geocentric distance (~384,400 km / 60.3 Earth Radii).'}
          </div>
        </div>
      ) : null}
    >
      {/* Moon Phase & Apsides Metrics Bar */}
      <div 
        className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/40 flex items-center justify-between gap-3 mt-1 cursor-pointer transition-colors hover:border-slate-700"
        onPointerEnter={() => setIsHoveringMoonMetrics(true)}
        onPointerLeave={() => setIsHoveringMoonMetrics(false)}
        title={`Geocentric Distance: ${(distanceEarthRadii || (distanceKm / 6371)).toFixed(1)} R_E (${(distanceKm || 384400).toLocaleString()} km)`}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 flex items-center justify-center">
            <PhaseVisual phase={phase.value} size={52} parallacticAngle={parallacticAngle} />
          </div>
          <div className="font-mono text-left">
            <div className="text-xs font-semibold text-slate-200">{phase.name}</div>
            <div className="text-[10px] text-slate-400 font-medium">{illPercent}% Illuminated</div>
          </div>
        </div>

        <div className="font-mono text-right text-[10px] space-y-0.5">
          <div className="text-slate-400">
            Dist: <strong className="text-slate-200 font-semibold">{(distanceKm || 384400).toLocaleString()} km</strong>
          </div>
          <div>
            <span className={`font-semibold px-1.5 py-0.5 rounded border text-[9px] ${
              isPerigee
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                : isApogee
                ? 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60'
                : 'bg-slate-900/60 text-slate-400 border-slate-800/60'
            }`}>
              {isPerigee ? 'Perigee' : isApogee ? 'Apogee' : 'Mean Orbit'}
            </span>
          </div>
        </div>
      </div>

      {/* Lunar Standstill Limits (Std Mode) or 4-Quadrant Draconic Orbital Progress Micro-Rail (Nodal Mode) */}
      {!isNodalMode ? (
        <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <span className="text-slate-400">Max Standstill:</span>
            <strong className="text-slate-200 font-semibold">{maxAnnualMoonNoon.toFixed(1)}° {standstillMaxCulmination.shortTag}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />
            <span className="text-slate-400">Min Standstill:</span>
            <strong className="text-slate-400 font-semibold">
              {minAnnualMoonNoon > 0 ? `${minAnnualMoonNoon.toFixed(1)}° ${standstillMinCulmination.shortTag}` : 'Below 0°'}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Zenith Cap:</span>
            <strong className={isLunarTropical ? 'text-emerald-400 font-semibold' : 'text-slate-300 font-semibold'}>
              {isLunarTropical ? 'None (90°)' : `>${maxAnnualMoonNoon.toFixed(1)}°`}
            </strong>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-1 bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1 font-mono">
          {/* Top Line: Past Node, Live Today State, and Next Node */}
          <div className="flex items-center justify-between text-[9.5px]">
            <div className="flex items-center gap-1 min-w-0 truncate">
              <span className="text-slate-500 font-sans">Past:</span>
              <strong className={nodalData.prevNodeType === 'ascending' ? 'text-sky-300 font-semibold' : 'text-rose-300 font-semibold'}>
                {nodalData.prevNodeType === 'ascending' ? '☊' : '☋'}{' '}
                {nodalData.daysSincePrevNode <= 0.5
                  ? `${Math.max(1, Math.round(nodalData.daysSincePrevNode * 24))}h ago`
                  : `${nodalData.daysSincePrevNode}d ago`}
              </strong>
            </div>

            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-800/60 shadow-xs">
              <span className={`w-1.5 h-1.5 rounded-full ${nodalData.isMoonAscending ? 'bg-sky-400' : 'bg-rose-400'}`} />
              <span className="text-slate-200 font-semibold text-[9.5px]">
                {nodalData.isMoonAscending ? 'North (☊)' : 'South (☋)'}
              </span>
              <span className={`font-mono font-medium ${nodalData.isMoonAscending ? 'text-sky-300' : 'text-rose-300'}`}>
                β: {nodalData.moonBeta >= 0 ? `+${nodalData.moonBeta.toFixed(1)}°` : `${nodalData.moonBeta.toFixed(1)}°`}
              </span>
            </div>

            <div className="flex items-center gap-1 min-w-0 truncate justify-end">
              <span className="text-slate-500 font-sans">Next:</span>
              <strong className={nodalData.upcomingNodeType === 'ascending' ? 'text-sky-300 font-semibold' : 'text-rose-300 font-semibold'}>
                {nodalData.upcomingNodeType === 'ascending' ? '☊' : '☋'}{' '}
                {nodalData.daysToNextNode <= 0.5
                  ? `in ${Math.max(1, Math.round(nodalData.daysToNextNode * 24))}h`
                  : `in ${nodalData.daysToNextNode}d`}
              </strong>
            </div>
          </div>

          {/* Bottom Line: Centered +-15-Day Draconic Rail SVG */}
          <div 
            className="w-full relative py-0.5" 
            title={`Monthly Draconic Window (±15 Days): Today centered, Past node: ${nodalData.prevNodeType === 'ascending' ? '☊' : '☋'} (${nodalData.daysSincePrevNode}d ago), Next node: ${nodalData.upcomingNodeType === 'ascending' ? '☊' : '☋'} (in ${nodalData.daysToNextNode}d)`}
          >
            <svg viewBox="0 0 240 16" className="w-full h-4 block overflow-visible">
              {/* Subtle background rail track */}
              <line x1="12" y1="8" x2="228" y2="8" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />

              {/* Day markers / ticks (-10d, -5d, +5d, +10d) */}
              {[-10, -5, 5, 10].map((day) => {
                const tickX = 120 + day * 7.2;
                return (
                  <line
                    key={day}
                    x1={tickX}
                    y1="6"
                    x2={tickX}
                    y2="10"
                    stroke="#334155"
                    strokeWidth="0.75"
                    strokeOpacity="0.6"
                  />
                );
              })}

              {/* Dynamic continuous timeline segments colored by ecliptic hemisphere (Sky Blue North / Rose Red South) */}
              {nodalData.timelineSegments.map((seg, idx) => {
                const x1 = Math.max(12, Math.min(228, 120 + seg.startDays * 7.2));
                const x2 = Math.max(12, Math.min(228, 120 + seg.endDays * 7.2));
                return (
                  <line
                    key={idx}
                    x1={x1.toFixed(1)}
                    y1="8"
                    x2={x2.toFixed(1)}
                    y2="8"
                    stroke={seg.color}
                    strokeWidth="2.5"
                    strokeOpacity="0.85"
                  />
                );
              })}

              {/* Pinned Node Markers along the timeline */}
              {nodalData.timelineNodes.map((node, idx) => {
                const x = 120 + node.daysOffset * 7.2;
                if (x < 10 || x > 230) return null;
                return (
                  <g key={idx} transform={`translate(${x.toFixed(1)}, 8)`}>
                    <circle cx="0" cy="0" r="2.8" fill="#020617" stroke={node.color} strokeWidth="1.2" />
                    <text
                      x="0"
                      y="-4.5"
                      textAnchor="middle"
                      className="text-[6.5px] font-bold select-none pointer-events-none"
                      fill={node.color}
                    >
                      {node.symbol}
                    </text>
                    <title>{`${node.type === 'ascending' ? 'Ascending Node (☊)' : 'Descending Node (☋)'}: ${node.daysOffset >= 0 ? `in ${node.daysOffset.toFixed(1)}d` : `${Math.abs(node.daysOffset).toFixed(1)}d ago`}`}</title>
                  </g>
                );
              })}

              {/* Center Target: Today / Now (T = 0, X = 120) */}
              <g transform="translate(120, 8)">
                {/* Vertical Center Guide */}
                <line x1="0" y1="-5" x2="0" y2="5" stroke="#64748b" strokeWidth="0.75" strokeDasharray="1 1" strokeOpacity="0.5" />
                {/* Pulsing Active Moon Bead */}
                <circle
                  cx="0"
                  cy="0"
                  r="4.5"
                  fill={nodalData.isMoonAscending ? '#38bdf8' : '#f43f5e'}
                  fillOpacity="0.35"
                  className="animate-pulse"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="2.5"
                  fill="#f8fafc"
                  stroke={nodalData.isMoonAscending ? '#38bdf8' : '#f43f5e'}
                  strokeWidth="1.2"
                />
              </g>

              {/* Timeline Axis Micro-Labels */}
              <text x="14" y="15" textAnchor="start" className="text-[5.5px] font-mono fill-slate-600 select-none pointer-events-none">−15d</text>
              <text x="120" y="15" textAnchor="middle" className="text-[5.5px] font-mono fill-slate-400 font-semibold select-none pointer-events-none">Today</text>
              <text x="226" y="15" textAnchor="end" className="text-[5.5px] font-mono fill-slate-600 select-none pointer-events-none">+15d</text>
            </svg>
          </div>
        </div>
      )}

      {/* Mirrored Footer Summary Badges: Moonrise / Moonset, Lunar Transit Snap Button, Declination, Mode Toggle */}
      <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
        <div 
          className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
          title={riseSetAz.riseFormatted !== '--' ? `Moonrise: ${riseSetAz.riseFormatted} · Moonset: ${riseSetAz.setFormatted}` : undefined}
        >
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Moonrise / Set</span>
          <span className="text-slate-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
            {moonrise !== null && moonrise !== undefined ? formatTime(moonrise).substring(0, 5) : '--:--'} / {moonset !== null && moonset !== undefined ? formatTime(moonset).substring(0, 5) : '--:--'}
          </span>
          {riseSetAz.riseOctant !== '--' && (
            <span className="text-[8px] text-slate-400 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
              {riseSetAz.riseOctant} · {riseSetAz.setOctant}
            </span>
          )}
        </div>
        <div
          onClick={() => transit && onSetTime && onSetTime(transit)}
          className="text-center bg-indigo-950/60 hover:bg-indigo-900/80 transition-all cursor-pointer p-1.5 rounded-lg border border-indigo-500/40 text-indigo-300 shadow-sm flex flex-col justify-center min-w-0"
          title="Click to jump clock to Lunar Transit"
        >
          <span className="text-[7.5px] sm:text-[8px] text-indigo-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap flex items-center justify-center gap-0.5 truncate">
            <Compass className="w-2.5 h-2.5 shrink-0" /> Lunar Transit
          </span>
          <span className="text-indigo-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">{formatTime(transit).substring(0, 5)} <span className="text-indigo-400/80 text-[9px] font-normal font-sans">UTC</span></span>
        </div>
        <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Declination (δ)</span>
          <span className={`text-[10px] sm:text-xs font-semibold font-mono whitespace-nowrap ${moonDeclination >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
            {moonDeclination >= 0 ? `+${(moonDeclination as number).toFixed(1)}°` : `${(moonDeclination as number).toFixed(1)}°`}
          </span>
        </div>
        <div className="text-center bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate mb-0.5">Mode View</span>
          <div className="flex items-center justify-center gap-0.5 bg-slate-950/80 p-0.5 rounded border border-slate-800/60">
            <button
              type="button"
              onClick={() => setIsNodalMode(false)}
              aria-label="Standard Lunar View"
              className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
                !isNodalMode
                  ? 'bg-slate-800 text-slate-200 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Std
            </button>
            <button
              type="button"
              onClick={() => setIsNodalMode(true)}
              aria-label="Lunar Nodes View"
              className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
                isNodalMode
                  ? 'bg-sky-950/80 text-sky-300 border border-sky-500/40 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ☊ Nodes
            </button>
          </div>
        </div>
      </div>
    </SkyDomeBase>
  );
};

export default MoonElevationDome;
