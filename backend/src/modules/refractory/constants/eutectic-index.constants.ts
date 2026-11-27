/** Dataset location and filters of the NSRDS-NBS 61 eutectic index. */
export const EUTECTIC_INDEX_CONSTANTS = {
  /** Path segments below `shared/` of the entries file */
  datasetPath: ['processed', 'eutectic-data'] as ReadonlyArray<string>,

  /** Entries file name inside the dataset directory */
  entriesFile: 'nsrds-nbs-61-1.entries.json',

  /** Component looks like an oxide or fluoride: contains O or F that is not the start of another element (Fe, Os, …) */
  oxideFluoridePattern: /[OF](?![a-z])/,

  /** Smallest number of components of a usable eutectic */
  minComponents: 2,
} as const;
