import type { SupplyBasis } from './supply-basis.type';

export type SupplyDraft = {
  basis: SupplyBasis;
  value: number | null;
};
