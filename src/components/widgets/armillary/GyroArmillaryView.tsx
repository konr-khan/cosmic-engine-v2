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
  const [projectionMode, setProjectionMode] = useState<ArmillaryProjectionMode>('stereographic');
  const [fromProjectionMode, setFromProjectionMode] = useState<ArmillaryProjectionMode>('stereographic');
  const [projectionTransitionT, setProjectionTransitionT] = useState<number>(1.0);
  const [morphLambda, setMorphLambda] = useState<number>(0.0);
  const [showRays, setShowRays] = useState<boolean>(false);
  const [showStars, setShowStars] = useState<boolean>(true);
  const [showTympan, setShowTympan] = useState<boolean>(true);
  const [showRule, setShowRule] = useState<boolean>(false);
  const [camera, setCamera] = useState<ArmillaryCameraState>({
    pitch: 25,
    yaw: 35,
    roll: 0
  });

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
      sunset
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
    sunset
  ]);

  // --- Smooth Animated Morph Transition (Supports 3D <-> 2D and 2D <-> 2D Cross-Morph) ---
  const animRef = useRef<number | null>(null);

  const handleSnapToPreset = useCallback((targetMode: ArmillaryProjectionMode, targetLambda: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const isCrossProjection2D = morphLambda >= 0.1 && targetMode !== projectionMode && targetLambda >= 0.5;

    if (isCrossProjection2D) {
      setFromProjectionMode(projectionMode);
      setProjectionMode(targetMode);
      setProjectionTransitionT(0.0);
    } else {
      setProjectionMode(targetMode);
      setFromProjectionMode(targetMode);
      setProjectionTransitionT(1.0);
    }

    const startLambda = morphLambda;
    const startT = isCrossProjection2D ? 0.0 : 1.0;
    const startTime = performance.now();
    const duration = isCrossProjection2D ? 550 : 500; // ms

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic curve for natural deceleration
      const ease = 1 - Math.pow(1 - progress, 3);

      const nextLambda = startLambda + (targetLambda - startLambda) * ease;
      setMorphLambda(parseFloat(nextLambda.toFixed(3)));

      if (isCrossProjection2D) {
        const nextT = startT + (1.0 - startT) * ease;
        setProjectionTransitionT(parseFloat(nextT.toFixed(3)));
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setMorphLambda(targetLambda);
        setProjectionTransitionT(1.0);
        setFromProjectionMode(targetMode);
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(step);
  }, [morphLambda, projectionMode]);

  useEffect(() => {
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleResetCamera = useCallback(() => {
    setCamera({ pitch: 25, yaw: 35, roll: 0 });
  }, []);

  return (
    <div className="flex flex-col h-full w-full justify-between select-none">
      {/* Top Header Controls */}
      <ArmillaryHeaderControls
        projectionMode={projectionMode}
        onSelectMode={(m) => setProjectionMode(m)}
        morphLambda={morphLambda}
        onMorphChange={(l) => setMorphLambda(l)}
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
          onCameraChange={setCamera}
          r0={100}
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
