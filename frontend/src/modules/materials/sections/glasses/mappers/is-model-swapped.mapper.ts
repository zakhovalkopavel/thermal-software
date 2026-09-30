import { GLASS_MODELS } from '../constants/glass-models.constants';
import type { GlassModel } from '../types/glass-model.type';

export function isModelSwapped(requested: GlassModel | null, appliedModelName: string | undefined): boolean {
  if (!requested || !appliedModelName) return false;
  const token = GLASS_MODELS.find((model) => model.value === requested)?.nameToken;
  return Boolean(token) && !appliedModelName.includes(token as string);
}
