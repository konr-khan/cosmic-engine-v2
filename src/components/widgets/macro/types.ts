import { EclipseData } from '../../../types';

export interface MilestoneItem {
  id: string;
  label: string;
  date: string;
  rawX: number;
  rawY: number;
  color: string;
  textColor: string;
  fillColor: string;
  distanceAU: number;
  distanceKm: number;
  speedKms: number;
  description: string;
  textAnchor: 'start' | 'middle' | 'end';
  textDx: number;
  textDy: number;
  subDy: number;
}

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
  exaggerateEccentricity: boolean;
  hoveredId: string | null;
  onHover: (id: string | null) => void;
  milestones?: MilestoneItem[];
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
