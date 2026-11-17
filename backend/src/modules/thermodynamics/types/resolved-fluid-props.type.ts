import {
  EquationValidity,
  MixtureValidity,
} from '../../../common/thermal/interfaces/equation-validity.interface';

/** Resolved fluid transport properties — output of Mode B resolution. */
export type ResolvedFluidProps = {
  rho_kg_m3: number;
  mu_Pa_s: number;
  Cp_J_kgK: number;
  lambda: number;
  nu_m2s: number;
  validity?: EquationValidity;
  mixtureValidity?: MixtureValidity;
};
