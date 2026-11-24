import type { CombustionRequest } from '../../../types/combustion-request.type';

/** Same request with another excess-air ratio; null for the bed mode (not swept). */
export function withExcessAir(request: CombustionRequest, kExcessAir: number): CombustionRequest | null {
  switch (request.mode) {
    case 'solid-direct':
      return { mode: request.mode, input: { ...request.input, kExcessAir } };
    case 'solid-two-step':
      return { mode: request.mode, input: { ...request.input, kExcessAir } };
    case 'fluid':
      return { mode: request.mode, input: { ...request.input, kExcessAir } };
    case 'bed':
      return null;
  }
}
