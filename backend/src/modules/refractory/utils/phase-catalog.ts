import { molarMassGramsPerMol } from '../../../common/chemistry/compounds/molar-mass-grams-per-mol.util';
import { PHASE_CATALOG } from '../data/phase-catalog.data';
import type { PhaseCatalogEntry } from '../types/phase-catalog-entry.type';

/** Lookup helpers for {@link PHASE_CATALOG}. */
export class PhaseCatalog {
  private static byId = new Map(PHASE_CATALOG.map(entry => [entry.phaseId, entry]));

  static get(phaseId: string): PhaseCatalogEntry | undefined {
    return PhaseCatalog.byId.get(phaseId);
  }

  /** Oxide mass fractions of one mole of the phase, normalised to 100 wt% of its oxides. */
  static oxideComposition_wt(phaseId: string): Record<string, number> | undefined {
    const entry = PhaseCatalog.get(phaseId);
    if (!entry || entry.inert) return undefined;
    const moles = entry.oxides;
    const keys = Object.keys(moles);
    if (keys.length === 0) return undefined;
    let totalMass = 0;
    const masses: Record<string, number> = {};
    for (const key of keys) {
      const mass = moles[key] * molarMassGramsPerMol(key);
      masses[key] = mass;
      totalMass += mass;
    }
    if (totalMass <= 0) return undefined;
    return Object.fromEntries(keys.map(key => [key, (100 * masses[key]) / totalMass]));
  }
}
