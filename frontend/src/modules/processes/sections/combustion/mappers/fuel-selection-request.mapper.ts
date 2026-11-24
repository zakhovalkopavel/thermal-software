import type { CondensedFuelSelection } from '../../../types/condensed-fuel-selection.type';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import type { CondensedFuelDraft } from '../types/condensed-fuel-draft.type';
import { toCondensedFuel } from './condensed-fuel-request.mapper';

/** `fuelId` (preset; first of `presets` when none chosen) or `fuel` (custom). */
export function toFuelSelection(draft: CondensedFuelDraft, presets: FuelSummary[], withBed: boolean): Pick<CondensedFuelSelection, 'fuelId' | 'fuel'> {
  if (draft.source === 'custom') return { fuel: toCondensedFuel(draft, withBed) };
  const fuelId = draft.fuelId ?? presets[0]?.id;
  if (!fuelId) throw new Error('Choose a fuel preset or enter a custom fuel.');
  return { fuelId };
}
