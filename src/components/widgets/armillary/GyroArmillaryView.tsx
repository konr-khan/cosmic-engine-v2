import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  generateArmillaryModel, 
  getJulianDate, 
  calculateEphemerisFrame
} from '../../../utils/cosmicMath';
import { 
  GyroArmillaryViewProps, 
  ArmillaryProjectionMode, 
  ArmillaryCameraState 
} from './types';
import { ArmillaryHeaderControls } from './ArmillaryHeaderControls';
import { ArmillarySvgCanvas } from './ArmillarySvgCanvas';
import { ArmillaryTelemetryHud } from './ArmillaryTelemetryHud';
import { useStagedCamera, computeStagedCamera } from './useStagedCamera';

// Re-export for backward compatibility
export { computeStagedCamera };

export const GyroArmillaryView: React.FC<GyroArmillaryViewProps> = ({
  solarData,
  orbitalData,
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12,
  currentDate = new Date(),
  onSetTime,
  onSetDate,
  hoverTime,
  onHoverTime
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
    setFromProjectionMode,
    setProjectionTransitionT,
    setMorphLambda,
    handleCameraChange,
    handleMorphChange,
    handleSnapToPreset,
    getCanonicalCameraForMode
  } = useStagedCamera();

  const [exaggerateEccentricity, setExaggerateEccentricity] = useState<boolean>(false);
  const [showObserverCone, setShowObserverCone] = useState<boolean>(true);
  const [showRays, setShowRays] = useState<boolean>(false);
  const [showStars, setShowStars] = useState<boolean>(true);
  const [showTympan, setShowTympan] = useState<boolean>(true);
  const [showRule, setShowRule] = useState<boolean>(false);
  const [isFreeReteMode, setIsFreeReteMode] = useState<boolean>(false);
  const [freeReteOffsetDeg, setFreeReteOffsetDeg] = useState<number>(0);
  const [ruleAngleDeg, setRuleAngleDeg] = useState<number>(0);

  const activeTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : timeOfDay;
  const activeDate = currentDate;

  const julianDate = useMemo(() => {
    return getJulianDate(activeDate, activeTime);
  }, [activeDate, activeTime]);

  // Ephemeris derivations for Sun & Moon
  const fallbackFrame = useMemo(() => calculateEphemerisFrame(julianDate, latitude, longitude), [julianDate, latitude, longitude]);

  const sunRaDeg = fallbackFrame.solarPos.rightAscension ?? 0;
  const sunDecDeg = solarData?.declination ?? fallbackFrame.solarPos.declination ?? 0;
  const sunLambdaDeg = fallbackFrame.solarPos.lambda ?? 0;

  const moonRaDeg = orbitalData?.lunarPos?.rightAscension ?? fallbackFrame.lunarPos.rightAscension ?? 0;
  const moonDecDeg = orbitalData?.lunarEvents?.declination ?? fallbackFrame.lunarPos.declination ?? 0;
  const moonLambdaDeg = fallbackFrame.lunarPos.lambda ?? 0;
  const moonPhase = orbitalData?.phase?.value ?? fallbackFrame.lunarPos.phase ?? 0.5;

  const dayOfWeek = activeDate.getUTCDay();
  const sunrise = solarData?.sunrise ?? fallbackFrame.sunrise;
  const sunset = solarData?.sunset ?? fallbackFrame.sunset;

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
      exaggerateEccentricity
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
    exaggerateEccentricity
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
    saved3DCameraRef.current = { pitch: 25, yaw: 35, roll: 0 };
    const targetCam = getCanonicalCameraForMode(projectionMode, morphLambda);
    setCamera(targetCam);
  }, [getCanonicalCameraForMode, morphLambda, projectionMode]);

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Header Controls */}
      <ArmillaryHeaderControls
        projectionMode={projectionMode}
        onSelectMode={(m) => setProjectionMode(m)}
        morphLambda={morphLambda}
        onMorphChange={handleMorphChange}
        showRays={showRays}
        onToggleRays={() => setShowRays(!showRays)}
        showStars={showStars}
        onToggleStars={() => setShowStars(!showStars)}
        showTympan={showTympan}
        onToggleTympan={() => setShowTympan(!showTympan)}
        showRule={showRule}
        onToggleRule={() => setShowRule(!showRule)}
        showObserverCone={showObserverCone}
        onToggleObserverCone={setShowObserverCone}
        onResetCamera={handleResetCamera}
        onSnapToPreset={handleSnapToPreset}
        isFreeReteMode={isFreeReteMode}
        onToggleFreeRete={handleToggleFreeRete}
        onSnapToNow={handleSnapToNow}
        apparentSolarHours={model.apparentSolarHours}
        exaggerateEccentricity={exaggerateEccentricity}
        onToggleEccentricity={setExaggerateEccentricity}
      />

      {/* Main Armillary SVG Canvas */}
      <div className="relative w-full flex-1 bg-slate-950/80 rounded-xl overflow-hidden border border-slate-800/80 p-2 shadow-inner">
        <ArmillarySvgCanvas
          model={model}
          projectionMode={projectionMode}
          morphLambda={morphLambda}
          showRays={showRays}
          showStars={showStars}
          showTympan={showTympan}
          showRule={showRule}
          showObserverCone={showObserverCone}
          camera={camera}
          onCameraChange={handleCameraChange}
          r0={100}
          latitude={latitude}
          longitude={longitude}
          timeOfDay={timeOfDay}
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
