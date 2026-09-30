import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/**
 * C2H2 — Acetylene.
 * Mr: sum of standard atomic weights (ref IUPAC2021). ΔHf, ΔGf at 298.15 K: ref Perry9 Table 2-95 (DIPPR 801).
 * Cp, H, S, G(T): NASA datasets.
 * LJ σ, ε/k: ref Poling5 Appendix B.
 * μ: ref Perry8 Table 2-312; λ: ref Perry8 Table 2-314 (DIPPR Eq. 102).
 */
export const C2H2: CompoundValue = {
  name: 'Acetylene',
  chemicalFormula: 'C2H2',
  Mr: 0.026038,
  /** ref: Perry9 Table 2-95, p. 2-167, no. 7 — 22.82, 21.068 (J/kmol × 1E-07) */
  enthalpyFormation298: 228200,
  gibbsEnergy298: 210680,
  collisionDiameter: 4.033,
  epsilonToKb: 231.8,
  nasa7Key: 'C2H2,acetylene',
  /** NASA RP-1311 set */
  nasa9Key: 'C2H2,acetylene',
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 1.2025e-6, c2: 0.4952, c3: 291.4, c4: 0 },
        min: 192.4, max: 600,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 7.5782e-5, c2: 1.0327, c3: -36.227, c4: 31432 },
        min: 189.35, max: 1000,
      },
    ],
  },
};
