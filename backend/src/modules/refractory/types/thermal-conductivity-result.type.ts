import type { WeightedThermalProperty } from './weighted-thermal-property.type';

/** Thermal conductivity result. */
export type ThermalConductivityResult = {
  /** Effective thermal conductivity (W/m·K) */
  effectiveConductivity_WmK: number;

  /** Conductivity in solid phase (W/m·K) */
  solidConductivity_WmK: number;

  /** Conductivity in pore phase (W/m·K) */
  poreConductivity_WmK: number;

  /** Porosity correction factor */
  porosityFactor: number;

  /** Temperature (°C) */
  temperature: number;

  /** Composition-weighted components */
  componentContributions: WeightedThermalProperty[];

  /** Calculation model used */
  model: 'Maxwell-Eucken' | 'series' | 'parallel' | 'composite';

  /** Notes about calculation */
  notes?: string;
};
