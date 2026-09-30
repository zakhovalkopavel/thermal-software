import { useMemo } from 'react';
import { CategoryBarChart } from '../../../../../components/charts';
import type { CategorySeries, ChartAxis } from '../../../../../components/charts';
import { MIX_OPTION_LABELS } from '../constants/mix-option-labels.constants';
import type { PsdChartsProps } from '../types/psd-charts-props.type';

const Y_AXIS: ChartAxis = { title: 'Mass', unit: '%', min: 0 };

export function FractionMassesChart({ fractions, labels, andreasen, funkDinger }: PsdChartsProps) {
  const series = useMemo<CategorySeries[]>(
    () => [
      { name: 'Actual', data: fractions.map((fraction) => fraction.massPercent) },
      ...(andreasen ? [{ name: MIX_OPTION_LABELS.psdMethod.Andreasen, data: andreasen.massFractionsRoundedPercent }] : []),
      ...(funkDinger ? [{ name: MIX_OPTION_LABELS.psdMethod.FunkDinger, data: funkDinger.massFractionsRoundedPercent }] : []),
    ],
    [fractions, andreasen, funkDinger],
  );
  return <CategoryBarChart title="Fraction masses: actual vs ideal" categories={labels} series={series} yAxis={Y_AXIS} showLegend />;
}
