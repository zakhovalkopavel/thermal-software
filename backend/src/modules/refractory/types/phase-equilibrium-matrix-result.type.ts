import type { PhaseEquilibriumMethod } from '../enums/phase-equilibrium-method.enum';
import type { PhaseEquilibriumResponseBlock } from './phase-equilibrium-response-block.type';
import type { PhaseEquilibriumResponseCrystal } from './phase-equilibrium-response-crystal.type';

/** Equilibrium of the reacted matrix, amounts as % of the fired body. */
export type PhaseEquilibriumMatrixResult = {
  /** Matrix amount [% of the fired body] */
  percent: number;

  /** Matrix oxide composition [wt%] */
  composition: Record<string, number>;

  /** Oxides of the matrix, e.g. `Al2O3-CaO-SiO2` */
  system: string;

  /** Engine method */
  method: PhaseEquilibriumMethod;

  /** Solidus [°C] */
  solidus_C: number;

  /** Liquidus [°C] */
  liquidus_C: number;

  atTemperature: { liquid: PhaseEquilibriumResponseBlock; crystals: PhaseEquilibriumResponseCrystal[] };
  afterCooling: { glass: PhaseEquilibriumResponseBlock; crystals: PhaseEquilibriumResponseCrystal[] };
};
