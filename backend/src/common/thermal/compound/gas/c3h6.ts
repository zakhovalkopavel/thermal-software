import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/**
 * C3H6 — Propylene.
 * Mr: sum of standard atomic weights (ref IUPAC2021). ΔHf, ΔGf at 298.15 K: ref Perry9 Table 2-95 (DIPPR 801).
 * Cp, H, S, G(T): NASA datasets.
 * LJ σ, ε/k: ref Poling5 Appendix B.
 * μ: ref Perry8 Table 2-312; λ: ref Perry8 Table 2-314 (DIPPR Eq. 102).
 */
export const C3H6: CompoundValue = {
  name: 'Propylene',
  chemicalFormula: 'C3H6',
  Mr: 0.042081,
  /** ref: Perry9 Table 2-95, p. 2-173, no. 305 — 2.023, 6.264 (J/kmol × 1E-07) */
  enthalpyFormation298: 20230,
  gibbsEnergy298: 62640,
  collisionDiameter: 4.678,
  epsilonToKb: 298.9,
  nasa7Key: 'C3H6,propylene',
  /** NASA RP-1311 set */
  nasa9Key: 'C3H6,propylene',
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 7.3919e-7, c2: 0.5423, c3: 263.73, c4: 0 },
        min: 87.89, max: 1000,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 4.49e-5, c2: 1.2018, c3: 421, c4: 0 },
        min: 225.45, max: 1000,
      },
    ],
  },
};
