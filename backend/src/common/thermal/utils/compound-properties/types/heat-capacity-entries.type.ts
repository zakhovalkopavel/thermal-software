import { EquationValue } from '../../../types/equation-value.type';

export type HeatCapacityEntries = {
  /** Index of the default approximation in `values` */
  def: number;
  values: EquationValue[];
}
