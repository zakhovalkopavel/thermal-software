import type { MaterialGroup } from './material-group.type';
import type { MaterialPickerKind } from './material-picker-kind.type';
import type { MaterialPickerSelection } from './material-picker-selection.type';

export type MaterialPickerProps = {
  kinds: MaterialPickerKind[];
  categories?: MaterialGroup[];
  excludeIds?: string[];
  value: MaterialPickerSelection | null;
  onChange: (selection: MaterialPickerSelection | null) => void;
  label?: string;
  size?: 'small' | 'medium';
  disabled?: boolean;
};
