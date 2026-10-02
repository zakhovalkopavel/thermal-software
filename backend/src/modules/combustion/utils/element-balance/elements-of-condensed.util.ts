import { COMPOUND_LIBRARY } from '../../../../common/chemistry';
import { ATOMIC_MASS } from '../../constants';
import { ElementalComposition } from '../../interfaces';
import { ElementFlows } from '../../types';

const M_H2O = COMPOUND_LIBRARY.H2O.molarMass_kg_mol;

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
