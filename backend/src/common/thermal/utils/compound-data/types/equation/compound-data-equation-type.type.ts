import { EquationTypeDto } from '../../../../dto/equation-type.dto';
import { CompoundDataPlannedEquationType } from './compound-data-planned-equation-type.type';

export type CompoundDataEquationType = `${EquationTypeDto}` | CompoundDataPlannedEquationType;
