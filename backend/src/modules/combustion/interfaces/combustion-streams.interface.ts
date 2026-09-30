import { Species } from '../../thermodynamics/enums/species.enum';
import { Element } from '../constants/combustion.constants';
import { CondensedFuel } from '../data/fuels/fuel.interface';
import { CombustionMode } from '../enums/combustion-mode.enum';

/** Atom flows [mol/s] */
export type ElementFlows = Record<Element, number>;

/** Species molar flows [mol/s] */
export type GasFlows = Partial<Record<Species, number>>;

export interface GasStream {
  flows: GasFlows;
  T_K:   number;
}

export interface CondensedStream {
  fuel:  CondensedFuel;
  m_kgs: number;
  T_K:   number;
}

/** Product distribution at a given temperature */
export interface EquilibriumProducts {
  gas:        GasFlows;
  /** Unburned carbon (char) left when O is insufficient even for C → CO [mol/s] */
  charC_mols: number;
  /** Water-gas shift Kp at the evaluation temperature; null when lean (complete combustion) */
  wgsKp:      number | null;
}

export interface ReactionStepInput {
  gasStreams: GasStream[];
  condensed?: CondensedStream;
  /** Heat removed from the reacting volume (walls) [W] */
  heatLoss_W?: number;
}

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

/** Flue gas leaving the last step of a combustion mode (input of heat exchangers) */
export interface FlueGas {
  mode:         CombustionMode;
  tFlame_K:     number;
  mFuel_kgs:    number;
  /** Fuel power, LHV basis [W] */
  fPower_W:     number;
  /** Total combustion air incl. humidity (primary + secondary) [kg/s] */
  mAir_kgs:     number;
  mFlueGas_kgs: number;
  /** Flue gas mole fractions, all species */
  moleFractions: Record<string, number>;
  /** O2 vol fraction of the dry combustion air */
  pO2:          number;
}
