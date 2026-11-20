/** Thermal properties of a component. */
export type ComponentThermalProperties = {
  /** Component name */
  component: string;

  /** Thermal conductivity (W/m·K at reference temperature) */
  thermalConductivity_WmK: number;

  /** Specific heat capacity (J/kg·K at reference temperature) */
  specificHeat_JkgK: number;

  /** Linear thermal expansion coefficient (1/K) */
  linearExpansion_1perK: number;

  /** Temperature dependence coefficient */
  temperatureDependence?: number;

  /** Reference temperature (°C) */
  referenceTemperature: number;
};
