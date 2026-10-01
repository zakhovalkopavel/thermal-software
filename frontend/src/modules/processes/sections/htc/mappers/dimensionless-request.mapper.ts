import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { withoutNulls } from '@/shared/utils/without-nulls';
import { GEOMETRY_DIMENSIONS } from '../constants/geometry-dimensions.constants';
import { HTC_FIELDS } from '../constants/htc-fields.constants';
import { HTC_UI } from '../constants/htc-ui.constants';
import type { DimensionlessInput } from '../types/dimensionless-input.type';
import type { FlowGeometryInfo } from '../types/flow-geometry-info.type';
import type { HtcDraft } from '../types/htc-draft.type';

/** Throws a user-facing message when a required field is missing. */
export function toDimensionlessInput(draft: HtcDraft, geometry: FlowGeometryInfo): DimensionlessInput {
  assertRequiredNumbers(HTC_FIELDS.main, draft.values);
  const missing = geometry.requiredDims.find((key) => draft.dims[key] === null || draft.dims[key] === undefined);
  if (missing) throw new Error(`Enter dimension ${GEOMETRY_DIMENSIONS[missing]?.label ?? missing}.`);
  if (draft.fluidMode === 'named' && !draft.fluid) throw new Error('Select a fluid.');

  const dimensionKeys = [...geometry.requiredDims, ...(geometry.optionalDims ?? [])];
  const dimensions = withoutNulls(Object.fromEntries(dimensionKeys.map((key) => [key, draft.dims[key] ?? null]))) as Record<string, number>;
  const fluid = draft.fluidMode === 'mixture' ? { fluid: HTC_UI.gasMixFluid, composition: draft.composition } : { fluid: draft.fluid };

  return {
    geometry: geometry.key,
    ...fluid,
    ...withoutNulls(draft.values),
    ...(Object.keys(dimensions).length > 0 ? { dimensions } : {}),
    ...(draft.forceRegime ? { forceRegime: draft.forceRegime } : {}),
    ...(draft.preferredCorrelation ? { preferredCorrelation: draft.preferredCorrelation } : {}),
    isHeating: draft.isHeating,
    compareAll: draft.compareAll,
  };
}
