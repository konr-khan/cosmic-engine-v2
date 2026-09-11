import React, { useState, useMemo } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { MILESTONES } from './milestones';
import { OrbitHeaderControls } from './OrbitHeaderControls';
import { OrbitHoverHud } from './OrbitHoverHud';
import { OrbitSvgCanvas } from './OrbitSvgCanvas';
import { OrbitPhysicsHud } from './OrbitPhysicsHud';
import { MacroOrbitViewProps, MacroOrbitHoverData } from './types';
import { useHeliocentricScene } from '../../../hooks/useCosmicScene';
import { useChronometerStore } from '../../../store/cosmicStore';

const selectMacroObserverParams = (s: { latitude: number; longitude: number; timeOfDay: number }) => ({
  latitude: s.latitude,
  longitude: s.longitude,
  timeOfDay: s.timeOfDay
});

export const MacroOrbitView: React.FC<MacroOrbitViewProps> = ({ 
  eclipse, 
  currentDate = new Date() 
}) => {
  const [exaggerateEccentricity, setExaggerateEccentricity] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(1.0);

  const handleWheelZoom = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((z) => Math.min(3.5, Math.max(0.5, parseFloat((z * factor).toFixed(2)))));
  };

  // Synchronize observer geographic coordinates and time from store
  const storeState = useChronometerStore(selectMacroObserverParams);

  // Consume unified 3D heliocentric scene graph
  const helioScene = useHeliocentricScene(
    exaggerateEccentricity ? 'exaggerated' : 'true',
    {
      date: currentDate,
      orbitalRadius: 200,
      latitude: storeState.latitude,
      longitude: storeState.longitude,
      timeOfDay: storeState.timeOfDay
    }
  );

  const {
    sun,
    earth,
    moon,
    focus2X,
    focus2Y,
    bRatio,
    orbitalRadius,
    sunLambdaDeg,
    milestones
  } = helioScene;

  const isEclipse = helioScene.isEclipse ?? Boolean(eclipse && eclipse.isEclipseActive);

  const {
    distanceAU = 1.00,
    distanceKm = 149597870,
    orbitalSpeedKms = 29.78,
    solarIrradiancePercent = 100.0,
    sunAngularDiameterArcmin = 32.0
  } = earth.physics;

  // Lookup active hovered node details smoothly without recreating state
  const activeHoverData: MacroOrbitHoverData | null = useMemo(() => {
    if (!hoveredId) return null;
    if (hoveredId === 'earth') {
      return {
        label: 'Current Earth Position',
        date: currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        distanceAU,
        distanceKm,
        speedKms: orbitalSpeedKms,
        description: `Live Keplerian orbital position. Distance: ${distanceAU.toFixed(3)} AU (${(distanceKm / 1e6).toFixed(1)}M km), Speed: ${orbitalSpeedKms.toFixed(2)} km/s, Irradiance: ${solarIrradiancePercent.toFixed(1)}% of mean.`
      };
    }
    const found = MILESTONES.find(m => m.id === hoveredId);
    if (!found) return null;
    return {
      label: found.label,
      date: found.date,
      distanceAU: found.distanceAU,
      distanceKm: found.distanceKm,
      speedKms: found.speedKms,
      description: found.description
    };
  }, [hoveredId, currentDate, distanceAU, distanceKm, orbitalSpeedKms, solarIrradiancePercent]);

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      <OrbitHeaderControls
        exaggerateEccentricity={exaggerateEccentricity}
        onToggleEccentricity={setExaggerateEccentricity}
        isEclipse={isEclipse}
      />

      {/* Main SVG Heliocentric Orbit Viewport */}
      <div className="relative w-full flex-1 min-h-[300px] flex items-center justify-center bg-slate-950 rounded-xl border border-slate-800/80 p-4 overflow-hidden">
        <OrbitHoverHud hoverData={activeHoverData} />
        
        <OrbitSvgCanvas
          renderSunX={sun.x}
          renderSunY={sun.y}
          renderEarthX={earth.x}
          renderEarthY={earth.y}
          renderMoonX={moon.x}
          renderMoonY={moon.y}
          orbitalRadius={orbitalRadius}
          bRatio={bRatio}
          focus2X={focus2X}
          focus2Y={focus2Y}
          exaggerateEccentricity={exaggerateEccentricity}
          hoveredId={hoveredId}
          onHover={setHoveredId}
          milestones={milestones}
          sunLambdaDeg={sunLambdaDeg}
          latitude={storeState.latitude}
          longitude={storeState.longitude}
          timeOfDay={storeState.timeOfDay}
          lunarOrbitPath={helioScene.lunarOrbitPath}
          zoom={zoom}
          onWheelZoom={handleWheelZoom}
        />

        {/* Orbit View Zoom Controls */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-slate-950/85 backdrop-blur-md border border-slate-800/90 rounded-lg p-1 shadow-xl font-mono text-[10px] select-none pointer-events-auto transition-opacity duration-200">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setZoom((z) => Math.max(0.5, parseFloat((z - 0.25).toFixed(2))));
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom Out (Orbit View)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 text-sky-400 font-semibold min-w-[34px] text-center">
            {zoom.toFixed(1)}×
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setZoom((z) => Math.min(3.5, parseFloat((z + 0.25).toFixed(2))));
            }}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Zoom In (Orbit View)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          {zoom !== 1.0 && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setZoom(1.0);
              }}
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer ml-0.5 border-l border-slate-800/80 pl-1.5"
              title="Reset Zoom (1.0×)"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <OrbitPhysicsHud
        distanceAU={distanceAU}
        distanceKm={distanceKm}
        orbitalSpeedKms={orbitalSpeedKms}
        solarIrradiancePercent={solarIrradiancePercent}
        sunAngularDiameterArcmin={sunAngularDiameterArcmin}
      />
    </div>
  );
};

export default MacroOrbitView;
