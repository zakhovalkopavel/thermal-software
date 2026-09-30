import type { Workability } from './workability.type';

export type WaterDemandInput = {
  /** φ, 0–1 */
  packingFraction: number;
  workability?: Workability;
};
