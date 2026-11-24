const ZERO_CELSIUS_K = 273.15;

export function celsiusToKelvin(celsius: number): number {
  return celsius + ZERO_CELSIUS_K;
}
