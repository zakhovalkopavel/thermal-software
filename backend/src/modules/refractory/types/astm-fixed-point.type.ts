/** ASTM C965-96 fixed point definition. */
export type ASTMFixedPoint = {
  /** Fixed point name */
  name: 'softening' | 'working' | 'annealing' | 'strain';

  /** Temperature (°C) */
  temperature_C: number;

  /** Viscosity at point (Pa·s) */
  viscosity_Pas: number;

  /** Description of processing window */
  description: string;
};
