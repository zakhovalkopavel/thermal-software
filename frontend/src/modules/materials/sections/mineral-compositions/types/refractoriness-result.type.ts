export type RefractorinessResult = {
  standard: string;
  estimatedRefractoriness_C: number;
  classification: string;
  PCE?: { coneNumber: number; equivalentTemperature_C: number; description: string };
  RUL?: { T05: number; T1: number; T2: number; testLoad_MPa: number; description: string };
};
