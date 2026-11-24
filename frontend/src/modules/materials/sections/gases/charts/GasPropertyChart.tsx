import { useMemo, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { XYLineChart, chartFormat } from '@/shared/ui/charts';
import type { ChartAxis, XYLineChartProps } from '@/shared/ui/charts';
import { celsiusToKelvin } from '@/shared/utils/celsius-to-kelvin';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { GAS_PROPERTY_AXES } from '../constants/gas-property-axes.constants';
import { toGasPropertySeries } from '../mappers/gas-property-series.mapper';
import type { GasPropertyChartProps } from '../types/gas-property-chart-props.type';
import type { GasPropertyKey } from '../types/gas-property-key.type';

const identityKelvin = (T_K: number) => T_K;

export function GasPropertyChart({ groups, availableKeys, temperatureUnit }: GasPropertyChartProps) {
  const [selectedKey, setSelectedKey] = useState<GasPropertyKey | null>(null);
  const property = availableKeys.includes(selectedKey as GasPropertyKey)
    ? (selectedKey as GasPropertyKey)
    : availableKeys[0];
  const axis = property ? GAS_PROPERTY_AXES[property] : null;

  const toX = temperatureUnit === 'C' ? kelvinToCelsius : identityKelvin;
  const xUnit = temperatureUnit === 'C' ? '°C' : 'K';
  const otherUnit = temperatureUnit === 'C' ? 'K' : '°C';
  const toOther = temperatureUnit === 'C' ? celsiusToKelvin : kelvinToCelsius;

  const series = useMemo(
    () => (property ? toGasPropertySeries(groups, property, toX) : []),
    [groups, property, toX],
  );
  const yAxes = useMemo<ChartAxis[]>(
    () => (axis ? [{ title: axis.label, unit: axis.unit, type: axis.type }] : []),
    [axis],
  );
  const xAxis = useMemo<XYLineChartProps['xAxis']>(
    () => ({
      title: 'T',
      unit: xUnit,
      tooltipExtra: (x) => chartFormat.value(toOther(x), otherUnit),
    }),
    [otherUnit, toOther, xUnit],
  );

  if (!property || !axis) return null;

  return (
    <XYLineChart
      title={`${axis.label}(T)`}
      subtitle={axis.type === 'logarithmic' ? 'Logarithmic y-axis' : undefined}
      actions={
        <TextField
          select
          size="small"
          label="Property"
          value={property}
          onChange={(event) => setSelectedKey(event.target.value as GasPropertyKey)}
          sx={{ minWidth: 120 }}
        >
          {availableKeys.map((key) => (
            <MenuItem key={key} value={key}>
              {GAS_PROPERTY_AXES[key].label}
            </MenuItem>
          ))}
        </TextField>
      }
      xAxis={xAxis}
      yAxes={yAxes}
      series={series}
    />
  );
}
