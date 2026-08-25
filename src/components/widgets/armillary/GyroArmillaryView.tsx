import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  generateArmillaryModel, 
  getJulianDate, 
  calculateSolarPosition, 
  calculateLunarPosition 
} from '../../../utils/cosmicMath';
import { 
  GyroArmillaryViewProps, 
  ArmillaryProjectionMode, 
  ArmillaryCameraState 
} from './types';
import { ArmillaryHeaderControls } from './ArmillaryHeaderControls';
import { ArmillarySvgCanvas } from './ArmillarySvgCanvas';
import { ArmillaryTelemetryHud } from './ArmillaryTelemetryHud';

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
  const [projectionMode, setProjectionMode] = useState<ArmillaryProjectionMode>('geocentric');
  const [fromProjectionMode, setFromProjectionMode] = useState<ArmillaryProjectionMode>('geocentric');
  const [projectionTransitionT, setProjectionTransitionT] = useState<number>(1.0);
  const [morphLambda, setMorphLambda] = useState<number>(0.0);
  const [exaggerateEccentricity, setExaggerateEccentricity] = useState<boolean>(false);
  const [showRays, setShowRays] = useState<boolean>(false);
  const [showStars, setShowStars] = useState<boolean>(true);
  const [showTympan, setShowTympan] = useState<boolean>(true);
  const [showRule, setShowRule] = useState<boolean>(false);
  const [isFreeReteMode, setIsFreeReteMode] = useState<boolean>(false);
  const [freeReteOffsetDeg, setFreeReteOffsetDeg] = useState<number>(0);
  const [ruleAngleDeg, setRuleAngleDeg] = useState<number>(0);
  const [camera, setCamera] = useState<ArmillaryCameraState>({
    pitch: 25,
    yaw: 35,
    roll: 0
  });

  const saved3DCameraRef = useRef<ArmillaryCameraState>({
    pitch: 25,
    yaw: 35,
    roll: 0
  });

  const getCanonicalCameraForMode = useCallback((mode: ArmillaryProjectionMode, lambda: number): ArmillaryCameraState => {
    const is3D = mode === 'heliocentric' || mode === 'geocentric' || lambda <= 0.05;
    if (is3D) {
      return saved3DCameraRef.current;
    }
    if (mode === 'rojas') {
      return { pitch: 0, yaw: 0, roll: 0 };
    }
    // stereographic and horizon
    return { pitch: 90, yaw: 0, roll: 0 };
  }, []);

  const activeTime = hoverTime !== null && hoverTime !== undefined ? hoverTime : timeOfDay;
  const activeDate = currentDate;

  const julianDate = useMemo(() => {
    return getJulianDate(activeDate, activeTime);
  }, [activeDate, activeTime]);

  // Ephemeris derivations for Sun & Moon
  const fallbackSolar = useMemo(() => calculateSolarPosition(julianDate), [julianDate]);
  const fallbackLunar = useMemo(() => calculateLunarPosition(julianDate), [julianDate]);

  const sunRaDeg = fallbackSolar.rightAscension ?? 0;
  const sunDecDeg = solarData?.declination ?? fallbackSolar.declination ?? 0;
  const sunLambdaDeg = fallbackSolar.lambda ?? 0;

  const moonRaDeg = orbitalData?.lunarPos?.rightAscension ?? fallbackLunar.rightAscension ?? 0;
  const moonDecDeg = orbitalData?.lunarEvents?.declination ?? fallbackLunar.declination ?? 0;
  const moonLambdaDeg = fallbackLunar.lambda ?? 0;
  const moonPhase = orbitalData?.phase?.value ?? fallbackLunar.phase ?? 0.5;

  const dayOfWeek = activeDate.getUTCDay();
  const sunrise = solarData?.sunrise ?? 6;
  const sunset = solarData?.sunset ?? 18;

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

  // --- Smooth Animated Morph Transition (Supports Universal Any-to-Any Morphing with Staged Camera Alignment) ---
  const animRef = useRef<number | null>(null);
  const snapRuleAnimRef = useRef<number | null>(null);

  const handleSnapToPreset = useCallback((targetMode: ArmillaryProjectionMode, targetLambda: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const isModeSwitch = targetMode !== projectionMode;

    if (isModeSwitch) {
      setFromProjectionMode(projectionMode);
      setProjectionMode(targetMode);
      setProjectionTransitionT(0.0);
    } else {
      setProjectionMode(targetMode);
      setFromProjectionMode(targetMode);
      setProjectionTransitionT(1.0);
    }

    const startLambda = morphLambda;
    const startT = isModeSwitch ? 0.0 : 1.0;

    // Staged SO(3) Camera Alignment
    const startCam = { ...camera };
    const targetCam = getCanonicalCameraForMode(targetMode, targetLambda);
    const deltaPitch = targetCam.pitch - startCam.pitch;
    const deltaYaw = (targetCam.yaw - startCam.yaw + 540) % 360 - 180;

    const startTime = performance.now();
    const duration = 650; // ms ease-out cubic spring curve

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic curve for natural deceleration
      const ease = 1 - Math.pow(1 - progress, 3);

      const nextLambda = startLambda + (targetLambda - startLambda) * ease;
      setMorphLambda(parseFloat(nextLambda.toFixed(3)));

      if (isModeSwitch) {
        const nextT = startT + (1.0 - startT) * ease;
        setProjectionTransitionT(parseFloat(nextT.toFixed(3)));
      }

      // Smoothly swing camera into projection pole alignment
      const nextPitch = startCam.pitch + deltaPitch * ease;
      const nextYaw = (startCam.yaw + deltaYaw * ease + 360) % 360;
      setCamera({
        pitch: parseFloat(nextPitch.toFixed(1)),
        yaw: parseFloat(nextYaw.toFixed(1)),
        roll: 0
      });

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setMorphLambda(targetLambda);
        setProjectionTransitionT(1.0);
        setFromProjectionMode(targetMode);
        setCamera(targetCam);
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(step);
  }, [camera, getCanonicalCameraForMode, morphLambda, projectionMode]);

  const handleMorphChange = useCallback((newLambda: number) => {
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setMorphLambda(newLambda);
    const is3DTarget = projectionMode === 'heliocentric' || projectionMode === 'geocentric';
    if (!is3DTarget) {
      const startCam = saved3DCameraRef.current;
      const targetCam = projectionMode === 'rojas' 
        ? { pitch: 0, yaw: 0, roll: 0 } 
        : { pitch: 90, yaw: 0, roll: 0 };
      const deltaPitch = targetCam.pitch - startCam.pitch;
      const deltaYaw = (targetCam.yaw - startCam.yaw + 540) % 360 - 180;
      const p = Math.max(0, Math.min(1, newLambda));
      setCamera({
        pitch: parseFloat((startCam.pitch + deltaPitch * p).toFixed(1)),
        yaw: parseFloat(((startCam.yaw + deltaYaw * p + 360) % 360).toFixed(1)),
        roll: 0
      });
    }
  }, [projectionMode]);

  const handleCameraChange = useCallback((newCam: ArmillaryCameraState) => {
    setCamera(newCam);
    const is3D = projectionMode === 'geocentric' || projectionMode === 'heliocentric' || morphLambda <= 0.05;
    if (is3D) {
      saved3DCameraRef.current = newCam;
    }
  }, [projectionMode, morphLambda]);

  // --- Snap Alidade Rule to Celestial Target ---
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
      if (animRef.current) cancelAnimationFrame(animRef.current);
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
          camera={camera}
          onCameraChange={handleCameraChange}
          r0={100}
          latitude={latitude}
          longitude={longitude}
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
