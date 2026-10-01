import type { CombustionStepResult } from '../../../src/modules/processes/types/combustion-step-result.type';

/** Lean charcoal burnout at λ = 1.2; override what the test compares. */
export function combustionStepResult(overrides: Partial<CombustionStepResult> = {}): CombustionStepResult {
  return {
    tOut_K: 1850,
    excessAir: 1.2,
    products: {
      moleFlows_mols: { N2: 0.21, O2: 0.009, CO2: 0.045, H2O: 0.012 },
      massFlows_kgs: { N2: 0.00588, O2: 0.000288, CO2: 0.00198, H2O: 0.000216, Ar: 0.00004 },
      moleFractions: { N2: 0.765, O2: 0.033, CO2: 0.164, CO: 0, H2O: 0.037, H2: 0, SO2: 0.001, Ar: 0.0009 },
      massFractions: { N2: 0.7, O2: 0.034, CO2: 0.236, H2O: 0.026, Ar: 0.004 },
    },
    mGas_kgs: 0.0084,
    charCarbon_kgs: 0,
    ash_kgs: 0.00004,
    reactantEnthalpy_W: -1200,
    productEnthalpy_W: -1200,
    heatLoss_W: 0,
    wgsKp: null,
    elementBalanceResidual: 1e-12,
    ...overrides,
  };
}
