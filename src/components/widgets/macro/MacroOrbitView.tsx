import React, { useState, useMemo } from 'react';
import { calculateEarthOrbitalPhysics, getJulianDate } from '../../../utils/cosmicMath';
import { SolarPositionFull } from '../../../types';
import { MILESTONES } from './milestones';
import { OrbitHeaderControls } from './OrbitHeaderControls';
import { OrbitHoverHud } from './OrbitHoverHud';
import { OrbitSvgCanvas } from './OrbitSvgCanvas';
import { OrbitPhysicsHud } from './OrbitPhysicsHud';
import { MacroOrbitViewProps, MacroOrbitHoverData } from './types';

export const MacroOrbitView: React.FC<MacroOrbitViewProps> = ({ 
  positions, 
  eclipse, 
  solarData: _solarData, 
  currentDate = new Date() 
}) => {
  const [exaggerateEccentricity, setExaggerateEccentricity] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const { earth = { x: 200, y: 0 }, moon = { x: 260, y: 0 } } = positions || {};
  const isEclipse = Boolean(eclipse && eclipse.isEclipseActive);

  // Calculate live Keplerian orbital physics
  const julianDate = getJulianDate(currentDate, 12);
  const physics: SolarPositionFull = calculateEarthOrbitalPhysics(julianDate);

  const {
    distanceAU = 1.00,
    distanceKm = 149597870,
    orbitalSpeedKms = 29.78,
    solarIrradiancePercent = 100.0,
    sunAngularDiameterArcmin = 32.0
  } = physics;

  // Compute visual Earth coordinates if exaggerated eccentricity (e = 0.25) is turned on
  const orbitalRadius = 200;
  let renderEarthX = earth.x;
  let renderEarthY = earth.y;
  let renderSunX = 0;
  let renderSunY = 0;
  let focus2X = 0;

  if (exaggerateEccentricity) {
    const e = 0.25;
    const a = orbitalRadius;
    const b = a * Math.sqrt(1 - e * e);
    const c = a * e; // Focal distance = 50px
    renderSunX = -c; // Sun at Focus F1 (-50, 0)
    focus2X = c;     // Empty Focus F2 (+50, 0)

    // Convert Earth angle relative to orbital center
    const angleRad = Math.atan2(earth.y, earth.x);
    renderEarthX = a * Math.cos(angleRad);
    renderEarthY = b * Math.sin(angleRad);
  }

  // Calculate Moon position relative to Earth
  const moonDx = moon.x - earth.x;
  const moonDy = moon.y - earth.y;
  const renderMoonX = renderEarthX + moonDx;
  const renderMoonY = renderEarthY + moonDy;

  const bRatio = exaggerateEccentricity ? Math.sqrt(1 - 0.25 * 0.25) : 1;

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
        description: `Live Keplerian orbital position. Distance: ${distanceAU} AU (${(distanceKm / 1e6).toFixed(1)}M km), Speed: ${orbitalSpeedKms} km/s, Irradiance: ${solarIrradiancePercent}% of mean.`
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
          renderSunX={renderSunX}
          renderSunY={renderSunY}
          renderEarthX={renderEarthX}
          renderEarthY={renderEarthY}
          renderMoonX={renderMoonX}
          renderMoonY={renderMoonY}
          orbitalRadius={orbitalRadius}
          bRatio={bRatio}
          focus2X={focus2X}
          exaggerateEccentricity={exaggerateEccentricity}
          hoveredId={hoveredId}
          onHover={setHoveredId}
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
