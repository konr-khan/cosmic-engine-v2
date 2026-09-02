import React, { useRef, useState, useCallback } from 'react';
import { ArmillaryProjectionMode, ArmillaryCameraState } from './types';
import { MiniGlobe } from '../../common/MiniGlobe';

export interface ArmillaryEarthPipProps {
  camera: ArmillaryCameraState;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  sunLambdaDeg?: number;
  declination?: number;
  rightAscension?: number;
  projectionMode: ArmillaryProjectionMode;
  morphLambda: number;
  onCameraChange?: (cam: ArmillaryCameraState) => void;
}

export type PipSize = 'compact' | 'standard' | 'large';

export const ArmillaryEarthPip: React.FC<ArmillaryEarthPipProps> = ({
  camera,
  latitude = 47.06,
  longitude = -122.81,
  timeOfDay = 12.0,
  sunLambdaDeg = 0,
  declination,
  rightAscension,
  projectionMode,
  morphLambda,
  onCameraChange
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pipSize, setPipSize] = useState<PipSize>('standard');
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

  // Size geometry config
  // Medium is the new Small (128px); upsized Standard (176px) and Large (224px)
  const sizeConfig = {
    compact: {
      apertureClass: 'w-32 h-32',
      radius: 50,
      viewBox: '-60 -60 120 120',
      rimRadius: 58,
      crosshair: 56
    },
    standard: {
      apertureClass: 'w-44 h-44',
      radius: 68,
      viewBox: '-80 -80 160 160',
      rimRadius: 78,
      crosshair: 76
    },
    large: {
      apertureClass: 'w-56 h-56',
      radius: 88,
      viewBox: '-102 -102 204 204',
      rimRadius: 100,
      crosshair: 98
    }
  }[pipSize];

  return (
    <div 
      className="absolute bottom-3 left-3 z-30 pointer-events-auto transition-opacity duration-300 flex flex-col items-center"
      style={{ opacity }}
    >
      <div className="bg-slate-950/90 backdrop-blur-md border border-slate-800/90 hover:border-sky-500/50 shadow-2xl rounded-2xl p-2.5 flex flex-col items-center gap-1.5 transition-all duration-200">
        {/* Header Badge with Resize Controls */}
        <div className="w-full relative z-20 flex items-center justify-between gap-2 text-[9px] font-mono font-bold select-none px-1">
          <div className="flex items-center gap-1.5 text-sky-400 tracking-wider uppercase truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
            <span>TERRA · LIVING MARBLE</span>
          </div>

          {/* S / M / L Size Preset Toggles */}
          <div className="flex items-center bg-slate-900/80 rounded-md p-0.5 border border-slate-800/80 text-[8px] shrink-0">
            {(['compact', 'standard', 'large'] as PipSize[]).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setPipSize(sz);
                }}
                className={`px-1.5 py-0.5 rounded uppercase font-mono transition-colors cursor-pointer ${
                  pipSize === sz
                    ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={`Set PIP Size to ${sz}`}
              >
                {sz === 'compact' ? 'S' : sz === 'standard' ? 'M' : 'L'}
              </button>
            ))}
          </div>
        </div>

        {/* 3D Euler MiniGlobe Sighting Aperture */}
        <div className={`relative ${sizeConfig.apertureClass} flex items-center justify-center transition-all duration-200 z-10`}>
          <svg
            viewBox={sizeConfig.viewBox}
            className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing rounded-xl"
            style={{ touchAction: 'none' }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Outer Faint Brass Bezel Rim */}
            <circle
              r={sizeConfig.rimRadius}
              fill="none"
              stroke="#334155"
              strokeWidth="0.75"
              strokeDasharray="2 2"
              opacity="0.5"
              className="pointer-events-none"
            />
            {/* Coordinate Crosshairs */}
            <line x1={-sizeConfig.crosshair} y1="0" x2={sizeConfig.crosshair} y2="0" stroke="#1e293b" strokeWidth="0.5" className="pointer-events-none" />
            <line x1="0" y1={-sizeConfig.crosshair} x2="0" y2={sizeConfig.crosshair} stroke="#1e293b" strokeWidth="0.5" className="pointer-events-none" />

            {/* Living Marble Earth with Vector Continents & Diurnal Sidereal Rotation */}
            <MiniGlobe
              cx={0}
              cy={0}
              radius={sizeConfig.radius}
              viewMode="euler3d"
              camera={{
                pitch: camera.pitch,
                yaw: camera.yaw,
                roll: 0
              }}
              sunLambdaDeg={sunLambdaDeg}
              declination={declination}
              rightAscension={rightAscension}
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
        <div className="w-full text-[8px] font-mono text-slate-400 select-none flex items-center justify-between px-1 border-t border-slate-800/60 pt-1">
          <span className="text-sky-400/90 font-semibold">GMST SYNC</span>
          <span className="text-slate-600">·</span>
          <span className="text-slate-400 font-medium">DRAG ROTATE 3D</span>
        </div>
      </div>
    </div>
  );
};

export default ArmillaryEarthPip;
