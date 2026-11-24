import type { BedCombustionResult } from './bed-combustion-result.type';
import type { SingleStepCombustionResult } from './single-step-combustion-result.type';
import type { SolidTwoStepResult } from './solid-two-step-result.type';

export type CombustionResponse =
  | { mode: 'solid-direct'; result: SingleStepCombustionResult }
  | { mode: 'solid-two-step'; result: SolidTwoStepResult }
  | { mode: 'fluid'; result: SingleStepCombustionResult }
  | { mode: 'bed'; result: BedCombustionResult };
