import { useMemo, useState } from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
import { XYLineChart, chartFormat } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { celsiusToKelvin } from '@/shared/utils/celsius-to-kelvin';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { toClampedBands } from '../../../mappers/clamped-bands.mapper';
import {
  metalResultPresentProperties,
  metalResultValue,
  type MetalResultPropertyKey,
} from '../constants/metal-result-properties.constants';
import { toMetalPropertySeries } from '../mappers/metal-property-series.mapper';
import type { MetalPropertiesChartProps } from '../types/metal-properties-chart-props.type';

export function MetalPropertiesChart({ metals, byMaterial, temperatureUnit }: MetalPropertiesChartProps) {
  const present = useMemo(
    () => metalResultPresentProperties(Object.values(byMaterial).flat()),
    [byMaterial],
  );
  const [selectedKey, setSelectedKey] = useState<MetalResultPropertyKey | null>(null);
  const property = present.find((item) => item.key === selectedKey) ?? present[0];
  const toX = temperatureUnit === 'C' ? kelvinToCelsius : (T_K: number) => T_K;
  const xUnit = temperatureUnit === 'C' ? '°C' : 'K';
  const otherUnit = temperatureUnit === 'C' ? 'K' : '°C';
  const toOther = temperatureUnit === 'C' ? celsiusToKelvin : kelvinToCelsius;

  const { series, xAxis, bands, yAxis } = useMemo(() => {
    if (!property) {
      return {
        series: [],
        xAxis: { title: 'T', unit: xUnit } satisfies XYLineChartProps['xAxis'],
        bands: [],
        yAxis: { title: '', unit: '' } satisfies ChartAxis,
      };
    }
    const allT = Object.values(byMaterial).flatMap((rows) =>
      rows
        .filter((row) => metalResultValue(row, property.key) !== undefined)
        .map((row) => toX(row.T_K)),
    );
    const xMin = allT.length ? Math.min(...allT) : 0;
    const xMax = allT.length ? Math.max(...allT) : 1;
    const plotBands =
      property.key === 'emissivity'
        ? Object.keys(byMaterial).flatMap((materialId) => {
            const metal = metals.find((item) => item.materialId === materialId);
            return metal?.emissivityRange_K
              ? toClampedBands(metal.emissivityRange_K, xMin, xMax, `ε clamped — ${metal.name}`, toX)
              : [];
          })
        : [];
    const axis: XYLineChartProps['xAxis'] = {
      title: 'T',
      unit: xUnit,
      tooltipExtra: (x) => chartFormat.value(toOther(x), otherUnit),
    };
    return {
      series: toMetalPropertySeries(byMaterial, metals, property, toX),
      xAxis: axis,
      bands: plotBands,
      yAxis: { title: property.short, unit: property.unit } satisfies ChartAxis,
    };
  }, [byMaterial, metals, otherUnit, property, toOther, toX, xUnit]);

  if (!property) return null;

  return (
    <>
      {present.length > 1 && (
        <ToggleButtonGroup
          exclusive
          size="small"
          value={property.key}
          onChange={(_, next: MetalResultPropertyKey | null) => {
            if (next) setSelectedKey(next);
          }}
          aria-label="Property to plot"
        >
          {present.map((item) => (
            <ToggleButton key={item.key} value={item.key}>
              {item.short}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      )}
      <XYLineChart
        title={`${property.label} (${property.short}) vs T`}
        subtitle={
          property.key === 'emissivity'
            ? 'Dotted segments and shaded bands = outside the ε validity range (value clamped)'
            : 'Points only where this property has table data for the grade'
        }
        xAxis={xAxis}
        yAxes={[yAxis]}
        series={series}
        xPlotBands={bands}
      />
    </>
  );
}
