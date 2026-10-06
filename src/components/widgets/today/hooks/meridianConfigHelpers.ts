/**
 * @file meridianConfigHelpers.ts
 * Reusable view-model transformation helper functions for Meridian Dome widgets.
 * Constructs typed configurations for radial tick pins, milestone swaths, gate anchors,
 * and peak targets across Sun and Moon meridian visualizers.
 */

import { RadialTickLine } from '../../../../utils/cosmicMath';
import {
  MeridianSwathConfig,
  MeridianRadialTickConfig,
  MeridianGateAnchorConfig,
  MeridianPeakTargetConfig,
} from '../MeridianDomeBase';

/**
 * Creates a MeridianRadialTickConfig for perpendicular dome ticks.
 */
export function createMeridianRadialTickConfig(
  id: string,
  tick: RadialTickLine,
  stroke: string,
  title: string,
  strokeWidth?: number,
  strokeDasharray?: string
): MeridianRadialTickConfig {
  const config: MeridianRadialTickConfig = {
    id,
    tick,
    stroke,
    title,
  };
  if (strokeWidth !== undefined) {
    config.strokeWidth = strokeWidth;
  }
  if (strokeDasharray !== undefined) {
    config.strokeDasharray = strokeDasharray;
  }
  return config;
}

/**
 * Creates a MeridianSwathConfig for arc highlight intervals between milestones.
 */
export function createMeridianSwathConfig(
  id: string,
  d: string,
  stroke: string,
  title?: string,
  options?: Partial<MeridianSwathConfig>
): MeridianSwathConfig {
  return {
    id,
    d,
    stroke,
    ...(title !== undefined ? { title } : {}),
    ...options,
  };
}

/**
 * Creates a MeridianGateAnchorConfig for marking horizon or twilight crossing gates.
 */
export function createMeridianGateAnchorConfig(
  id: string,
  anchorPoint: { x: number; y: number },
  stroke: string,
  title: string,
  r: number = 3.5
): MeridianGateAnchorConfig {
  return {
    id,
    x: anchorPoint.x,
    y: anchorPoint.y,
    r,
    stroke,
    title,
  };
}

/**
 * Creates a MeridianPeakTargetConfig for targeting the daily culmination peak.
 */
export function createMeridianPeakTargetConfig(
  id: string,
  peakPoint: { x: number; y: number },
  stroke: string,
  title: string
): MeridianPeakTargetConfig {
  return {
    id,
    peakPoint,
    stroke,
    title,
  };
}
