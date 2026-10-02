import { EquilibriumProducts } from './equilibrium-products.interface';
import { ElementFlows } from '../types';

export interface ReactionStepOutcome {
  T_K:           number;
  products:      EquilibriumProducts;
  ash_kgs:       number;
  elements:      ElementFlows;
  /** Stoichiometric O2 demand of all reactants [mol/s] */
  o2Stoich_mols: number;
  /** O2 supplied as free O2 in the gas streams [mol/s] */
  o2Supplied_mols: number;
  reactantEnthalpy_W: number;
  productEnthalpy_W:  number;
  heatLoss_W:    number;
  elementBalanceResidual: number;
}
