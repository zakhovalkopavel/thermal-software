import { EquationTypeDto } from '../dto/equation-type.dto';
import { RefKey } from '../enum/ref-key.enum';

export type EquationValue = {
  type: EquationTypeDto;
  /** Literature reference key — see docs/REFERENCES.md */
  ref: RefKey;
  /** Page number in the source, omit only when the source has no pagination */
  page?: number;
  vars: Record<string, unknown>;
  /**
   * Valid temperature range min [K].
   * `null` means the source did not publish a lower bound (unknown — not “−∞”).
   */
  min: number | null;
  /**
   * Valid temperature range max [K].
   * `null` means the source did not publish an upper bound (unknown — not “+∞”).
   */
  max: number | null;
  /** Optional scaling factor applied after equation evaluation */
  k?: number;
}

