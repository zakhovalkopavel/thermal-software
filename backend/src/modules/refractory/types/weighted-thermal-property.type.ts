/** Component-weighted thermal property. */
export type WeightedThermalProperty = {
  /** Component name */
  component: string;

  /** Weight percentage in composition */
  percentage: number;

  /** Thermal property value */
  value: number;

  /** Contribution to total */
  contribution: number;
};
