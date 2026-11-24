/** A single (temperature, log viscosity) calibration point. */
export type VtfPoint = {
  /** Temperature in °C */
  T_celsius: number;
  /** log₁₀(η [Pa·s]) */
  logEtaPaS: number;
};
