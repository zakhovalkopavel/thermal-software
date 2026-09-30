import { formatValue } from '../../../../../components/calc';

export function toSizeLabel(fraction: { dMin_mm: number; dMax_mm: number }): string {
  return `${formatValue(fraction.dMin_mm)}–${formatValue(fraction.dMax_mm)} mm`;
}
