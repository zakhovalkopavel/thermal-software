import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { toWallLayers } from '../../../mappers/wall-layers-request.mapper';
import { withoutNulls } from '@/shared/utils/without-nulls';
import type { BedCombustionInput } from '../../../types/bed-combustion-input.type';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import type { BedDraft } from '../types/bed-draft.type';
import type { BedFieldKey } from '../types/bed-field-key.type';
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
      emissivity: emissivity as number,
      wallLayers: toWallLayers(draft.furnaceWallLayers, 'Furnace wall'),
    },
  };
}

function toPrimaryAir({ primaryAir }: BedDraft): Pick<BedCombustionInput, 'airFlow_m3h' | 'mAirPrimary_kgs'> {
  if (primaryAir.value === null) throw new Error('Enter the primary air flow.');
  return primaryAir.basis === 'flow' ? { airFlow_m3h: primaryAir.value } : { mAirPrimary_kgs: primaryAir.value };
}

/** Steam and surroundings inputs are sent (and required) only with the sub-model that uses them. */
function toSubModelValues(draft: BedDraft): Pick<BedCombustionInput, 'steamInjectionPercent' | 'steamT_K' | 'generatorWallEmissivity' | 'tAmbient_K'> {
  const { steamInjectionPercent, steamT_K, generatorWallEmissivity, tAmbient_K } = draft.values;
  const steam = (steamInjectionPercent ?? 0) > 0;
  const wall = draft.generatorWallLayers.length > 0;
  const surroundings = wall || draft.furnaceMode === 'walls';
  const needed: Partial<Record<BedFieldKey, boolean>> = { steamT_K: steam, generatorWallEmissivity: wall, tAmbient_K: surroundings };
  assertRequiredNumbers(
    COMBUSTION_FIELDS.bed.advanced.map((field) => ({ ...field, required: needed[field.key] })),
    draft.values,
  );
  return withoutNulls({
    steamInjectionPercent,
    steamT_K: steam ? steamT_K : null,
    generatorWallEmissivity: wall ? generatorWallEmissivity : null,
    tAmbient_K: surroundings ? tAmbient_K : null,
  });
}

export function toBedInput(draft: BedDraft, solidPresets: FuelSummary[]): BedCombustionInput {
  assertRequiredNumbers(COMBUSTION_FIELDS.bed.main, draft.values);
  const { bedHeight_m, diameter_m, nLayers, tAirPrimary_K, tAirSecondary_K, tFuel_K, pO2, wH2Om } = draft.values;
  const { secondaryAir } = draft;
  return {
    ...toFuelSelection(draft.fuel, solidPresets, true),
    bedHeight_m: bedHeight_m as number,
    diameter_m: diameter_m as number,
    nLayers: nLayers as number,
    tAirPrimary_K: tAirPrimary_K as number,
    ...withoutNulls({ tAirSecondary_K, tFuel_K, pO2, wH2Om }),
    ...toSubModelValues(draft),
    ...toPrimaryAir(draft),
    ...withoutNulls(secondaryAir.basis === 'excess' ? { kExcessAir: secondaryAir.value } : { mAirSecondary_kgs: secondaryAir.value }),
    ...(draft.generatorWallLayers.length > 0 ? { generatorWallLayers: toWallLayers(draft.generatorWallLayers, 'Generator wall') } : {}),
    ...toFurnace(draft),
  };
}
