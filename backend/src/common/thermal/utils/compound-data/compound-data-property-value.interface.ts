import { RefKey } from '../../enum/ref-key.enum';
import { CompoundDataPhase } from './compound-data-phase.type';
import { CompoundDataRef } from './compound-data-ref.type';

/** One scalar value from one source row; the unit is fixed per property (`CompoundDataProperties`) */
export interface CompoundDataPropertyValue {
  value: number;
  /** Phase the value refers to; absent for phase-independent properties (Tm, Tb, Tc, …) */
  phase?: CompoundDataPhase;
  /** Polymorph or modification from the source label, e.g. "α", "monoclinic" */
  variant?: string;
  /** Intermolecular potential of σ, ε/k_B and the other potential parameters */
  potential?: 'lennardJones' | 'stockmayer' | 'correspondingStates';
  /** What the potential parameters were fitted to, e.g. "secondVirial" (Mamedov2014), "viscosityData" (Svehla1995) */
  basis?: string;
  /** Citation printed in the source row (Svehla1995), e.g. "Boushehri et al. 1987" */
  citation?: string;
  /** Lower temperature limit of the method the parameters belong to [K] (Svehla1995) */
  TminK?: number;
  /** Reference the source table was taken from, e.g. White3 Table A-7 ← Svehla1962 */
  originalRef?: RefKey;
  ref: CompoundDataRef;
}
