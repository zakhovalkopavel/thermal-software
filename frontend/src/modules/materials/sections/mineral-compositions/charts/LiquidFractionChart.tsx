import { useMemo } from 'react';
import { XYLineChart } from '@/shared/ui/charts';
import type { ChartAxis, PlotLine, XYLineChartProps, XYSeries } from '@/shared/ui/charts';
import type { LiquidFractionChartProps } from '../types/liquid-fraction-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'T', unit: '°C' };
const Y_AXES: ChartAxis[] = [{ title: 'Liquid', unit: '%', min: 0, max: 100 }];

export function LiquidFractionChart({ points }: LiquidFractionChartProps) {
  const { series, plotLines } = useMemo(() => {
    const valid = points.filter((point) => point.result);
    const matrix = valid[0]?.result?.matrix;
    const lines: PlotLine[] = matrix
      ? [
          { value: matrix.solidus_C, label: `Solidus ${matrix.solidus_C} °C` },
          { value: matrix.liquidus_C, label: `Liquidus ${matrix.liquidus_C} °C` },
        ]
      : [];
    const data: XYSeries[] = [
      { name: 'Liquid fraction', data: valid.map((point) => [point.temperature, point.result?.atTemperature.liquid.percent ?? 0] as [number, number]) },
    ];
    return { series: data, plotLines: lines };
  }, [points]);

  const failed = points.filter((point) => !point.result).map((point) => point.temperature);
  return (
    <XYLineChart
      title="Liquid fraction vs T"
      subtitle={failed.length > 0 ? `Not calculated at ${failed.join(', ')} °C` : undefined}
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
      xPlotLines={plotLines}
    />
  );
}
