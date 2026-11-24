import type { FluidCpResult } from '../types/fluid-cp-result.type';
import type { PureGasPropertyRow } from '../types/pure-gas-property-row.type';
import type { ScalarDimensionlessResult } from '../types/scalar-dimensionless-result.type';

/** Cp endpoint (Cp, Cv, γ, M) + Prandtl endpoint (Pr and the resolved ρ, μ, ν, λ) → one row; missing parts stay undefined. */
export function toPureGasRow(
  gas: string,
  T_K: number,
  cp: FluidCpResult | undefined,
  prandtl: ScalarDimensionlessResult | undefined,
  errors: unknown[],
): PureGasPropertyRow {
  const fluid = prandtl?.resolvedFluid;
  return {
    gas,
    T_K,
    Cp_J_kgK: cp?.Cp_J_kgK ?? fluid?.Cp_J_kgK,
    Cv_J_kgK: cp?.Cv_J_kgK,
    gamma: cp?.gamma,
    molecularWeight_kg_mol: cp?.molecularWeight_kg_mol,
    mu_Pa_s: fluid?.mu_Pa_s,
    nu_m2s: fluid?.nu_m2s,
    rho_kg_m3: fluid?.rho_kg_m3,
    lambda_WmK: fluid?.lambda,
    Pr: prandtl?.value,
    errors,
  };
}
