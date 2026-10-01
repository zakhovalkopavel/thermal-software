import { formatPowerOfTen } from '@/shared/ui/calc';
import type { PlotLine } from '@/shared/ui/charts';
import { VISCOSITY_LEVELS } from '../constants/viscosity-levels.constants';

export function toViscosityLevelPlotLines(): PlotLine[] {
  return VISCOSITY_LEVELS.map((level) => ({
    value: Math.pow(10, level.logEta),
    label: `${level.label} ${formatPowerOfTen(level.logEta)} Pa·s`,
  }));
}
