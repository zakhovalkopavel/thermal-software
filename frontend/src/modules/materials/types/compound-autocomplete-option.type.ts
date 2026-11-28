export type CompoundAutocompleteOption = {
  /** Stable option id: `registry:N2` or `compound:124-38-9`. */
  optionId: string;
  source: 'registry' | 'compound';
  key?: string;
  compoundId?: string;
  label: string;
  secondary: string;
  groupLabel: string;
  formula: string | null;
  displayFormula?: string;
  cas?: string | null;
  className?: string;
  group?: string;
};
