import { CompoundValue } from '../interfaces/compound-value.interface';
import { EquationValue } from '../interfaces/equation-value.interface';
import { RefKey } from '../dto/ref-key.dto';
import { Nasa7EquationMethod } from './nasa7-equation-method';
import { Common } from './common';

/**
 * Preferred approximation selector.
 * Pass either a numeric index into the property's `values` array,
 * or a RefKey to select by literature source.
 * Omit (undefined) to use the property's `def` default.
 */
export type PreferredApprox = number | RefKey;

/**
 * Resolves a single property value (Cp, μ, λ …) from a compound's
 * multi-approximation bucket.
 *
 * Selection priority:
 *   1. `preferred` as numeric index     → values[preferred]
 *   2. `preferred` as RefKey            → first entry whose ref === preferred
 *   3. undefined                        → values[def]  (the default)
 *
 * If the preferred entry is not found, falls back to the default silently.
 */
function resolveEntry(
  bucket: { def: number; values: EquationValue[] },
  preferred?: PreferredApprox,
): EquationValue {
  const { def, values } = bucket;
  if (preferred === undefined) return values[def];

  if (typeof preferred === 'number') {
    return values[preferred] ?? values[def];
  }
  // RefKey lookup
  const byRef = values.find(v => v.ref === preferred);
  return byRef ?? values[def];
}

/**
 * Hides all property calculation details from callers.
 * Use this instead of accessing compound data directly.
 */
export class CompoundPropertyResolver {
  private readonly _nasa7 = new Nasa7EquationMethod();

  constructor(private readonly compound: CompoundValue) {}

  // ─── Heat capacity ──────────────────────────────────────────────────────────

  /**
   * Isobaric molar heat capacity Cp [J/(mol·K)] at temperature T [K].
   * @param preferred  Index or RefKey to select approximation; default uses `def`.
   */
  heatCapacity(T: number, preferred?: PreferredApprox): number {
    if (preferred === undefined && this.compound.nasa7) {
      return this._nasa7.calculate(
        T, this.compound.nasa7,
        this.compound.nasa7 ? 200 : 0,
        this.compound.nasa7 ? 6000 : Infinity,
      );
    }
    const entry = resolveEntry(this.compound.heatCapacity, preferred);
    return Common.equation(entry.type).calculate(T, entry.vars as never, entry.min, entry.max, entry.k ?? 1);
  }

  /**
   * Average Cp [J/(mol·K)] over [T1, T2].
   * @param preferred  Index or RefKey to select approximation; default uses nasa7 if available.
   */
  heatCapacityAverage(T1: number, T2: number, preferred?: PreferredApprox): number {
    if (preferred === undefined && this.compound.nasa7) {
      const n = this.compound.nasa7;
      return this._nasa7.calculateAverage(T1, T2, n, 200, 6000);
    }
    const entry = resolveEntry(this.compound.heatCapacity, preferred);
    return Common.equation(entry.type).calculateAverage(T1, T2, entry.vars as never, entry.min, entry.max, entry.k ?? 1);
  }

  // ─── Enthalpy ───────────────────────────────────────────────────────────────

  /**
   * Molar enthalpy H [J/mol] at temperature T [K].
   * Requires nasa7 data; returns NaN if unavailable.
   */
  enthalpy(T: number): number {
    if (!this.compound.nasa7) return NaN;
    return this._nasa7.enthalpy(T, this.compound.nasa7);
  }

  // ─── Entropy ────────────────────────────────────────────────────────────────

  /**
   * Molar entropy S [J/(mol·K)] at temperature T [K].
   * Requires nasa7 data; returns NaN if unavailable.
   */
  entropy(T: number): number {
    if (!this.compound.nasa7) return NaN;
    return this._nasa7.entropy(T, this.compound.nasa7);
  }

  // ─── Gibbs energy ───────────────────────────────────────────────────────────

  /**
   * Molar Gibbs free energy G = H − T·S [J/mol] at temperature T [K].
   * Requires nasa7 data; returns NaN if unavailable.
   */
  gibbsEnergy(T: number): number {
    if (!this.compound.nasa7) return NaN;
    return this._nasa7.gibbsEnergy(T, this.compound.nasa7);
  }

  // ─── Viscosity ──────────────────────────────────────────────────────────────

  /**
   * Dynamic viscosity μ [Pa·s] at temperature T [K].
   * @param preferred  Index or RefKey to select approximation; default uses `def`.
   */
  viscosity(T: number, preferred?: PreferredApprox): number {
    const entry = resolveEntry(this.compound.viscosity, preferred);
    return Common.equation(entry.type).calculate(T, entry.vars as never, entry.min, entry.max, entry.k ?? 1);
  }

  // ─── Thermal conductivity ───────────────────────────────────────────────────

  /**
   * Thermal conductivity λ [W/(m·K)] at temperature T [K].
   * @param preferred  Index or RefKey to select approximation; default uses `def`.
   */
  thermalConductivity(T: number, preferred?: PreferredApprox): number {
    const entry = resolveEntry(this.compound.thermalConductivity, preferred);
    return Common.equation(entry.type).calculate(T, entry.vars as never, entry.min, entry.max, entry.k ?? 1);
  }
}

