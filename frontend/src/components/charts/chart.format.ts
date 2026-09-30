import { formatPowerOfTen } from '../calc/format-power-of-ten';
import { formatValue } from '../calc/format';

export const chartFormat = {
  logTick: (value: number): string => {
    const exponent = Math.log10(value);
    return Number.isInteger(Number(exponent.toFixed(6))) ? formatPowerOfTen(Math.round(exponent)) : formatValue(value, 3);
  },
  value: (value: number | null | undefined, unit?: string): string =>
    `${formatValue(value)}${unit ? ` ${unit}` : ''}`,
  axisTitle: (title: string, unit?: string): string => (unit ? `${title} [${unit}]` : title),
  marker: (color: unknown): string => `<span style="color:${String(color)}">●</span>`,
};
