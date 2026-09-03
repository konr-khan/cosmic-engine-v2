import { EclipseData } from '../../../types';
import { MilestoneNode3D } from '../../../utils/cosmicMath/scene/types';
import type { MilestoneItem } from '../../../utils/cosmicMath/milestones';

export type { MilestoneItem };

export type OrbitMilestoneInput = MilestoneItem | (MilestoneNode3D & { x: number; y: number });

export interface MacroOrbitHoverData {
  label: string;
  date: string;
  distanceAU: number;
  distanceKm: number;
  speedKms?: number;
  description: string;
}

export interface MacroOrbitViewProps {
  eclipse?: EclipseData | null;
  currentDate?: Date;
}

export interface OrbitSvgCanvasProps {
  renderSunX: number;
  renderSunY: number;
  renderEarthX: number;
  renderEarthY: number;
  renderMoonX: number;
  renderMoonY: number;
  orbitalRadius: number;
  bRatio: number;
  focus2X: number;
  focus2Y?: number;
  exaggerateEccentricity: boolean;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  milestones?: OrbitMilestoneInput[];
}

export interface OrbitHeaderControlsProps {
  exaggerateEccentricity: boolean;
  onToggleEccentricity: (val: boolean) => void;
  isEclipse: boolean;
}

export interface OrbitHoverHudProps {
  hoverData: MacroOrbitHoverData | null;
}

export interface OrbitPhysicsHudProps {
  distanceAU: number;
  distanceKm: number;
  orbitalSpeedKms: number;
  solarIrradiancePercent: number;
  sunAngularDiameterArcmin: number;
}
