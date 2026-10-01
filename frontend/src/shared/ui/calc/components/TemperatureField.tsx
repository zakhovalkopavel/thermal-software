import type { ComponentProps } from 'react';
import { NumberField } from './NumberField';

type TemperatureFieldProps = Omit<ComponentProps<typeof NumberField>, 'unit'> & {
  unit: 'C' | 'K';
};

export function TemperatureField({ unit, label = 'Temperature', ...rest }: TemperatureFieldProps) {
  return <NumberField {...rest} label={label} unit={unit === 'C' ? '°C' : 'K'} />;
}
