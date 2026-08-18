import React, { useState } from 'react';
import { Globe, Sun, Sparkles } from 'lucide-react';
import { SolarAlmanacData, OrbitalData } from '../../../types';
import { GeocentricSphereView } from './GeocentricSphereView';
import { HeliocentricOrbitView } from './HeliocentricOrbitView';

export interface CelestialSphereViewProps {
  latitude?: number;
  longitude?: number;
  solarData?: SolarAlmanacData | null;
  orbitalData?: OrbitalData | null;
  timeOfDay?: number;
}

export const CelestialSphereView: React.FC<CelestialSphereViewProps> = ({ 
  latitude = 47.06, 
  longitude = -122.81, 
  solarData, 
  orbitalData, 
  timeOfDay = 12 
}) => {
  const [viewMode, setViewMode] = useState<'geocentric' | 'heliocentric'>('geocentric');
  const [isExaggeratedScale, setIsExaggeratedScale] = useState(false);

  const moonDeg = orbitalData && orbitalData.angles ? (orbitalData.angles.moonDegrees as number) : 0;
  const lunarBetaDeg = orbitalData?.lunarPos?.beta ?? 0;
  const sunLambdaDeg = ((solarData?.lambda ?? solarData?.eclipticLongitude ?? ((12 - timeOfDay) * 15 + (solarData?.declination ?? 0))) as number);
  const lunarLambdaDeg = orbitalData?.lunarPos?.lambda ?? orbitalData?.angles?.moonDegrees ?? moonDeg;

  // Eclipse Proximity Alert: moon is within 1.5° of ecliptic and within 18° of syzygy
  const elongationDeg = Math.abs((lunarLambdaDeg - sunLambdaDeg + 360) % 360);
  const distToSyzygy = Math.min(
    Math.min(elongationDeg, 360 - elongationDeg), // New Moon
    Math.abs(elongationDeg - 180)                 // Full Moon
  );
  const isNearEclipseNode = Math.abs(lunarBetaDeg) < 1.5 && distToSyzygy < 18;

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      
      {/* Top Inline Controls & Mode Switcher */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <p className="text-xs text-slate-400">
          Spatial geometry of Earth's axial tilt ({isExaggeratedScale && viewMode === 'geocentric' ? '45°' : '23.44°'}) &amp; Lunar inclination ({isExaggeratedScale && viewMode === 'geocentric' ? '15°' : '5.14°'})
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Scale Toggle (True vs Exaggerated) */}
          {viewMode === 'geocentric' && (
            <button
              onClick={() => setIsExaggeratedScale(!isExaggeratedScale)}
              className={`px-2.5 py-1 rounded-xl font-bold font-mono text-xs transition-all border cursor-pointer ${
                isExaggeratedScale
                  ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                  : 'bg-slate-950/80 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
              }`}
              title="Toggle between true physical orbital tilt and exaggerated angle visualization"
            >
              {isExaggeratedScale ? 'Scale: Exaggerated (45° / 15°)' : 'Scale: True (23.4° / 5.1°)'}
            </button>
          )}

          {/* View Mode Selector Tabs */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-mono">
            <button
              onClick={() => setViewMode('geocentric')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'geocentric'
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Geocentric (Sky Vault)
            </button>
            <button
              onClick={() => setViewMode('heliocentric')}
              className={`px-3 py-1 rounded-lg font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'heliocentric'
                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" /> Heliocentric (Space)
            </button>
          </div>
        </div>
      </div>

      {/* Main 3D Canvas */}
      <div className="relative w-full flex-1 min-h-[300px] bg-slate-950 rounded-xl overflow-hidden border border-slate-800/80 flex items-center justify-center">
        
        {/* Legend Badge */}
        <div className="absolute top-3 left-3 bg-slate-950/90 backdrop-blur-sm px-3 py-2 rounded-xl border border-slate-800/80 text-[10px] font-mono space-y-1.5 z-10 shadow-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-indigo-400 inline-block" /> Celestial Equator (0°)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-amber-400 inline-block" /> {isExaggeratedScale && viewMode === 'geocentric' ? 'Ecliptic Plane (45° Exagg)' : 'Ecliptic Plane (23.44°)'}
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-emerald-400 inline-block" /> {isExaggeratedScale && viewMode === 'geocentric' ? 'Moon Orbit (15° Tilt Exagg)' : 'Moon Orbit (5.14° Tilt)'}
          </div>
          <div className="flex items-center gap-2 text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Observer Zenith Ray
          </div>
        </div>

        {/* Eclipse Proximity Alert */}
        {viewMode === 'geocentric' && isNearEclipseNode && (
          <div className="absolute top-3 right-3 bg-amber-950/90 border border-amber-600/70 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center gap-1.5 z-10 backdrop-blur-sm shadow-md">
            <Sparkles className="w-4 h-4 text-amber-400" /> Near Eclipse Node Zone (Alignment!)
          </div>
        )}

        <svg viewBox="0 0 400 320" className="w-full h-full block" preserveAspectRatio="xMidYMid meet">
          {viewMode === 'geocentric' ? (
            <GeocentricSphereView
              latitude={latitude}
              longitude={longitude}
              timeOfDay={timeOfDay}
              solarData={solarData}
              orbitalData={orbitalData}
              isExaggeratedScale={isExaggeratedScale}
            />
          ) : (
            <HeliocentricOrbitView
              solarData={solarData}
              moonDegrees={moonDeg}
            />
          )}
        </svg>
      </div>

      {/* Footer Spatial Context Readout */}
      <div className="mt-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs font-mono text-slate-400">
        <span>Observer Zenith: <strong className="text-cyan-400">{Math.abs(latitude).toFixed(1)}°{latitude >= 0 ? 'N' : 'S'}, {Math.abs(longitude).toFixed(1)}°{longitude >= 0 ? 'E' : 'W'}</strong></span>
        <span>Axial Tilt: <strong className="text-amber-400">{isExaggeratedScale && viewMode === 'geocentric' ? '45.0° (Exagg)' : '23.44°'}</strong></span>
        <span>Lunar Tilt: <strong className="text-emerald-400">{isExaggeratedScale && viewMode === 'geocentric' ? '15.0° (Exagg)' : '5.14°'}</strong></span>
      </div>
    </div>
  );
};

export default CelestialSphereView;
