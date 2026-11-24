import type { CompositionUnit } from '@/shared/ui/calc';
import type { MaterialEntry } from '../../../types/material-entry.type';
import type { GlassModel } from './glass-model.type';

export type GlassCompositionFormProps = {
  presets: MaterialEntry[];
  presetId: string;
  onPresetChange: (presetId: string) => void;
  /** Preset keys outside the glass oxide list, dropped when the preset was loaded. */
  ignoredKeys: string[];
  composition: Record<string, number>;
  onCompositionChange: (composition: Record<string, number>) => void;
  unit: CompositionUnit;
  onUnitChange: (unit: CompositionUnit) => void;
  model: GlassModel | null;
  onModelChange: (model: GlassModel | null) => void;
};
