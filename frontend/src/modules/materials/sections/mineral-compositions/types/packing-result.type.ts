export type PackingResult = {
  model: string;
  packingFraction_phi: number;
  porosity_initial: number;
  effectivePackingDensity: number;
  /** CPM only. */
  calibration?: Record<string, number | boolean>;
  /** CPM only. */
  composition?: {
    hasMicroFillers: boolean;
    microFillerPercent: number;
    psdType: string;
    packingQuality: string;
    recommendedMaxPhi: number;
    explanation: string;
  };
};
