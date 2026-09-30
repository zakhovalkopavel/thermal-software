import { CategoryBarChart } from '../../../../../components/charts';
import type { ChartAxis } from '../../../../../components/charts';
import type { RecuperatorChartProps } from '../types/recuperator-chart-props.type';

const CATEGORIES = ['Smoke', 'Air'];
const Y_AXIS: ChartAxis = { title: 'Velocity', unit: 'm/s', min: 0 };

export function VelocitiesChart({ result }: RecuperatorChartProps) {
  return (
    <CategoryBarChart
      title="Channel velocities"
      categories={CATEGORIES}
      series={[
        { name: 'Inlet', data: [result.wSmokeStart_ms, result.wAirStart_ms] },
        { name: 'Outlet', data: [result.wSmokeEnd_ms, result.wAirEnd_ms] },
      ]}
      yAxis={Y_AXIS}
    />
  );
}
