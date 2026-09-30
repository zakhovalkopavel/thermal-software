import { useMemo, useState } from 'react';
import { MenuItem, TextField } from '@mui/material';
import { XYLineChart, chartFormat } from '../../../../../components/charts';
import type { ChartAxis, XYLineChartProps } from '../../../../../components/charts';
import { TEMPERATURE_SWEEP } from '../../../constants/temperature-sweep.constants';
import { GAS_PROPERTY_AXES } from '../constants/gas-property-axes.constants';
import { toGasPropertySeries } from '../mappers/gas-property-series.mapper';
import type { GasPropertyChartProps } from '../types/gas-property-chart-props.type';
import type { GasPropertyKey } from '../types/gas-property-key.type';

const X_AXIS: XYLineChartProps['xAxis'] = {
  title: 'T',
  unit: 'K',
  tooltipExtra: (x) => chartFormat.value(x - TEMPERATURE_SWEEP.KELVIN_OFFSET, '°C'),
};

export function GasPropertyChart({ groups, availableKeys }: GasPropertyChartProps) {
  const [property, setProperty] = useState<GasPropertyKey>(availableKeys[0]);
  const axis = GAS_PROPERTY_AXES[property];

  const series = useMemo(() => toGasPropertySeries(groups, property), [groups, property]);
  const yAxes = useMemo<ChartAxis[]>(() => [{ title: axis.label, unit: axis.unit, type: axis.type }], [axis]);

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
          onChange={(event) => setProperty(event.target.value as GasPropertyKey)}
          sx={{ minWidth: 120 }}
        >
          {availableKeys.map((key) => (
            <MenuItem key={key} value={key}>
              {GAS_PROPERTY_AXES[key].label}
            </MenuItem>
          ))}
        </TextField>
      }
      xAxis={X_AXIS}
      yAxes={yAxes}
      series={series}
    />
  );
}
