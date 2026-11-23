import type { GasPropertyAxis } from '../types/gas-property-axis.type';
import type { GasPropertyKey } from '../types/gas-property-key.type';

/** Plottable gas properties in display order; only keys present in the result rows are offered. */
export const GAS_CHART_PROPERTY_KEYS: GasPropertyKey[] = [
  'Cp_J_kgK',
  'Cv_J_kgK',
  'gamma',
  'H_J_mol',
  'mu_Pa_s',
  'nu_m2s',
  'rho_kg_m3',
  'lambda_WmK',
  'Pr',
];

export const GAS_PROPERTY_AXES: Record<GasPropertyKey, GasPropertyAxis> = {
  Cp_J_kgK: { label: 'Cp', unit: 'J/(kg·K)', type: 'linear' },
  Cv_J_kgK: { label: 'Cv', unit: 'J/(kg·K)', type: 'linear' },
  gamma: { label: 'γ', unit: '–', type: 'linear' },
  H_J_mol: { label: 'H', unit: 'J/mol', type: 'linear' },
  mu_Pa_s: { label: 'μ', unit: 'Pa·s', type: 'linear' },
  nu_m2s: { label: 'ν', unit: 'm²/s', type: 'logarithmic' },
  rho_kg_m3: { label: 'ρ', unit: 'kg/m³', type: 'logarithmic' },
  lambda_WmK: { label: 'λ', unit: 'W/(m·K)', type: 'linear' },
  Pr: { label: 'Pr', unit: '–', type: 'linear' },
};
