/** One crystalline phase of a raw-material mineralogy table. */
export type MaterialMineralogyPhase = {
  /** Stable phase id (e.g. `corundum`, `mullite`) */
  phaseId: string;
  /** Amount of the phase in the as-delivered material [wt%] */
  wt: number;
};
