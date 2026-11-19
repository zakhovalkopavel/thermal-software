import { STANDARD_CONDITIONS } from '../../constants/standard-conditions.constants';
import { EquationValue } from '../../interfaces/equation-value.interface';
import { GAS_COMPOUND_BINDING } from '../../compound/gas/gas-compound-binding';
import { Common } from '../common';
import { EquationValidity } from '../equation-validity';
import { BOILING_TEMPERATURE } from './constants/boiling-temperature.constants';
import { CompoundText } from './compound-text';
import { GasTemperatureBounds } from './interfaces/bounds/gas-temperature-bounds.interface';
import { CompoundDataCompoundFile } from './interfaces/record/compound-data-compound-file.interface';
import { CompoundDataRecord } from './interfaces/record/compound-data-record.interface';
import { CompoundData } from './compound-data';
import { CompoundDataEquationList } from './interfaces/equation/compound-data-equation-list.interface';

/**
 * Gas-phase temperature bounds and boiling temperature at pressure for compound-data records.
 */
export class CompoundGasBounds {
  /**
   * Gas-state temperature window for a compound at pressure P.
   * Tmin is the boiling temperature at P (vapour-pressure solve, else normal Tb).
   */
  static forCompound(
    id: string,
    P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
  ): GasTemperatureBounds {
    const loaded = CompoundGasBounds.loadRecord(id);
    const { record } = loaded;
    const TbNormal = CompoundGasBounds.normalBoilingPoint(record);
    const vpBucket = CompoundGasBounds.equationBucket(record.equations?.vaporPressure?.liquid)
      ?? CompoundGasBounds.equationBucket(record.equations?.vaporPressure?.gas);
    const vpEntry = CompoundGasBounds.pickVaporPressureEquation(vpBucket);
    let boilingPoint_K: number | null = null;
    let boilingPointSource: GasTemperatureBounds['boilingPointSource'] = null;
    let message: string | undefined;

    if (vpEntry) {
      boilingPoint_K = CompoundGasBounds.boilingTemperatureFromVaporPressure(vpEntry, P_Pa);
      if (boilingPoint_K != null) boilingPointSource = 'vaporPressure';
    }

    if (boilingPoint_K == null && TbNormal != null) {
      boilingPoint_K = TbNormal;
      boilingPointSource = 'normalBoilingPoint';
      if (Math.abs(P_Pa - STANDARD_CONDITIONS.PRESSURE_PA) > 1) {
        message =
          'No vapour-pressure solution at the requested P; using the normal boiling point (≈1 atm) as Tmin.';
      }
    }

    const Tmax_K = CompoundGasBounds.gasEquationMax(record);
    const Tmin_K = boilingPoint_K;

    if (Tmin_K != null && Tmax_K != null && Tmin_K >= Tmax_K) {
      message = [
        message,
        `Boiling temperature (${Tmin_K.toFixed(2)} K) is at or above the gas correlation ceiling (${Tmax_K.toFixed(2)} K).`,
      ]
        .filter(Boolean)
        .join(' ');
    }

    return {
      id: loaded.id,
      cas: loaded.cas,
      name: loaded.name,
      formula: loaded.formula,
      displayFormula: loaded.displayFormula,
      P_Pa,
      Tmin_K,
      Tmax_K,
      boilingPoint_K,
      boilingPointSource,
      normalBoilingPoint_K: TbNormal,
      ...(message ? { message } : {}),
    };
  }

  /**
   * Solve Psat(T) = P_Pa inside the equation's published [min, max].
   * Returns null when P is outside the vapour-pressure span or the range is unknown.
   */
  static boilingTemperatureFromVaporPressure(
    entry: EquationValue,
    P_Pa: number,
  ): number | null {
    if (!(P_Pa > 0)) return null;
    if (entry.min == null || entry.max == null) return null;
    const { lo, hi } = EquationValidity.clampLimits(entry.min, entry.max);
    if (!(hi > lo) || !Number.isFinite(lo) || !Number.isFinite(hi)) return null;

    const method = Common.equation(entry.type);
    const k = entry.k ?? 1;
    const psat = (T: number) => method.calculate(T, entry.vars as never, lo, hi, k);

    const pLo = psat(lo);
    const pHi = psat(hi);
    const pMin = Math.min(pLo, pHi);
    const pMax = Math.max(pLo, pHi);
    const tol = BOILING_TEMPERATURE.pressureSpanTolerance;
    if (P_Pa < pMin * (1 - tol) || P_Pa > pMax * (1 + tol)) return null;

    let a = lo;
    let b = hi;
    for (let i = 0; i < BOILING_TEMPERATURE.binarySearchIterations; i++) {
      const mid = 0.5 * (a + b);
      if (psat(mid) < P_Pa) a = mid;
      else b = mid;
    }
    return 0.5 * (a + b);
  }

