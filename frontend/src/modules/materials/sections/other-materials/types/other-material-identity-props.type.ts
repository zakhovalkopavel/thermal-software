import type { CompoundSelection } from '../../../types/compound-selection.type';

export type OtherMaterialIdentityProps = {
  selection: Extract<CompoundSelection, { source: 'compound' }>;
};
