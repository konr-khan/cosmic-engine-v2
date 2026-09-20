/**
 * @file useArmillaryInteractions.ts
 * Custom hook encapsulating pointer capture, 3D camera drag, Free Rete rotation,
 * astrolabe rule dragging/snapping, and non-passive wheel zoom interactions.
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  ArmillaryCameraState,
  ArmillaryProjectionMode,
  HoveredStarInfo,
  ArmillaryMilestoneNode
} from './types';

export interface UseArmillaryInteractionsOptions {
  camera: ArmillaryCameraState;
  onCameraChange: (cam: ArmillaryCameraState) => void;
  projectionMode: ArmillaryProjectionMode;
  morphLambda: number;
  isFreeReteMode?: boolean;
  onFreeReteRotate?: (deltaDeg: number) => void;
  controlledRuleAngle?: number;
  onRuleAngleChange?: (angle: number) => void;
  onSnapToTarget?: (name: string, angleDeg: number) => void;
}

export interface UseArmillaryInteractionsReturn {
  svgRef: React.RefObject<SVGSVGElement | null>;
  viewBoxStr: string;
  zoom: number;
  setZoom: React.Dispatch<React.SetStateAction<number>>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  isOrbital: boolean;
  is3D: boolean;
  isZoomable: boolean;
  isDraggingCamera: boolean;
  isDraggingRule: boolean;
  isDraggingRete: boolean;
  isDragging: boolean;
  setIsDraggingRule: React.Dispatch<React.SetStateAction<boolean>>;
  hoveredStar: HoveredStarInfo | null;
  setHoveredStar: React.Dispatch<React.SetStateAction<HoveredStarInfo | null>>;
  hoveredBead: 'sun' | 'moon' | 'earth' | 'observer' | null;
  setHoveredBead: React.Dispatch<React.SetStateAction<'sun' | 'moon' | 'earth' | 'observer' | null>>;
  hoveredMilestone: ArmillaryMilestoneNode | null;
  setHoveredMilestone: React.Dispatch<React.SetStateAction<ArmillaryMilestoneNode | null>>;
  hoveredNode: 'asc' | 'desc' | null;
  setHoveredNode: React.Dispatch<React.SetStateAction<'asc' | 'desc' | null>>;
  ruleAngleDeg: number;
  localRuleAngle: number;
  setLocalRuleAngle: React.Dispatch<React.SetStateAction<number>>;
  updateRuleAngle: (angle: number) => void;
  handlePointerDown: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerMove: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerUp: (e: React.PointerEvent<SVGSVGElement>) => void;
  handlePointerLeave: () => void;
  handlePointerDownRule: (e: React.PointerEvent<SVGGElement | SVGElement>) => void;
  handleTargetClick: (name: string, screenPos: { x: number; y: number }) => void;
}

export function useArmillaryInteractions({
  camera,
  onCameraChange,
  projectionMode,
  morphLambda,
  isFreeReteMode = false,
  onFreeReteRotate,
  controlledRuleAngle,
  onRuleAngleChange,
  onSnapToTarget
}: UseArmillaryInteractionsOptions): UseArmillaryInteractionsReturn {
  const [hoveredStar, setHoveredStar] = useState<HoveredStarInfo | null>(null);
  const [hoveredBead, setHoveredBead] = useState<'sun' | 'moon' | 'earth' | 'observer' | null>(null);
  const [hoveredMilestone, setHoveredMilestone] = useState<ArmillaryMilestoneNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<'asc' | 'desc' | null>(null);
  const [localRuleAngle, setLocalRuleAngle] = useState<number>(0);
  const [isDraggingRule, setIsDraggingRule] = useState<boolean>(false);
  const [isDraggingCamera, setIsDraggingCamera] = useState<boolean>(false);
  const [isDraggingRete, setIsDraggingRete] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(1.0);

  // Reset zoom when leaving 3D Orbit view or morphing to 2D plates
  useEffect(() => {
    if (projectionMode !== 'heliocentric' || morphLambda > 0.05) {
      setZoom(1.0);
    }
  }, [projectionMode, morphLambda]);

  const ruleAngleDeg = controlledRuleAngle !== undefined ? controlledRuleAngle : localRuleAngle;
  const updateRuleAngle = (angle: number) => {
    setLocalRuleAngle(angle);
    if (onRuleAngleChange) onRuleAngleChange(angle);
  };

  const dragStartRef = useRef<{ x: number; y: number; pitch: number; yaw: number; reteStartAngle: number }>({
    x: 0,
    y: 0,
    pitch: 0,
    yaw: 0,
    reteStartAngle: 0
  });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const isOrbital = projectionMode === 'heliocentric';
  const is3D = projectionMode === 'geocentric' || projectionMode === 'heliocentric' || morphLambda <= 0.05;
  const isZoomable = (isOrbital || projectionMode === 'geocentric') && morphLambda <= 0.05;
  const isDragging = isDraggingCamera || isDraggingRete || isDraggingRule;

  // Dynamic zoom viewBox for 3D Heliocentric Orbit view and 3D Geocentric Apparent view
  const viewBoxStr = useMemo(() => {
    if (zoom === 1.0) return "-150 -150 300 300";
    const half = parseFloat((150 / zoom).toFixed(2));
    return `${-half} ${-half} ${2 * half} ${2 * half}`;
  }, [zoom]);

  const zoomIn = () => {
    setZoom((prev) => Math.min(3.5, parseFloat((prev + 0.25).toFixed(2))));
  };

  const zoomOut = () => {
    setZoom((prev) => Math.max(0.75, parseFloat((prev - 0.25).toFixed(2))));
  };

  const resetZoom = () => {
    setZoom(1.0);
  };

  // Native non-passive wheel zoom listener for 3D Orbit and Apparent views
  // (Prevents browser from falling back to page scroll due to passive React synthetic events)
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const handleNativeWheel = (e: WheelEvent) => {
      if (!isZoomable) return;
      e.preventDefault();
      e.stopPropagation();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setZoom((prev) => Math.min(3.5, Math.max(0.75, parseFloat((prev * zoomFactor).toFixed(2)))));
    };

    svgEl.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      svgEl.removeEventListener('wheel', handleNativeWheel);
    };
  }, [isZoomable]);

  // --- Pointer Drag for 3D Camera, Free Rete, and Alidade ---
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingRule) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);

    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const distFromCenter = Math.sqrt(dx * dx + dy * dy);
      const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;

      // In Free Rete mode on 2D plate or 3D sphere, grab and spin the Rete
      if (isFreeReteMode && distFromCenter > 15) {
        setIsDraggingRete(true);
        dragStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          pitch: camera.pitch,
          yaw: camera.yaw,
          reteStartAngle: angle
        };
        return;
      }
    }

    if (is3D) {
      setIsDraggingCamera(true);
      setHoveredMilestone(null);
      setHoveredStar(null);
      setHoveredBead(null);
      setHoveredNode(null);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        pitch: camera.pitch,
        yaw: camera.yaw,
        reteStartAngle: 0
      };
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (isDraggingRule && svgRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 90 + 360) % 360;
      updateRuleAngle(angle);
      return;
    }

    if (isDraggingRete && svgRef.current) {
      e.preventDefault();
      e.stopPropagation();
      const rect = svgRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const currAngle = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      let deltaAngle = currAngle - dragStartRef.current.reteStartAngle;
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      if (onFreeReteRotate) {
        onFreeReteRotate(deltaAngle);
      }
      dragStartRef.current.reteStartAngle = currAngle;
      return;
    }

    if (!isDraggingCamera) return;
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
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    setIsDraggingCamera(false);
    setIsDraggingRule(false);
    setIsDraggingRete(false);
  };

  const handlePointerLeave = () => {
    setIsDraggingCamera(false);
    setIsDraggingRule(false);
    setHoveredStar(null);
    setHoveredBead(null);
  };

  const handlePointerDownRule = (e: React.PointerEvent<SVGGElement | SVGElement>) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    setIsDraggingRule(true);
  };

  const handleTargetClick = (name: string, screenPos: { x: number; y: number }) => {
    const angle = (Math.atan2(screenPos.y, screenPos.x) * 180 / Math.PI + 90 + 360) % 360;
    updateRuleAngle(angle);
    if (onSnapToTarget) {
      onSnapToTarget(name, angle);
    }
  };

  return {
    svgRef,
    viewBoxStr,
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    isOrbital,
    is3D,
    isZoomable,
    isDraggingCamera,
    isDraggingRule,
    isDraggingRete,
    isDragging,
    setIsDraggingRule,
    hoveredStar,
    setHoveredStar,
    hoveredBead,
    setHoveredBead,
    hoveredMilestone,
    setHoveredMilestone,
    hoveredNode,
    setHoveredNode,
    ruleAngleDeg,
    localRuleAngle,
    setLocalRuleAngle,
    updateRuleAngle,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handlePointerLeave,
    handlePointerDownRule,
    handleTargetClick
  };
}
