import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationValue } from '../../interfaces/equation-value.interface';
import { CompoundText } from './compound-text';
import { GasCompoundQuery } from './types/gas-compound-query.type';
import { CompoundDataIndexEntry } from './interfaces/dataset/compound-data-index-entry.interface';
import { CompoundDataEquationList } from './interfaces/equation/compound-data-equation-list.interface';
import { CompoundDataEquationValue } from './interfaces/equation/compound-data-equation-value.interface';
import { CompoundDataPropertyValue } from './interfaces/property/compound-data-property-value.interface';
import { CompoundDataCompoundFile } from './interfaces/record/compound-data-compound-file.interface';
import { CompoundDataRecord } from './interfaces/record/compound-data-record.interface';
import { CompoundData } from './compound-data';

/**
 * Builds a `CompoundValue` from processed compound-data (registry binding or catalogue id).
 */
export class CompoundValueBuilder {
  /**
   * One `CompoundValue` for a `GAS_REGISTRY` key.
   * Gas-phase equations and the first gas-phase formation values are kept.
   * Lennard-Jones σ is converted from metres to angstroms.
   */
  static forGas(key: string, query: GasCompoundQuery): CompoundValue {
    const { doc, record } = CompoundValueBuilder.matchingRecord(key, query);
    const properties = record.properties ?? {};
    const gasViscosity = record.equations?.viscosity?.gas?.values ?? [];
    const viscosity = CompoundValueBuilder.equationBucket(
      record.equations?.viscosity?.gas,
      `${key} viscosity`,
    );
    const thermalConductivity = CompoundValueBuilder.equationBucket(
      record.equations?.thermalConductivity?.gas,
      `${key} thermal conductivity`,
    );
    if (!viscosity) throw new Error(`Compound data has no gas viscosity for ${key}`);
    if (!thermalConductivity) {
      throw new Error(`Compound data has no gas thermal conductivity for ${key}`);
    }

    const molarMass = record.Mr;
    if (molarMass === undefined) throw new Error(`Compound data record for ${key} has no molar mass`);
    const sigma = CompoundValueBuilder.lennardJones(properties.collisionDiameter);
    const epsilon = CompoundValueBuilder.lennardJones(properties.epsilonToKb);
    const rawName = record.name ?? doc.displayFormula;
    const enthalpy = CompoundValueBuilder.gasPhase(properties.enthalpyFormation298);
    const gibbs = CompoundValueBuilder.gasPhase(properties.gibbsEnergy298);
    const sutherland = CompoundValueBuilder.sutherlandParams(gasViscosity);
    const heatCapacity = CompoundValueBuilder.equationBucket(
      record.equations?.heatCapacity?.gas,
      `${key} heat capacity`,
    );
    return {
      name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
      chemicalFormula: doc.displayFormula,
      Mr: molarMass,
      ...(enthalpy !== undefined ? { enthalpyFormation298: enthalpy } : {}),
      ...(gibbs !== undefined ? { gibbsEnergy298: gibbs } : {}),
      ...(sigma ? { collisionDiameter: sigma.value * 1e10 } : {}),
      ...(epsilon ? { epsilonToKb: epsilon.value } : {}),
      ...(sutherland ? { sutherlandParams: sutherland } : {}),
      nasa7Key: query.nasa7Key,
      ...(query.nasa9Key ? { nasa9Key: query.nasa9Key } : {}),
      ...(heatCapacity ? { heatCapacity } : {}),
      viscosity,
      thermalConductivity,
    };
  }

