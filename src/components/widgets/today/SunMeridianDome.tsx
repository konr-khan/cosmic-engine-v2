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
} from '../../../utils/cosmicMath';
import { SolarAlmanacData } from '../../../types';
import { SkyDomeBase, EL_CX, EL_CY } from './SkyDomeBase';

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

  // Real-time instantaneous Sun position along continuous 3D diurnal path
  const activeSunPoint = useMemo(
    () => calculateMeridianDiurnalPoint(latitude, Number(sunDeclination), sunHourAngle),
    [latitude, sunDeclination, sunHourAngle]
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

  const summerSolstice = solsticeCulminations.summer;
  const winterSolstice = solsticeCulminations.winter;
  const summerNoon = summerSolstice.altitude;
  const winterNoon = winterSolstice.altitude;

  // --- Meridian Coordinate Points on Dome Arc (R=92) ---
  const todayPeakPoint = useMemo(
    () => calculateMeridianPoint(peakAlt, todayCulmination.direction),
    [peakAlt, todayCulmination]
  );

  const summerPoint = useMemo(
    () => calculateMeridianPoint(summerSolstice.altitude, summerSolstice.direction),
    [summerSolstice]
  );

  const winterPoint = useMemo(
    () => calculateMeridianPoint(winterSolstice.altitude, winterSolstice.direction),
    [winterSolstice]
  );

  const equinoxPoint = useMemo(
    () => calculateMeridianPoint(equinoxCulmination.altitude, equinoxCulmination.direction),
    [equinoxCulmination]
  );

  // --- Solstice Swath Arc (along R=92 dome) ---
  const solsticeSwathD = useMemo(
    () => generateMeridianSwathD(winterPoint.thetaDeg, summerPoint.thetaDeg),
    [winterPoint.thetaDeg, summerPoint.thetaDeg]
  );

  // --- Perpendicular Radial Tick Pins ---
  const summerTick = useMemo(
    () => calculateMeridianRadialTick(summerPoint.thetaDeg, 86, 98),
    [summerPoint.thetaDeg]
  );

  const winterTick = useMemo(
    () => calculateMeridianRadialTick(winterPoint.thetaDeg, 86, 98),
    [winterPoint.thetaDeg]
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
    <SkyDomeBase
      title="Sun Meridian Profile"
      icon={Sun}
      iconColorClass="text-amber-400"
      peakLabel="Noon Peak"
      peakElevation={peakAlt}
      peakDirectionSuffix={todayCulmination.shortTag}
      meridianDirection={todayCulmination.meridianLabel}
      culminationDirection={todayCulmination.direction}
      sightingBanner={todayCulmination.sightingSummary}
      currentElevation={currentSunElevation}
      elevationColorClass={currentSunElevation >= 0 ? 'text-amber-400' : 'text-slate-400'}
      elevationStatusSubtitle={elevationSubtitle}
      showTwilightBands={isTwilightModeActive}
      leftHorizonLabel="S"
      centerHorizonLabel="Z"
      rightHorizonLabel="N"
      showZenithAxis={true}
      latitude={latitude}
      bodyX={activeSunPoint.x}
      bodyY={activeSunPoint.y}
      bodyVectorStroke={currentSunElevation >= 0 ? '#fbbf24' : '#475569'}
      renderBodyGraphic={() => (
        <g id="active-solar-noon-bead">
          <circle
            cx={activeSunPoint.x}
            cy={activeSunPoint.y}
            r="5"
            fill={
              currentSunElevation >= 0
                ? '#fbbf24'
                : currentSunElevation >= -6
                ? '#f59e0b'
                : currentSunElevation >= -12
                ? '#64748b'
                : '#334155'
            }
            fillOpacity={currentSunElevation >= -18 ? 0.95 : 0.45}
            stroke="#ffffff"
            strokeWidth="1.2"
            strokeOpacity={currentSunElevation >= -18 ? 0.9 : 0.4}
            className="drop-shadow"
          >
            <title>{`Current Solar Altitude: ${currentSunElevation >= 0 ? '+' : ''}${currentSunElevation.toFixed(1)}° (${elevationSubtitle})`}</title>
          </circle>
        </g>
      )}
      extraSvgContent={
        <g className="meridian-solstice-geometry" id="meridian-solstice-geometry">
          {/* Annual Solstice Migration Highway Swath (Amber Glowing Arc) */}
          {solsticeSwathD && (
            <>
              <path
                d={solsticeSwathD}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="5"
                strokeOpacity="0.15"
                className="blur-[1px] pointer-events-none"
              />
              <path
                id="solstice-swath-core"
                d={solsticeSwathD}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeOpacity="0.4"
              >
                <title>{`Annual Solar Solstice Range: ${winterNoon > 0 ? winterNoon.toFixed(1) + '° ' + winterSolstice.shortTag : 'Below 0°'} to ${summerNoon.toFixed(1)}° ${summerSolstice.shortTag}`}</title>
              </path>
            </>
          )}

          {/* Summer Solstice Tick Pin */}
          <g id="summer-solstice-tick">
            <line
              x1={summerTick.x1}
              y1={summerTick.y1}
              x2={summerTick.x2}
              y2={summerTick.y2}
              stroke="#fbbf24"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <title>{`Summer Solstice Noon Peak: ${summerNoon.toFixed(1)}° ${summerSolstice.shortTag}`}</title>
          </g>

          {/* Winter Solstice Tick Pin */}
          <g id="winter-solstice-tick">
            <line
              x1={winterTick.x1}
              y1={winterTick.y1}
              x2={winterTick.x2}
              y2={winterTick.y2}
              stroke="#d97706"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
            <title>{`Winter Solstice Noon Peak: ${winterNoon > 0 ? winterNoon.toFixed(1) + '° ' + winterSolstice.shortTag : 'Below 0° (Polar Night)'}`}</title>
          </g>

          {/* Equinox Tick Pin */}
          <g id="equinox-tick">
            <line
              x1={equinoxTick.x1}
              y1={equinoxTick.y1}
              x2={equinoxTick.x2}
              y2={equinoxTick.y2}
              stroke="#64748b"
              strokeWidth="1.0"
              strokeLinecap="round"
            />
            <title>{`Equinox Noon Peak: ${equinoxCulmination.altitude.toFixed(1)}° ${equinoxCulmination.shortTag}`}</title>
          </g>

          {/* Daily Culmination Peak Target Halo on the Arc */}
          <g id="meridian-noon-peak-target">
            <line
              x1={EL_CX}
              y1={EL_CY}
              x2={todayPeakPoint.x}
              y2={todayPeakPoint.y}
              stroke="#fbbf24"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              strokeOpacity="0.35"
            />
            <circle
              cx={todayPeakPoint.x}
              cy={todayPeakPoint.y}
              r="5.5"
              fill="none"
              stroke="#fbbf24"
              strokeWidth="1.0"
              strokeDasharray="2 2"
              strokeOpacity="0.75"
            >
              <title>{`Today's Noon Peak: ${peakAlt.toFixed(1)}° ${todayCulmination.shortTag}`}</title>
            </circle>
          </g>
        </g>
      }
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
    </SkyDomeBase>
  );
};

export default SunMeridianDome;
