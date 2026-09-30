import type { OxideComposition } from '../../../types/oxide-composition.type';

export type PhaseEquilibriumInput = {
  composition: OxideComposition;
  /** °C, 500–2000 */
  temperature: number;
  /** Required by the backend validation despite being documented as optional. */
  totalMass: number;
};