  /**
   * Prefer an equation whose range covers a nominal temperature, else `values[def]`.
   */
  static pickVaporPressureEquation(
    bucket: { def: number; values: EquationValue[] } | undefined,
    preferT_K = BOILING_TEMPERATURE.preferT_K,
  ): EquationValue | undefined {
    if (!bucket?.values.length) return undefined;
    const covering = bucket.values.find(
      (row) => row.min != null && row.max != null && preferT_K >= row.min && preferT_K <= row.max,
    );
    if (covering) return covering;
    return bucket.values[bucket.def] ?? bucket.values[0];
  }

  private static equationBucket(
    list: CompoundDataEquationList | undefined,
  ): { def: number; values: EquationValue[] } | undefined {
    if (!list?.values.length) return undefined;
    return {
      def: list.def ?? 0,
      values: list.values.map((row) => CompoundData.toEquationValue(row)),
    };
  }

  private static normalBoilingPoint(record: CompoundDataRecord): number | null {
    const rows = record.properties?.boilingPoint;
    if (!rows?.length) return null;
    const value = rows.find((row) => typeof row.value === 'number')?.value;
    return typeof value === 'number' ? value : null;
  }

  private static gasEquationMax(record: CompoundDataRecord): number | null {
    const buckets = [
      CompoundGasBounds.equationBucket(record.equations?.heatCapacity?.gas),
      CompoundGasBounds.equationBucket(record.equations?.viscosity?.gas),
      CompoundGasBounds.equationBucket(record.equations?.thermalConductivity?.gas),
    ].filter(Boolean) as Array<{ def: number; values: EquationValue[] }>;

    const maxima: number[] = [];
    for (const bucket of buckets) {
      for (const row of bucket.values) {
        if (row.max != null && Number.isFinite(row.max)) maxima.push(row.max);
      }
    }
    if (!maxima.length) return null;
    return Math.min(...maxima);
  }

  private static resolveRegistryKey(id: string): string | undefined {
    const binding = (GAS_COMPOUND_BINDING as Record<string, { formula: string; nasa7Key: string }>)[id];
    if (!binding) return undefined;
    const index = CompoundData.loadIndex();
    const hill = CompoundText.hillFormula(binding.formula);
    const candidates = (index.byFormula[hill] ?? [])
      .map((cid) => ({ id: cid, meta: index.compounds[cid] }))
      .filter((row) => row.meta?.nasa7?.includes(binding.nasa7Key));
    return candidates[0]?.id;
  }

  private static loadRecord(id: string): {
    id: string;
    cas: string | null;
    name: string;
    formula: string;
    displayFormula: string;
    record: CompoundDataRecord;
    doc: CompoundDataCompoundFile;
  } {
    const index = CompoundData.loadIndex();
    const registryId = CompoundGasBounds.resolveRegistryKey(id);
    const lookupId = registryId
      ?? (index.compounds[id] ? id : undefined)
      ?? index.byCas?.[id]
      ?? index.byOtherCas[id];
    const meta = lookupId ? index.compounds[lookupId] : undefined;
    if (!meta || !lookupId) throw new Error(`Unknown compound id: ${id}`);
    const doc = CompoundData.loadFile(meta.file);
    const record = doc.entries[meta.entry];
    if (!record) throw new Error(`Compound file ${meta.file} has no entry "${meta.entry}"`);
    return {
      id: lookupId,
      cas: meta.cas ?? null,
      name: meta.name ?? record.name ?? doc.displayFormula,
      formula: meta.hill,
      displayFormula: meta.displayFormula,
      record,
      doc,
    };
  }
}
