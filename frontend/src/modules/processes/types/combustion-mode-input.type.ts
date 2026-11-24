import type { BedCombustionInput } from './bed-combustion-input.type';
import type { CombustionMode } from './combustion-mode.type';
import type { FluidFuelInput } from './fluid-fuel-input.type';
import type { SolidDirectInput } from './solid-direct-input.type';
import type { SolidTwoStepInput } from './solid-two-step-input.type';

/** `combustion` of the recuperator request: the input of exactly the selected mode. */
export type CombustionModeInput = {
  mode: CombustionMode;
  solidDirect?: SolidDirectInput;
  solidTwoStep?: SolidTwoStepInput;
  fluid?: FluidFuelInput;
  bed?: BedCombustionInput;
};
