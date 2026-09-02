/**
 * @file miniglobe/types.ts
 * Internal type definitions and geometry structures for the decomposed MiniGlobe subsystem.
 */

import { Vector2D } from '../../../types/coordinates';
import { MiniGlobeViewMode, MiniGlobeCamera } from '../../../utils/cosmicMath/globe';

export interface TopdownGlobeGeometry {
  dayPath: string;
  eqRy: number;
  tropRy: number;
  tropShiftY: number;
  obsPx: number;
  obsPy: number;
  isDaylight: boolean;
  isFrontVisible: boolean;
}

export interface TransverseGlobeGeometry {
  sideGeom: {
    eqX1: number;
    eqY1: number;
    eqX2: number;
    eqY2: number;
    poleLineX: number;
    poleLineY: number;
    obsPx: number;
    obsPy: number;
    isDaylight: boolean;
  };
  dayPath: string;
}

export interface AxialGlobeGeometry {
  equatorPathD: string;
  poleLineX: number;
  poleLineY: number;
  obsPx: number;
  obsPy: number;
  isDaylight: boolean;
}

export interface EulerGlobeGeometry {
  dayPath: string;
  civilPath: string;
  nauticalPath: string;
  polePx: number;
  polePy: number;
  obsPx: number;
  obsPy: number;
  isObsDay: boolean;
  isObsVisible: boolean;
}

export interface MiniGlobeSphereProps {
  viewMode: MiniGlobeViewMode;
  safeRadius: number;
  clipPathId: string;
  dayGradId: string;
  epsRad: number;
  camera?: MiniGlobeCamera;
  showTerminator: boolean;
  showTwilightBands: boolean;
  showContinents: boolean;
  showParallels: boolean;
  showPolarAxis: boolean;
  showObserverPin: boolean;
  topdownGeometry: TopdownGlobeGeometry | null;
  transverseGeometry: TransverseGlobeGeometry | null;
  axialGeometry: AxialGlobeGeometry | null;
  eulerGeometry: EulerGlobeGeometry | null;
  continentPaths: string[];
}
