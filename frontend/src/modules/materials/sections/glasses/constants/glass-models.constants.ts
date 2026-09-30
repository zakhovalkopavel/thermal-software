import type { GlassModel } from '../types/glass-model.type';

/** `nameToken` appears in the model name the backend returns when that model was applied. */
export const GLASS_MODELS: { value: GlassModel; label: string; nameToken: string }[] = [
  { value: 'FLUEGEL_2007', label: 'Fluegel 2007', nameToken: 'Fluegel' },
  { value: 'LAKATOS_1976', label: 'Lakatos 1976', nameToken: 'Lakatos' },
  { value: 'HETHERINGTON_1964', label: 'Hetherington 1964', nameToken: 'Hetherington' },
];
