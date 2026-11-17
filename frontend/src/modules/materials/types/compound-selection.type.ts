/** Selected gas in the unified registry + catalogue picker. */
export type CompoundSelection =
  | {
      source: 'registry';
      key: string;
      label: string;
      formula: string | null;
    }
  | {
      source: 'compound';
      id: string;
      label: string;
      formula: string;
      displayFormula: string;
      cas: string | null;
    };
