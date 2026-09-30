import type { MaterialPickerSelection } from '../../materials';

export type WallLayerDraft = {
  id: string;
  material: MaterialPickerSelection | null;
  thicknessMm: number | null;
};
