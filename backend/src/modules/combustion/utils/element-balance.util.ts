import { Species } from '../../thermodynamics/enums/species.enum';
import { GAS_REGISTRY } from '../../../common/thermal/compound/gas/registry';
import { ATOMIC_MASS, ELEMENTS, Element } from '../constants/combustion.constants';
import { ElementalComposition } from '../data/fuels/fuel.interface';
import { ElementFlows, GasFlows } from '../interfaces/combustion-streams.interface';

const M_H2O = 2 * ATOMIC_MASS.H + ATOMIC_MASS.O;

/** Parse a chemical formula such as 'C3H8' or 'SO2' into atom counts */
export function parseFormula(formula: string): Record<string, number> {
  const atoms: Record<string, number> = {};
  const re = /([A-Z][a-z]?)(\d*)/g;
  let consumed = 0;
  for (let m = re.exec(formula); m && m[0]; m = re.exec(formula)) {
    atoms[m[1]] = (atoms[m[1]] ?? 0) + (m[2] ? Number(m[2]) : 1);
    consumed += m[0].length;
  }
  if (consumed !== formula.length) throw new Error(`Unsupported chemical formula: ${formula}`);
  return atoms;
}

export function emptyElements(): ElementFlows {
  return { C: 0, H: 0, O: 0, N: 0, S: 0 };
}

export function addElements(a: ElementFlows, b: ElementFlows): ElementFlows {
  const out = emptyElements();
  for (const e of ELEMENTS) out[e] = a[e] + b[e];
  return out;
}

/** Species carrying none of C, H, O, N, S (e.g. Ar) pass through combustion unchanged */
export function isInert(species: Species): boolean {
  const atoms = parseFormula(GAS_REGISTRY[species].chemicalFormula);
  return !Object.keys(atoms).some(a => (ELEMENTS as readonly string[]).includes(a));
}

/** Split gas flows into reacting-element flows and inert species flows */
export function elementsOfGas(flows: GasFlows): { elements: ElementFlows; inerts: GasFlows } {
  const elements = emptyElements();
  const inerts: GasFlows = {};
  for (const [sp, n] of Object.entries(flows) as [Species, number][]) {
    if (!n) continue;
    const compound = GAS_REGISTRY[sp];
    if (!compound) throw new Error(`Unknown species: ${sp}`);
    const atoms = parseFormula(compound.chemicalFormula);
    if (isInert(sp)) {
      inerts[sp] = (inerts[sp] ?? 0) + n;
      continue;
    }
    for (const [a, k] of Object.entries(atoms)) {
      if (!(ELEMENTS as readonly string[]).includes(a)) {
        throw new Error(`Species ${sp} contains unsupported element ${a}`);
      }
      elements[a as Element] += k * n;
    }
  }
  return { elements, inerts };
}

/** Atom flows [mol/s] of a condensed fuel stream; moisture contributes H2O */
export function elementsOfCondensed(comp: ElementalComposition, m_kgs: number): ElementFlows {
  const w = comp.moisture ?? 0;
  return {
    C: m_kgs * comp.C / ATOMIC_MASS.C,
    H: m_kgs * (comp.H / ATOMIC_MASS.H + 2 * w / M_H2O),
    O: m_kgs * (comp.O / ATOMIC_MASS.O + w / M_H2O),
    N: m_kgs * comp.N / ATOMIC_MASS.N,
    S: m_kgs * (comp.S ?? 0) / ATOMIC_MASS.S,
  };
}

/** O2 needed for complete combustion to CO2, H2O, SO2, net of the O already bound [mol/s] */
export function stoichiometricO2(el: ElementFlows): number {
  return el.C + el.H / 4 + el.S - el.O / 2;
}

/** Mass flow of an element inventory [kg/s] */
export function elementsMass(el: ElementFlows): number {
  return ELEMENTS.reduce((s, e) => s + el[e] * ATOMIC_MASS[e], 0);
}

/** Largest relative element mismatch between two inventories */
export function elementResidual(a: ElementFlows, b: ElementFlows): number {
  const scale = Math.max(...ELEMENTS.map(e => Math.abs(a[e])), 1e-300);
  return Math.max(...ELEMENTS.map(e => Math.abs(a[e] - b[e]))) / scale;
}

const molarMassCache = new Map<Species, number>();

/**
 * Molar mass [kg/mol] from the formula and ATOMIC_MASS, so that species masses are consistent
 * with element masses (exact mass closure); registry Mr for species with other elements (Ar).
 */
export function speciesMolarMass(species: Species): number {
  let M = molarMassCache.get(species);
  if (M === undefined) {
    const compound = GAS_REGISTRY[species];
    if (!compound) throw new Error(`Unknown species: ${species}`);
    const atoms = Object.entries(parseFormula(compound.chemicalFormula));
    M = atoms.every(([a]) => a in ATOMIC_MASS)
      ? atoms.reduce((s, [a, k]) => s + k * ATOMIC_MASS[a as Element], 0)
      : compound.Mr;
    molarMassCache.set(species, M);
  }
  return M;
}

export function gasMassFlow(flows: GasFlows): number {
  return (Object.entries(flows) as [Species, number][])
    .reduce((s, [sp, n]) => s + (n ?? 0) * speciesMolarMass(sp), 0);
}

export function totalMoles(flows: GasFlows): number {
  return Object.values(flows).reduce((s: number, n) => s + (n ?? 0), 0);
}

export function moleFractions(flows: GasFlows): GasFlows {
  const total = totalMoles(flows);
  const out: GasFlows = {};
  for (const [sp, n] of Object.entries(flows) as [Species, number][]) out[sp] = total > 0 ? n / total : 0;
  return out;
}

export function massFractions(flows: GasFlows): GasFlows {
  const total = gasMassFlow(flows);
  const out: GasFlows = {};
  for (const [sp, n] of Object.entries(flows) as [Species, number][]) {
    out[sp] = total > 0 ? n * speciesMolarMass(sp) / total : 0;
  }
  return out;
}

export function scaleFlows(flows: GasFlows, k: number): GasFlows {
  const out: GasFlows = {};
  for (const [sp, n] of Object.entries(flows) as [Species, number][]) out[sp] = n * k;
  return out;
}

export function sumFlows(...all: GasFlows[]): GasFlows {
  const out: GasFlows = {};
  for (const flows of all) {
    for (const [sp, n] of Object.entries(flows) as [Species, number][]) {
      if (n) out[sp] = (out[sp] ?? 0) + n;
    }
  }
  return out;
}

/**
 * Air stream carrying `o2_mols` of O2 [mol/s].
 * pO2 — O2 vol fraction in dry air (rest N2); wH2Om — water mass per mass of dry air.
 */
export function airFlows(o2_mols: number, pO2: number, wH2Om: number): GasFlows {
  const n2_mols = o2_mols * (1 - pO2) / pO2;
  const mDry_kgs = o2_mols * speciesMolarMass(Species.O2) + n2_mols * speciesMolarMass(Species.N2);
  const flows: GasFlows = { [Species.O2]: o2_mols, [Species.N2]: n2_mols };
  if (wH2Om > 0) flows[Species.H2O] = wH2Om * mDry_kgs / speciesMolarMass(Species.H2O);
  return flows;
}
