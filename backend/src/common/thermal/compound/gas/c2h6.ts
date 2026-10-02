import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationTypeDto } from '../../dto/equation-type.dto';
import { RefKey } from '../../enum/ref-key.enum';
import { COMPOUND_LIBRARY } from '../../../chemistry';

/**
 * C2H6 — Ethane.
 * Mr: sum of standard atomic weights (ref IUPAC2021). ΔHf, ΔGf at 298.15 K: ref Perry9 Table 2-95 (DIPPR 801).
 * Cp, H, S, G(T): NASA datasets.
 * LJ σ, ε/k: ref Poling5 Appendix B.
 * μ: ref Perry8 Table 2-312; λ: ref Perry8 Table 2-314 (DIPPR Eq. 102).
 */
export const C2H6: CompoundValue = {
  name: 'Ethane',
  chemicalFormula: 'C2H6',
  Mr: COMPOUND_LIBRARY.C2H6.molarMass_kg_mol,
  /** ref: Perry9 Table 2-95, p. 2-169, no. 125 — −8.382, −3.192 (J/kmol × 1E-07) */
  enthalpyFormation298: -83820,
  gibbsEnergy298: -31920,
  collisionDiameter: 4.443,
  epsilonToKb: 215.7,
  /** ref: Eakin1963 Table 1 — B = 7.461 μP, S = 466.2 °R; exact unit conversion to T0 = 273.15 K */
  sutherlandParams: { mu0: 8.4918e-6, T0: 273.15, S: 259.0 },
  nasa7Key: 'C2H6',
  /** NASA RP-1311 set */
  nasa9Key: 'C2H6',
  viscosity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 2.5906e-7, c2: 0.67988, c3: 98.902, c4: 0 },
        min: 90.35, max: 1000,
      },
    ],
  },
  thermalConductivity: {
    def: 0,
    values: [
      {
        type: EquationTypeDto.dipprN102,
        ref: RefKey.Perry8,
        vars: { c1: 7.3869e-5, c2: 1.1689, c3: 500.73, c4: 0 },
        min: 184.55, max: 1000,
      },
    ],
  },
};
