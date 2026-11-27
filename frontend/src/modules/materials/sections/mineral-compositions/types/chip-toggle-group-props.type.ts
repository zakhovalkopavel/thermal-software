export type ChipToggleGroupProps<T extends string | number> = {
  label: string;
  /** Optional short explanation under the label */
  helperText?: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  selected: readonly T[];
  onChange: (next: T[]) => void;
};
