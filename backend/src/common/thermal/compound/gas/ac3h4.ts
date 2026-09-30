import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';

/**
 * aC3H4 — Propadiene (allene).
 * Mr: sum of standard atomic weights (ref IUPAC2021). ΔHf, ΔGf at 298.15 K: ref Perry9 Table 2-95 (DIPPR 801).
 * Cp, H, S, G(T): NASA datasets.
 * No LJ σ, ε/k: propadiene is not listed in Poling5 Appendix B.
 * μ: ref Perry8 Table 2-312; λ: ref Perry8 Table 2-314 (DIPPR Eq. 102).
 */
export const aC3H4: CompoundValue = {
  name: 'Propadiene (allene)',
  chemicalFormula: 'C3H4',
  Mr: 0.040065,
  /** ref: Perry9 Table 2-95, p. 2-172, no. 294 (Propadiene) — 19.05, 20.08 (J/kmol × 1E-07) */
  enthalpyFormation298: 190500,
  gibbsEnergy298: 200800,
  nasa7Key: 'C3H4,allene',
  /** NASA RP-1311 set */
  nasa9Key: 'C3H4,allene',
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 6.0758e-7, c2: 0.53845, c3: 173.45, c4: 0 },
        min: 136.87, max: 1000,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 6.1629e-5, c2: 1.0731, c3: 1.8579, c4: 70128 },
        min: 238.65, max: 1000,
      },
    ],
  },
};
