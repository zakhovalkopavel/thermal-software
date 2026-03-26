import { EquationTypeDto } from '../dto/equation-type.dto';
import { RefKey } from '../dto/ref-key.dto';

export interface EquationValue {
  type: EquationTypeDto;
  /** Literature reference key — see docs/REFERENCES.md */
  ref: RefKey;
  /** Page number in the source, omit only when the source has no pagination */
  page?: number;
  vars: Record<string, unknown>;
  /** Valid temperature range min [K] */
  min: number;
  /** Valid temperature range max [K] */
  max: number;
  /** Optional scaling factor applied after equation evaluation */
  k?: number;
}

