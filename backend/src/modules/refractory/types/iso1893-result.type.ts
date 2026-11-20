/** ISO 1893 Refractoriness Under Load (RUL) result. */
export type ISO1893Result = {
  standard: 'ISO1893';

  /** Temperature at 0.5mm deformation (°C) */
  T05_C: number;

  /** Temperature at 1mm deformation (°C) */
  T1_C: number;

  /** Temperature at 2mm deformation (°C) */
  T2_C: number;

  /** Test load applied (Pa) */
  testLoad_Pa: number;

  /** Description of RUL points */
  description: string;
};
