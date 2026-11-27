import { CompoundValue } from '../../types/compound-value.type';
import { EquationValue } from '../../types/equation-value.type';
import { CompoundData } from './compound-data';
import { CompoundLiquidData } from './compound-liquid-data';
import { CompoundDataEquationList } from './types/equation/compound-data-equation-list.type';
import { CompoundDataIndexEntry } from './types/dataset/compound-data-index-entry.type';

/**
 * Builds a liquid end-member `CompoundValue` from processed compound-data.
 * Prefers NASA `(L)` keys; gas transport is not required.
 */
export class CompoundLiquidValue {
  static fromId(id: string, preferredNasa9Key?: string): CompoundValue {
    const resolved = CompoundLiquidValue.resolveMeta(id);
    if (!resolved) throw new Error(`Unknown compound id: ${id}`);
    const { meta } = resolved;
    const doc = CompoundData.loadFile(meta.file);
    const record = doc.entries[meta.entry];
    if (!record) throw new Error(`Compound data file ${meta.file} has no entry "${meta.entry}"`);
    if (record.Mr === undefined) throw new Error(`Compound data record ${resolved.id} has no molar mass`);

    const { nasa7Key, nasa9Key } = CompoundLiquidData.nasaKeys(meta, preferredNasa9Key);
    if (!nasa7Key && !nasa9Key) {
      throw new Error(`Compound data has no liquid NASA key for ${resolved.id}`);
    }

    const properties = record.properties ?? {};
    const enthalpy = CompoundLiquidData.liquidPhase(properties.enthalpyFormation298);
    const entropy = CompoundLiquidData.liquidPhase(properties.entropy298);
    const gibbs = CompoundLiquidData.liquidPhase(properties.gibbsEnergy298);
    const heatCapacity = CompoundLiquidValue.equationBucket(
      record.equations?.heatCapacity?.liquid,
      `${resolved.id} liquid heat capacity`,
    );
    const rawName = record.name ?? meta.name ?? doc.displayFormula;
    return {
      name: `${rawName.charAt(0).toUpperCase() + rawName.slice(1)} (liquid)`,
      chemicalFormula: doc.displayFormula,
      Mr: record.Mr,
      ...(enthalpy !== undefined ? { enthalpyFormation298: enthalpy } : {}),
      ...(entropy !== undefined ? { entropy298: entropy } : {}),
      ...(gibbs !== undefined ? { gibbsEnergy298: gibbs } : {}),
      ...(nasa7Key ? { nasa7Key } : {}),
      ...(nasa9Key ? { nasa9Key } : {}),
      ...(heatCapacity ? { heatCapacity } : {}),
    };
  }

  private static resolveMeta(id: string): { id: string; meta: CompoundDataIndexEntry } | undefined {
    const index = CompoundData.loadIndex();
    const direct = index.compounds[id];
    if (direct) return { id, meta: direct };
    const viaCas = index.byCas?.[id];
    if (viaCas && index.compounds[viaCas]) return { id: viaCas, meta: index.compounds[viaCas] };
    const viaOther = index.byOtherCas[id];
    if (viaOther && index.compounds[viaOther]) return { id: viaOther, meta: index.compounds[viaOther] };
    return undefined;
  }

  private static equationBucket(
    list: CompoundDataEquationList | undefined,
    label: string,
  ): { def: number; values: EquationValue[] } | undefined {
    if (!list?.values.length) return undefined;
    const values = list.values.map((row) => CompoundData.toEquationValue(row));
    const def = list.def ?? 0;
    if (def < 0 || def >= values.length) {
      throw new Error(`Compound-data ${label} def ${def} is outside ${values.length} equations`);
    }
    return { def, values };
  }
}
