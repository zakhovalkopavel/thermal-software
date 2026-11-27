import type { XYSeries } from '@/shared/ui/charts';
import type { MixThermalResult } from '../../../types/mix-thermal-result.type';

/** One series per `/mix/thermal` result; the requested porosity is drawn solid. */
export function toConductivitySweepSeries(results: MixThermalResult[], porosity: number): XYSeries[] {
  return results.map((result) => ({
    name: `P = ${result.porosity}`,
    dashStyle: result.porosity === porosity ? undefined : 'Dash',
    emphasis: result.porosity === porosity,
    data: result.points
      .map((point) => [point.temperature_C, point.lambdaEffective_WmK] as [number, number])
      .sort((a, b) => a[0] - b[0]),
  }));
}
