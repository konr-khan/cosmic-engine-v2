import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  generateArmillaryModel, 
  getJulianDate, 
  calculateEphemerisFrame,
  calculateMeanLunarNodeLongitude,
  DEFAULT_OBSERVER_LATITUDE,
  DEFAULT_OBSERVER_LONGITUDE,
  J2000_DATE
} from '../../../utils/cosmicMath';
import { GyroArmillaryViewProps, ArmillaryCameraState, ArmillaryProjectionMode } from './types';
import { ArmillaryHeaderControls } from './ArmillaryHeaderControls';
import { ArmillarySvgCanvas } from './ArmillarySvgCanvas';
import { ArmillaryTelemetryHud } from './ArmillaryTelemetryHud';
import { useStagedCamera, computeStagedCamera } from './useStagedCamera';

// Re-export for backward compatibility
export { computeStagedCamera };

export const GyroArmillaryView: React.FC<GyroArmillaryViewProps> = ({
  solarData,
  orbitalData,
  latitude = DEFAULT_OBSERVER_LATITUDE,
  longitude = DEFAULT_OBSERVER_LONGITUDE,
  timeOfDay = 12,
  currentDate = J2000_DATE,
  hoverTime,
  onHoverTime: _onHoverTime
}) => {
  const {
    camera,
    saved3DCameraRef,
    projectionMode,
    fromProjectionMode,
    projectionTransitionT,
    morphLambda,
    setCamera,
    setProjectionMode,
    handleCameraChange,
    handleMorphChange,
    handleSnapToPreset,
    handleSnapToNodal,
    handleResetFromNodal,
    getCanonicalCameraForMode
  } = useStagedCamera();

  const [isNodalActive, setIsNodalActive] = useState<boolean>(false);

  const [exaggerateEccentricity, setExaggerateEccentricity] = useState<boolean>(false);
  const [showVolumetric, setShowVolumetric] = useState<boolean>(true);
  const [showStars, setShowStars] = useState<boolean>(true);
  const [showTympan, setShowTympan] = useState<boolean>(true);
  const [showRule, setShowRule] = useState<boolean>(false);
  const [showLunarNodes, setShowLunarNodes] = useState<boolean>(true);
  const [isFreeReteMode, setIsFreeReteMode] = useState<boolean>(false);
  const [freeReteOffsetDeg, setFreeReteOffsetDeg] = useState<number>(0);
  const [ruleAngleDeg, setRuleAngleDeg] = useState<number>(0);

  const onCameraChange = useCallback(
    (newCam: ArmillaryCameraState) => {
      setIsNodalActive(false);
      handleCameraChange(newCam);
    },
    [handleCameraChange]
  );

  const onMorphChange = useCallback(
    (newLambda: number) => {
      setIsNodalActive(false);
      handleMorphChange(newLambda);
    },
    [handleMorphChange]
  );

  const onSnapToPreset = useCallback(
    (targetMode: ArmillaryProjectionMode, targetLambda: number) => {
      setIsNodalActive(false);
      handleSnapToPreset(targetMode, targetLambda);
    },
    [handleSnapToPreset]
  );

  const onSelectMode = useCallback(
    (m: ArmillaryProjectionMode) => {
      setIsNodalActive(false);
      setProjectionMode(m);
    },
    [setProjectionMode]
  );

  const handleToggleVolumetric = useCallback(() => {
    setShowVolumetric((prev) => !prev);
  }, []);

  const isHoverOverride = hoverTime !== null && hoverTime !== undefined;
  const activeTime = isHoverOverride ? hoverTime : timeOfDay;
  const activeDate = currentDate;

  const julianDate = useMemo(() => {
    return getJulianDate(activeDate, activeTime);
  }, [activeDate, activeTime]);

  // Ephemeris derivations for Sun & Moon (skip full frame recomputation when props supply all required ephemerides)
  const hasPrecomputedEphemeris =
    !isHoverOverride &&
    solarData?.rightAscension !== undefined &&
    solarData?.declination !== undefined &&
    solarData?.lambda !== undefined &&
    solarData?.sunrise !== undefined &&
    solarData?.sunset !== undefined &&
    orbitalData?.lunarPos?.rightAscension !== undefined &&
    orbitalData?.lunarPos?.declination !== undefined &&
    orbitalData?.lunarPos?.lambda !== undefined &&
    orbitalData?.lunarPos?.nodeLongitude !== undefined &&
    orbitalData?.phase?.value !== undefined;

  const fallbackFrame = useMemo(
    () => (hasPrecomputedEphemeris ? null : calculateEphemerisFrame(julianDate, latitude, longitude)),
    [hasPrecomputedEphemeris, julianDate, latitude, longitude]
  );

  const sunRaDeg = !isHoverOverride && solarData?.rightAscension !== undefined
    ? Number(solarData.rightAscension)
    : (fallbackFrame?.solarPos.rightAscension ?? 0);
  const sunDecDeg = !isHoverOverride && solarData?.declination !== undefined
    ? Number(solarData.declination)
    : (fallbackFrame?.solarPos.declination ?? 0);
  const sunLambdaDeg = !isHoverOverride && solarData?.lambda !== undefined
    ? Number(solarData.lambda)
    : (fallbackFrame?.solarPos.lambda ?? 0);

  const moonRaDeg = !isHoverOverride && orbitalData?.lunarPos?.rightAscension !== undefined
    ? orbitalData.lunarPos.rightAscension
    : (fallbackFrame?.lunarPos.rightAscension ?? 0);
  const moonDecDeg = !isHoverOverride && orbitalData?.lunarEvents?.declination !== undefined
    ? orbitalData.lunarEvents.declination
    : (!isHoverOverride && orbitalData?.lunarPos?.declination !== undefined
        ? orbitalData.lunarPos.declination
        : (fallbackFrame?.lunarPos.declination ?? 0));
  const moonLambdaDeg = !isHoverOverride && orbitalData?.lunarPos?.lambda !== undefined
    ? orbitalData.lunarPos.lambda
    : (fallbackFrame?.lunarPos.lambda ?? 0);
  const moonPhase = !isHoverOverride && orbitalData?.phase?.value !== undefined
    ? orbitalData.phase.value
    : (fallbackFrame?.lunarPos.phase ?? 0.5);
  const moonNodeLonDeg = !isHoverOverride && orbitalData?.lunarPos?.nodeLongitude !== undefined
    ? Number(orbitalData.lunarPos.nodeLongitude)
    : (fallbackFrame ? Number(fallbackFrame.lunarPos.nodeLongitude) : undefined);

  const precomputedOrbitalPhysics = useMemo(() => {
    if (
      isHoverOverride ||
      solarData?.distanceAU === undefined ||
      solarData?.distanceKm === undefined ||
      solarData?.orbitalSpeedKms === undefined ||
      solarData?.solarIrradiancePercent === undefined ||
      solarData?.sunAngularDiameterArcmin === undefined
    ) {
      return undefined;
    }
    return {
      distanceAU: solarData.distanceAU,
      distanceKm: solarData.distanceKm,
      orbitalSpeedKms: solarData.orbitalSpeedKms,
      solarIrradiancePercent: solarData.solarIrradiancePercent,
      sunAngularDiameterArcmin: solarData.sunAngularDiameterArcmin,
    };
  }, [
    isHoverOverride,
    solarData?.distanceAU,
    solarData?.distanceKm,
    solarData?.orbitalSpeedKms,
    solarData?.solarIrradiancePercent,
    solarData?.sunAngularDiameterArcmin,
  ]);

  const handleToggleNodal = useCallback(() => {
    if (isNodalActive) {
      setIsNodalActive(false);
      handleResetFromNodal();
    } else {
      setIsNodalActive(true);
      const nodeLon = Number(moonNodeLonDeg ?? calculateMeanLunarNodeLongitude(julianDate));
      handleSnapToNodal(nodeLon);
    }
  }, [isNodalActive, moonNodeLonDeg, julianDate, handleSnapToNodal, handleResetFromNodal]);

  const dayOfWeek = activeDate.getUTCDay();
  const sunrise = !isHoverOverride && solarData?.sunrise !== undefined
    ? solarData.sunrise
    : (fallbackFrame?.sunrise ?? 6);
  const sunset = !isHoverOverride && solarData?.sunset !== undefined
    ? solarData.sunset
    : (fallbackFrame?.sunset ?? 18);

  // Generate 60 FPS Gyro-Morph Model
  const model = useMemo(() => {
    return generateArmillaryModel({
      julianDate,
      latitude,
      longitude,
      timeOfDay: activeTime,
      sunRaDeg,
      sunDecDeg,
      sunLambdaDeg,
      moonRaDeg,
      moonDecDeg,
      moonLambdaDeg,
      moonPhase,
      moonNodeLonDeg,
      morphLambda,
      projectionMode,
      fromProjectionMode,
      projectionTransitionT,
      cameraPitch: camera.pitch,
      cameraYaw: camera.yaw,
      r0: 100,
      dayOfWeek,
      sunrise,
      sunset,
      isFreeReteMode,
      freeReteOffsetDeg,
      exaggerateEccentricity,
      orbitalPhysics: precomputedOrbitalPhysics
    });
  }, [
    julianDate,
    latitude,
    longitude,
    activeTime,
    sunRaDeg,
    sunDecDeg,
    sunLambdaDeg,
    moonRaDeg,
    moonDecDeg,
    moonLambdaDeg,
    moonPhase,
    moonNodeLonDeg,
    morphLambda,
    projectionMode,
    fromProjectionMode,
    projectionTransitionT,
    camera.pitch,
    camera.yaw,
    dayOfWeek,
    sunrise,
    sunset,
    isFreeReteMode,
    freeReteOffsetDeg,
    exaggerateEccentricity,
    precomputedOrbitalPhysics
  ]);

  // --- Snap Alidade Rule to Celestial Target ---
  const snapRuleAnimRef = useRef<number | null>(null);

  const handleSnapToTarget = useCallback((_targetName: string, targetAngleDeg: number) => {
    setShowRule(true);
    if (snapRuleAnimRef.current) cancelAnimationFrame(snapRuleAnimRef.current);

    const startAngle = ruleAngleDeg;
    // Compute shortest angular delta (-180 to +180)
    let delta = (targetAngleDeg - startAngle + 540) % 360 - 180;
    const startTime = performance.now();
    const duration = 400; // ms

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = (startAngle + delta * ease + 360) % 360;
      setRuleAngleDeg(parseFloat(current.toFixed(1)));

      if (progress < 1) {
        snapRuleAnimRef.current = requestAnimationFrame(step);
      } else {
        setRuleAngleDeg(targetAngleDeg);
        snapRuleAnimRef.current = null;
      }
    };

    snapRuleAnimRef.current = requestAnimationFrame(step);
  }, [ruleAngleDeg]);

  const handleToggleFreeRete = useCallback(() => {
    setIsFreeReteMode((prev) => !prev);
  }, []);

  const handleSnapToNow = useCallback(() => {
    setFreeReteOffsetDeg(0);
    setIsFreeReteMode(false);
  }, []);

  const handleFreeReteRotate = useCallback((deltaDeg: number) => {
    setFreeReteOffsetDeg((prev) => (prev + deltaDeg) % 360);
  }, []);

  useEffect(() => {
    return () => {
      if (snapRuleAnimRef.current) cancelAnimationFrame(snapRuleAnimRef.current);
    };
  }, []);

  const handleResetCamera = useCallback(() => {
    setIsNodalActive(false);
    saved3DCameraRef.current = { pitch: 25, yaw: 35, roll: 0 };
    const targetCam = getCanonicalCameraForMode(projectionMode, morphLambda);
    setCamera(targetCam);
  }, [getCanonicalCameraForMode, morphLambda, projectionMode, setCamera]);

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Header Controls */}
      <ArmillaryHeaderControls
        projectionMode={projectionMode}
        onSelectMode={onSelectMode}
        morphLambda={morphLambda}
        onMorphChange={onMorphChange}
        showRays={showVolumetric}
        onToggleRays={handleToggleVolumetric}
        showStars={showStars}
        onToggleStars={() => setShowStars(!showStars)}
        showTympan={showTympan}
        onToggleTympan={() => setShowTympan(!showTympan)}
        showRule={showRule}
        onToggleRule={() => setShowRule(!showRule)}
        showLunarNodes={showLunarNodes}
        onToggleLunarNodes={() => setShowLunarNodes((prev) => !prev)}
        showObserverCone={showVolumetric}
        onResetCamera={handleResetCamera}
        onSnapToPreset={onSnapToPreset}
        isFreeReteMode={isFreeReteMode}
        onToggleFreeRete={handleToggleFreeRete}
        onSnapToNow={handleSnapToNow}
        apparentSolarHours={model.apparentSolarHours}
        exaggerateEccentricity={exaggerateEccentricity}
        onToggleEccentricity={setExaggerateEccentricity}
        isNodalActive={isNodalActive}
        onToggleNodal={handleToggleNodal}
      />

      {/* Main Armillary SVG Canvas */}
      <div className="relative w-full flex-1 bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800/80 p-2 shadow-inner">
        <ArmillarySvgCanvas
          model={model}
          projectionMode={projectionMode}
          morphLambda={morphLambda}
          showRays={showVolumetric}
          showStars={showStars}
          showTympan={showTympan}
          showRule={showRule}
          showLunarNodes={showLunarNodes}
          showObserverCone={showVolumetric}
          camera={camera}
          onCameraChange={onCameraChange}
          r0={100}
          latitude={latitude}
          longitude={longitude}
          timeOfDay={activeTime}
          isFreeReteMode={isFreeReteMode}
          onFreeReteRotate={handleFreeReteRotate}
          ruleAngleDeg={ruleAngleDeg}
          onRuleAngleChange={setRuleAngleDeg}
          onSnapToTarget={handleSnapToTarget}
        />
      </div>

      {/* Bottom 4-Column Glassmorphic Telemetry Footer */}
      <ArmillaryTelemetryHud
        model={model}
        projectionMode={projectionMode}
        morphLambda={morphLambda}
        latitude={latitude}
        longitude={longitude}
        cameraPitch={camera.pitch}
        cameraYaw={camera.yaw}
      />
    </div>
  );
};

export default GyroArmillaryView;
