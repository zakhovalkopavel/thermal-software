import type { CombustionModeInput } from '../../../types/combustion-mode-input.type';
import type { CombustionRequest } from '../../../types/combustion-request.type';

/** The recuperator's `combustion` field: the mode plus the input under its mode key. */
export function toCombustionModeInput(request: CombustionRequest): CombustionModeInput {
  switch (request.mode) {
    case 'solid-direct':
      return { mode: request.mode, solidDirect: request.input };
    case 'solid-two-step':
      return { mode: request.mode, solidTwoStep: request.input };
    case 'fluid':
      return { mode: request.mode, fluid: request.input };
    case 'bed':
      return { mode: request.mode, bed: request.input };
  }
}
