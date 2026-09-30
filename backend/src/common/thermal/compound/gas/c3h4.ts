import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/**
 * C3H4 — Propyne (methylacetylene).
 * Mr: sum of standard atomic weights (ref IUPAC2021). ΔHf, ΔGf at 298.15 K: ref Perry9 Table 2-95 (DIPPR 801).
 * Cp, H, S, G(T): NASA datasets.
 * LJ σ, ε/k: ref Poling5 Appendix B.
 * μ: ref Perry8 Table 2-312; λ: ref Perry8 Table 2-314 (DIPPR Eq. 102).
 */
export const C3H4: CompoundValue = {
  name: 'Propyne (methylacetylene)',
  chemicalFormula: 'C3H4',
  Mr: 0.040065,
  /** ref: Perry9 Table 2-95, p. 2-170, no. 197 (Methyl acetylene) — 18.49, 19.384 (J/kmol × 1E-07) */
  enthalpyFormation298: 184900,
  gibbsEnergy298: 193840,
  collisionDiameter: 4.761,
  epsilonToKb: 251.8,
  nasa7Key: 'C3H4,propyne',
  /** NASA RP-1311 set */
  nasa9Key: 'C3H4,propyne',
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 1.163e-6, c2: 0.4787, c3: 316, c4: 0 },
        min: 170.45, max: 800,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 0.00026544, c2: 0.8921, c3: 222.19, c4: 79869 },
        min: 249.94, max: 1000,
      },
    ],
  },
};
