import { atomicMass } from '../../../common/chemistry';

/** Molar masses [kg/mol] of the reacting elements, from PERIODIC_TABLE */
export const ATOMIC_MASS = {
  C: atomicMass('C'),
  H: atomicMass('H'),
  O: atomicMass('O'),
  N: atomicMass('N'),
  S: atomicMass('S'),
} as const;
