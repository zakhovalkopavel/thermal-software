import {
  EquationValidity,
  MixtureValidity,
} from '../../../common/thermal/interfaces/equation-validity.interface';

/**
 * Thermophysical props for one compound.
 *
 * Prefer equations on the compound. When a property bucket is empty and the
 * compound has `composition`, evaluate that property as a mole-fraction mixture.
 */
export type CompoundFluidProps = {
  M: number;
  Cp_J_molK: number;
  Cp_J_kgK: number;
  mu_Pa_s: number;
  lambda: number;
  rho_kg_m3: number;
  nu_m2s: number;
  validity: EquationValidity;
  mixtureValidity?: MixtureValidity;
  cpValidity: EquationValidity;
  muValidity: EquationValidity;
  lambdaValidity: EquationValidity;
};
