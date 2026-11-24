export type GlassValidation = {
  systemDetected: string;
  confidenceLevel: string;
  warnings: string[];
  extrapolationRisk: string;
  compositionIssues?: string[];
};
