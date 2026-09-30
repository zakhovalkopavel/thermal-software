import type { NumberFieldSpec } from '../../../types/number-field-spec.type';
import type { ThermalFieldKey } from '../types/thermal-field-key.type';

/** Limits follow ProfileRequestDto. */
export const THERMAL_FIELDS = {
  main: [
    { key: 'Tc', label: 'Medium T_c', unit: '°C', required: true },
    { key: 'T0', label: 'Initial T₀', unit: '°C', required: true },
    { key: 'tau', label: 'Time τ', unit: 's', min: 0, required: true },
    { key: 'lambda', label: 'Conductivity λ', unit: 'W/(m·K)', min: 0, required: true },
    { key: 'thermalDiffusivity', label: 'Diffusivity a', unit: 'm²/s', min: 0, required: true },
  ] satisfies NumberFieldSpec<ThermalFieldKey>[],
  convective: [{ key: 'alpha', label: 'Heat-transfer coefficient α', unit: 'W/(m²·K)', min: 0, required: true }] satisfies NumberFieldSpec<ThermalFieldKey>[],
  parabolic: [
    { key: 'T0Ctr', label: 'Initial centre T', unit: '°C', required: true },
    { key: 'T0Surf', label: 'Initial surface T', unit: '°C', required: true },
  ] satisfies NumberFieldSpec<ThermalFieldKey>[],
  series: [{ key: 'seriesTerms', label: 'Fourier series terms', min: 1, max: 500, helperText: 'Default 100' }] satisfies NumberFieldSpec<ThermalFieldKey>[],
  biPerAxis: [
    { key: 'bi1', label: 'Bi₁', min: 0 },
    { key: 'bi2', label: 'Bi₂', min: 0 },
    { key: 'bi3', label: 'Bi₃', min: 0 },
  ] satisfies NumberFieldSpec<ThermalFieldKey>[],
  biCylinder: [
    { key: 'biLateral', label: 'Bi lateral', min: 0 },
    { key: 'biEnd', label: 'Bi end face', min: 0 },
  ] satisfies NumberFieldSpec<ThermalFieldKey>[],
};
