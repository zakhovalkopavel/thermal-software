import { useMemo } from 'react';
import { XYLineChart, chartFormat } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { TEMPERATURE_SWEEP } from '../../../constants/temperature-sweep.constants';
import { toClampedBands } from '../../../mappers/clamped-bands.mapper';
import { toMetalPropertySeries } from '../mappers/metal-property-series.mapper';
import type { MetalPropertiesChartProps } from '../types/metal-properties-chart-props.type';

const Y_AXES: ChartAxis[] = [
  { title: 'λ', unit: 'W/(m·K)' },
  { title: 'ε', unit: '–', min: 0, max: 1, opposite: true },
];

export function MetalPropertiesChart({ metals, byMaterial }: MetalPropertiesChartProps) {
  const { series, xAxis, bands } = useMemo(() => {
    const allT = Object.values(byMaterial).flatMap((rows) => rows.map((row) => row.T_K));
    const xMin = Math.min(...allT);
    const xMax = Math.max(...allT);
    const plotBands = Object.keys(byMaterial).flatMap((materialId) => {
      const metal = metals.find((item) => item.materialId === materialId);
      return metal ? toClampedBands(metal.emissivityRange_K, xMin, xMax, `ε clamped — ${metal.name}`) : [];
    });
    const axis: XYLineChartProps['xAxis'] = {
      title: 'T',
      unit: 'K',
      tooltipExtra: (x) => chartFormat.value(x - TEMPERATURE_SWEEP.KELVIN_OFFSET, '°C'),
    };
    return { series: toMetalPropertySeries(byMaterial, metals), xAxis: axis, bands: plotBands };
  }, [byMaterial, metals]);

  return (
    <XYLineChart
      title="Thermal conductivity λ(T) and emissivity ε(T)"
      subtitle="λ solid (left axis), ε dashed (right axis); dotted ε and shaded bands = outside the ε validity range (value clamped)"
      xAxis={xAxis}
      yAxes={Y_AXES}
      series={series}
      xPlotBands={bands}
    />
  );
}
