import { assertRequiredNumbers } from '../../../mappers/required-numbers.mapper';
import { withoutNulls } from '../../../mappers/without-nulls.mapper';
import type { FluidFuelInput } from '../../../types/fluid-fuel-input.type';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import { COMBUSTION_FIELDS } from '../constants/combustion-fields.constants';
import type { FluidDraft } from '../types/fluid-draft.type';
import { toCondensedFuel } from './condensed-fuel-request.mapper';
import { toSupply } from './supply-request.mapper';

function toFluidFuel(draft: FluidDraft, gasPresets: FuelSummary[]): Pick<FluidFuelInput, 'fuelId' | 'fuelGas' | 'fuel'> {
  if (draft.phase === 'liquid') return { fuel: toCondensedFuel(draft.liquidFuel, false) };
  if (draft.gasSource === 'custom') {
    const fuelGas = Object.fromEntries(Object.entries(draft.fuelGas).filter(([, fraction]) => fraction > 0));
    if (Object.keys(fuelGas).length === 0) throw new Error('Enter the fuel gas mole fractions.');
    return { fuelGas };
  }
  const fuelId = draft.gasFuelId ?? gasPresets[0]?.id;
  if (!fuelId) throw new Error('Choose a gas preset or enter mole fractions.');
  return { fuelId };
}

export function toFluidInput(draft: FluidDraft, gasPresets: FuelSummary[]): FluidFuelInput {
  assertRequiredNumbers(COMBUSTION_FIELDS.fluid.main, draft.values);
  const { kExcessAir, tAir_K, ...optional } = draft.values;
  return {
    phase: draft.phase,
    ...toFluidFuel(draft, gasPresets),
    ...toSupply(draft.supply),
    kExcessAir: kExcessAir as number,
    tAir_K: tAir_K as number,
    ...withoutNulls(optional),
  };
}
