import { CompoundDataEquationValue } from './compound-data-equation-value.interface';

export interface CompoundDataEquationList {
  /** Index of the first value with an implemented type; `null` when all types are planned */
  def: number | null;
  /** Values in source priority order */
  values: CompoundDataEquationValue[];
}
