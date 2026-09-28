import { AlphaResult } from '../interfaces/alpha-result.interface';

export class BetweenLayerDto {
  name:     string;
  tCelsius: number;
}

export class MultilayerWallResultDto {
  /** Inner surface temperature [K] */
  tInner_K: number;
  /** Outer surface temperature [K] */
  tOuter_K: number;
  /** Log-mean gas temperature after furnace [K] */
  tGasEnd_K: number;
  /** Log-mean gas temperature inside furnace [K] */
  tGasAverage_K: number;
  /** Temperatures at each layer interface */
  betweenLayers: BetweenLayerDto[];
  /** Total heat flux entering from flame side [W] */
  fluxInner_W: number;
  /** Total heat flux leaving outer surface [W] */
  fluxOuter_W: number;
  /** Inner surface heat flux density [W/m²] */
  fluxInnerDensity_Wm2: number;
  /** Inner surface area [m²] */
  sInner_m2: number;
  /** Outer surface area [m²] */
  sOuter_m2: number;
  /** Inner HTC breakdown */
  alphaInner: AlphaResult;
  /** Outer surface HTC [W/(m²·K)] */
  alphaOuter_Wm2K: number;
  /** Total wall thickness [mm] */
  totalThickness_mm: number;
}
