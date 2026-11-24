import type { ShrinkageStage } from './shrinkage-stage.type';

/** Firing stage specific result. */
export type FiringShrinkage = ShrinkageStage & {
  name: 'firing';

  /** Sintering temperature (°C) */
  sinteringTemperature_C: number;

  /** Average sintering rate */
  sinteringRate: number;

  /** Master sintering curve parameter */
  masterSinteringCurve_theta: number;
};
