export const GAS_MIXTURE_PRESETS = [
  { key: 'dry_air', label: 'Dry air', composition: { N2: 0.79, O2: 0.21 } },
  { key: 'flue_gas', label: 'Typical flue gas', composition: { N2: 0.72, CO2: 0.12, H2O: 0.1, O2: 0.06 } },
] as const;
