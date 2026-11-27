import { CompoundValue } from '../../types/compound-value.type';
import { EquationValue } from '../../types/equation-value.type';
import { CompoundSolidData } from './compound-solid-data';
import { CompoundText } from './compound-text';
import { GasCompoundQuery } from './types/gas-compound-query.type';
import { CompoundDataIndexEntry } from './types/dataset/compound-data-index-entry.type';
import { CompoundDataEquationList } from './types/equation/compound-data-equation-list.type';
import { CompoundDataPropertyValue } from './types/property/compound-data-property-value.type';
import { CompoundDataCompoundFile } from './types/record/compound-data-compound-file.type';
import { CompoundDataRecord } from './types/record/compound-data-record.type';
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
    const { doc, record, meta } = CompoundValueBuilder.matchingRecord(key, query);
    const properties = record.properties ?? {};
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
    const sigma = CompoundValueBuilder.collisionPotential(properties.collisionDiameter);
    const epsilon = CompoundValueBuilder.collisionPotential(properties.epsilonToKb);
    const critical = CompoundValueBuilder.criticalScalars(properties);
    const rawName = record.name ?? doc.displayFormula;
    const enthalpy = CompoundValueBuilder.gasPhase(properties.enthalpyFormation298);
    const gibbs = CompoundValueBuilder.gasPhase(properties.gibbsEnergy298);
    const heatCapacity = CompoundValueBuilder.equationBucket(
      record.equations?.heatCapacity?.gas,
      `${key} heat capacity`,
    );
    const coolpropKey = record.coolprop?.[0] ?? meta.coolprop?.[0];
    return {
      name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
      chemicalFormula: doc.displayFormula,
      Mr: molarMass,
      ...(enthalpy !== undefined ? { enthalpyFormation298: enthalpy } : {}),
      ...(gibbs !== undefined ? { gibbsEnergy298: gibbs } : {}),
      ...(sigma ? { collisionDiameter: sigma.value * 1e10 } : {}),
      ...(epsilon ? { epsilonToKb: epsilon.value } : {}),
      ...critical,
      nasa7Key: query.nasa7Key,
      ...(query.nasa9Key ? { nasa9Key: query.nasa9Key } : {}),
      ...(coolpropKey ? { coolpropKey } : {}),
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
    const coolpropKey = record.coolprop?.[0] ?? meta.coolprop?.[0];
    if (!heatCapacity && !nasa7Key && !nasa9Key) {
      throw new Error(`Compound data has no gas heat capacity or NASA keys for ${resolved.id}`);
    }

    const rawName = record.name ?? meta.name ?? doc.displayFormula;
    const sigma = CompoundValueBuilder.collisionPotential(properties.collisionDiameter);
    const epsilon = CompoundValueBuilder.collisionPotential(properties.epsilonToKb);
    const critical = CompoundValueBuilder.criticalScalars(properties);
    const enthalpy = CompoundValueBuilder.gasPhase(properties.enthalpyFormation298);
    const gibbs = CompoundValueBuilder.gasPhase(properties.gibbsEnergy298);

    return {
      name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
      chemicalFormula: doc.displayFormula,
      Mr: record.Mr,
      ...(enthalpy !== undefined ? { enthalpyFormation298: enthalpy } : {}),
      ...(gibbs !== undefined ? { gibbsEnergy298: gibbs } : {}),
      ...(sigma ? { collisionDiameter: sigma.value * 1e10 } : {}),
      ...(epsilon ? { epsilonToKb: epsilon.value } : {}),
      ...critical,
      ...(nasa7Key ? { nasa7Key } : {}),
      ...(nasa9Key ? { nasa9Key } : {}),
      ...(coolpropKey ? { coolpropKey } : {}),
      ...(heatCapacity ? { heatCapacity } : {}),
      viscosity,
      thermalConductivity,
    };
  }

  /**
   * Build a solid-phase `CompoundValue` from a public `compoundId` (or CAS).
   * Uses solid-phase ΔHf°298, S°298, ΔGf°298, solid Cp and condensed NASA keys (liquid / gas keys
   * are skipped). Gas transport is not required — `viscosity` / `thermalConductivity` stay absent.
   */
  static forSolid(id: string): CompoundValue {
    const resolved = CompoundValueBuilder.resolveMeta(id);
    if (!resolved) throw new Error(`Unknown compound id: ${id}`);
    const { meta } = resolved;
    const doc = CompoundData.loadFile(meta.file);
    const record = doc.entries[meta.entry];
    if (!record) throw new Error(`Compound data file ${meta.file} has no entry "${meta.entry}"`);
    if (record.Mr === undefined) throw new Error(`Compound data record ${resolved.id} has no molar mass`);

    const properties = record.properties ?? {};
    const enthalpy = CompoundSolidData.solidPhase(properties.enthalpyFormation298);
    const entropy = CompoundSolidData.solidPhase(properties.entropy298);
    const gibbs = CompoundSolidData.solidPhase(properties.gibbsEnergy298);
    const heatCapacity = CompoundValueBuilder.equationBucket(
      record.equations?.heatCapacity?.solid,
      `${resolved.id} solid heat capacity`,
    );
    const { nasa7Key, nasa9Key } = CompoundSolidData.nasaKeys(meta);
    if (!heatCapacity && !nasa7Key && !nasa9Key && (enthalpy === undefined || entropy === undefined)) {
      throw new Error(`Compound data has no solid heat capacity, NASA keys or ΔHf298 + S298 for ${resolved.id}`);
    }

    const rawName = record.name ?? meta.name ?? doc.displayFormula;
    return {
      name: rawName.charAt(0).toUpperCase() + rawName.slice(1),
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

  private static gasPhase(rows: CompoundDataPropertyValue[] | undefined): number | undefined {
    return rows?.find((row) => row.phase === 'gas')?.value;
  }

  /**
   * Prefer Lennard-Jones, then Stockmayer, then corresponding-states σ / ε/k rows.
   */
  private static collisionPotential(
    rows: CompoundDataPropertyValue[] | undefined,
  ): CompoundDataPropertyValue | undefined {
    if (!rows?.length) return undefined;
    return rows.find((row) => row.potential === 'lennardJones')
      ?? rows.find((row) => row.potential === 'stockmayer')
      ?? rows.find((row) => row.potential === 'correspondingStates')
      ?? rows[0];
  }

  /**
   * First listed SI scalar for each critical / polarity field used by Chung / CE.
   */
  private static criticalScalars(properties: {
    criticalTemperature?: CompoundDataPropertyValue[];
    criticalPressure?: CompoundDataPropertyValue[];
    criticalVolume?: CompoundDataPropertyValue[];
    acentricFactor?: CompoundDataPropertyValue[];
    dipoleMoment?: CompoundDataPropertyValue[];
    stockmayerDelta?: CompoundDataPropertyValue[];
  }): Partial<Pick<
    CompoundValue,
    | 'criticalTemperature'
    | 'criticalPressure'
    | 'criticalVolume'
    | 'acentricFactor'
    | 'dipoleMoment'
    | 'stockmayerDelta'
  >> {
    const criticalTemperature = properties.criticalTemperature?.[0]?.value;
    const criticalPressure = properties.criticalPressure?.[0]?.value;
    const criticalVolume = properties.criticalVolume?.[0]?.value;
    const acentricFactor = properties.acentricFactor?.[0]?.value;
    const dipoleMoment = properties.dipoleMoment?.[0]?.value;
    const stockmayerDelta = properties.stockmayerDelta?.[0]?.value;
    return {
      ...(criticalTemperature !== undefined ? { criticalTemperature } : {}),
      ...(criticalPressure !== undefined ? { criticalPressure } : {}),
      ...(criticalVolume !== undefined ? { criticalVolume } : {}),
      ...(acentricFactor !== undefined ? { acentricFactor } : {}),
      ...(dipoleMoment !== undefined ? { dipoleMoment } : {}),
      ...(stockmayerDelta !== undefined ? { stockmayerDelta } : {}),
    };
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
  ): { doc: CompoundDataCompoundFile; record: CompoundDataRecord; meta: CompoundDataIndexEntry } {
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
    const meta = hits[0];
    const doc = CompoundData.loadFile(meta.file);
    const record = doc.entries[meta.entry];
    if (!record) throw new Error(`Compound data file ${meta.file} has no entry "${meta.entry}"`);
    if (record.Mr === undefined) throw new Error(`Compound data record for ${key} has no molar mass`);
    return { doc, record, meta };
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
