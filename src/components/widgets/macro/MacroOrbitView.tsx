import React, { useState, useMemo } from 'react';
import { MILESTONES } from './milestones';
import { OrbitHeaderControls } from './OrbitHeaderControls';
import { OrbitHoverHud } from './OrbitHoverHud';
import { OrbitSvgCanvas } from './OrbitSvgCanvas';
import { OrbitPhysicsHud } from './OrbitPhysicsHud';
import { MacroOrbitViewProps, MacroOrbitHoverData } from './types';
import { useHeliocentricScene } from '../../../hooks/useCosmicScene';
import { useChronometerStore } from '../../../store/cosmicStore';

export const MacroOrbitView: React.FC<MacroOrbitViewProps> = ({ 
  eclipse, 
  currentDate = new Date() 
}) => {
  const [exaggerateEccentricity, setExaggerateEccentricity] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Synchronize observer geographic coordinates and time from store
  const storeState = useChronometerStore(s => ({
    latitude: s.latitude,
    longitude: s.longitude,
    timeOfDay: s.timeOfDay
  }));

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

  const isEclipse = Boolean(eclipse && eclipse.isEclipseActive);

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
        />
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
