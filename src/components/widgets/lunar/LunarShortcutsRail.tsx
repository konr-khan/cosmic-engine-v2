import React from 'react';
import { AlmanacShortcutsRail, AlmanacShortcut } from '../common/AlmanacShortcutsRail';

export type LunarShortcutItem = AlmanacShortcut;

export interface LunarShortcutsRailProps {
  shortcuts: LunarShortcutItem[];
  activeDay: number;
  onDayChange?: (day: number) => void;
}

export const LunarShortcutsRail: React.FC<LunarShortcutsRailProps> = (props) => {
  return <AlmanacShortcutsRail {...props} />;
};

export default LunarShortcutsRail;
