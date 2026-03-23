import { EquationTypeDto } from '../dto/equation-type.dto';

export interface EquationValue {
  type: EquationTypeDto;
  /** Literature reference index */
  ref: number;
  page?: number;
  vars: Record<string, unknown>;
  /** Valid temperature range min [K] */
  min: number;
  /** Valid temperature range max [K] */
  max: number;
  /** Optional scaling factor applied after equation evaluation */
  k?: number;
}

