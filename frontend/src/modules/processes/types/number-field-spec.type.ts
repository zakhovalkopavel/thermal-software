export type NumberFieldSpec<K extends string> = {
  key: K;
  label: string;
  unit?: string;
  min?: number;
  max?: number;
  helperText?: string;
  required?: boolean;
};
