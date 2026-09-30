import type { FuelSummary } from '../../../types/fuel-summary.type';
import type { CondensedFuelDraft } from './condensed-fuel-draft.type';

export type CondensedFuelFieldsProps = {
  value: CondensedFuelDraft;
  onChange: (next: CondensedFuelDraft) => void;
  /** Empty = custom fuel only. */
  presets: FuelSummary[];
  /** Show the packed-bed properties of a custom fuel. */
  withBed?: boolean;
};
