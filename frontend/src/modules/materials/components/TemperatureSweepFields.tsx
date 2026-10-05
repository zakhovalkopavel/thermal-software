import { Stack, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material';
import { NumberField } from '@/shared/ui/calc';
import { celsiusToKelvin } from '@/shared/utils/celsius-to-kelvin';
import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import { TEMPERATURE_SWEEP } from '../constants/temperature-sweep.constants';
import { toTemperatureGrid } from '../mappers/temperature-grid.mapper';
import type { TemperatureSweep } from '../types/temperature-sweep.type';
import type { TemperatureSweepFieldsProps } from '../types/temperature-sweep-fields-props.type';

function convert(value: number | null, from: TemperatureSweep['unit'], to: TemperatureSweep['unit']): number | null {
  if (value === null || from === to) return value;
  const shifted = to === 'K' ? celsiusToKelvin(value) : kelvinToCelsius(value);
  return Number(shifted.toFixed(2));
}

export function TemperatureSweepFields({
  value,
  onChange,
  maxPoints = TEMPERATURE_SWEEP.maxPoints,
  allowUnitChange = true,
}: TemperatureSweepFieldsProps) {
  const unitLabel = value.unit === 'C' ? '°C' : 'K';
  const set = (patch: Partial<TemperatureSweep>) => onChange({ ...value, ...patch });

  const changeUnit = (unit: TemperatureSweep['unit'] | null) => {
    if (!unit || unit === value.unit) return;
    onChange({
      ...value,
      unit,
      value: convert(value.value, value.unit, unit),
      from: convert(value.from, value.unit, unit),
      to: convert(value.to, value.unit, unit),
    });
  };

  let status: { text: string; error: boolean } | null = null;
  if (value.mode === 'range') {
    try {
      status = { text: `${toTemperatureGrid(value, maxPoints).length} points`, error: false };
    } catch (error) {
      status = { text: (error as Error).message, error: true };
    }
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <ToggleButtonGroup size="small" exclusive value={value.mode} onChange={(_, mode) => mode && set({ mode })}>
          <ToggleButton value="single">Single T</ToggleButton>
          <ToggleButton value="range">Range</ToggleButton>
        </ToggleButtonGroup>
        {allowUnitChange && (
          <ToggleButtonGroup size="small" exclusive value={value.unit} onChange={(_, unit) => changeUnit(unit)}>
            <ToggleButton value="C">°C</ToggleButton>
            <ToggleButton value="K">K</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Stack>
      {value.mode === 'single' ? (
        <NumberField label="Temperature" unit={unitLabel} value={value.value} onChange={(next) => set({ value: next })} />
      ) : (
        <Stack direction="row" spacing={1}>
          <NumberField label="From" unit={unitLabel} value={value.from} onChange={(next) => set({ from: next })} />
          <NumberField label="To" unit={unitLabel} value={value.to} onChange={(next) => set({ to: next })} />
          <NumberField label="Step" unit={unitLabel} value={value.step} min={0} onChange={(next) => set({ step: next })} />
        </Stack>
      )}
      {status && (
        <Typography variant="caption" color={status.error ? 'error' : 'text.secondary'}>
          {status.text}
        </Typography>
      )}
    </Stack>
  );
}
