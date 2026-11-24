import type { PlotLine } from '@/shared/ui/charts';
import type { ThermalRequest } from '../types/thermal-request.type';

export function toBoundaryPlotLines(request: ThermalRequest): PlotLine[] {
  return [
    { value: request.Tc, label: `Medium T_c = ${request.Tc} °C`, dashStyle: 'Dash' },
    { value: request.T0, label: `Initial T₀ = ${request.T0} °C`, dashStyle: 'ShortDot' },
  ];
}
