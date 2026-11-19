import { AnnualSolarMatrixItem } from '../../../types';

/**
 * Finds the opposite-season day across the solstice whose daylight duration
 * most closely matches `targetDayLength`, excluding days within ±5 days of
 * `focusDay` (including year-wrap boundaries).
 */
export function findMirrorSolarDay(
  almanacData: AnnualSolarMatrixItem[],
  focusDay: number,
  targetDayLength: number,
  totalDays: number
): AnnualSolarMatrixItem | null {
  if (!almanacData.length) return null;

  let bestDay: AnnualSolarMatrixItem | null = null;
  let minDiff = Infinity;

  for (let i = 0; i < almanacData.length; i++) {
    const d = almanacData[i];
    const dayGap = Math.abs(d.day - focusDay);
    if (dayGap > 5 && dayGap < totalDays - 5) {
      const diff = Math.abs(d.dayLength - targetDayLength);
      if (diff < minDiff) {
        minDiff = diff;
        bestDay = d;
      }
    }
  }

  return bestDay;
}
