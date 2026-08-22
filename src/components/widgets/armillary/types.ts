import { 
  ArmillaryProjectionMode, 
  ArmillaryStarData, 
  AlmucantarCircleData, 
  ArmillaryModelOutput,
  AlidadeSightingInfo,
  ProjectionFocalBeaconOutput,
  LaserRay
} from '../../../utils/cosmicMath';
import { SolarAlmanacData, OrbitalData } from '../../../types';

export type { 
  ArmillaryProjectionMode, 
  ArmillaryStarData, 
  AlmucantarCircleData, 
  ArmillaryModelOutput,
  AlidadeSightingInfo,
  ProjectionFocalBeaconOutput,
  LaserRay
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
