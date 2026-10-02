import { GasFlows } from '../types';

/** Product distribution at a given temperature */
export interface EquilibriumProducts {
  gas:        GasFlows;
  /** Unburned carbon (char) left when O is insufficient even for C → CO [mol/s] */
  charC_mols: number;
  /** Water-gas shift Kp at the evaluation temperature; null when lean (complete combustion) */
  wgsKp:      number | null;
}
