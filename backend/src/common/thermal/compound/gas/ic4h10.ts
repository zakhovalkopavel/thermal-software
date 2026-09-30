import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/**
 * iC4H10 — Isobutane (2-methylpropane).
 * Mr: sum of standard atomic weights (ref IUPAC2021). ΔHf, ΔGf at 298.15 K: ref Perry9 Table 2-95 (DIPPR 801).
 * Cp, H, S, G(T): NASA datasets.
 * LJ σ, ε/k: ref Poling5 Appendix B.
 * μ: ref Perry8 Table 2-312; λ: ref Perry8 Table 2-314 (DIPPR Eq. 102).
 */
export const iC4H10: CompoundValue = {
  name: 'Isobutane',
  chemicalFormula: 'C4H10',
  Mr: 0.058124,
  /** ref: Perry9 Table 2-95, p. 2-171, no. 236 (2-Methylpropane) — −13.499, −2.144 (J/kmol × 1E-07) */
  enthalpyFormation298: -134990,
  gibbsEnergy298: -21440,
  collisionDiameter: 5.278,
  epsilonToKb: 330.1,
  nasa7Key: 'C4H10,isobutane',
  /** NASA RP-1311 set */
  nasa9Key: 'C4H10,isobutane',
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 1.0871e-7, c2: 0.78135, c3: 70.639, c4: 0 },
        min: 150, max: 1000,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 0.089772, c2: 0.18501, c3: 639.23, c4: 1114700 },
        min: 261.43, max: 1000,
      },
    ],
  },
};
