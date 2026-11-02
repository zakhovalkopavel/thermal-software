import { CompoundValue } from '../../interfaces/compound-value.interface';
import { EquationValue } from '../../interfaces/equation-value.interface';
import { CompoundDataCompoundFile } from './interfaces/record/compound-data-compound-file.interface';
import { CompoundDataEquationList } from './interfaces/equation/compound-data-equation-list.interface';
import { CompoundDataEquationValue } from './interfaces/equation/compound-data-equation-value.interface';
import { CompoundDataIndexEntry } from './interfaces/dataset/compound-data-index-entry.interface';
import { CompoundDataPropertyValue } from './interfaces/property/compound-data-property-value.interface';
import { CompoundDataRecord } from './interfaces/record/compound-data-record.interface';
import { loadCompoundDataFile } from './load-compound-data-file.util';
import { loadCompoundDataIndex } from './load-compound-data-index.util';
import { toEquationValue } from './to-equation-value.util';

/** Which compound-data record fills one `GAS_REGISTRY` key. */
type GasCompoundQuery = {
  formula: string;
  nasa7Key: string;
  nasa9Key?: string;
};

const ELEMENT = /([A-Z][a-z]?)(\d*)/g;

/** Hill formula: C, H, then alphabetical; without carbon, alphabetical. */
function hillFormula(formula: string): string {
  const counts = new Map<string, number>();
  let consumed = '';
  for (const match of formula.matchAll(ELEMENT)) {
    const element = match[1];
    counts.set(element, (counts.get(element) ?? 0) + (match[2] ? Number(match[2]) : 1));
    consumed += match[0];
  }
  if (consumed !== formula) throw new Error(`Unreadable formula "${formula}"`);
  const token = (element: string) => {
    const n = counts.get(element)!;
    return element + (n > 1 ? String(n) : '');
  };
  const rest = [...counts.keys()].filter(element => element !== 'C' && element !== 'H').sort();
  const order = counts.has('C')
    ? ['C', ...(counts.has('H') ? ['H'] : []), ...rest]
    : [...counts.keys()].sort();
  return order.map(token).join('');
}

function gasPhase(rows: CompoundDataPropertyValue[] | undefined): number | undefined {
  return rows?.find(row => row.phase === 'gas')?.value;
}

function lennardJones(rows: CompoundDataPropertyValue[] | undefined): CompoundDataPropertyValue | undefined {
  return rows?.find(row => row.potential === 'lennardJones');
}

function equationBucket(
  list: CompoundDataEquationList | undefined,
  label: string,
): { def: number; values: EquationValue[] } | undefined {
  if (!list?.values.length) return undefined;
  const values = list.values.map(row => toEquationValue(row));
  const def = list.def ?? 0;
  if (def < 0 || def >= values.length) {
    throw new Error(`Compound-data ${label} def ${def} is outside ${values.length} equations`);
  }
  return { def, values };
}

function sutherlandParams(
  rows: CompoundDataEquationValue[],
): CompoundValue['sutherlandParams'] {
  const row = rows.find(equation => equation.type === 'sutherland');
  if (!row) return undefined;
  const vars = row.vars as { y0?: number; T0?: number; S?: number };
  if (typeof vars.y0 !== 'number' || typeof vars.T0 !== 'number' || typeof vars.S !== 'number') {
    throw new Error('Compound-data Sutherland equation is missing y0, T0 or S');
  }
  return { mu0: vars.y0, T0: vars.T0, S: vars.S };
}

/** Isotopic and labelled records (D2O, H2[18O], (2H3)ammonia) share the parent's NASA keys. */
function isLabelled(meta: CompoundDataIndexEntry): boolean {
  if (meta.formula) return true;
  return /[0-9()]/.test(meta.name ?? '');
}

function matchingRecord(key: string, query: GasCompoundQuery): {
  doc: CompoundDataCompoundFile;
  record: CompoundDataRecord;
} {
  const hill = hillFormula(query.formula);
  const index = loadCompoundDataIndex();
  const ids = index.byFormula[hill] ?? [];
  let hits: CompoundDataIndexEntry[] = [];
  for (const id of ids) {
    const meta = index.compounds[id];
    if (!meta?.nasa7?.includes(query.nasa7Key)) continue;
    if (query.nasa9Key && !meta.nasa9?.includes(query.nasa9Key)) continue;
    hits.push(meta);
  }
  if (hits.length > 1) {
    const plain = hits.filter(meta => !isLabelled(meta));
    if (plain.length) hits = plain;
  }
  if (hits.length !== 1) {
    throw new Error(
      `Compound data has ${hits.length} records for ${key} (${hill}, NASA-7 "${query.nasa7Key}")`,
    );
  }
  const doc = loadCompoundDataFile(hits[0].file);
  const record = doc.entries[hits[0].entry];
  if (!record) throw new Error(`Compound data file ${hits[0].file} has no entry "${hits[0].entry}"`);
  if (record.Mr === undefined) throw new Error(`Compound data record for ${key} has no molar mass`);
  return { doc, record };
}

/**
 * One `CompoundValue` from the processed compound-data record.
 * Gas-phase equations and the first gas-phase formation values are kept.
 * Lennard-Jones σ is converted from metres to angstroms.
 */
export function compoundValueForGas(key: string, query: GasCompoundQuery): CompoundValue {
  const { doc, record } = matchingRecord(key, query);
  const properties = record.properties ?? {};
  const gasViscosity = record.equations?.viscosity?.gas?.values ?? [];
  const viscosity = equationBucket(record.equations?.viscosity?.gas, `${key} viscosity`);
  const thermalConductivity = equationBucket(
    record.equations?.thermalConductivity?.gas,
    `${key} thermal conductivity`,
  );
  if (!viscosity) throw new Error(`Compound data has no gas viscosity for ${key}`);
  if (!thermalConductivity) throw new Error(`Compound data has no gas thermal conductivity for ${key}`);

  const molarMass = record.Mr;
  if (molarMass === undefined) throw new Error(`Compound data record for ${key} has no molar mass`);
  const sigma = lennardJones(properties.collisionDiameter);
  const epsilon = lennardJones(properties.epsilonToKb);
  const rawName = record.name ?? doc.displayFormula;
  const enthalpy = gasPhase(properties.enthalpyFormation298);
  const gibbs = gasPhase(properties.gibbsEnergy298);
  const sutherland = sutherlandParams(gasViscosity);
  const heatCapacity = equationBucket(record.equations?.heatCapacity?.gas, `${key} heat capacity`);
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
