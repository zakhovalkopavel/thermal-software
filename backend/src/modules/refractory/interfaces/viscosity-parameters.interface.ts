import { ViscosityModelType } from '../enums/viscosity-model.enum';

export interface ComponentEffectRange {
  component: string;
  effectMin: number; // K per wt%
  effectMax: number; // K per wt%
  validMin: number;  // wt%
  validMax: number;  // wt%
}

export interface ViscosityParameters {
  modelType: ViscosityModelType;
  A: number;           // Pre-exponential factor
  B: number;           // Activation energy / R (K)
  T0?: number;         // VFT temperature (K), optional
  componentEffects: ComponentEffectRange[];
  temperatureRange: {
    min: number;       // °C
    max: number;       // °C
  };
  validCompositionRanges: Record<string, { min: number; max: number }>;
  reference: string;
  notes?: string;
}

