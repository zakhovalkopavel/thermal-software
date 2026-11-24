/**
 * Path segments that identify a construct folder (plural + documented legacy singular).
 * Used by suffix ↔ folder matching (docs/CONVENTIONS.md § Construct → folder → file).
 */
export const CONSTRUCT_FOLDER_SEGMENTS = {
  type: new Set(['types', 'type']),
  interface: new Set(['interfaces']),
  constants: new Set(['constants']),
  enum: new Set(['enums', 'enum']),
};
