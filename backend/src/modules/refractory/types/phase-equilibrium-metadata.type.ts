/** Calculation metadata for phase equilibrium. */
export type PhaseEquilibriumMetadata = {
  /** Temperature used (°C) */
  temperature: number;

  /** Total mass used (kg) */
  totalMass: number;

  /** Eutectic temperature for CAS system (°C) */
  eutecticTemperature: number;

  /** Estimated liquidus temperature (°C) */
  estimatedLiquidus: number;

  /** Calculation timestamp */
  calculatedAt: Date;

  /** Calculation method used */
  method: 'CAS-approximation' | 'component-based';

  /** Model parameters */
  parameters: {
    /** Base refractoriness temperature (°C) */
    baseRefractoriness_C: number;

    /** Enrichment model used */
    enrichmentModel: 'selective-melting' | 'eutectic-blending';
  };
};
