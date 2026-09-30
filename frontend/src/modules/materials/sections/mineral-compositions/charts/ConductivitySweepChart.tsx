import { useMemo } from 'react';
import { XYLineChart } from '../../../../../components/charts';
import type { ChartAxis, XYLineChartProps, XYSeries } from '../../../../../components/charts';
import type { ConductivitySweepChartProps } from '../types/conductivity-sweep-chart-props.type';

const X_AXIS: XYLineChartProps['xAxis'] = { title: 'T', unit: '°C' };
const Y_AXES: ChartAxis[] = [{ title: 'λ_eff', unit: 'W/(m·K)' }];

export function ConductivitySweepChart({ points, porosity }: ConductivitySweepChartProps) {
  const series = useMemo<XYSeries[]>(() => {
    const byPorosity = new Map<number, [number, number][]>();
    for (const point of points) {
      if (!point.result) continue;
      const data = byPorosity.get(point.porosity) ?? [];
      if (!data.some(([x]) => x === point.temperature)) data.push([point.temperature, point.result.thermalConductivity_WmK]);
      byPorosity.set(point.porosity, data);
    }
    return [...byPorosity.entries()].map(([P, data]) => ({
      name: `P = ${P}`,
      dashStyle: P === porosity ? undefined : 'Dash',
      emphasis: P === porosity,
      data: data.sort((a, b) => a[0] - b[0]),
    }));
  }, [points, porosity]);

  return (
    <XYLineChart
      title="Effective thermal conductivity λ_eff(T)"
      caption="Maxwell–Eucken with linear temperature correction; dashed = dense (P = 0)"
      xAxis={X_AXIS}
      yAxes={Y_AXES}
      series={series}
    />
  );
}
