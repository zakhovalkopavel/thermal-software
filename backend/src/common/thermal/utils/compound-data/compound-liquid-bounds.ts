import { STANDARD_CONDITIONS } from '../../constants/standard-conditions.constants';
import { EquationValue } from '../../types/equation-value.type';
import { CompoundGasBounds } from './compound-gas-bounds';
import { CompoundLiquidValue } from './compound-liquid-value';
import { CompoundData } from './compound-data';
import { LiquidTemperatureBounds } from './types/bounds/liquid-temperature-bounds.type';
import { CompoundDataCompoundFile } from './types/record/compound-data-compound-file.type';
import { CompoundDataRecord } from './types/record/compound-data-record.type';
import { CompoundDataEquationList } from './types/equation/compound-data-equation-list.type';
import { CompoundDataIndexEntry } from './types/dataset/compound-data-index-entry.type';

/**
 * Liquid-phase temperature bounds for compound-data records with full liquid transport.
 */
export class CompoundLiquidBounds {
  /**
   * Liquid-state temperature window at pressure P.
   * Tmin = melting point (else min of liquid equation mins).
   * Tmax = boiling temperature at P, capped by liquid equation maxima.
   */
  static forCompound(
    id: string,
    P_Pa: number = STANDARD_CONDITIONS.PRESSURE_PA,
  ): LiquidTemperatureBounds {
    const loaded = CompoundLiquidBounds.loadRecord(id);
    const { record, meta } = loaded;
    const capable = CompoundLiquidValue.hasTransport(meta);
    const meltingPoint_K = CompoundLiquidBounds.meltingPoint(record);
    const TbNormal = CompoundLiquidBounds.normalBoilingPoint(record);
    const vpBucket = CompoundLiquidBounds.equationBucket(record.equations?.vaporPressure?.liquid)
      ?? CompoundLiquidBounds.equationBucket(record.equations?.vaporPressure?.gas);
    const vpEntry = CompoundGasBounds.pickVaporPressureEquation(vpBucket);

    let boilingPoint_K: number | null = null;
    let boilingPointSource: LiquidTemperatureBounds['boilingPointSource'] = null;
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
          'No vapour-pressure solution at the requested P; using the normal boiling point (≈1 atm) as Tmax.';
      }
    }

    const eqMin = CompoundLiquidBounds.liquidEquationMin(record);
    const eqMax = CompoundLiquidBounds.liquidEquationMax(record);
    const Tmin_K = meltingPoint_K ?? eqMin;
    let Tmax_K: number | null = null;
    if (boilingPoint_K != null && eqMax != null) Tmax_K = Math.min(boilingPoint_K, eqMax);
    else Tmax_K = boilingPoint_K ?? eqMax;

    if (!capable) {
      message = [message, 'Compound has no full liquid transport set (μ, λ, ρ, Cp).']
        .filter(Boolean)
        .join(' ');
    }
    if (Tmin_K != null && Tmax_K != null && Tmin_K >= Tmax_K) {
      message = [
        message,
        `Liquid Tmin (${Tmin_K.toFixed(2)} K) is at or above Tmax (${Tmax_K.toFixed(2)} K).`,
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
      capable,
      Tmin_K: capable ? Tmin_K : null,
      Tmax_K: capable ? Tmax_K : null,
      meltingPoint_K,
      boilingPoint_K,
      boilingPointSource,
      normalBoilingPoint_K: TbNormal,
      ...(message ? { message } : {}),
    };
  }

  private static meltingPoint(record: CompoundDataRecord): number | null {
    const rows = record.properties?.meltingPoint;
    if (!rows?.length) return null;
    const value = rows.find((row) => typeof row.value === 'number')?.value;
    return typeof value === 'number' ? value : null;
  }

  private static normalBoilingPoint(record: CompoundDataRecord): number | null {
    const rows = record.properties?.boilingPoint;
    if (!rows?.length) return null;
    const value = rows.find((row) => typeof row.value === 'number')?.value;
    return typeof value === 'number' ? value : null;
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

  private static liquidEquationBuckets(record: CompoundDataRecord): Array<{ def: number; values: EquationValue[] }> {
    return [
      CompoundLiquidBounds.equationBucket(record.equations?.heatCapacity?.liquid),
      CompoundLiquidBounds.equationBucket(record.equations?.viscosity?.liquid),
      CompoundLiquidBounds.equationBucket(record.equations?.thermalConductivity?.liquid),
      CompoundLiquidBounds.equationBucket(record.equations?.density?.liquid),
    ].filter(Boolean) as Array<{ def: number; values: EquationValue[] }>;
  }

  private static liquidEquationMin(record: CompoundDataRecord): number | null {
    const minima: number[] = [];
    for (const bucket of CompoundLiquidBounds.liquidEquationBuckets(record)) {
      for (const row of bucket.values) {
        if (row.min != null && Number.isFinite(row.min)) minima.push(row.min);
      }
    }
    if (!minima.length) return null;
    return Math.max(...minima);
  }

  private static liquidEquationMax(record: CompoundDataRecord): number | null {
    const maxima: number[] = [];
    for (const bucket of CompoundLiquidBounds.liquidEquationBuckets(record)) {
      for (const row of bucket.values) {
        if (row.max != null && Number.isFinite(row.max)) maxima.push(row.max);
      }
    }
    if (!maxima.length) return null;
    return Math.min(...maxima);
  }

  private static loadRecord(id: string): {
    id: string;
    cas: string | null;
    name: string;
    formula: string;
    displayFormula: string;
    record: CompoundDataRecord;
    meta: CompoundDataIndexEntry;
    doc: CompoundDataCompoundFile;
  } {
    const index = CompoundData.loadIndex();
    const lookupId =
      (index.compounds[id] ? id : undefined)
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
      meta,
      doc,
    };
  }
}
