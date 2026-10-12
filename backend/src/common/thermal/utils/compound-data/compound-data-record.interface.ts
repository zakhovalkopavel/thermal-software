import { CompoundDataEquations } from './compound-data-equations.interface';
import { CompoundDataProperties } from './compound-data-properties.interface';
import { CompoundDataRawValue } from './compound-data-raw-value.interface';
import { CompoundDataLineRef } from './compound-data-ref.type';
import { CompoundDataTransport } from './compound-data-transport.interface';

/**
 * One compound (one CAS, or one formula without CAS): `CompoundDataCompoundFile.entries[key]`.
 * The CAS (entry key), Hill formula and elements (file level) are not repeated; null and empty fields are left out.
 */
export interface CompoundDataRecord {
  /** Source formula when it differs from the Hill key (isotopes, charges), e.g. "C2D4O" */
  formula?: string;
  /** Identifier database name, else the first source label */
  name?: string;
  /** Molar mass [kg/mol] (`units.json` → `Mr`) */
  Mr?: number;
  /** Structure line notation, e.g. "CCO" (ethanol), "[Al]" */
  smiles?: string;
  /** Hashed IUPAC InChI, e.g. "XAGFODPZIPBFFR-UHFFFAOYSA-N" */
  inchikey?: string;
  /** PubChem compound id; page URL: `sources.json` → `pubchem.compoundUrl` */
  pubchemCid?: number;
  /** Organic functional families, specific → general */
  families?: string[];
  /** Identifier row the formula, name and Mr came from (chemicals files, or the local PubChem cache "idPubchemRest") */
  identifierRef?: CompoundDataLineRef;
  /** Source CAS numbers unknown to every identifier source whose rows were moved here (Perry Mg 22537-22-0) */
  otherCas?: string[];
  properties?: CompoundDataProperties;
  equations?: CompoundDataEquations;
  raw?: CompoundDataRawValue[];
  /** How the NASA Lewis viscosity / conductivity fits were obtained (Svehla1995); pairs: `interactions.json` */
  transport?: CompoundDataTransport;
  /**
   * NIST-JANAF table ids with the same Hill formula, e.g. ["Al-096", "Al-097"] (ref NISTJANAF).
   * Tables: `shared/processed/JANAF/index.json` → `tables[id].file`; URLs: `sources.json` → `janaf`.
   */
  janaf?: string[];
  /**
   * NASA-7 species keys (all phases) with the same Hill formula and ΔfH°(298.15), e.g. ["H2O", "H2O(L)"] (ref NASA7).
   * Species: `sources.json` → `nasa.nasa7.dataset` → `species[key]`.
   */
  nasa7?: string[];
  /** NASA-9 species keys, as `nasa7` (ref NASA9); dataset: `sources.json` → `nasa.nasa9.dataset` */
  nasa9?: string[];
}
