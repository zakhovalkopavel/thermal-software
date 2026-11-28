import type { MultilayerWallResult } from '../../../types/multilayer-wall-result.type';

/** Finite-difference T(x) from the backend: [mm, °C]. */
export function toWallProfile(result: MultilayerWallResult): [number, number][] {
  return result.temperatureProfile.map((point) => [point.x_mm, point.tCelsius]);
}
