import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { toWallLayers } from '../../../mappers/wall-layers-request.mapper';
import { withoutNulls } from '../../../mappers/without-nulls.mapper';
import type { BedCombustionInput } from '../../../types/bed-combustion-input.type';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import type { BedDraft } from '../types/bed-draft.type';
import { toFuelSelection } from './fuel-selection-request.mapper';

function toFurnace(draft: BedDraft): Pick<BedCombustionInput, 'furnace' | 'furnaceHeatLoss_W'> {
  if (draft.furnaceMode === 'loss') return withoutNulls({ furnaceHeatLoss_W: draft.furnaceHeatLoss_W });
  if (draft.furnaceMode === 'none') return {};
  assertRequiredNumbers(COMBUSTION_FIELDS.furnace, draft.furnace);
  const { diameter_m, length_m, emissivity } = draft.furnace;
  return {
    furnace: {
      diameter_m: diameter_m as number,
      length_m: length_m as number,
      wallLayers: toWallLayers(draft.furnaceWallLayers, 'Furnace wall'),
      ...withoutNulls({ emissivity }),
    },
  };
}

export function toBedInput(draft: BedDraft, solidPresets: FuelSummary[]): BedCombustionInput {
  const { primaryAir, secondaryAir } = draft;
  return {
    ...toFuelSelection(draft.fuel, solidPresets, true),
    ...withoutNulls(draft.values),
    ...withoutNulls(primaryAir.basis === 'flow' ? { airFlow_m3h: primaryAir.value } : { mAirPrimary_kgs: primaryAir.value }),
    ...withoutNulls(secondaryAir.basis === 'excess' ? { kExcessAir: secondaryAir.value } : { mAirSecondary_kgs: secondaryAir.value }),
    ...(draft.generatorWallLayers.length > 0 ? { generatorWallLayers: toWallLayers(draft.generatorWallLayers, 'Generator wall') } : {}),
    ...toFurnace(draft),
  };
}
