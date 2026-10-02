import { EquationValue } from '../../interfaces/equation-value.interface';

export interface HeatCapacityEntries {
  /** Index of the default approximation in `values` */
  def: number;
  values: EquationValue[];
}
