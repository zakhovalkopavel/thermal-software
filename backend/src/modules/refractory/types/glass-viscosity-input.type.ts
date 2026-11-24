/** Glass viscosity calculation input. */
export type GlassViscosityInput = {
  /** Glass composition (Record with component names and wt%) */
  composition: Record<string, number>;

  /** Temperature (°C) */
  temperature: number;

  /** Pressure (MPa, optional) */
  pressure_MPa?: number;
};
