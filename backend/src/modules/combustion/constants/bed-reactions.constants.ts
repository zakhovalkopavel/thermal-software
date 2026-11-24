import { Species } from '../../thermodynamics/enums';
import { GasFlows, ReactionId } from '../types';

const STOICH: Record<ReactionId, GasFlows> = {
  r1:  { [Species.O2]: -1, [Species.CO2]: 1 },
  r2:  { [Species.O2]: -1, [Species.CO]: 2 },
  r3:  { [Species.CO2]: -1, [Species.CO]: 2 },
  r31: { [Species.H2O]: -1, [Species.CO]: 1, [Species.H2]: 1 },
  r32: { [Species.H2O]: -2, [Species.CO2]: 1, [Species.H2]: 2 },
  r33: { [Species.H2]: -2, [Species.CH4]: 1 },
  r4:  { [Species.CO]: -2, [Species.O2]: -1, [Species.CO2]: 2 },
  r41: { [Species.H2]: -2, [Species.O2]: -1, [Species.H2O]: 2 },
  r42: { [Species.CH4]: -1, [Species.O2]: -2, [Species.CO2]: 1, [Species.H2O]: 2 },
};

/**
 * Bed reactions — kinetics and heats from legacy furnaceCombustion/modules/ChemicalKinetics.js, taken without changes.
 * Refs: Laurendeau1978 pp. 221–270 (char surface reactions); Turns2012 pp. 120–145 (gas phase);
 *       Higman2008 pp. 78–95 (Boudouard, water-gas).
 * Rates r = A·exp(−E/(R·T))·Π p_i [atm]; surface rates per bed volume [mol/(m³·s)].
 */
export const BED_REACTIONS = {
  /** Stoichiometry of the gas species (char carbon is implicit) */
  STOICH,
  IDS: Object.keys(STOICH) as ReactionId[],
  /** Char carbon consumed per unit extent */
  CARBON_PER_EXTENT: { r1: 1, r2: 2, r3: 1, r31: 1, r32: 1, r33: 1 } as Partial<Record<ReactionId, number>>,
  /** Activation energies [J/mol] */
  E: {
    E1:  140000,        // C + O2 → CO2
    E2:  1.1 * 140000,  // 2C + O2 → 2CO
    E3:  2.2 * 140000,  // C + CO2 → 2CO (Boudouard)
    E31: 1.6 * 140000,  // C + H2O → CO + H2
    E32: 240000,        // C + 2H2O → CO2 + 2H2
    E33: 80000,         // C + 2H2 → CH4
    E4:  96300,         // 2CO + O2 → 2CO2
    E41: 70000,         // 2H2 + O2 → 2H2O
    E42: 125000,        // CH4 + 2O2 → CO2 + 2H2O
    E43: 90000,         // CO + H2O ⇌ CO2 + H2
  },
  /** Pre-exponential factors (literature-based, tuned) */
  A: {
    A1: 1e7,  A2: 5e6,  A3: 1e5,  A31: 1e4,
    A32: 1e4, A33: 1e3, A4: 1e10, A41: 1e11,
    A42: 1e9, A43: 1e7,
  },
  /** Standard heats of reaction [J/mol of reaction as written in E comments] */
  DH: {
    dH1: -393500, dH2: -110500, dH3: 172000, dH31: 131000, dH32: 90000,
    dH33: -75000, dH4: -283000, dH41: -241800, dH42: -802000, dH43: -41000,
  },
} as const;
