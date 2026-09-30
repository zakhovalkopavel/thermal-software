import type { CombustionMode } from '../../../types/combustion-mode.type';
import type { CombustionRequest } from '../../../types/combustion-request.type';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import type { CombustionDrafts } from '../types/combustion-drafts.type';
import { toBedInput } from './bed-request.mapper';
import { toFluidInput } from './fluid-request.mapper';
import { toSolidDirectInput } from './solid-direct-request.mapper';
import { toSolidTwoStepInput } from './solid-two-step-request.mapper';

/** Throws a user-facing message when a required field is missing. */
export function toCombustionRequest(mode: CombustionMode, drafts: CombustionDrafts, fuels: FuelSummary[]): CombustionRequest {
  const solid = fuels.filter((fuel) => fuel.phase === 'solid');
  const gas = fuels.filter((fuel) => fuel.phase === 'gas');
  switch (mode) {
    case 'solid-direct':
      return { mode, input: toSolidDirectInput(drafts[mode], solid) };
    case 'solid-two-step':
      return { mode, input: toSolidTwoStepInput(drafts[mode], solid) };
    case 'fluid':
      return { mode, input: toFluidInput(drafts[mode], gas) };
    case 'bed':
      return { mode, input: toBedInput(drafts[mode], solid) };
  }
}
