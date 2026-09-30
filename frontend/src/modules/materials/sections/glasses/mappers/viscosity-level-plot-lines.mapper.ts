import { formatPowerOfTen } from '../../../../../components/calc';
import type { PlotLine } from '../../../../../components/charts';
import { VISCOSITY_LEVELS } from '../constants/viscosity-levels.constants';

export function toViscosityLevelPlotLines(): PlotLine[] {
  return VISCOSITY_LEVELS.map((level) => ({
    value: Math.pow(10, level.logEta),
    label: `${level.label} ${formatPowerOfTen(level.logEta)} Pa·s`,
  }));
}
