import type { BedCombustionInput } from './bed-combustion-input.type';
import type { FluidFuelInput } from './fluid-fuel-input.type';
import type { SolidDirectInput } from './solid-direct-input.type';
import type { SolidTwoStepInput } from './solid-two-step-input.type';

export type CombustionRequest =
  | { mode: 'solid-direct'; input: SolidDirectInput }
  | { mode: 'solid-two-step'; input: SolidTwoStepInput }
  | { mode: 'fluid'; input: FluidFuelInput }
  | { mode: 'bed'; input: BedCombustionInput };
