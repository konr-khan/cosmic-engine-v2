import React from 'react';
import { AlmanacShortcutsRail, AlmanacShortcut } from '../common/AlmanacShortcutsRail';

export type SolarShortcut = AlmanacShortcut;

export interface SolarShortcutsRailProps {
  shortcuts: SolarShortcut[];
  activeDay: number;
  onDayChange?: (day: number) => void;
}

export const SolarShortcutsRail: React.FC<SolarShortcutsRailProps> = (props) => {
  return <AlmanacShortcutsRail {...props} />;
};

export default SolarShortcutsRail;
