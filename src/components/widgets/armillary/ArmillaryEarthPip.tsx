import React, { useRef, useState, useCallback } from 'react';
import { ArmillaryProjectionMode, ArmillaryCameraState } from './types';
import { MiniGlobe } from '../../common/MiniGlobe';

export interface ArmillaryEarthPipProps {
  camera: ArmillaryCameraState;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  sunLambdaDeg?: number;
  projectionMode: ArmillaryProjectionMode;
  morphLambda: number;
  onCameraChange?: (cam: ArmillaryCameraState) => void;
}

export const ArmillaryEarthPip: React.FC<ArmillaryEarthPipProps> = ({
  camera,
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12.0,
  sunLambdaDeg = 0,
  projectionMode,
  morphLambda,
  onCameraChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; pitch: number; yaw: number }>({
    x: 0,
    y: 0,
    pitch: 0,
    yaw: 0
  });

  const isHeliocentric = projectionMode === 'heliocentric';
  
  // Calculate smooth fade-out opacity as morphLambda progresses away from Orbit view
  const opacity = isHeliocentric 
    ? Math.max(0, 1 - morphLambda / 0.15) 
    : 0;

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      pitch: camera.pitch,
      yaw: camera.yaw
    };
  }, [camera.pitch, camera.yaw]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDragging || !onCameraChange) return;
    e.preventDefault();
    e.stopPropagation();
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const newYaw = (dragStartRef.current.yaw + dx * 0.6 + 360) % 360;
    const newPitch = Math.max(-85, Math.min(85, dragStartRef.current.pitch + dy * 0.6));

    onCameraChange({
      pitch: newPitch,
      yaw: newYaw,
      roll: 0
    });
  }, [isDragging, onCameraChange]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    setIsDragging(false);
  }, []);

  if (opacity <= 0.01) {
    return null;
  }

  return (
    <div 
      className="absolute bottom-3 left-3 z-30 pointer-events-auto transition-opacity duration-300 flex flex-col items-center"
      style={{ opacity }}
    >
      <div className="bg-slate-950/85 backdrop-blur-md border border-slate-800/80 hover:border-sky-500/50 shadow-2xl rounded-2xl p-2 flex flex-col items-center gap-1.5 transition-colors duration-200">
        {/* Header Badge */}
        <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold text-sky-400 tracking-wider uppercase select-none px-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>TERRA · LIVING MARBLE</span>
        </div>

        {/* 3D Euler MiniGlobe Sighting Aperture */}
        <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
          <svg
            viewBox="-32 -32 64 64"
            className="w-full h-full overflow-visible cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Outer Faint Brass Bezel Rim */}
            <circle
              r="29"
              fill="none"
              stroke="#334155"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              opacity="0.5"
              className="pointer-events-none"
            />
            {/* Coordinate Crosshairs */}
            <line x1="-28" y1="0" x2="28" y2="0" stroke="#1e293b" strokeWidth="0.5" className="pointer-events-none" />
            <line x1="0" y1="-28" x2="0" y2="28" stroke="#1e293b" strokeWidth="0.5" className="pointer-events-none" />

            {/* Living Marble Earth with Vector Continents & Diurnal Sidereal Rotation */}
            <MiniGlobe
              cx={0}
              cy={0}
              radius={24}
              viewMode="euler3d"
              camera={{
                pitch: camera.pitch,
                yaw: camera.yaw,
                roll: 0
              }}
              sunLambdaDeg={sunLambdaDeg}
              latitude={latitude}
              longitude={longitude}
              timeOfDay={timeOfDay}
              showContinents={true}
              showTerminator={true}
              showTwilightBands={true}
              showParallels={true}
              showPolarAxis={true}
              showObserverPin={true}
              showAtmosphereGlow={true}
              showLabel={false}
            />
          </svg>
        </div>

        {/* Telemetry Micro-Pill */}
        <div className="text-[8px] font-mono text-slate-400 select-none flex items-center gap-1.5 px-1 border-t border-slate-800/60 pt-1">
          <span className="text-amber-400/90 font-semibold">23.4° TILT</span>
          <span className="text-slate-600">·</span>
          <span className="text-sky-400/90 font-semibold">GMST SYNC</span>
        </div>
      </div>
    </div>
  );
};

export default ArmillaryEarthPip;
