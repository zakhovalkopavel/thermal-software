import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/**
 * C3H8 — Propane.
 * Mr: sum of standard atomic weights (ref IUPAC2021). ΔHf, ΔGf at 298.15 K: ref Perry9 Table 2-95 (DIPPR 801).
 * Cp, H, S, G(T): NASA datasets.
 * LJ σ, ε/k: ref Poling5 Appendix B.
 * μ: ref Perry8 Table 2-312; λ: ref Perry8 Table 2-314 (DIPPR Eq. 102).
 */
export const C3H8: CompoundValue = {
  name: 'Propane',
  chemicalFormula: 'C3H8',
  Mr: 0.044097,
  /** ref: Perry9 Table 2-95, p. 2-172, no. 295 — −10.468, −2.439 (J/kmol × 1E-07) */
  enthalpyFormation298: -104680,
  gibbsEnergy298: -24390,
  collisionDiameter: 5.118,
  epsilonToKb: 237.1,
  /** ref: Eakin1963 Table 1 — B = 6.805 μP, S = 502.4 °R; exact unit conversion to T0 = 273.15 K */
  sutherlandParams: { mu0: 7.4631e-6, T0: 273.15, S: 279.11 },
  nasa7Key: 'C3H8',
  /** NASA RP-1311 set */
  nasa9Key: 'C3H8',
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 4.9054e-8, c2: 0.90125, c3: 0, c4: 0 },
        min: 85.47, max: 1000,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: -1.12, c2: 0.10972, c3: -9834.6, c4: -7535800 },
        min: 231.11, max: 1000,
      },
    ],
  },
};