  /**
   * Build a `CompoundValue` from a public `compoundId` (name slug), or a CAS via `byCas` / `byOtherCas`.
   * Requires gas viscosity + thermal conductivity; Cp may come from equations or NASA keys.
   */
  static fromId(id: string): CompoundValue {
    const resolved = CompoundValueBuilder.resolveMeta(id);
    if (!resolved) throw new Error(`Unknown compound id: ${id}`);
    const { meta } = resolved;
    const doc = CompoundData.loadFile(meta.file);
    const record = doc.entries[meta.entry];
    if (!record) throw new Error(`Compound data file ${meta.file} has no entry "${meta.entry}"`);
    if (record.Mr === undefined) {
      throw new Error(`Compound data record ${resolved.id} has no molar mass`);
    }

    const properties = record.properties ?? {};
    const gasViscosity = record.equations?.viscosity?.gas?.values ?? [];
    const viscosity = CompoundValueBuilder.equationBucket(
      record.equations?.viscosity?.gas,
      `${resolved.id} viscosity`,
    );
    const thermalConductivity = CompoundValueBuilder.equationBucket(
      record.equations?.thermalConductivity?.gas,
      `${resolved.id} thermal conductivity`,
    );
    if (!viscosity) throw new Error(`Compound data has no gas viscosity for ${resolved.id}`);
    if (!thermalConductivity) {
      throw new Error(`Compound data has no gas thermal conductivity for ${resolved.id}`);
    }

    const heatCapacity = CompoundValueBuilder.equationBucket(
      record.equations?.heatCapacity?.gas,
      `${resolved.id} heat capacity`,
    );
    const nasa7Key = meta.nasa7?.[0];
    const nasa9Key = meta.nasa9?.[0];
    if (!heatCapacity && !nasa7Key && !nasa9Key) {
      throw new Error(`Compound data has no gas heat capacity or NASA keys for ${resolved.id}`);
    }

    const rawName = record.name ?? meta.name ?? doc.displayFormula;
    const sigma = CompoundValueBuilder.lennardJones(properties.collisionDiameter);
    const epsilon = CompoundValueBuilder.lennardJones(properties.epsilonToKb);
    const enthalpy = CompoundValueBuilder.gasPhase(properties.enthalpyFormation298);
    const gibbs = CompoundValueBuilder.gasPhase(properties.gibbsEnergy298);
    const sutherland = CompoundValueBuilder.sutherlandParams(gasViscosity);

    return {
      name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
      chemicalFormula: doc.displayFormula,
      Mr: record.Mr,
      ...(enthalpy !== undefined ? { enthalpyFormation298: enthalpy } : {}),
      ...(gibbs !== undefined ? { gibbsEnergy298: gibbs } : {}),
      ...(sigma ? { collisionDiameter: sigma.value * 1e10 } : {}),
      ...(epsilon ? { epsilonToKb: epsilon.value } : {}),
      ...(sutherland ? { sutherlandParams: sutherland } : {}),
      ...(nasa7Key ? { nasa7Key } : {}),
      ...(nasa9Key ? { nasa9Key } : {}),
      ...(heatCapacity ? { heatCapacity } : {}),
      viscosity,
      thermalConductivity,
    };
  }

  private static gasPhase(rows: CompoundDataPropertyValue[] | undefined): number | undefined {
    return rows?.find((row) => row.phase === 'gas')?.value;
  }

  private static lennardJones(
    rows: CompoundDataPropertyValue[] | undefined,
  ): CompoundDataPropertyValue | undefined {
    return rows?.find((row) => row.potential === 'lennardJones');
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

  private static sutherlandParams(
    rows: CompoundDataEquationValue[],
  ): CompoundValue['sutherlandParams'] {
    const row = rows.find((equation) => equation.type === 'sutherland');
    if (!row) return undefined;
    const vars = row.vars as { y0?: number; T0?: number; S?: number };
    if (typeof vars.y0 !== 'number' || typeof vars.T0 !== 'number' || typeof vars.S !== 'number') {
      throw new Error('Compound-data Sutherland equation is missing y0, T0 or S');
    }
    return { mu0: vars.y0, T0: vars.T0, S: vars.S, min: row.min, max: row.max };
  }

  /**
   * Isotopic / mass-labelled records (D2O, H2[18O], …) often share the parent's NASA keys.
   * Detected from the display name — not from `formula`.
   */
  private static isLabelled(meta: CompoundDataIndexEntry): boolean {
    const name = meta.name ?? '';
    if (/[0-9()]/.test(name)) return true;
    return /\b(deuterium|tritium|tritiated)\b/i.test(name);
  }

  private static matchingRecord(
    key: string,
    query: GasCompoundQuery,
  ): { doc: CompoundDataCompoundFile; record: CompoundDataRecord } {
    const hill = CompoundText.hillFormula(query.formula);
    const index = CompoundData.loadIndex();
    const ids = index.byFormula[hill] ?? [];
    let hits: CompoundDataIndexEntry[] = [];
    for (const id of ids) {
      const meta = index.compounds[id];
      if (!meta?.nasa7?.includes(query.nasa7Key)) continue;
      if (query.nasa9Key && !meta.nasa9?.includes(query.nasa9Key)) continue;
      hits.push(meta);
    }
    if (hits.length > 1) {
      const plain = hits.filter((meta) => !CompoundValueBuilder.isLabelled(meta));
      if (plain.length) hits = plain;
    }
    if (hits.length !== 1) {
      throw new Error(
        `Compound data has ${hits.length} records for ${key} (${hill}, NASA-7 "${query.nasa7Key}")`,
      );
    }
    const doc = CompoundData.loadFile(hits[0].file);
    const record = doc.entries[hits[0].entry];
    if (!record) throw new Error(`Compound data file ${hits[0].file} has no entry "${hits[0].entry}"`);
    if (record.Mr === undefined) throw new Error(`Compound data record for ${key} has no molar mass`);
    return { doc, record };
  }

  private static resolveMeta(id: string) {
    const index = CompoundData.loadIndex();
    const direct = index.compounds[id];
    if (direct) return { id, meta: direct };
    const viaCas = index.byCas?.[id];
    if (viaCas && index.compounds[viaCas]) return { id: viaCas, meta: index.compounds[viaCas] };
    const viaOther = index.byOtherCas[id];
    if (viaOther && index.compounds[viaOther]) return { id: viaOther, meta: index.compounds[viaOther] };
    return undefined;
  }
}
