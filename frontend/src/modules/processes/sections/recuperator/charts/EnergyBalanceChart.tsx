import { CategoryBarChart } from '../../../../../components/charts';
import type { ChartAxis } from '../../../../../components/charts';
import { formatValue } from '../../../../../components/calc';
import type { RecuperatorChartProps } from '../types/recuperator-chart-props.type';

const CATEGORIES = ['Smoke total energy', 'Smoke energy decrease', 'Air energy increase'];
const Y_AXIS: ChartAxis = { title: 'Power', unit: 'W', min: 0 };

export function EnergyBalanceChart({ result }: RecuperatorChartProps) {
  return (
    <CategoryBarChart
      title="Energy balance"
      subtitle={`Energy returned: ${formatValue(result.energyReturnedPercent)} %`}
      categories={CATEGORIES}
      series={[{ name: 'Power', data: [result.smokeTotalEnergy_W, result.smokeEnergyDecrease_W, result.airEnergyIncrease_W] }]}
      yAxis={Y_AXIS}
      showLegend={false}
    />
  );
}
