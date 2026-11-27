/** Reacted matrix of the fired body. */
export type PhaseEquilibriumMatrix = {
  /** % of the fired body */
  percent: number;
  /** wt% */
  composition: Record<string, number>;
  /** Oxides of the matrix, e.g. `Al2O3-CaO-SiO2` */
  system?: string;
  method?: string;
  /** °C */
  solidus_C: number;
  /** °C */
  liquidus_C: number;
};
