import type { BlendResult } from '../types/blend-result.type';

export function toBlendResultId(result: BlendResult): string {
  return String(result.rank);
}
