import { EquationValidity } from './equation-validity.type';

/** Mixture aggregate: per-component flags plus overall in-range */
export type MixtureValidity = {
  allInRange: boolean;
  components: Record<string, EquationValidity>;
};
