import type { ParticleSizeRange } from '../../../types/particle-size-range.type';

export type SizeOption = {
  /** `<group>:<code>` */
  key: string;
  code: string;
  groupLabel: string;
  range: ParticleSizeRange;
};
