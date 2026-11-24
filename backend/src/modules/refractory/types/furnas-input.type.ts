import type { PackingInput } from './packing-input.type';

/** Complete Furnas input with optional efficiency. */
export type FurnasInput = PackingInput & {
  /** Void filling efficiency factor (0-1, default 0.75) */
  efficiencyFactor?: number;
};
