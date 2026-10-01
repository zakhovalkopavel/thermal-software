import { CategoryBarChart } from '@/shared/ui/charts';
import type { ChartAxis } from '@/shared/ui/charts';
import type { RecuperatorChartProps } from '../types/recuperator-chart-props.type';

const CATEGORIES = ['Flame T', 'Max flame T'];
const Y_AXIS: ChartAxis = { title: 'T', unit: 'K', min: 0 };

export function FlameTemperatureChart({ input, result }: RecuperatorChartProps) {
  return (
    <CategoryBarChart
      title="Flame temperature gain"
      caption={input.airPreheat_K ? `Max flame T includes the ${input.airPreheat_K} K air preheat offset.` : 'No air preheat offset was set.'}
      categories={CATEGORIES}
      series={[{ name: 'Temperature', data: [result.tFlame_K, result.maxFlameTemp_K] }]}
      yAxis={Y_AXIS}
      showLegend={false}
    />
  );
}
