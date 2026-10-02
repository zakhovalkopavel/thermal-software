import { RefKey } from '../../enum/ref-key.enum';

/** Cp, H, S, G of a compound from one NASA dataset */
export interface NasaThermo {
  /** RefKey.NASA9 or RefKey.NASA7 */
  ref: RefKey;
  /** Validity range of the dataset [K] */
  Tmin: number;
  Tmax: number;
  /** Cp [J/(mol·K)], T clamped to [Tmin, Tmax] */
  cp(T: number): number;
  /** Formation-referenced H [J/mol]; outside [Tmin, Tmax] extrapolated with the boundary Cp */
  enthalpy(T: number): number;
  /** Absolute S [J/(mol·K)]; outside [Tmin, Tmax] extrapolated with the boundary Cp */
  entropy(T: number): number;
  /** G = H − T·S [J/mol] */
  gibbsEnergy(T: number): number;
}
