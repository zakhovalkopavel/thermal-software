import type { MaterialPickerKind } from '../../../../materials';
import type { WallLayer } from '../../../types/wall-layer.type';
import type { WallDraft } from './wall-draft.type';

export type WallPreset = {
  id: string;
  label: string;
  draft: Omit<WallDraft, 'layers'>;
  layers: Array<WallLayer & { kind: MaterialPickerKind }>;
};
