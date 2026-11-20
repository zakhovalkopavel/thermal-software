import type { ThermalInput } from './thermal-input.type';

/** Thermal conductivity calculation input. */
export type ThermalConductivityInput = ThermalInput & {
  /** Reference temperature for property (°C, default 20) */
  referenceTemperature?: number;

  /** Material bulk density (kg/m³) */
  bulkDensity_kgm3?: number;
};
