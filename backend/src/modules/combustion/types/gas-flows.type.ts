import { Species } from '../../thermodynamics/enums';

/** Species molar flows [mol/s] */
export type GasFlows = Partial<Record<Species, number>>;
