import type { CombustionModeInput } from '../../../types/combustion-mode-input.type';
import type { HoleForm } from './hole-form.type';

export type RecuperatorInput = {
  combustion: CombustionModeInput;
  tAirStart_K: number;
  holeForm: HoleForm;
  d0_m: number;
  h0_m?: number;
  refractoryThickness_m: number;
  nAir: number;
  nSmoke: number;
  nPasses?: number;
  smokeTurbulence?: boolean;
  wantedRecuperatorLength_m: number;
  thermalInsulationThickness_m: number;
  refractoryLambda_WmK: number;
  refractoryEmissivity: number;
  surfaceEmissivity: number;
  surfaceArea_m2: number;
  airPreheat_K?: number;
};
