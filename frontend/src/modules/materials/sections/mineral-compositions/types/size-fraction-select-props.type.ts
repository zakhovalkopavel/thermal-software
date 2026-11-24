import type { ParticleSizeRange } from '../../../types/particle-size-range.type';
import type { SizeOption } from './size-option.type';

export type SizeFractionSelectProps = {
  options: SizeOption[];
  value: string | null;
  /** `range` is `null` for the custom option. */
  onChange: (key: string, range: ParticleSizeRange | null) => void;
  disabled?: boolean;
};
