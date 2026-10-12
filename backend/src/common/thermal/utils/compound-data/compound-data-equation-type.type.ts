import { EquationTypeDto } from '../../dto/equation-type.dto';

/**
 * Types written by the dataset that `EquationTypeDto` does not implement yet
 * (docs/services/NEW_EQUATION_TYPES_SPEC.md); mirrors python PLANNED_EQUATION_TYPES. Currently none.
 */
export type CompoundDataPlannedEquationType = never;

export type CompoundDataEquationType = `${EquationTypeDto}` | CompoundDataPlannedEquationType;
