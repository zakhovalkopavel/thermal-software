import { kelvinToCelsius } from '@/shared/utils/kelvin-to-celsius';
import type { MultilayerWallInput } from '../../../types/multilayer-wall-input.type';
import type { MultilayerWallResult } from '../../../types/multilayer-wall-result.type';

/** Inner surface, each interface at the cumulative request thickness, outer surface: [mm, °C]. */
export function toWallProfile(input: MultilayerWallInput, result: MultilayerWallResult): [number, number][] {
  const interfaces = input.layers.slice(0, -1).reduce<{ x: number; points: [number, number][] }>(
    (acc, layer, index) => {
      const x = acc.x + layer.thicknessMm;
      const between = result.betweenLayers[index];
      return { x, points: between ? [...acc.points, [x, between.tCelsius]] : acc.points };
    },
    { x: 0, points: [] },
  ).points;
  const total = input.layers.reduce((sum, layer) => sum + layer.thicknessMm, 0);
  return [[0, kelvinToCelsius(result.tInner_K)], ...interfaces, [total, kelvinToCelsius(result.tOuter_K)]];
}
