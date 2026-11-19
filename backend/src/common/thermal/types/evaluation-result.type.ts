import { EquationValidity } from './equation-validity.type';

/** Point (or average) evaluation with numeric value + boundary metadata */
export type EvaluationResult = {
  value: number;
  validity: EquationValidity;
};
