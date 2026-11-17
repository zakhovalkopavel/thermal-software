import { EquationValue } from '../../../interfaces/equation-value.interface';

export type HeatCapacityEntries = {
  /** Index of the default approximation in `values` */
  def: number;
  values: EquationValue[];
}
