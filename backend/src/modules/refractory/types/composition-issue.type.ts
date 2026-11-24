/** Specific composition issue. */
export type CompositionIssue = {
  component: string;
  actualValue: number;
  validRange: { min: number; max: number };
  severity: 'WARNING' | 'ERROR';
  impact: string;
};
