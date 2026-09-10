import React, { useState, useMemo } from 'react';
import { Sun, Compass } from 'lucide-react';
import { 
  toRadians, 
  formatTime, 
  calculateEarthOrbitalPhysics, 
  getJulianDate,
  projectSkyDomePoint,
  generateDiurnalPath,
  getSolarTwilightStatus,
  calculateCulminationBearing,
  calculateRiseSetAzimuth,
  calculateSolsticeCulminations
} from '../../../utils/cosmicMath';
import { SolarAlmanacData } from '../../../types';
import { SkyDomeBase, EL_R, EL_CX, EL_CY, SkyDomeDiurnalPath } from './SkyDomeBase';

export interface SunElevationDomeProps {
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
  initialTwilightMode?: boolean;
  isTwilightMode?: boolean;
  onToggleTwilight?: () => void;
  isQuadMode?: boolean;
}

export const SunElevationDome: React.FC<SunElevationDomeProps> = ({
  solarData,
  displayTime,
  latitude,
  currentDate = new Date(),
  onSetTime,
  initialTwilightMode = false,
  isTwilightMode,
  onToggleTwilight,
  isQuadMode = false,
}) => {
  const [isHoveringSunMetrics, setIsHoveringSunMetrics] = useState(false);
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

  // Earth-Sun Distance & Orbital Physics from Canonical Solver
  const fallbackPhysics = useMemo(
    () => calculateEarthOrbitalPhysics(getJulianDate(currentDate, displayTime)),
    [currentDate, displayTime]
  );
  const sunDistanceAU = solarData?.distanceAU ?? fallbackPhysics.distanceAU;
  const sunDistanceKm = solarData?.distanceKm ?? fallbackPhysics.distanceKm;

  // --- Sun Elevation Math ---
  const {
    noonElevation = 45,
    solarNoon = 12,
    equationOfTime = 0,
    sunrise = 6,
    sunset = 18,
    declination: sunDeclination = 0,
  } = solarData || {};

  const sunHourAngle = (displayTime - solarNoon) * 15;
  const sunPos = projectSkyDomePoint(sunHourAngle, Number(sunDeclination), latitude);
  const currentSunElevation = sunPos.elevation;
  const sunX = sunPos.x;
  const sunY = sunPos.y;

  // --- Culmination & Sighting Bearing Math ---
  const culmination = useMemo(
    () => calculateCulminationBearing(latitude, Number(sunDeclination)),
    [latitude, sunDeclination]
  );
  const riseSetAz = useMemo(
    () => calculateRiseSetAzimuth(latitude, Number(sunDeclination)),
    [latitude, sunDeclination]
  );
  const solsticeCulminations = useMemo(
    () => calculateSolsticeCulminations(latitude),
    [latitude]
  );

  // --- Solstice Peaks & Zenith Cap Math ---
  const OBLIQUITY = 23.439281;
  const absLat = Math.abs(latitude);
  const isTropical = absLat <= OBLIQUITY;

  // Maximum annual noon elevation ceiling (Zenith Cap boundary)
  const maxAnnualNoon = isTropical ? 90 : (90 - absLat + OBLIQUITY);
  const summerSolsticeNoon = solsticeCulminations.summer.altitude;
  const winterSolsticeNoon = solsticeCulminations.winter.altitude;

  // Zenith Cap geometry (unreachable sector when latitude is outside tropics)
  let capPathD = '';
  if (!isTropical && maxAnnualNoon < 89.5) {
    const yCap = EL_CY - EL_R * Math.sin(toRadians(maxAnnualNoon));
    const xCapL = EL_CX - EL_R * Math.cos(toRadians(maxAnnualNoon));
    const xCapR = EL_CX + EL_R * Math.cos(toRadians(maxAnnualNoon));
    capPathD = `M ${xCapL.toFixed(1)} ${yCap.toFixed(1)} A ${EL_R} ${EL_R} 0 0 1 ${xCapR.toFixed(1)} ${yCap.toFixed(1)} Z`;
  }

  // --- Curved Diurnal Paths ---
  const summerDec = latitude >= 0 ? OBLIQUITY : -OBLIQUITY;
  const winterDec = latitude >= 0 ? -OBLIQUITY : OBLIQUITY;

  const summerPathResult = generateDiurnalPath(latitude, summerDec);
  const winterPathResult = generateDiurnalPath(latitude, winterDec);
  const equinoxPathResult = generateDiurnalPath(latitude, 0);
  const todayPathResult = generateDiurnalPath(latitude, Number(sunDeclination));

  const diurnalPaths: SkyDomeDiurnalPath[] = [];

  // 1. Summer Solstice Arc (Amber dashed hairline)
  if (summerPathResult.pathD && summerSolsticeNoon > 0) {
    diurnalPaths.push({
      id: 'summer-solstice',
      d: summerPathResult.pathD,
      stroke: '#fbbf24',
      strokeWidth: 0.75,
      strokeDasharray: '3 2',
      strokeOpacity: 0.7,
      title: `Summer Solstice Noon Peak: ${summerSolsticeNoon.toFixed(1)}° ${solsticeCulminations.summer.shortTag}`
    });
  }

  // 2. Active Today's Sun Path (Glowing Solid Gold Track)
  if (todayPathResult.pathD) {
    diurnalPaths.push({
      id: 'today-sun-path',
      d: todayPathResult.pathD,
      stroke: '#f59e0b',
      strokeWidth: 1.5,
      strokeOpacity: 0.95,
      isGlowing: true,
      title: `Today's Solar Transit Peak: ${todayPathResult.peakAlt.toFixed(1)}°`
    });
  }

  // 2b. Today's Twilight Sub-Horizon Continuation (0° to -18°)
  if (isTwilightMode && todayPathResult.twilightD) {
    diurnalPaths.push({
      id: 'today-twilight-path',
      d: todayPathResult.twilightD,
      stroke: '#f59e0b',
      strokeWidth: 1.0,
      strokeDasharray: '2 2',
      strokeOpacity: 0.4,
      title: "Today's Twilight Track (0° to −18°)"
    });
  }

  // 3. Equinox Arc (Muted slate dashed hairline)
  if (equinoxPathResult.pathD && equinoxPathResult.peakAlt > 0) {
    const eqPeak = equinoxPathResult.peakAlt;
    diurnalPaths.push({
      id: 'equinox-path',
      d: equinoxPathResult.pathD,
      stroke: '#64748b',
      strokeWidth: 0.75,
      strokeDasharray: '2 3',
      strokeOpacity: 0.5,
      title: `Equinox Noon Peak: ${eqPeak.toFixed(1)}°`
    });
  }

  // 4. Winter Solstice Arc (Bronze dashed hairline)
  if (winterPathResult.pathD && winterSolsticeNoon > 0) {
    diurnalPaths.push({
      id: 'winter-solstice',
      d: winterPathResult.pathD,
      stroke: '#d97706',
      strokeWidth: 0.75,
      strokeDasharray: '3 2',
      strokeOpacity: 0.7,
      title: `Winter Solstice Noon Peak: ${winterSolsticeNoon.toFixed(1)}° ${solsticeCulminations.winter.shortTag}`
    });
  }

  const twilightStatus = getSolarTwilightStatus(currentSunElevation);

  return (
    <SkyDomeBase
      title="Sun Elevation Arc"
      icon={Sun}
      iconColorClass="text-amber-400"
      peakLabel="Noon Peak"
      peakElevation={noonElevation as number}
      peakDirectionSuffix={culmination.shortTag}
      meridianDirection={culmination.meridianLabel}
      culminationDirection={culmination.direction}
      sightingBanner={culmination.sightingSummary}
      currentElevation={currentSunElevation}
      elevationColorClass={twilightStatus.badgeClass}
      elevationStatusSubtitle={twilightStatus.label}
      showTwilightBands={isTwilightModeActive}
      latitude={latitude}
      capPathD={capPathD}
      diurnalPaths={diurnalPaths}
      bodyX={sunX}
      bodyY={sunY}
      bodyVectorStroke={currentSunElevation >= 0 ? '#fbbf24' : '#64748b'}
      renderBodyGraphic={() => (
        <circle
          cx={sunX}
          cy={sunY}
          r="5"
          fill={
            currentSunElevation >= 0
              ? '#fbbf24'
              : currentSunElevation >= -6
              ? '#f59e0b'
              : currentSunElevation >= -12
              ? '#64748b'
              : currentSunElevation >= -18
              ? '#334155'
              : '#1e293b'
          }
          fillOpacity={currentSunElevation >= -18 ? 0.95 : 0.45}
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeOpacity={currentSunElevation >= -18 ? 0.9 : 0.4}
          className="drop-shadow"
        />
      )}
      popover={isHoveringSunMetrics ? (
        <div className="absolute bottom-20 left-4 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-3 rounded-xl max-w-xs shadow-2xl font-mono space-y-1 pointer-events-none animate-in fade-in zoom-in-95 duration-150">
          <div className="text-xs font-semibold text-amber-300 flex items-center justify-between">
            <span>Solar Analemma &amp; Orbit</span>
            <span className="text-slate-400 text-[10px] font-normal">32.0' Angular Diam</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Distance: <strong className="text-white font-semibold">{(sunDistanceKm || 149597870).toLocaleString()} km</strong>{' '}
            <span className="text-slate-400">({sunDistanceAU.toFixed(3)} AU)</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Equation of Time: <strong className={equationOfTime >= 0 ? 'text-indigo-300 font-semibold' : 'text-rose-300 font-semibold'}>
              {equationOfTime >= 0 ? `+${equationOfTime.toFixed(1)}m` : `${equationOfTime.toFixed(1)}m`}
            </strong>
          </div>
          <div className="text-[9px] text-slate-400 pt-1 border-t border-slate-800 leading-tight">
            {sunDistanceAU < 0.99
              ? 'Near Perihelion: Earth is closest to the Sun (~0.983 AU in January), causing fastest orbital speed.'
              : sunDistanceAU > 1.01
              ? 'Near Aphelion: Earth is furthest from the Sun (~1.017 AU in July), causing slowest orbital speed.'
              : 'Mean 1 AU Orbit: Solar distance is near average (149.6M km / 1.000 AU).'}
          </div>
        </div>
      ) : null}
    >
      {/* Symmetrical Sun State & Analemma Bar */}
      <div 
        className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/40 flex items-center justify-between gap-3 mt-1 cursor-pointer transition-colors hover:border-slate-700"
        onPointerEnter={() => setIsHoveringSunMetrics(true)}
        onPointerLeave={() => setIsHoveringSunMetrics(false)}
        title={`Earth-Sun Distance: ${sunDistanceAU.toFixed(3)} AU (${(sunDistanceKm || 149597870).toLocaleString()} km)`}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-[52px] h-[52px] rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Sun className="w-6 h-6 text-amber-400 drop-shadow-sm" />
          </div>
          <div className="font-mono text-left">
            <div className="text-xs font-semibold text-slate-200">Solar Orbit</div>
            <div className="text-[10px] text-slate-400 font-medium">
              Eq of Time: <span className={equationOfTime >= 0 ? 'text-indigo-300' : 'text-rose-300'}>{equationOfTime >= 0 ? `+${equationOfTime.toFixed(1)}m` : `${equationOfTime.toFixed(1)}m`}</span>
            </div>
          </div>
        </div>

        <div className="font-mono text-right text-[10px] space-y-0.5">
          <div className="text-slate-400">
            Dist: <strong className="text-slate-200 font-semibold">{sunDistanceAU.toFixed(3)} AU</strong>
          </div>
          <div>
            <span className={`font-semibold px-1.5 py-0.5 rounded border text-[9px] ${
              sunDistanceAU < 0.99
                ? 'bg-amber-950/60 text-amber-300 border-amber-800/60'
                : sunDistanceAU > 1.01
                ? 'bg-sky-950/60 text-sky-300 border-sky-800/60'
                : 'bg-slate-900/60 text-slate-400 border-slate-800/60'
            }`}>
              {sunDistanceAU < 0.99 ? 'Perihelion' : sunDistanceAU > 1.01 ? 'Aphelion' : 'Mean 1 AU'}
            </span>
          </div>
        </div>
      </div>

      {/* Solstice Noon Limits & Zenith Cap Stats Strip (Below Solar Orbit) */}
      <div className="flex items-center justify-between text-[10px] font-mono bg-slate-950/70 px-2.5 py-1.5 rounded-lg border border-slate-800/50 text-slate-400 mt-1">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="text-slate-400">Summer Sol:</span>
          <strong className="text-amber-300 font-semibold">{summerSolsticeNoon.toFixed(1)}° {solsticeCulminations.summer.shortTag}</strong>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
          <span className="text-slate-400">Winter Sol:</span>
          <strong className="text-amber-500 font-semibold">
            {winterSolsticeNoon > 0 ? `${winterSolsticeNoon.toFixed(1)}° ${solsticeCulminations.winter.shortTag}` : 'Below 0°'}
          </strong>
        </div>
        {isQuadMode && (
          <div className="flex items-center gap-1.5" title="Annual Solstice Migration Corridor: Δδ = 46.9°">
            <span className="text-slate-600">·</span>
            <span className="text-slate-400">Solstice Span:</span>
            <strong className="text-amber-300 font-semibold">Δδ {(2 * OBLIQUITY).toFixed(1)}°</strong>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-600">·</span>
          <span className="text-slate-400">Zenith Cap:</span>
          <strong className={isTropical ? 'text-emerald-400 font-semibold' : 'text-slate-300 font-semibold'}>
            {isTropical ? 'None (90°)' : `>${maxAnnualNoon.toFixed(1)}°`}
          </strong>
        </div>
      </div>

      {/* Mirrored Footer Summary Badges: Sunrise / Sunset, Solar Noon Snap Button, Declination, Mode Toggle */}
      <div className="grid grid-cols-4 gap-1.5 w-full bg-slate-950/60 p-1.5 rounded-xl border border-slate-800/50 text-xs font-mono mt-1">
        <div 
          className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
          title={riseSetAz.riseFormatted !== '--' ? `Sunrise: ${riseSetAz.riseFormatted} · Sunset: ${riseSetAz.setFormatted}` : undefined}
        >
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Sunrise / Set</span>
          <span className="text-slate-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
            {formatTime(sunrise).substring(0, 5)} / {formatTime(sunset).substring(0, 5)}
          </span>
          {riseSetAz.riseOctant !== '--' && (
            <span className="text-[8px] text-slate-400 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
              {riseSetAz.riseOctant} · {riseSetAz.setOctant}
            </span>
          )}
        </div>
        <div 
          onClick={() => solarNoon && onSetTime && onSetTime(solarNoon)}
          className="text-center bg-amber-950/60 hover:bg-amber-900/80 transition-all cursor-pointer p-1.5 rounded-lg border border-amber-500/40 text-amber-300 shadow-sm flex flex-col justify-center min-w-0"
          title="Click to jump clock to Solar Noon"
        >
          <span className="text-[7.5px] sm:text-[8px] text-amber-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap flex items-center justify-center gap-0.5 truncate">
            <Compass className="w-2.5 h-2.5 shrink-0" /> Solar Noon
          </span>
          <span className="text-amber-200 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">{formatTime(solarNoon).substring(0, 5)} <span className="text-amber-400/80 text-[9px] font-normal font-sans">UTC</span></span>
        </div>
        <div 
          className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0"
          title={isQuadMode ? `Solar Declination: ${(sunDeclination as number).toFixed(1)}° · Annual Solstice Corridor: Δδ ${(2 * OBLIQUITY).toFixed(1)}°` : undefined}
        >
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">
            {isQuadMode ? 'Dec (δ) · Span' : 'Declination (δ)'}
          </span>
          <span className={`text-[10px] sm:text-xs font-semibold font-mono whitespace-nowrap ${(sunDeclination as number) >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            {(sunDeclination as number) >= 0 ? `+${(sunDeclination as number).toFixed(1)}°` : `${(sunDeclination as number).toFixed(1)}°`}
          </span>
          {isQuadMode && (
            <span className="text-[8px] text-amber-400/80 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
              Δδ {(2 * OBLIQUITY).toFixed(1)}° Span
            </span>
          )}
        </div>
        <div className="text-center bg-slate-900/40 p-1 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap mb-0.5">Mode View</span>
          <div className="flex items-center justify-center gap-0.5 bg-slate-950/80 p-0.5 rounded border border-slate-800/60">
            <button
              type="button"
              onClick={() => handleToggleTwilight(false)}
              aria-label="Standard Solar View"
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
              aria-label="Twilight Strata View"
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
    </SkyDomeBase>
  );
};

export default SunElevationDome;
