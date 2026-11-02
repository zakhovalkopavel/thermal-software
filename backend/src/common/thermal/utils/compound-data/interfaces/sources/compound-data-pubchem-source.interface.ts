/**
 * PubChem identifiers of CAS numbers the chemicals identifier files miss (`identifierRef` files
 * "idPubchemRestInorganic", "idPubchemRestOrganic", "idPubchemRestUnclassified")
 */
export interface CompoundDataPubchemSource {
  /** PUG REST base URL the files were filled from */
  api: string;
  /** Local folder of the pubchem-<class>.jsonl files, e.g. "shared/sources/compound-data/pubchem" */
  cache: string;
  /** Compound page template with "{cid}" (`CompoundDataRecord.pubchemCid`) */
  compoundUrl: string;
}
