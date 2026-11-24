import type { WallLayerDraft } from '../../../types/wall-layer-draft.type';
import type { BedFieldKey } from './bed-field-key.type';
import type { CondensedFuelDraft } from './condensed-fuel-draft.type';
import type { FurnaceFieldKey } from './furnace-field-key.type';

export type BedDraft = {
  fuel: CondensedFuelDraft;
  values: Record<BedFieldKey, number | null>;
  primaryAir: { basis: 'flow' | 'mass'; value: number | null };
  secondaryAir: { basis: 'excess' | 'mass'; value: number | null };
  generatorWallLayers: WallLayerDraft[];
  furnaceMode: 'none' | 'walls' | 'loss';
  furnace: Record<FurnaceFieldKey, number | null>;
  furnaceWallLayers: WallLayerDraft[];
  furnaceHeatLoss_W: number | null;
};
