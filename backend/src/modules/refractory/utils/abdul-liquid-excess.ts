import { AbdulLiquid } from './abdul-liquid';

type Species = 'ALL' | 'CAOL' | 'SIO2L';

/**
 * Redlich–Kister excess among Abdul liquid oxide end-members ALL (AlO1.5), CAOL, SIO2L.
 * Associates (ASL, CSL, …) are not speciated — this is the allowed partial-excess rung.
 */
export class AbdulLiquidExcess {
  /**
   * Excess Gibbs [J] for the liquid amount given as oxide moles (batch basis).
   * Returns 0 when the composition is outside CAS or excess rows cannot be evaluated.
   */
  static excessGibbs_J(liquidOxideMoles: Record<string, number>, temperature_C: number): number {
    const speciesMoles = AbdulLiquidExcess.toSpeciesMoles(liquidOxideMoles);
    const total = Object.values(speciesMoles).reduce((sum, n) => sum + n, 0);
    if (total <= 0) return 0;
    const y: Record<Species, number> = {
      ALL: speciesMoles.ALL / total,
      CAOL: speciesMoles.CAOL / total,
      SIO2L: speciesMoles.SIO2L / total,
    };
    let gEx_Jmol = 0;
    for (const row of AbdulLiquid.excessParameters()) {
      const parsed = AbdulLiquidExcess.parseBinary(row.parameter);
      if (!parsed) continue;
      const [a, b, order] = parsed;
      if (!(a in y) || !(b in y)) continue;
      const L = AbdulLiquid.evaluateParameter(row, temperature_C);
      if (!Number.isFinite(L)) continue;
      gEx_Jmol += y[a] * y[b] * L * (y[a] - y[b]) ** order;
    }
    return gEx_Jmol * total;
  }

  /** Al2O3 → 2 ALL; CaO → CAOL; SiO2 → SIO2L. Other oxides ignored. */
  static toSpeciesMoles(oxideMoles: Record<string, number>): Record<Species, number> {
    return {
      ALL: 2 * (oxideMoles.Al2O3 ?? 0),
      CAOL: oxideMoles.CaO ?? 0,
      SIO2L: oxideMoles.SiO2 ?? 0,
    };
  }

  private static parseBinary(parameter: string): [Species, Species, number] | undefined {
    const match = parameter.match(/^L\(LIQUID,([A-Z0-9]+),([A-Z0-9]+);(\d+)\)$/);
    if (!match) return undefined;
    const a = match[1] as Species;
    const b = match[2] as Species;
    if (!AbdulLiquidExcess.isSpecies(a) || !AbdulLiquidExcess.isSpecies(b)) return undefined;
    return [a, b, Number(match[3])];
  }

  private static isSpecies(value: string): value is Species {
    return value === 'ALL' || value === 'CAOL' || value === 'SIO2L';
  }
}
