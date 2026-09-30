import type { MaterialPickerKind } from './material-picker-kind.type';

export type MaterialPickerOption = {
  kind: MaterialPickerKind;
  id: string;
  label: string;
  groupLabel: string;
  description?: string;
};
