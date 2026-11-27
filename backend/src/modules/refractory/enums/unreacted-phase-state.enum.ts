/** State of the unreacted grain core after firing */
export enum UnreactedPhaseState {
  /** Core keeps its original properties */
  UNCHANGED = 'unchanged',
  /** Core is softened (e.g. glassy / viscous behaviour) */
  SOFTENED = 'softened',
  /** Core is transformed into another phase */
  TRANSFORMED = 'transformed',
}
