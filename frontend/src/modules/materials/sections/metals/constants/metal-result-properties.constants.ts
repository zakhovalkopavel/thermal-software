import type { MetalThermalResult } from '../types/metal-thermal-result.type';

export type MetalResultPropertyKey =
  | 'lambda_WmK'
  | 'emissivity'
  | 'specificHeat_JkgK'
  | 'thermalExpansion_1e6K'
  | 'density_kgm3'
  | 'electricalResistivity_OhmM';

export type MetalResultProperty = {
  key: MetalResultPropertyKey;
  label: string;
  short: string;
  unit: string;
};

/** Properties returned by `/metals/thermal-properties`, in display order. */
export const METAL_RESULT_PROPERTIES: readonly MetalResultProperty[] = [
  { key: 'lambda_WmK', label: 'Thermal conductivity λ', short: 'λ', unit: 'W/(m·K)' },
  { key: 'emissivity', label: 'Emissivity ε', short: 'ε', unit: '–' },
  { key: 'specificHeat_JkgK', label: 'Specific heat Cp', short: 'Cp', unit: 'J/(kg·K)' },
  { key: 'thermalExpansion_1e6K', label: 'Thermal expansion α', short: 'α', unit: '10⁻⁶/K' },
  { key: 'density_kgm3', label: 'Density ρ', short: 'ρ', unit: 'kg/m³' },
  {
    key: 'electricalResistivity_OhmM',
    label: 'Electrical resistivity ρₑ',
    short: 'ρₑ',
    unit: 'Ω·m',
  },
] as const;

export function metalResultValue(
  row: MetalThermalResult,
  key: MetalResultPropertyKey,
): number | undefined {
  const value = row[key];
  return typeof value === 'number' ? value : undefined;
}

export function metalResultHasValue(row: MetalThermalResult): boolean {
  return METAL_RESULT_PROPERTIES.some((property) => metalResultValue(row, property.key) !== undefined);
}

export function metalResultPresentProperties(
  rows: MetalThermalResult[],
): MetalResultProperty[] {
  return METAL_RESULT_PROPERTIES.filter((property) =>
    rows.some((row) => metalResultValue(row, property.key) !== undefined),
  );
}
