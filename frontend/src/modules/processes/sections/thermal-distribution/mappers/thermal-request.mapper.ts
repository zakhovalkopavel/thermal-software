import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { withoutNulls } from '@/shared/utils/without-nulls';
import { THERMAL_FIELDS } from '../constants/thermal-fields.constants';
import { THERMAL_SHAPES } from '../constants/thermal-shapes.constants';
import type { ThermalDraft } from '../types/thermal-draft.type';
import type { ThermalRequest } from '../types/thermal-request.type';

const allSet = (values: Array<number | null>): values is number[] => values.every((value) => value !== null);

/** Throws a user-facing message when a required field is missing. */
export function toThermalRequest(draft: ThermalDraft): ThermalRequest {
  const shape = THERMAL_SHAPES.find((item) => item.value === draft.geometry) ?? THERMAL_SHAPES[0];
  const convective = draft.bcType === 'BC_III';
  const parabolic = draft.initialProfile === 'parabolic';
  assertRequiredNumbers(
    [...THERMAL_FIELDS.main, ...(convective ? THERMAL_FIELDS.convective : []), ...(parabolic ? THERMAL_FIELDS.parabolic : [])],
    draft.values,
  );
  assertRequiredNumbers(shape.fields, draft.shape);

  const { Tc, T0, tau, lambda, thermalDiffusivity, alpha, T0Ctr, T0Surf, seriesTerms, bi1, bi2, bi3, biLateral, biEnd } = draft.values;
  const biPerAxis = [bi1, bi2, bi3];
  const biCylinder = [biLateral, biEnd];
  const shapeValues = Object.fromEntries(shape.fields.map((field) => [field.key, draft.shape[field.key]]));

  return {
    bcType: draft.bcType,
    Tc: Tc as number,
    T0: T0 as number,
    tau: tau as number,
    lambda: lambda as number,
    thermalDiffusivity: thermalDiffusivity as number,
    shape: { geometry: shape.value, ...withoutNulls(shapeValues) },
    initialProfile: draft.initialProfile,
    ...withoutNulls({ seriesTerms, alpha: convective ? alpha : null }),
    ...(parabolic ? { T0Ctr: T0Ctr as number, T0Surf: T0Surf as number } : {}),
    ...(convective && draft.geometry === 'parallelepiped' && allSet(biPerAxis) ? { biPerAxis: biPerAxis as [number, number, number] } : {}),
    ...(convective && draft.geometry === 'finite_cylinder' && allSet(biCylinder) ? { biCylinder: biCylinder as [number, number] } : {}),
  };
}
