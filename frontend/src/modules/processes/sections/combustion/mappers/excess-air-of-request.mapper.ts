import type { CombustionRequest } from '../../../types/combustion-request.type';

export function toRequestExcessAir(request: CombustionRequest): number | undefined {
  return request.input.kExcessAir;
}
