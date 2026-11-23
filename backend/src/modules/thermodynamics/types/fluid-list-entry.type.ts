/** One entry returned by GET /thermodynamics/fluid/list */
export type FluidListEntry = {
  key: string;
  name: string;
  formula: string | null;
  Mr_kg_mol: number | null;
};
