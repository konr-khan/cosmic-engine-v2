import React, { useMemo } from 'react';
import { Sun, Compass } from 'lucide-react';
import {
  formatTime,
  calculateCulminationBearing,
  calculateSolsticeCulminations,
  calculateMeridianPoint,
  generateMeridianSwathD,
  calculateMeridianRadialTick,
} from '../../../utils/cosmicMath';
import { SolarAlmanacData } from '../../../types';
import { SkyDomeBase } from './SkyDomeBase';

export interface SunMeridianDomeProps {
  solarData?: SolarAlmanacData | null;
  displayTime: number;
  latitude: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
}

export const SunMeridianDome: React.FC<SunMeridianDomeProps> = ({
  solarData,
  displayTime: _displayTime,
  latitude,
  currentDate: _currentDate = new Date(),
  onSetTime,
}) => {
  const {
    solarNoon = 12,
    declination: sunDeclination = 0,
    distanceAU = 1.0,
    distanceKm = 149597870,
    equationOfTime = 0,
  } = solarData || {};

  // --- Culminations & Bearings ---
  const todayCulmination = useMemo(
    () => calculateCulminationBearing(latitude, Number(sunDeclination)),
    [latitude, sunDeclination]
  );

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

  // --- Meridian Coordinate Points ---
  const todayPoint = useMemo(
    () => calculateMeridianPoint(todayCulmination.altitude, todayCulmination.direction),
    [todayCulmination]
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

  return (
    <SkyDomeBase
      title="Sun Meridian Profile"
      icon={Sun}
      iconColorClass="text-amber-400"
      peakLabel="Noon Peak"
      peakElevation={todayCulmination.altitude}
      peakDirectionSuffix={todayCulmination.shortTag}
      meridianDirection={todayCulmination.meridianLabel}
      culminationDirection={todayCulmination.direction}
      sightingBanner={todayCulmination.sightingSummary}
      currentElevation={todayCulmination.altitude}
      elevationColorClass="text-amber-400"
      elevationStatusSubtitle="Noon Meridian Culmination"
      leftHorizonLabel="S"
      centerHorizonLabel="Z"
      rightHorizonLabel="N"
      showZenithAxis={true}
      latitude={latitude}
      bodyX={todayPoint.x}
      bodyY={todayPoint.y}
      bodyVectorStroke="#fbbf24"
      renderBodyGraphic={() => (
        <g id="active-solar-noon-bead">
          <circle
            cx={todayPoint.x}
            cy={todayPoint.y}
            r="7"
            fill="#fbbf24"
            fillOpacity="0.25"
            className="animate-ping"
          />
          <circle
            cx={todayPoint.x}
            cy={todayPoint.y}
            r="5"
            fill={todayCulmination.altitude >= 0 ? '#fbbf24' : '#64748b'}
            fillOpacity={0.95}
            stroke="#ffffff"
            strokeWidth="1.2"
            className="drop-shadow"
          >
            <title>{`Today's Solar Noon Culmination: ${todayCulmination.altitude.toFixed(1)}° ${todayCulmination.shortTag}`}</title>
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
        </g>
      }
    >
      {/* Symmetrical Sun State & Analemma Bar */}
      <div 
        className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/40 flex items-center justify-between gap-3 mt-1"
        title={`Earth-Sun Distance: ${distanceAU.toFixed(3)} AU (${distanceKm.toLocaleString()} km)`}
      >
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-[52px] h-[52px] rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
            <Sun className="w-6 h-6 text-amber-400 drop-shadow-sm" />
          </div>
          <div className="font-mono text-left">
            <div className="text-xs font-semibold text-slate-200">Meridian Axis</div>
            <div className="text-[10px] text-slate-400 font-medium">
              Eq of Time: <span className={equationOfTime >= 0 ? 'text-indigo-300' : 'text-rose-300'}>{equationOfTime >= 0 ? `+${equationOfTime.toFixed(1)}m` : `${equationOfTime.toFixed(1)}m`}</span>
            </div>
          </div>
        </div>

        <div className="font-mono text-right text-[10px] space-y-0.5">
          <div className="text-slate-400">
            Peak Altitude: <strong className="text-amber-300 font-semibold">{todayCulmination.altitude.toFixed(1)}° {todayCulmination.shortTag}</strong>
          </div>
          <div>
            <span className={`font-semibold px-1.5 py-0.5 rounded border text-[9px] ${
              isTropical
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60'
                : 'bg-slate-900/60 text-slate-400 border-slate-800/60'
            }`}>
              {isTropical ? 'Tropical (Lahaina Cross)' : 'Temperate Arc'}
            </span>
          </div>
        </div>
      </div>

      {/* Solstice Noon Limits & Zenith Transit Stats Strip */}
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

      {/* Mirrored Footer Summary Badges: Solstice Range, Solar Noon Snap Button, Declination, Profile Tag */}
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
        <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Declination (δ)</span>
          <span className={`text-[10px] sm:text-xs font-semibold font-mono whitespace-nowrap ${(sunDeclination as number) >= 0 ? 'text-amber-400' : 'text-rose-400'}`}>
            {(sunDeclination as number) >= 0 ? `+${(sunDeclination as number).toFixed(1)}°` : `${(sunDeclination as number).toFixed(1)}°`}
          </span>
        </div>
        <div className="text-center bg-slate-900/40 p-1.5 rounded-lg border border-slate-800/40 flex flex-col justify-center min-w-0">
          <span className="text-[7.5px] sm:text-[8px] text-slate-400 block uppercase font-sans font-medium tracking-tight whitespace-nowrap truncate">Profile Axis</span>
          <span className="text-amber-400 font-semibold text-[10px] sm:text-xs font-mono whitespace-nowrap truncate">
            S ↔ Z ↔ N
          </span>
          <span className="text-[8px] text-slate-500 font-mono block whitespace-nowrap truncate leading-none mt-0.5">
            Meridian
          </span>
        </div>
      </div>
    </SkyDomeBase>
  );
};

export default SunMeridianDome;
