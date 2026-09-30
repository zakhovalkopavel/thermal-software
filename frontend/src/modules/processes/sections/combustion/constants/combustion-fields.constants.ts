import type { NumberFieldSpec } from '../../../types/number-field-spec.type';
import type { BedFieldKey } from '../types/bed-field-key.type';
import type { CustomFuelPropertyKey } from '../types/custom-fuel-property-key.type';
import type { ElementKey } from '../types/element-key.type';
import type { FluidFieldKey } from '../types/fluid-field-key.type';
import type { FurnaceFieldKey } from '../types/furnace-field-key.type';
import type { SolidDirectFieldKey } from '../types/solid-direct-field-key.type';
import type { SolidTwoStepFieldKey } from '../types/solid-two-step-field-key.type';

/** Limits follow the combustion DTOs. */
const T_MIN_K = 200;

const EXCESS_AIR = { key: 'kExcessAir', label: 'Excess air λ', min: 0.01, helperText: '< 1 rich, 1 stoichiometric, > 1 lean', required: true } as const;
const T_FUEL = { key: 'tFuel_K', label: 'Fuel inlet T', unit: 'K', min: T_MIN_K, helperText: 'Default 298.15 K' } as const;
const P_O2 = { key: 'pO2', label: 'O₂ in dry air', min: 0.01, max: 1, helperText: 'Vol. fraction; default 0.21' } as const;
const W_H2O = { key: 'wH2Om', label: 'Air humidity', unit: 'kg/kg', min: 0, helperText: 'Water per dry air; default 0' } as const;
const HEAT_LOSS = { key: 'heatLoss_W', label: 'Heat removed from flame', unit: 'W', min: 0, helperText: 'Default 0 (adiabatic)' } as const;

export const COMBUSTION_FIELDS = {
  elemental: [
    { key: 'C', label: 'C', min: 0, max: 1, required: true },
    { key: 'H', label: 'H', min: 0, max: 1, required: true },
    { key: 'O', label: 'O', min: 0, max: 1, required: true },
    { key: 'N', label: 'N', min: 0, max: 1, required: true },
    { key: 'S', label: 'S', min: 0, max: 1 },
    { key: 'ash', label: 'Ash', min: 0, max: 1, required: true },
    { key: 'moisture', label: 'Moisture', min: 0, max: 1 },
  ] satisfies NumberFieldSpec<ElementKey>[],
  customFuel: [{ key: 'specificHeat_J_kgK', label: 'Specific heat', unit: 'J/(kg·K)', min: 0, helperText: 'Default 1500' }] satisfies NumberFieldSpec<CustomFuelPropertyKey>[],
  customFuelBed: [
    { key: 'porosity', label: 'Bed porosity', min: 0.01, max: 0.99, required: true },
    { key: 'bulkDensity_kg_m3', label: 'Bulk density', unit: 'kg/m³', min: 1 },
    { key: 'particleSize_m', label: 'Particle size', unit: 'm', min: 0.0001, required: true },
    { key: 'activityFactor', label: 'Activity factor', min: 0, required: true },
    { key: 'emissivity', label: 'Emissivity', min: 0, max: 1 },
  ] satisfies NumberFieldSpec<CustomFuelPropertyKey>[],
  solidDirect: {
    main: [EXCESS_AIR, { key: 'tAir_K', label: 'Air T', unit: 'K', min: T_MIN_K, required: true }],
    advanced: [HEAT_LOSS, T_FUEL, P_O2, W_H2O],
  } satisfies Record<string, NumberFieldSpec<SolidDirectFieldKey>[]>,
  solidTwoStep: {
    main: [
      { ...EXCESS_AIR, label: 'Total excess air λ' },
      { key: 'tAirPrimary_K', label: 'Primary air T', unit: 'K', min: T_MIN_K, required: true },
      { key: 'primaryExcessAir', label: 'Primary excess air', min: 0, helperText: '≤ total λ; default: C → CO' },
      { key: 'tAirSecondary_K', label: 'Secondary air T', unit: 'K', min: T_MIN_K, helperText: 'Default = primary' },
    ],
    advanced: [
      { key: 'generatorHeatLoss_W', label: 'Generator heat loss', unit: 'W', min: 0, helperText: 'Overrides flux × surface' },
      { key: 'generatorHeatFlux_Wm2', label: 'Generator heat flux', unit: 'W/m²', min: 0, helperText: 'Default 0; typical 7000' },
      { key: 'generatorSurface_m2', label: 'Generator surface', unit: 'm²', min: 0 },
      { key: 'furnaceHeatLoss_W', label: 'Furnace heat loss', unit: 'W', min: 0 },
      T_FUEL,
      P_O2,
      W_H2O,
    ],
  } satisfies Record<string, NumberFieldSpec<SolidTwoStepFieldKey>[]>,
  fluid: {
    main: [EXCESS_AIR, { key: 'tAir_K', label: 'Air T', unit: 'K', min: T_MIN_K, required: true }],
    advanced: [HEAT_LOSS, T_FUEL, P_O2, W_H2O],
  } satisfies Record<string, NumberFieldSpec<FluidFieldKey>[]>,
  bed: {
    main: [
      { key: 'bedHeight_m', label: 'Bed height', unit: 'm', min: 0.01, helperText: 'Default 0.5' },
      { key: 'diameter_m', label: 'Generator diameter', unit: 'm', min: 0.01, helperText: 'Default 0.3' },
      { key: 'nLayers', label: 'Layers', min: 1, max: 500, helperText: 'Default 25' },
      { key: 'tAirPrimary_K', label: 'Primary air T', unit: 'K', min: T_MIN_K, helperText: 'Default 400' },
      { key: 'tAirSecondary_K', label: 'Secondary air T', unit: 'K', min: T_MIN_K, helperText: 'Default = primary' },
    ],
    advanced: [
      { key: 'steamInjectionPercent', label: 'Steam injection', unit: '%', min: 0, helperText: 'Of the gas molar flow at max CO₂' },
      { key: 'steamT_K', label: 'Steam T', unit: 'K', min: 373, helperText: 'Default 500' },
      { key: 'generatorWallEmissivity', label: 'Generator wall emissivity', min: 0, max: 1, helperText: 'Default 0.85' },
      { key: 'tAmbient_K', label: 'Ambient T', unit: 'K', min: T_MIN_K, helperText: 'Default 293' },
      T_FUEL,
      P_O2,
      W_H2O,
    ],
  } satisfies Record<string, NumberFieldSpec<BedFieldKey>[]>,
  furnace: [
    { key: 'diameter_m', label: 'Furnace diameter', unit: 'm', min: 0.01, required: true },
    { key: 'length_m', label: 'Furnace length', unit: 'm', min: 0.01, required: true },
    { key: 'emissivity', label: 'Wall emissivity', min: 0, max: 1, helperText: 'Default 0.85' },
  ] satisfies NumberFieldSpec<FurnaceFieldKey>[],
};
