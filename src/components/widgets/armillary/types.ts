import { 
  ArmillaryModelMode,
  ArmillaryProjectionMode, 
  ArmillaryStarData, 
  AlmucantarCircleData, 
  ArmillaryModelOutput,
  ArmillaryMilestoneNode,
  ArmillaryOrbitalPhysics,
  AlidadeSightingInfo,
  ProjectionFocalBeaconOutput,
  LaserRay,
  ArmillaryObserverCone,
  ArmillaryLunarNodes
} from '../../../utils/cosmicMath';
import { SolarAlmanacData, OrbitalData } from '../../../types';

export type { 
  ArmillaryModelMode,
  ArmillaryProjectionMode, 
  ArmillaryStarData, 
  AlmucantarCircleData, 
  ArmillaryModelOutput,
  ArmillaryMilestoneNode,
  ArmillaryOrbitalPhysics,
  AlidadeSightingInfo,
  ProjectionFocalBeaconOutput,
  LaserRay,
  ArmillaryObserverCone,
  ArmillaryLunarNodes
};

export interface ArmillaryCameraState {
  pitch: number;
  yaw: number;
  roll: number;
}

export interface GyroArmillaryViewProps {
  solarData?: SolarAlmanacData | null;
  orbitalData?: OrbitalData | null;
  latitude?: number;
  longitude?: number;
  timeOfDay?: number;
  currentDate?: Date;
  onSetTime?: (time: number) => void;
  onSetDate?: (date: Date) => void;
  hoverTime?: number | null;
  onHoverTime?: (time: number | null) => void;
}

export interface HoveredStarInfo {
  id: string;
  name: string;
  bayer: string;
  constellation: string;
  raDeg: number;
  decDeg: number;
  magnitude: number;
  altDeg: number;
  azDeg: number;
  screenX: number;
  screenY: number;
}
