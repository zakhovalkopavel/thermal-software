/** Origin of a phase part: reacted matrix or unreacted grain core */
export enum PhasePartSource {
  /** Part formed from the reacted (equilibrated) matrix */
  MATRIX = 'matrix',
  /** Part inherited from the unreacted grain cores */
  UNREACTED = 'unreacted',
}
