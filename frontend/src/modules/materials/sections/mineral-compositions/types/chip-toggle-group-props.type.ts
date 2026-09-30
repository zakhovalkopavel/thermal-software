export type ChipToggleGroupProps<T extends string | number> = {
  label: string;
  options: ReadonlyArray<{ value: T; label: string }>;
  selected: readonly T[];
  onChange: (next: T[]) => void;
};
