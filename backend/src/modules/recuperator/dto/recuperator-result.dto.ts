export class RecuperatorResultDto {
  /** Required recuperator length [m] */
  recuperatorLength_m:    number;
  /** Optimised air preheat temperature [K] */
  tAirEnd_K:              number;
  /** Smoke exit temperature [K] */
  tSmokeEnd_K:            number;
  /** Smoke entry temperature [K] */
  tSmokeStart_K:          number;
  /** Adiabatic flame temperature [K] */
  tFlame_K:               number;
  /** Maximum flame temperature with full air preheat [K] */
  maxFlameTemp_K:         number;
  /** Energy returned to air / total smoke energy [%] */
  energyReturnedPercent:  number;
  /** Heat transferred to air [W] */
  airEnergyIncrease_W:    number;
  /** Heat lost by smoke [W] */
  smokeEnergyDecrease_W:  number;
  /** Total smoke energy from T_start to T_air_start [W] */
  smokeTotalEnergy_W:     number;
  /** Log-mean overall HTC [W/(m²·K)] */
  alphaAverage_Wm2K:      number;
  /** Log-mean temperature difference [K] */
  averageDeltaT_K:        number;
  /** Smoke cross-section area [m²] */
  sSmoke_m2:              number;
  /** Air cross-section area [m²] */
  sAir_m2:                number;
  /** Air equivalent diameter [m] */
  dAir_m:                 number;
  /** Smoke equivalent diameter [m] */
  dSmoke_m:               number;
  wSmokeStart_ms:         number;
  wSmokeEnd_ms:           number;
  wAirStart_ms:           number;
  wAirEnd_ms:             number;
  /** Fuel consumption [kg/h] */
  mFuel_kgh:              number;
}
