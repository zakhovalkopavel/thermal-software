export type ProductRow = {
  species: string;
  /** Per step key: mole fraction and mass flow. */
  values: Record<string, { moleFraction: number; massFlow_kgs: number }>;
};
