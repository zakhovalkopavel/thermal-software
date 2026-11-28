import type { CompoundSelection } from './compound-selection.type';

export type CompoundAutocompleteProps = {
  value: CompoundSelection | null;
  onChange: (value: CompoundSelection | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
  /** Include short fluid registry list in the same input (default true). */
  includeRegistry?: boolean;
  /** Restrict catalogue search to gas-capable compounds (default true). */
  gasesOnly?: boolean;
  /** Restrict catalogue search to liquid-capable compounds (default false). */
  liquidsOnly?: boolean;
  /** Registry keys / compound ids to hide (selected value always kept). */
  excludeIds?: string[];
};
