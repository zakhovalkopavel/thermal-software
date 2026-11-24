export type MaterialPropertyLookupProps = {
  title?: string;
  onApplyLambda: (lambda_WmK: number) => void;
  /** Omit to hide the "Use ε" action. */
  onApplyEmissivity?: (emissivity: number) => void;
};
