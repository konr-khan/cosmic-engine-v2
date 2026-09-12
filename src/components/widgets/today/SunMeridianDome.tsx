import React, { useState, useMemo } from 'react';
import { Sun } from 'lucide-react';
import {
  projectSkyDomePoint,
  calculateCulminationBearing,
  calculateSolsticeCulminations,
  calculateMeridianPoint,
  generateMeridianSwathD,
  calculateMeridianRadialTick,
  calculateMeridianDiurnalPoint,
  calculateMeridianDiurnalChord,
} from '../../../utils/cosmicMath';
import { SolarAlmanacData } from '../../../types';
import { MeridianDomeBase, EL_CX, EL_CY, EL_R } from './MeridianDomeBase';

export interface SunMeridianDomeProps {
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
  initialTwilightMode?: boolean;
  isTwilightMode?: boolean;
  onToggleTwilight?: () => void;
  hideFooter?: boolean;
}

export const SunMeridianDome: React.FC<SunMeridianDomeProps> = ({
  solarData,
  displayTime,
  latitude,
  currentDate: _currentDate = new Date(),
  onSetTime: _onSetTime,
  initialTwilightMode = false,
  isTwilightMode,
  onToggleTwilight,
  hideFooter = false,
}) => {
  const [localTwilightMode, setLocalTwilightMode] = useState(initialTwilightMode);
  const isTwilightModeActive = isTwilightMode !== undefined ? isTwilightMode : localTwilightMode;

  const handleToggleTwilight = (val: boolean) => {
    if (onToggleTwilight) {
      if (val !== isTwilightModeActive) {
        onToggleTwilight();
      }
    } else {
      setLocalTwilightMode(val);
    }
  };

  const {
    solarNoon = 12,
    declination: sunDeclination = 0,
  } = solarData || {};

  // --- Real-Time Sun Elevation & Meridian Diurnal Trajectory ---
  const sunHourAngle = (displayTime - solarNoon) * 15;
  const currentSunPos = projectSkyDomePoint(sunHourAngle, Number(sunDeclination), latitude);
  const currentSunElevation = currentSunPos.elevation;

  // Sub-horizon threshold: -18° when Twilight mode active, 0° (horizon baseline) in Std mode
  const thresholdElevation = isTwilightModeActive ? -18 : 0;

  // Real-time instantaneous Sun position along continuous 3D diurnal path
  const activeSunPoint = useMemo(
    () => calculateMeridianDiurnalPoint(latitude, Number(sunDeclination), sunHourAngle, thresholdElevation),
    [latitude, sunDeclination, sunHourAngle, thresholdElevation]
  );

  // Today's Diurnal Chord in the Meridian projection (touching Meridian Arc at Solar Noon)
  const todayChord = useMemo(
    () => calculateMeridianDiurnalChord(latitude, Number(sunDeclination), thresholdElevation),
    [latitude, sunDeclination, thresholdElevation]
  );

  // --- Culminations & Bearings ---
  const todayCulmination = useMemo(
    () => calculateCulminationBearing(latitude, Number(sunDeclination)),
    [latitude, sunDeclination]
  );
  const peakAlt = todayCulmination.altitude;

  const solsticeCulminations = useMemo(
    () => calculateSolsticeCulminations(latitude),
    [latitude]
  );

  const equinoxCulmination = useMemo(
    () => calculateCulminationBearing(latitude, 0),
    [latitude]
  );

  const OBLIQUITY = 23.439281;
  const absLat = Math.abs(latitude);
  const isTropical = absLat <= OBLIQUITY;
  const isPolar = absLat >= 89.9;

  const juneSolstice = useMemo(
    () => calculateCulminationBearing(latitude, OBLIQUITY),
    [latitude]
  );
  const decemberSolstice = useMemo(
    () => calculateCulminationBearing(latitude, -OBLIQUITY),
    [latitude]
  );
  const juneNoon = juneSolstice.altitude;
  const decemberNoon = decemberSolstice.altitude;

  const summerSolstice = solsticeCulminations.summer;
  const winterSolstice = solsticeCulminations.winter;
  const summerNoon = summerSolstice.altitude;
  const winterNoon = winterSolstice.altitude;

  const getTwilightTier = (alt: number): string => {
    if (alt >= 0) return 'Daylight';
    if (alt >= -6) return 'Civil Twilight';
    if (alt >= -12) return 'Nautical Twilight';
    if (alt >= -18) return 'Astro Twilight';
    return 'Polar Night';
  };

  // --- Meridian Coordinate Points on Dome Arc (R=92) ---
  const todayPeakPoint = useMemo(
    () => calculateMeridianPoint(peakAlt, todayCulmination.direction, EL_CX, EL_CY, EL_R, thresholdElevation),
    [peakAlt, todayCulmination, thresholdElevation]
  );

  const junePoint = useMemo(
    () => calculateMeridianPoint(juneNoon, juneSolstice.direction, EL_CX, EL_CY, EL_R, thresholdElevation),
    [juneNoon, juneSolstice, thresholdElevation]
  );

  const decemberPoint = useMemo(
    () => calculateMeridianPoint(decemberNoon, decemberSolstice.direction, EL_CX, EL_CY, EL_R, thresholdElevation),
    [decemberNoon, decemberSolstice, thresholdElevation]
  );

  const equinoxPoint = useMemo(
    () => calculateMeridianPoint(equinoxCulmination.altitude, equinoxCulmination.direction, EL_CX, EL_CY, EL_R, thresholdElevation),
    [equinoxCulmination, thresholdElevation]
  );

  // --- Split Solstice Milestone Swaths (along R=92 dome) ---
  // Bifurcated at Today's Noon Peak into June (Gold) and December (Bronze) milestone arcs
  const juneSwathD = useMemo(
    () => generateMeridianSwathD(todayPeakPoint.thetaDeg, junePoint.thetaDeg),
    [todayPeakPoint.thetaDeg, junePoint.thetaDeg]
  );

  const decemberSwathD = useMemo(
    () => generateMeridianSwathD(todayPeakPoint.thetaDeg, decemberPoint.thetaDeg),
    [todayPeakPoint.thetaDeg, decemberPoint.thetaDeg]
  );

  // Annual seasonal migration direction:
  // Dec 21 -> Jun 21: Sun moves North towards June Solstice (lambda in [270°, 360°) or [0°, 90°))
  // Jun 21 -> Dec 21: Sun moves South towards December Solstice (lambda in [90°, 270°))
  const sunLambda = solarData?.lambda !== undefined ? Number(solarData.lambda) : undefined;
  const isApproachingJune = useMemo(() => {
    if (sunLambda !== undefined) {
      const normLambda = ((sunLambda % 360) + 360) % 360;
      return normLambda >= 270 || normLambda < 90;
    }
    const startOfYear = new Date(_currentDate.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((_currentDate.getTime() - startOfYear.getTime()) / 86400000);
    return dayOfYear < 172 || dayOfYear >= 355;
  }, [sunLambda, _currentDate]);

  // Solstice tick pin visibility logic:
  // - If altitude >= 0°: visible in all modes
  // - If 0° > altitude >= -18°: visible ONLY when isTwilightModeActive is true
  // - If altitude < -18°: disappears completely (below Astronomical Twilight floor)
  const showJuneTick = juneNoon >= 0 || (isTwilightModeActive && juneNoon >= -18);
  const showDecemberTick = decemberNoon >= 0 || (isTwilightModeActive && decemberNoon >= -18);

  const juneTickTitle = juneNoon >= 0
    ? `June Solstice Noon Peak (+23.4°): ${juneNoon.toFixed(1)}° ${juneSolstice.shortTag}`
    : `June Solstice Noon Peak (+23.4°): ${juneNoon.toFixed(1)}° ${juneSolstice.shortTag} (${getTwilightTier(juneNoon)})`;

  const decemberTickTitle = decemberNoon >= 0
    ? `December Solstice Noon Peak (−23.4°): ${decemberNoon.toFixed(1)}° ${decemberSolstice.shortTag}`
    : `December Solstice Noon Peak (−23.4°): ${decemberNoon.toFixed(1)}° ${decemberSolstice.shortTag} (${getTwilightTier(decemberNoon)})`;

  const juneSwathTitle = juneNoon >= -18
    ? `June Solstice Arc (+23.4°): ${todayCulmination.altitude.toFixed(1)}° ${todayCulmination.shortTag} ↔ ${juneNoon.toFixed(1)}° ${juneSolstice.shortTag}${juneNoon < 0 ? ` (${getTwilightTier(juneNoon)})` : ''}${isApproachingJune ? ' (Approaching Milestone)' : ''}`
    : `June Solstice Arc (+23.4°): Plunges below −18° Astro Twilight (Polar Night)${isApproachingJune ? ' (Approaching Milestone)' : ''}`;

  const decemberSwathTitle = decemberNoon >= -18
    ? `December Solstice Arc (−23.4°): ${todayCulmination.altitude.toFixed(1)}° ${todayCulmination.shortTag} ↔ ${decemberNoon.toFixed(1)}° ${decemberSolstice.shortTag}${decemberNoon < 0 ? ` (${getTwilightTier(decemberNoon)})` : ''}${!isApproachingJune ? ' (Approaching Milestone)' : ''}`
    : `December Solstice Arc (−23.4°): Plunges below −18° Astro Twilight (Polar Night)${!isApproachingJune ? ' (Approaching Milestone)' : ''}`;

  // --- Perpendicular Radial Tick Pins ---
  const juneTick = useMemo(
    () => calculateMeridianRadialTick(junePoint.thetaDeg, 86, 98),
    [junePoint.thetaDeg]
  );

  const decemberTick = useMemo(
    () => calculateMeridianRadialTick(decemberPoint.thetaDeg, 86, 98),
    [decemberPoint.thetaDeg]
  );

  const equinoxTick = useMemo(
    () => calculateMeridianRadialTick(equinoxPoint.thetaDeg, 88, 96),
    [equinoxPoint.thetaDeg]
  );

  // Solstice Span in declination: 2 * 23.439° = 46.88°
  const solsticeSpanDeg = 2 * OBLIQUITY;

  const elevationSubtitle = currentSunElevation >= 0
    ? 'Daylight'
    : currentSunElevation >= -6
    ? 'Civil Twilight'
    : currentSunElevation >= -12
    ? 'Nautical Twilight'
    : currentSunElevation >= -18
    ? 'Astro Twilight'
    : 'Night';

  return (
    <MeridianDomeBase
      title="Sun Meridian Profile"
      icon={Sun}
      iconColorClass="text-amber-400"
      peakLabel={isPolar ? 'Constant Altitude' : 'Noon Peak'}
      peakElevation={peakAlt}
      peakDirectionSuffix={todayCulmination.shortTag}
      meridianDirection={todayCulmination.meridianLabel}
      culminationDirection={todayCulmination.direction}
      sightingBanner={todayCulmination.sightingSummary}
      currentElevation={currentSunElevation}
      elevationColorClass={currentSunElevation >= 0 ? 'text-amber-400' : 'text-slate-400'}
      elevationStatusSubtitle={elevationSubtitle}
      showTwilightBands={isTwilightModeActive}
      latitude={latitude}
      bodyX={activeSunPoint.x}
      bodyY={activeSunPoint.y}
      bodyVectorStroke={currentSunElevation >= 0 ? '#fbbf24' : '#475569'}
      renderBodyGraphic={() => (
        <g id="active-solar-noon-bead">
          <circle
            cx={activeSunPoint.x}
            cy={activeSunPoint.y}
            r={activeSunPoint.isParked ? 4.5 : 5}
            fill={
              activeSunPoint.isParked
                ? '#1e293b'
                : currentSunElevation >= 0
                ? '#fbbf24'
                : currentSunElevation >= -6
                ? '#f59e0b'
                : currentSunElevation >= -12
                ? '#64748b'
                : '#334155'
            }
            fillOpacity={activeSunPoint.isParked ? 0.35 : (currentSunElevation >= -18 ? 0.95 : 0.45)}
            stroke={activeSunPoint.isParked ? '#94a3b8' : '#ffffff'}
            strokeWidth="1.2"
            strokeDasharray={activeSunPoint.isParked ? '1.5 1.5' : undefined}
            strokeOpacity={activeSunPoint.isParked ? 0.5 : (currentSunElevation >= -18 ? 0.9 : 0.4)}
            className="drop-shadow"
          >
            <title>
              {activeSunPoint.isParked
                ? (isTwilightModeActive
                    ? `Sun below −18° (${elevationSubtitle}) · Parked at Twilight Gate`
                    : `Sun below Horizon (${elevationSubtitle}) · Parked at Horizon Gate`)
                : `Current Solar Altitude: ${currentSunElevation >= 0 ? '+' : ''}${currentSunElevation.toFixed(1)}° (${elevationSubtitle})`}
            </title>
          </circle>
        </g>
      )}
      swaths={[
        ...(juneSwathD
          ? [
              {
                id: 'solstice-swath-june',
                d: juneSwathD,
                stroke: '#fbbf24',
                strokeWidth: 2.0,
                strokeDasharray: '3 2',
                strokeOpacity: isApproachingJune ? 0.85 : 0.40,
                glow: true,
                glowWidth: 4,
                glowOpacity: isApproachingJune ? 0.25 : 0.10,
                title: juneSwathTitle,
              },
            ]
          : []),
        ...(decemberSwathD
          ? [
              {
                id: 'solstice-swath-december',
                d: decemberSwathD,
                stroke: '#d97706',
                strokeWidth: 2.0,
                strokeDasharray: '3 2',
                strokeOpacity: !isApproachingJune ? 0.85 : 0.40,
                glow: true,
                glowWidth: 4,
                glowOpacity: !isApproachingJune ? 0.25 : 0.10,
                title: decemberSwathTitle,
              },
            ]
          : []),
      ]}
      radialTicks={[
        ...(showJuneTick
          ? [
              {
                id: 'summer-solstice-tick',
                tick: juneTick,
                stroke: '#fbbf24',
                strokeWidth: 1.4,
                title: juneTickTitle,
              },
            ]
          : []),
        ...(showDecemberTick
          ? [
              {
                id: 'winter-solstice-tick',
                tick: decemberTick,
                stroke: '#d97706',
                strokeWidth: 1.4,
                title: decemberTickTitle,
              },
            ]
          : []),
        {
          id: 'equinox-tick',
          tick: equinoxTick,
          stroke: '#64748b',
          strokeWidth: 1.0,
          title: `Equinox Noon Peak: ${equinoxCulmination.altitude.toFixed(1)}° ${equinoxCulmination.shortTag}`,
        },
      ]}
      geometryGroupId="meridian-solstice-geometry"
      geometryGroupClassName="meridian-solstice-geometry"
      todayChordConfig={{
        daylightId: 'sun-today-diurnal-chord',
        twilightId: isTwilightModeActive ? 'sun-today-twilight-chord' : undefined,
        chord: todayChord,
        stroke: '#fbbf24',
        strokeWidth: 1.5,
        strokeOpacity: 0.85,
        twilightStroke: '#d97706',
        twilightWidth: 1.0,
        twilightOpacity: 0.40,
        twilightDasharray: '2 2',
        daylightTitle: `Today's Solar Diurnal Path (Noon Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag})`,
        twilightTitle: "Today's Sub-Horizon Twilight Extension down to −18°",
      }}
      gateAnchor={
        isTwilightModeActive
          ? {
              id: 'sun-twilight-gate-anchor',
              x: todayChord.anchorPoint.x,
              y: todayChord.anchorPoint.y,
              r: 3.5,
              stroke: '#64748b',
              title: 'Astronomical Twilight Gate (−18°): Deep Night Station',
            }
          : undefined
      }
      peakTarget={{
        id: 'meridian-noon-peak-target',
        peakPoint: todayPeakPoint,
        stroke: '#fbbf24',
        title: `Today's Noon Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag}`,
      }}
    >
      {!hideFooter && (
        <>
          {/* Solstice Noon Limits & Zenith Transit Stats Strip (Dedicated to Meridian Geometry) */}
          <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-slate-400">Summer Sol:</span>
              <strong className="text-amber-300 font-semibold">{summerNoon.toFixed(1)}° {summerSolstice.shortTag}</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
              <span className="text-slate-400">Winter Sol:</span>
              <strong className="text-amber-500 font-semibold">
                {winterNoon > 0 ? `${winterNoon.toFixed(1)}° ${winterSolstice.shortTag}` : 'Below 0°'}
              </strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-600">·</span>
              <span className="text-slate-400">Lahaina Transit:</span>
              <strong className={isTropical ? 'text-emerald-400 font-semibold' : 'text-slate-300 font-semibold'}>
                {isTropical ? 'Yes (Crosses Zenith)' : 'Outside Tropics'}
              </strong>
            </div>
          </div>

          {/* Mirrored 4-Badge Summary Footer with Mode View Toggle (Std vs Twilight) */}
          <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
            <div 
              className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
              title={`Annual Solstice Range: Δδ = ${solsticeSpanDeg.toFixed(1)}° between ±${OBLIQUITY.toFixed(1)}°`}
            >
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Solstice Span</span>
              <span className="text-slate-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
                Δδ {solsticeSpanDeg.toFixed(1)}°
              </span>
              <span className="text-[8px] text-slate-400 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
                Min ↔ Max
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Summer Peak</span>
              <span className="text-amber-300 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
                {summerNoon.toFixed(1)}° {summerSolstice.shortTag}
              </span>
              <span className="text-[8px] text-slate-500 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
                Highest Noon
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Winter Peak</span>
              <span className="text-amber-500 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
                {winterNoon > 0 ? `${winterNoon.toFixed(1)}° ${winterSolstice.shortTag}` : 'Below 0°'}
              </span>
              <span className="text-[8px] text-slate-500 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
                Lowest Noon
              </span>
            </div>
            <div className="text-center bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
              <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate mb-0.5">Mode View</span>
              <div className="flex items-center justify-center gap-0.5 bg-slate-950/80 p-0.5 rounded border border-slate-800/60">
                <button
                  type="button"
                  onClick={() => handleToggleTwilight(false)}
                  aria-label="Standard Solar Meridian View"
                  className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
                    !isTwilightModeActive
                      ? 'bg-slate-800 text-amber-400 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Std
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleTwilight(true)}
                  aria-label="Twilight Strata Meridian View"
                  className={`flex-1 py-0.5 px-1 rounded text-[8.5px] sm:text-[9px] font-mono transition-colors ${
                    isTwilightModeActive
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Twilight
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </MeridianDomeBase>
  );
};

export default SunMeridianDome;
