import type { CombustionMode } from '../../../types/combustion-mode.type';
import type { FuelSummary } from '../../../types/fuel-summary.type';
import type { CombustionDrafts } from './combustion-drafts.type';

export type CombustionModeFormProps = {
  mode: CombustionMode;
  drafts: CombustionDrafts;
  onChange: (drafts: CombustionDrafts) => void;
  fuels: FuelSummary[];
};
