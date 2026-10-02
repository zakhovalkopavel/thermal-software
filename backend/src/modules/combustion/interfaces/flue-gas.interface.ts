import { CombustionMode } from '../enums/combustion-mode.enum';

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
