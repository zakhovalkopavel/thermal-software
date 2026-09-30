import type { GasPropertyKey } from '../types/gas-property-key.type';

export const GAS_PROPERTY_AXES: Record<GasPropertyKey, { label: string; unit: string; type: 'linear' | 'logarithmic' }> = {
  Cp_J_kgK: { label: 'Cp', unit: 'J/(kg·K)', type: 'linear' },
  mu_Pa_s: { label: 'μ', unit: 'Pa·s', type: 'linear' },
  nu_m2s: { label: 'ν', unit: 'm²/s', type: 'logarithmic' },
  rho_kg_m3: { label: 'ρ', unit: 'kg/m³', type: 'logarithmic' },
  lambda_WmK: { label: 'λ', unit: 'W/(m·K)', type: 'linear' },
  Pr: { label: 'Pr', unit: '–', type: 'linear' },
};
